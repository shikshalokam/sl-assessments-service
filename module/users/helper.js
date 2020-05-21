/**
 * name : helper.js
 * author : Aman
 * created-date : 20-May-2020
 * Description : All users helper functionality.
 */

 // Dependencies 

 let entityAssessorsHelper = require(MODULES_BASE_PATH + "/entityAssessors/helper");
 let programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
 let solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
 let observationsHelper = require(MODULES_BASE_PATH + "/observations/helper");
 let submissionsHelper = require(MODULES_BASE_PATH + "/submissions/helper");
 let entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
 let observationSubmissionsHelper = require(MODULES_BASE_PATH + "/observationSubmissions/helper");

/**
    * UserHelper
    * @class
*/
module.exports = class UserHelper {

     /**
   * Details user information. 
   * @method
   * @name userDetailsInformation
   * @param {String} userId 
   * @returns {Object} consists of observation,solutions,entities,programs and assessorData,submissions and observation submissions data.
   * associated to the user. 
   */

    static userDetailsInformation( userId ) {
        return new Promise(async (resolve, reject) => {
            try {

                let assessorsData = 
                await entityAssessorsHelper.assessorsDocument({
                    userId : userId
                },["programId","solutionId","entities"]);
                
                let programIds = [];
                let solutionIds = [];
                let entityIds = [];
                
                if( assessorsData.length > 0 ) {
                    
                    assessorsData.forEach(assessor=>{
                        
                        programIds.push(assessor.programId);
                        solutionIds.push(assessor.solutionId);
                        entityIds = entityIds.concat(assessor.entities);
                    })
                }

                let submissions = await submissionsHelper.submissionDocuments({
                    solutionId : { $in : solutionIds },
                    entityId : { $in : entityIds }
                },[
                    "status",
                    "_id",
                    "entityId",
                    "solutionId"
                ]);
                
                let observationsData = 
                await observationsHelper.observationDocuments({
                    createdBy : userId,
                    status : messageConstants.common.PUBLISHED
                },[
                    "entities",
                    "solutionId",
                    "programId",
                    "entityId",
                    "name",
                    "description",
                    "status",
                    "observationId"
                ]);

                let observationIds = [];
                let observationSolutions = [];
                let observationEntities = [];
                
                if ( observationsData.length > 0 ) {
                    
                    observationsData.forEach(observation=>{
                        observationIds.push(observation._id);
                        observation["isObservation"] = true;
                        programIds.push(observation.programId);
                        observationSolutions.push(observation.solutionId);
                        observationEntities = observationEntities.concat(observation.entities);
                    })
                }

                let observationSubmissions = 
                await observationSubmissionsHelper.observationSubmissionsDocument({
                    observationId : { $in : observationIds },
                    entityId : { $in : observationEntities }
                },[
                    "status",
                    "submissionNumber",
                    "entityId",
                    "createdAt",
                    "updatedAt",
                    "observationInformation.name",
                    "observationId"
                ],{
                    createdAt : -1
                });

                solutionIds = solutionIds.concat(observationSolutions);
                entityIds = entityIds.concat(observationEntities);

                if ( !programIds.length > 0 ) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.PROGRAM_NOT_MAPPED_TO_USER
                    }
                }

                if( !solutionIds.length > 0 ) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.SOLUTION_NOT_MAPPED_TO_USER
                    }
                }
                
                if( !entityIds.length > 0 ) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.ENTITIES_NOT_MAPPED_TO_USER
                    }
                }
                
                let programs = 
                await programsHelper.programDocument(
                    programIds,
                    ["name","externalId","description"]
                );
                
                if ( !programs.length > 0 ) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.PROGRAM_NOT_FOUND
                    }
                }
                
                let programsData = programs.reduce(
                    (ac, program) => ({
                        ...ac,
                        [program._id.toString()]: program
                }), {});
                
                let solutions = 
                await solutionsHelper.solutionDocuments(
                    {
                        _id : { $in : solutionIds }
                    },[
                        "name",
                        "description",
                        "externalId",
                        "type",
                        "subType",
                        "solutionId"
                    ]
                );

                if ( !solutions.length > 0 ) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.SOLUTION_NOT_FOUND
                    }
                }

                let solutionsData = solutions.reduce(
                    (ac, solution) => ({
                        ...ac,
                        [solution._id.toString()]: solution
                    }), {});

                    let entities = await entitiesHelper.entityDocuments({
                        _id : { $in : entityIds }
                    }, [
                        "_id",
                        "metaInformation.externalId",
                        "metaInformation.name",
                        "metaInformation.city",
                        "metaInformation.state",
                        "entityType"
                    ]);

                    if ( !entities.length > 0 ) {
                        throw {
                            status : httpStatusCode.bad_request.status,
                            message : messageConstants.apiResponses.ENTITY_NOT_FOUND
                        }
                    }

                    let entitiesData = entities.reduce(
                        (ac, entity) => ({
                            ...ac,
                            [entity._id.toString()]: entity
                        }), {});

                    return resolve({
                        entityAssessors : assessorsData,
                        observations : observationsData,
                        programsData : programsData,
                        solutionsData : solutionsData,
                        entitiesData : entitiesData,
                        submissions : submissions,
                        observationSubmissions : observationSubmissions
                    });
                    
            } catch(error) {
                return reject(error);
            }
        })
    }

     /**
   * list user programs.
   * @method
   * @name programs
   * @param {String} userId 
   * @returns {Object} list of user programs. 
   */

    static programs( userId ) {
        return new Promise(async (resolve, reject) => {
            try {

                let userDetails = await this.userDetailsInformation(
                    userId
                );

                let users = userDetails.entityAssessors.concat(
                    userDetails.observations
                );

                let submissions = {};
                let observationSubmissions = {};

                if( userDetails.submissions.length > 0 ) {
                    submissions =  _submissions(userDetails.submissions);
                };

                if( userDetails.observationSubmissions.length > 0 ) {
                    
                    observationSubmissions = _observationSubmissions(
                        userDetails.observationSubmissions
                    );
                }

                let result = [];
                 
                for( let user = 0 ; user < users.length ; user ++ ) {
                   
                    let program = 
                    users[user].programId && 
                    userDetails.programsData[users[user].programId.toString()];

                    let solution = 
                    users[user].solutionId &&
                    userDetails.solutionsData[users[user].solutionId.toString()];

                    if ( program && solution ) {

                        let programIndex = result.findIndex(programData =>
                            programData.externalId === program.externalId
                        );

                        if ( programIndex < 0 ) {

                            result.push(_programInformation(program));
                            programIndex = result.length - 1;
                        }

                        let solutionIndex = 
                        result[programIndex].solutions.findIndex(
                            solutionData => solutionData.externalId === solution.externalId
                        )

                        if( solutionIndex < 0 ) {

                            let solutionInformation =  
                            _solutionInformation(program,solution);

                            if( users[user].isObservation ) {
                                solutionInformation["observations"] = [];
                            } else {
                                solutionInformation["entities"] = [];
                            }
                            
                            result[programIndex].solutions.push(
                                solutionInformation
                            );

                            solutionIndex = 
                            result[programIndex].solutions.length - 1;
                        }

                        if( result[programIndex].solutions[solutionIndex].observations ) 
                        {
                            let observationIndex = 
                            result[programIndex].solutions[solutionIndex].observations.findIndex(
                                observation => observation.externalId === users[user].externalId
                            );

                            if( observationIndex < 0 ) {

                                let observationData = _observationInformation(
                                    program,
                                    users[user]
                                );

                                observationData["entities"] = [];
                                
                                result[programIndex].solutions[solutionIndex].observations.push(
                                    observationData
                                );

                                observationIndex = 
                                result[programIndex].solutions[solutionIndex].observations.length-1;
                            }

                            result[programIndex].solutions[solutionIndex].observations[observationIndex].entities = 
                            _entitiesData(
                                users[user].entities,
                                userDetails.entitiesData,
                                users[user]._id,
                                observationSubmissions,
                                true
                            )

                        } else {
                            
                            result[programIndex].solutions[solutionIndex].entities = 
                            _entitiesData(
                                users[user].entities,
                                userDetails.entitiesData,
                                solution._id,
                                submissions
                            )
                        }

                    }
                }

                return resolve({
                    result : result
                });


            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
   * Entity types and entities detail information
   * @method
   * @name entities
   * @param {string} userId - logged in user Id.
   * @returns {Array} - Entity types and entities detail information.
   */

    static entities( userId ) {
        return new Promise(async (resolve, reject) => {
            try {

                let userDetails = await this.userDetailsInformation(
                    userId
                );

                let submissions = {};
                let observationSubmissions = {};

                if( userDetails.submissions.length > 0 ) {
                    submissions =  _submissions(userDetails.submissions);
                };

                if( userDetails.observationSubmissions.length > 0 ) {
                    
                    observationSubmissions = _observationSubmissions(
                        userDetails.observationSubmissions
                    );
                }

                let result = {
                    entityTypes : 
                    _entityTypesKeyValue(
                        Object.values(userDetails.entitiesData)
                    ),
                    entities : {}
                }

                let users = userDetails.entityAssessors.concat(
                    userDetails.observations
                );


                for ( let user = 0 ; user < users.length ; user++) {

                    let userData = users[user];
                    let program = 
                    userDetails.programsData[users[user].programId.toString()];
                    
                    let solution = 
                    userDetails.solutionsData[users[user].solutionId.toString()];

                    if ( solution && program && userData.entities.length > 0 ) {

                        userData.entities.forEach(entity => {

                            let entitiesData = userDetails.entitiesData;
            
                            if ( entitiesData[entity.toString()] ) {
                        
                                if (
                                    !result.entities[entitiesData[entity.toString()].entityType]
                                ) {
                                    result.entities[entitiesData[entity.toString()].entityType] = [];
                                }
                        
                                let entityExternalId =  
                                entitiesData[entity.toString()]["metaInformation"]["externalId"];
                        
                                let entityIndex =  
                                result.entities[entitiesData[entity.toString()].entityType].findIndex(
                                    entity => entity.externalId === entityExternalId
                                )
                        
                                if ( entityIndex < 0 ) {

                                    let entityInformation =  _entityInformation(userDetails.entitiesData[entity.toString()]);
                                    entityInformation["solutions"] = [];

                                    result.entities[entitiesData[entity.toString()].entityType].push(entityInformation);
                                    
                                    entityIndex = 
                                    result.entities[entitiesData[entity.toString()].entityType].length -1 ;
                                }
                        
                                let solutionIndex = 
                                result.entities[entitiesData[entity.toString()].entityType][entityIndex].solutions.findIndex(
                                    solutionData => solutionData.externalId === solution.externalId
                                )
                        
                                if( solutionIndex < 0 ) {

                                    let submission = {};

                                    if( users[user].isObservation ) {
                                        submission = _observationSubmissionInformation(
                                            observationSubmissions,
                                            solution._id,
                                            entity
                                        );

                                    } else {

                                        submission = submissions[solution._id.toString()][entity.toString()];
                                    }

                                    let solutionInformation = { 
                                        ..._solutionInformation(
                                            program,
                                            solution
                                        ),
                                        ...submission
                                    }
                        
                                    result.entities[entitiesData[entity.toString()].entityType][entityIndex].solutions.push(
                                        solutionInformation
                                    );
                        
                                }
                            }
                        });
                    }

                }

                return resolve({
                    message : 
                    messageConstants.apiResponses.USER_ENTITIES_FETCHED_SUCCESSFULLY,

                    result : result
                })

            } catch (error) {
                return reject(error);
            }
        })
    }

};

  /**
   * Entity types .
   * @method
   * @name _entityTypesKeyValue - submission helper functionality
   * @param {Array} entities - list of entities.
   * @returns {Array} - Entity types key-value pair.
   */

  function _entityTypesKeyValue(entities) {

      let result = [];
    
      entities.forEach(entity => {
        
        let findEntityTypesIndex = 
        result.findIndex(
            type => type.key === entity.entityType
        );

        if( findEntityTypesIndex < 0 ) {
            
            result.push({
                "name" : gen.utils.camelCaseToTitleCase(entity.entityType),
                "key" : entity.entityType
            })
        }
      });
    
    return result;
  }

  /**
   * Assessment Submissions data.
   * @method
   * @name _submissions - submission helper functionality
   * @param {Array} entities - list of entities.
   * @param {Object} submissions - assessment submission.
   * @returns {Array} - submission id and submission status.
   */

function _submissions( submissions ) {

    let submissionData = {};

    submissions.forEach(submission =>{
        
        if( !submissionData[submission.solutionId.toString()] ) {
            submissionData[submission.solutionId.toString()] = {};
        }

        if( !submissionData[submission.solutionId.toString()][submission.entityId.toString()] ) {
            
            submissionData[submission.solutionId.toString()][submission.entityId.toString()] = {
                submissionId : submission.entityId,
                submissionStatus : submission.status
            }
        }
    })

    return submissionData;
}

  /**
   * observations submissions data.
   * @method
   * @name _observationSubmissions - observations helper functionality
   * @param {Array} observationSubmissions - observation submissions.
   * @returns {Array} - observations submissions data.
   */

function _observationSubmissions(observationSubmissions) {

    let submissions = {};

    observationSubmissions.forEach(submission=>{
        
        if ( !submissions[submission.observationId.toString()] ) {
            submissions[submission.observationId.toString()] =  {};
        }

        if( !submissions[submission.observationId.toString()][submission.entityId.toString()] ) {
            submissions[submission.observationId.toString()][submission.entityId.toString()] = {};
            submissions[submission.observationId.toString()][submission.entityId.toString()]["submissions"] = [];
        }
            
        submissions[submission.observationId.toString()][submission.entityId.toString()]["submissions"].push(
            {
                "status" : submission.status,
                "submissionNumber" : submission.submissionNumber,
                "entityId" : submission.entityId,
                "createdAt" : submission.createdAt,
                "updatedAt" : submission.updatedAt,
                "observationName" : submission.observationInformation.name,
                "observationId" : submission.observationId
            }
        );
    })

    return submissions;
}

  /**
   * observations submissions information.
   * @method
   * @name _observationSubmissionInformation - observations helper functionality
   * @param {Object} submissions - observation submissions key-value pair.
   * @param {String} observationId - solution internal id.
   * @param {String} entityId - entity internal id.
   * @returns {Object} - observations submissions information.
   */

function _observationSubmissionInformation(submissions,observationId,entityId) {
    return {
        totalSubmissionCount : 
        submissions[observationId] && submissions[observationId][entityId].submissions.length > 0 ? 
        submissions[observationId][entityId].submissions.length  : 
        0,

        submissions : 
        submissions[observationId] && submissions[observationId][entityId].submissions.length > 0 ? 
        submissions[observationId][entityId].submissions.slice(0,10) : 
        []

    };
}

 /**
   * program information
   * @method
   * @name _programInformation - program information
   * @param {Object} program - program data.
   * @param {String} program._id - program internal id.
   * @param {String} program.name - program name.
   * @param {String} program.description - program description.
   * @returns {Object} - program information
   */

function _programInformation(program) {
    return {
        _id : program._id,
        name : program.name,
        externalId : program.externalId,
        description : program.description,
        solutions : []
    }
}

 /**
   * solution information
   * @method
   * @name _solutionInformation - program information
   * @param {Object} program - program data.
   * @param {String} program._id - program internal id.
   * @param {String} program.name - program name.
   * @param {Object} solution - solution data.
   * @param {String} solution.externalId - solution external id.
   * @param {String} solution._id - solution internal id.
   * @param {String} solution.name - solution name.
   * @param {String} solution.description - solution description.
   * @param {String} solution.type - solution type.
   * @param {String} solution.subType - solution subType.
   * @returns {Object} - solution information
   */

function _solutionInformation(program,solution) {
    return {
        programName : program.name,
        programId : program._id,
        _id : solution._id,
        name : solution.name,
        externalId : solution.externalId,
        description : solution.description,
        type : solution.type,
        subType : solution.subType
    }
}

function _observationInformation(program,observation) {
    return {
        programName : program.name,
        programId : program._id,
        _id : observation._id,
        name : observation.name,
        externalId : observation.externalId,
        description : observation.description
    }
}

function _entitiesData(
    entities,
    entitiesData,
    solutionOrObservationId,
    submissions,
    observation = false
) {

    let result = [];

    if( entities.length > 0 ) {

        entities.forEach(entityId=>{
                                
            let entityIndex = 
            result.findIndex(entity=>
                entity.externalId === entitiesData[entityId.toString()].externalId
            );
    
            if( entityIndex < 0 ) {
    
                let entityObj = _entityInformation(
                    entitiesData[entityId.toString()]
                );
    
                let submission;
    
                if( observation ) {
    
                    submission = 
                    _observationSubmissionInformation(
                        submissions,
                        solutionOrObservationId,
                        entityId
                    );
    
                } else {
    
                    submission = 
                    submissions[solutionOrObservationId.toString()][entityId.toString()];
                }
    
                entityObj = {
                    ...entityObj,
                    ...submission
                }
    
                result.push(
                    entityObj
                );
            }
        
        })

    }

    return result;

}

 /**
   * entity information
   * @method
   * @name _entityInformation 
   * @param {Object} entityDetails - entity details key-value pair.
   * @returns {Object} - entity information
   */

function _entityInformation(entityDetails) {
    return {
        _id : entityDetails._id,
        name : entityDetails.metaInformation.name ? entityDetails.metaInformation.name : "",
        externalId : entityDetails.metaInformation.externalId,
        entityType : entityDetails.entityType
    }
}