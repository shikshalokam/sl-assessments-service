const userRolesHelper = require(ROOT_PATH + "/module/userRoles/helper");
const entityTypesHelper = require(ROOT_PATH + "/module/entityTypes/helper");
const entitiesHelper = require(ROOT_PATH + "/module/entities/helper");
const shikshalokamGenericHelper = require(ROOT_PATH + "/generics/helpers/shikshalokam");

module.exports = class userExtensionHelper {

    static profileWithEntityDetails(filterQueryObject) {
        return new Promise(async (resolve, reject) => {
            try {

                const entityTypesArray = await entityTypesHelper.list({}, {
                    name: 1,
                    immediateChildrenEntityType: 1
                });

                let enityTypeToImmediateChildrenEntityMap = {}

                if (entityTypesArray.length > 0) {
                    entityTypesArray.forEach(entityType => {
                        enityTypeToImmediateChildrenEntityMap[entityType.name] = (entityType.immediateChildrenEntityType && entityType.immediateChildrenEntityType.length > 0) ? entityType.immediateChildrenEntityType : []
                    })
                }

                let queryObject = [
                    {
                        $match: filterQueryObject
                    },
                    {
                        $lookup: {
                            "from": "entities",
                            "localField": "roles.entities",
                            "foreignField": "_id",
                            "as": "entityDocuments"
                        }
                    },
                    {
                        $lookup: {
                            "from": "userRoles",
                            "localField": "roles.roleId",
                            "foreignField": "_id",
                            "as": "roleDocuments"
                        }
                    },
                    {
                        $project: {
                            "externalId": 1,
                            "roles": 1,
                            "roleDocuments._id": 1,
                            "roleDocuments.code": 1,
                            "roleDocuments.title": 1,
                            "entityDocuments._id": 1,
                            "entityDocuments.metaInformation.externalId": 1,
                            "entityDocuments.metaInformation.name": 1,
                            "entityDocuments.groups": 1,
                            "entityDocuments.entityType": 1,
                            "entityDocuments.entityTypeId": 1
                        }
                    }
                ];

                let userExtensionData = await database.models.userExtension.aggregate(queryObject)

                if (userExtensionData[0]) {

                    let roleMap = {}

                    if (userExtensionData[0].roleDocuments.length > 0) {

                        userExtensionData[0].roleDocuments.forEach(role => {
                            roleMap[role._id.toString()] = role
                        })
                        let entityMap = {}
                        userExtensionData[0].entityDocuments.forEach(entity => {
                            entity.metaInformation.childrenCount = 0
                            entity.metaInformation.entityType = entity.entityType
                            entity.metaInformation.entityTypeId = entity.entityTypeId
                            entity.metaInformation.subEntityGroups = new Array

                            Array.isArray(enityTypeToImmediateChildrenEntityMap[entity.entityType]) && enityTypeToImmediateChildrenEntityMap[entity.entityType].forEach(immediateChildrenEntityType => {
                                if (entity.groups && entity.groups[immediateChildrenEntityType]) {
                                    entity.metaInformation.immediateSubEntityType = immediateChildrenEntityType
                                    entity.metaInformation.childrenCount = entity.groups[immediateChildrenEntityType].length
                                }
                            })

                            entity.groups && Array.isArray(Object.keys(entity.groups)) && Object.keys(entity.groups).forEach(subEntityType => {
                                entity.metaInformation.subEntityGroups.push(subEntityType)
                            })

                            entityMap[entity._id.toString()] = entity
                        })

                        for (let userExtensionRoleCounter = 0; userExtensionRoleCounter < userExtensionData[0].roles.length; userExtensionRoleCounter++) {
                            for (let userExtenionRoleEntityCounter = 0; userExtenionRoleEntityCounter < userExtensionData[0].roles[userExtensionRoleCounter].entities.length; userExtenionRoleEntityCounter++) {
                                userExtensionData[0].roles[userExtensionRoleCounter].entities[userExtenionRoleEntityCounter] = {
                                    _id: entityMap[userExtensionData[0].roles[userExtensionRoleCounter].entities[userExtenionRoleEntityCounter].toString()]._id,
                                    ...entityMap[userExtensionData[0].roles[userExtensionRoleCounter].entities[userExtenionRoleEntityCounter].toString()].metaInformation
                                }
                            }
                            roleMap[userExtensionData[0].roles[userExtensionRoleCounter].roleId.toString()].immediateSubEntityType = (userExtensionData[0].roles[userExtensionRoleCounter].entities[0] && userExtensionData[0].roles[userExtensionRoleCounter].entities[0].entityType) ? userExtensionData[0].roles[userExtensionRoleCounter].entities[0].entityType : ""
                            roleMap[userExtensionData[0].roles[userExtensionRoleCounter].roleId.toString()].entities = userExtensionData[0].roles[userExtensionRoleCounter].entities
                        }
                    }

                    return resolve(_.merge(_.omit(userExtensionData[0], ["roles", "entityDocuments", "roleDocuments"]), { roles: _.isEmpty(roleMap) ? [] : Object.values(roleMap) }));
                } else {
                    return resolve({})
                }
            } catch (error) {
                return reject(error);
            }
        })


    }

    static bulkCreateOrUpdate(userRolesCSVData, userDetails) {

        return new Promise(async (resolve, reject) => {
            try {

                let userRolesUploadedData = new Array

                const userRolesArray = await userRolesHelper.list({
                    status: "active",
                    isDeleted: false
                }, {
                        code: 1,
                        title: 1,
                        entityTypes: 1
                    });

                let userRoleMap = {}
                let userRoleAllowedEntityTypes = {}

                userRolesArray.forEach(userRole => {
                    userRoleMap[userRole.code] = {
                        roleId: userRole._id,
                        code: userRole.code,
                        entities: []
                    }
                    userRoleAllowedEntityTypes[userRole.code] = new Array
                    if (userRole.entityTypes && userRole.entityTypes.length > 0) {
                        userRole.entityTypes.forEach(entityType => {
                            userRoleAllowedEntityTypes[userRole.code].push(entityType.entityTypeId)
                        })
                    }
                })

                let entityOperation = {
                    "ADD": 1,
                    "APPEND": 1,
                    "REMOVE": 1,
                    "OVERRIDE": 1
                }

                let userToKeycloakIdMap = {}
                let userKeycloakId = ""
                let userRole
                let existingEntity
                let existingUserRole
                const keycloakUserIdIsMandatoryInFile = (process.env.DISABLE_LEARNER_SERVICE_ON_OFF && process.env.DISABLE_LEARNER_SERVICE_ON_OFF == "ON") ? "true" : false

                for (let csvRowNumber = 0; csvRowNumber < userRolesCSVData.length; csvRowNumber++) {

                    userRole = gen.utils.valueParser(userRolesCSVData[csvRowNumber]);
                    userRole["_SYSTEM_ID"] = ""

                    try {

                        if (!userRoleMap[userRole.role]) throw "Invalid role code."

                        if (!entityOperation[userRole.entityOperation]) throw "Invalid entity operation."

                        let entityQueryObject = {
                            _id: userRole.entity
                        }
                        if (userRoleAllowedEntityTypes[userRole.role] && userRoleAllowedEntityTypes[userRole.role].length > 0) {
                            entityQueryObject.entityTypeId = {
                                $in: userRoleAllowedEntityTypes[userRole.role]
                            }
                        }
                        existingEntity = await database.models.entities.findOne(
                            entityQueryObject,
                            {
                                _id: 1
                            }
                        );

                        if (!existingEntity || !existingEntity._id) throw "Invalid entity id."

                        if (userToKeycloakIdMap[userRole.user]) {
                            userKeycloakId = userToKeycloakIdMap[userRole.user]
                        } else {
                            if (keycloakUserIdIsMandatoryInFile) {
                                if (!userRole["keycloak-userId"] || userRole["keycloak-userId"] == "") {
                                    throw "Keycloak user ID is mandatory."
                                }
                                userKeycloakId = userRole["keycloak-userId"]
                                userToKeycloakIdMap[userRole.user] = userRole["keycloak-userId"]
                            } else {
                                let keycloakUserId = await shikshalokamGenericHelper.getKeycloakUserIdByLoginId(userDetails.userToken, userRole.user)

                                if (keycloakUserId && keycloakUserId.length > 0 && keycloakUserId[0].userLoginId) {
                                    userKeycloakId = keycloakUserId[0].userLoginId
                                    userToKeycloakIdMap[userRole.user] = keycloakUserId[0].userLoginId
                                } else {
                                    throw "User entity id."
                                }
                            }
                        }

                        existingUserRole = await database.models.userExtension.findOne(
                            {
                                userId: userKeycloakId
                            },
                            {
                                roles: 1
                            }
                        );

                        if (existingUserRole && existingUserRole._id) {

                            let userRoleToUpdate

                            if (existingUserRole.roles && existingUserRole.roles.length > 0) {
                                userRoleToUpdate = _.findIndex(existingUserRole.roles, { 'code': userRole.role });
                            }

                            if (!(userRoleToUpdate >= 0)) {
                                userRoleToUpdate = existingUserRole.roles.length
                                existingUserRole.roles.push(userRoleMap[userRole.role])
                            }

                            existingUserRole.roles[userRoleToUpdate].entities = existingUserRole.roles[userRoleToUpdate].entities.map(eachEntity => eachEntity.toString());

                            if (userRole.entityOperation == "OVERRIDE") {
                                existingUserRole.roles[userRoleToUpdate].entities = [userRole.entity]
                            } else if (userRole.entityOperation == "APPEND" || userRole.entityOperation == "ADD") {
                                existingUserRole.roles[userRoleToUpdate].entities.push(userRole.entity)
                                existingUserRole.roles[userRoleToUpdate].entities = _.uniq(existingUserRole.roles[userRoleToUpdate].entities)
                            } else if (userRole.entityOperation == "REMOVE") {
                                _.pull(existingUserRole.roles[userRoleToUpdate].entities, userRole.entity);
                            }

                            existingUserRole.roles[userRoleToUpdate].entities = existingUserRole.roles[userRoleToUpdate].entities.map(eachEntity => ObjectId(eachEntity))

                            await database.models.userExtension.findOneAndUpdate(
                                {
                                    _id: existingUserRole._id
                                },
                                _.merge({
                                    "roles": existingUserRole.roles,
                                    "updatedBy": userDetails.id
                                }, _.omit(userRole, ["externalId", "userId", "createdBy", "updatedBy", "createdAt", "updatedAt"]))
                            );

                            userRole["_SYSTEM_ID"] = existingUserRole._id
                            userRole.status = "Success"

                        } else {

                            let roles = [userRoleMap[userRole.role]]
                            roles[0].entities = [ObjectId(userRole.entity)]

                            let newRole = await database.models.userExtension.create(
                                _.merge({
                                    "roles": roles,
                                    "userId": userKeycloakId,
                                    "externalId": userRole.user,
                                    "status": "active",
                                    "updatedBy": userDetails.id,
                                    "createdBy": userDetails.id
                                }, _.omit(userRole, ["externalId", "userId", "createdBy", "updatedBy", "createdAt", "updatedAt", "status", "roles"]))
                            );

                            if (newRole._id) {
                                userRole["_SYSTEM_ID"] = newRole._id
                                userRole.status = "Success"
                            } else {
                                userRole["_SYSTEM_ID"] = ""
                                userRole.status = "Failed to create the user role."
                            }

                        }


                    } catch (error) {
                        userRole.status = (error && error.message) ? error.message : error
                    }


                    userRolesUploadedData.push(userRole)
                }


                return resolve(userRolesUploadedData);

            } catch (error) {
                return reject(error)
            }
        })

    }

    static getUserEntities(userId = false) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!userId) throw "User ID is required."

                let userExtensionDoument = await database.models.userExtension.findOne({
                    userId: userId
                }, { roles: 1 }).lean()

                if (!userExtensionDoument) {
                    throw { status: 400, message: "User Extension not found ." }
                }

                let entities = []

                for (let pointerToUserExtension = 0; pointerToUserExtension < userExtensionDoument.roles.length; pointerToUserExtension++) {
                    entities = _.concat(entities, userExtensionDoument.roles[pointerToUserExtension].entities)
                }

                return resolve(entities)

            } catch (error) {
                return reject(error)
            }
        })
    }

    static getUserEntitiyUniverseByEntityType(userId = false, entityType = false) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!userId) throw "User ID is required."

                if (!entityType) throw "User ID is required."

                let allEntities = new Array

                let userExtensionEntities = await this.getUserEntities(userId);

                if (!userExtensionEntities.length > 0) {
                    resolve(allEntities)
                } else {
                    allEntities = userExtensionEntities
                }


                let entitiesFound = await entitiesHelper.entities({
                    _id: { $in: allEntities },
                    entityType: entityType
                }, ["_id"])


                if (entitiesFound.length > 0) {
                    entitiesFound.forEach(eachEntityData => {
                        allEntities.push(eachEntityData._id)
                    })
                }

                let findQuery = {
                    _id: { $in: userExtensionEntities },
                    entityType: { $ne: entityType }
                }

                findQuery[`groups.${entityType}`] = { $exists: true }

                let remainingEntities = await entitiesHelper.entities(findQuery, [`groups.${entityType}`])

                if (remainingEntities.length > 0) {
                    remainingEntities.forEach(eachEntityNotFound => {
                        allEntities = _.concat(allEntities, eachEntityNotFound.groups[entityType])
                    })
                }

                return resolve(allEntities)

            } catch (error) {
                return reject(error)
            }
        })
    }
};