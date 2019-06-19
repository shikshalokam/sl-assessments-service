const csv = require("csvtojson");
module.exports = class Solutions extends Abstract {

  /**
      * @apiDefine errorBody
      * @apiError {String} status 4XX,5XX
      * @apiError {String} message Error
      */

  /**
      * @apiDefine successBody
      *  @apiSuccess {String} status 200
      * @apiSuccess {String} result Data
      */

  constructor() {
    super(solutionsSchema);
  }

  static get name() {
    return "solutions";
  }

  /**
  * @api {get} /assessment/api/v1/solutions/details/:solutionInternalId Framework & Rubric Details
  * @apiVersion 0.0.1
  * @apiName Framework & Rubric Details of a Solution
  * @apiGroup Solutions
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/solutions/details/5b98fa069f664f7e1ae7498c
  * @apiUse successBody
  * @apiUse errorBody
  */

  async details(req) {
    return new Promise(async (resolve, reject) => {
      try {

        if (!req.params._id || req.params._id == "") {
          throw "Invalid parameters."
        }

        let findQuery = {
          _id: req.params._id
        }

        let solutionDocument = await database.models.solutions.findOne(findQuery, { themes: 1, levelToScoreMapping: 1, name: 1 }).lean()

        let criteriasIdArray = gen.utils.getCriteriaIds(solutionDocument.themes);
        let criteriaDocument = await database.models.criteria.find({ _id: { $in: criteriasIdArray } }, { "name": 1, "rubric.levels": 1 }).lean()

        let criteriaObject = {}

        criteriaDocument.forEach(eachCriteria => {
          let levelsDescription = {}

          for (let k in eachCriteria.rubric.levels) {
            levelsDescription[k] = eachCriteria.rubric.levels[k].description
          }

          criteriaObject[eachCriteria._id.toString()] = _.merge({
            name: eachCriteria.name
          }, levelsDescription)
        })

        let responseObject = {}
        responseObject.heading = "Solution Framework + rubric for - " + solutionDocument.name

        responseObject.sections = new Array

        let levelValue = {}

        let sectionHeaders = new Array

        sectionHeaders.push({
          name: "criteriaName",
          value: "Domain"
        })

        for (let k in solutionDocument.levelToScoreMapping) {
          levelValue[k] = ""
          sectionHeaders.push({ name: k, value: solutionDocument.levelToScoreMapping[k].label })
        }

        let generateCriteriaThemes = function (themes, parentData = []) {

          themes.forEach(theme => {

            if (theme.children) {
              let hierarchyTrackToUpdate = [...parentData]
              hierarchyTrackToUpdate.push(_.pick(theme, ["type", "label", "externalId", "name"]))

              generateCriteriaThemes(theme.children, hierarchyTrackToUpdate)

            } else {

              let tableData = new Array
              let levelObjectFromCriteria = {}

              let hierarchyTrackToUpdate = [...parentData]
              hierarchyTrackToUpdate.push(_.pick(theme, ["type", "label", "externalId", "name"]))

              theme.criteria.forEach(criteria => {

                if (criteriaObject[criteria.criteriaId.toString()]) {

                  Object.keys(levelValue).forEach(eachLevel => {
                    levelObjectFromCriteria[eachLevel] = criteriaObject[criteria.criteriaId.toString()][eachLevel]
                  })

                  tableData.push(_.merge({
                    criteriaName: criteriaObject[criteria.criteriaId.toString()].name,
                  }, levelObjectFromCriteria))
                }

              })

              let eachSection = {
                table: true,
                data: tableData,
                tabularData: {
                  headers: sectionHeaders
                },
                summary: hierarchyTrackToUpdate
              }

              responseObject.sections.push(eachSection)
            }
          })

        }

        generateCriteriaThemes(solutionDocument.themes)

        let response = {
          message: "Solution framework + rubric fetched successfully.",
          result: responseObject
        };

        return resolve(response);

      } catch (error) {
        return reject({
          status: 500,
          message: error,
          errorObject: error
        });
      }
    });
  }


  /**
  * @api {get} /assessment/api/v1/solutions/importFromFramework/?programId:programExternalId&frameworkId:frameworkExternalId Create solution from framework.
  * @apiVersion 0.0.1
  * @apiName Create solution from framework.
  * @apiGroup Solutions
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiParam {String} programId Program External ID.
  * @apiParam {String} frameworkId Framework External ID.
  * @apiParam {String} entityType Entity Type.
  * @apiSampleRequest /assessment/api/v1/solutions/importFromFramework?programId=PGM-SMC&frameworkId=EF-SMC
  * @apiUse successBody
  * @apiUse errorBody
  */

  async importFromFramework(req) {
    return new Promise(async (resolve, reject) => {
      try {

        if (!req.query.programId || req.query.programId == "" || !req.query.frameworkId || req.query.frameworkId == "" || !req.query.entityType || req.query.entityType == "") {
          throw "Invalid parameters."
        }

        let frameworkDocument = await database.models.frameworks.findOne({
          externalId: req.query.frameworkId
        }).lean()

        if (!frameworkDocument._id) {
          throw "Invalid parameters."
        }

        let programDocument = await database.models.programs.findOne({
          externalId: req.query.programId
        }, {
            _id: 1,
            externalId: 1,
            name: 1,
            description: 1
          }).lean()

        if (!programDocument._id) {
          throw "Invalid parameters."
        }

        let entityTypeDocument = await database.models.entityTypes.findOne({
          name: req.query.entityType
        }, {
            _id: 1,
            name: 1
          }).lean()

        if (!entityTypeDocument._id) {
          throw "Invalid parameters."
        }

        let criteriasIdArray = gen.utils.getCriteriaIds(frameworkDocument.themes);

        let frameworkCriteria = await database.models.criteria.find({ _id: { $in: criteriasIdArray } }).lean();

        let solutionCriteriaToFrameworkCriteriaMap = {}

        await Promise.all(frameworkCriteria.map(async (criteria) => {
          criteria.frameworkCriteriaId = criteria._id
          let newCriteriaId = await database.models.criteria.create(_.omit(criteria, ["_id"]))
          if (newCriteriaId._id) {
            solutionCriteriaToFrameworkCriteriaMap[criteria._id.toString()] = newCriteriaId._id
          }
        }))


        let updateThemes = function (themes) {
          themes.forEach(theme => {
            let criteriaIdArray = new Array
            let themeCriteriaToSet = new Array
            if (theme.children) {
              updateThemes(theme.children);
            } else {
              criteriaIdArray = theme.criteria;
              criteriaIdArray.forEach(eachCriteria => {
                eachCriteria.criteriaId = solutionCriteriaToFrameworkCriteriaMap[eachCriteria.criteriaId.toString()] ? solutionCriteriaToFrameworkCriteriaMap[eachCriteria.criteriaId.toString()] : eachCriteria.criteriaId
                themeCriteriaToSet.push(eachCriteria)
              })
              theme.criteria = themeCriteriaToSet
            }
          })
          return true;
        }

        let newSolutionDocument = _.cloneDeep(frameworkDocument)

        updateThemes(newSolutionDocument.themes)

        newSolutionDocument.programId = programDocument._id
        newSolutionDocument.programExternalId = programDocument.externalId
        newSolutionDocument.programName = programDocument.name
        newSolutionDocument.programDescription = programDocument.description

        newSolutionDocument.frameworkId = frameworkDocument._id
        newSolutionDocument.frameworkExternalId = frameworkDocument.externalId

        newSolutionDocument.entityTypeId = entityTypeDocument._id
        newSolutionDocument.entityType = entityTypeDocument.name

        let newSolutionId = await database.models.solutions.create(_.omit(newSolutionDocument, ["_id"]))

        if (newSolutionId._id) {
          await database.models.programs.updateOne({ _id: programDocument._id }, { $addToSet: { components: newSolutionId._id } })
        }

        let response = {
          message: "Solution generated and mapped to the program.",
          result: newSolutionId._id
        };

        return resolve(response);

      } catch (error) {
        return reject({
          status: 500,
          message: error,
          errorObject: error
        });
      }
    });
  }

  /**
    * @api {get} /assessment/api/v1/solutions/mapEntityToSolution/:solutionExternalId Map entity id to solution
    * @apiVersion 0.0.1
    * @apiName Map entity id to solution
    * @apiGroup Solutions
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiParam {String} solutionId solution id.
    * @apiUse successBody
    * @apiUse errorBody
    */

  async mapEntityToSolution(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let responseMessage = "Entities updated successfully.";

        let entityIdsFromCSV = await csv().fromString(req.files.entities.data.toString());

        entityIdsFromCSV = entityIdsFromCSV.map(entity => ObjectId(entity.entityIds));

        let solutionDocument = await database.models.solutions.findOne({ externalId: req.params._id }, { entityType: 1 }).lean();

        let entitiesDocument = await database.models.entities.find({ _id: { $in: entityIdsFromCSV }, entityType: solutionDocument.entityType }, { _id: 1 }).lean();

        let entityIds = entitiesDocument.map(entity => entity._id);

        if (entityIdsFromCSV.length != entityIds.length) responseMessage = "Not all entities are updated.";

        await database.models.solutions.updateOne(
          { externalId: req.params._id },
          { $addToSet: { entities: entityIds } }
        )

        return resolve({ message: responseMessage });

      } catch (error) {
        return reject({
          status: 500,
          message: error,
          errorObject: error
        });
      }
    });
  }


};