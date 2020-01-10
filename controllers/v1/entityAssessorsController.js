/**
 * name : entityAssessorsController.js
 * author : Akash
 * created-date : 22-Nov-2018
 * Description : All Entity Assessors related information.
 */

// Dependencies
const entityAssessorsHelper = require(MODULES_BASE_PATH + "/entityAssessors/helper");

/**
    * EntityAssessors
    * @class
*/
module.exports = class EntityAssessors extends Abstract {
  constructor() {
    super(entityAssessorsSchema);
  }

  static get name() {
    return "entityAssessors";
  }

  /**
 * @api {get} /assessment/api/v1/entityAssessors/entities?type=:solutionType&subType=:solutionSubType&programId=:programInternalId&solutionId=:solutionInternalId Entity assessor list
 * @apiVersion 1.0.0
 * @apiName Entity assessor list
 * @apiGroup Entity Assessor
 * @apiHeader {String} X-authenticated-user-token Authenticity token
 * @apiSampleRequest /assessment/api/v1/entityAssessors/entities?type=assessment&subType=institutional&programId=5cfa4ebcfc7cae61da9add8b&solutionId=5cfdf0e5e8dc32060234571c
 * @apiUse successBody
 * @apiUse errorBody
 * @apiParamExample {json} Response:
 * "result": [
     {
      "_id": "5cfa4ebcfc7cae61da9add8b",
      "externalId": "PGM-SMC",
      "name": "SMC Program Index 2018-19",
      "description": "SMC Program Index 2018-19",
      "startDate": "2018-05-20T05:39:26.970Z",
      "endDate": "2020-05-20T05:39:26.970Z",
      "solutions": [
      {
        "_id": "5cfdf0e5e8dc32060234571c",
        "type": "assessment",
        "subType": "institutional",
        "externalId": "SOLUTION-SMC",
        "name": "SMC Assessment Framework 2019",
        "description": "SMC Assessment Framework 2019",
        "entities": [
          {
            "_id": "5cfe1f29f5fcff1170088cf3",
            "isParentInterviewCompleted": false,
            "submissionId": "5d7b3870491ec9303b93d098",
            "submissionStatus": "started",
            "externalId": "SMC01",
            "name": "SMC of School 1",
            "city": "Bengaluru",
            "state": "Delhi"
          }
        ]
      }
    ]
  }
]
 */

  /**
   * Get all the entities for particular assessor.
   * @method
   * @name entities
   * @param {Object} req - All requested Data.
   * @param {String} req.userDetails.userId - Logged in user id.
   * @param {String} req.query.programId - requested programId.
   * @param {String} req.query.solutionId - requested solutionId.
   * @param {String} req.query.type - requested entity type.
   * @param {String} req.query.subType - requested entity subType. 
   * @returns {JSON} - Entities details information.
   */

  async entities(req) {

    return new Promise(async (resolve, reject) => {

      try {

        let programs = new Array;
        let responseMessage = messageConstants.apiResponses.UNAUTHORIZED;

        let assessorEntitiesQueryObject = [
          {
            $match: {
              userId: req.userDetails.userId
            }
          },
          {
            $lookup: {
              from: "entities",
              localField: "entities",
              foreignField: "_id",
              as: "entityDocuments"
            }
          },
          {
            $project: {
              "entities": 1,
              "solutionId": 1,
              "programId": 1,
              "entityDocuments._id": 1,
              "entityDocuments.metaInformation.externalId": 1,
              "entityDocuments.metaInformation.name": 1,
              "entityDocuments.metaInformation.addressLine1": 1,
              "entityDocuments.metaInformation.addressLine2": 1,
              "entityDocuments.metaInformation.city": 1,
              "entityDocuments.metaInformation.state": 1
            }
          }
        ];

        if (req.query.programId) {
          assessorEntitiesQueryObject[0]["$match"]["programId"] = ObjectId(req.query.programId);
        }
        if (req.query.solutionId) {
          assessorEntitiesQueryObject[0]["$match"]["solutionId"] = ObjectId(req.query.solutionId);
        }

        const assessorsDocument = await database.models.entityAssessors.aggregate(assessorEntitiesQueryObject);

        let assessor;
        let solutionQueryObject = {};
        let programQueryObject = {};
        let program = {};
        let solution = {};
        let submissions;
        let entityPAISubmissionStatus = new Array;

        for (let pointerToAssessorDocumentArray = 0; pointerToAssessorDocumentArray < assessorsDocument.length; pointerToAssessorDocumentArray++) {

          assessor = assessorsDocument[pointerToAssessorDocumentArray];


          solutionQueryObject["_id"] = assessor.solutionId;
          solutionQueryObject["type"] = req.query.type;
          solutionQueryObject["subType"] = req.query.subType;
          solutionQueryObject["status"] = "active";
          solutionQueryObject["isDeleted"] = false;

          solution = await database.models.solutions.findOne(
            solutionQueryObject,
            {
              name: 1,
              description: 1,
              externalId: 1,
              type: 1,
              subType: 1
            }
          ).lean();


          programQueryObject["_id"] = assessor.programId;
          programQueryObject["status"] = "active";
          programQueryObject["isDeleted"] = false;

          program = await database.models.programs.findOne(
            programQueryObject,
            {
              name: 1,
              description: 1,
              externalId: 1,
              startDate: 1,
              endDate: 1
            }
          ).lean();


          if (solution && program) {

            submissions = await database.models.submissions.find(
              {
                entityId: {
                  $in: assessor.entities
                },
                solutionId: assessor.solutionId
              },
              {
                "entityId": 1,
                "status": 1,
                "evidences.PAI.isSubmitted": 1
              }
            );

            entityPAISubmissionStatus = submissions.reduce(
              (ac, entitySubmission) => ({
                ...ac,
                [entitySubmission.entityId.toString()]: {
                  PAIStatus: (entitySubmission.entityId && entitySubmission.entityId.evidences && entitySubmission.entityId.evidences.PAI && entitySubmission.entityId.evidences.PAI.isSubmitted === true) ? entity.entityId.evidences.PAI.isSubmitted : false,
                  submissionId: entitySubmission._id,
                  submissionStatus: (entitySubmission.entityId && entitySubmission.status) ? entitySubmission.status : "pending"
                }
              }), {});

            let programDocument = program;
            programDocument.solutions = new Array;
            solution.entities = new Array;
            assessor.entityDocuments.forEach(assessorEntity => {
              solution.entities.push({
                _id: assessorEntity._id,
                isParentInterviewCompleted: (entityPAISubmissionStatus[assessorEntity._id.toString()]) ? entityPAISubmissionStatus[assessorEntity._id.toString()]["PAIStatus"] : false,
                submissionId: (entityPAISubmissionStatus[assessorEntity._id.toString()]) ? entityPAISubmissionStatus[assessorEntity._id.toString()]["submissionId"] : "",
                submissionStatus: (entityPAISubmissionStatus[assessorEntity._id.toString()]) ? entityPAISubmissionStatus[assessorEntity._id.toString()]["submissionStatus"] : "pending",
                ...assessorEntity.metaInformation
              });
            })
            programDocument.solutions.push(solution);
            programs.push(programDocument);
          }

        }

        responseMessage = messageConstants.apiResponses.ENTITY_FETCHED;

        return resolve({
          message: responseMessage,
          result: programs
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }

    });

  }

  /**
* @api {post} /assessment/api/v1/entityAssessors/upload Upload Entity Information CSV
* @apiVersion 1.0.0
* @apiName Upload Entity Assessor Information CSV
* @apiGroup Entity Assessor
* @apiParam {File} assessors Mandatory assessors file of type CSV.
* @apiSampleRequest /assessment/api/v1/entityAssessors/upload
* @apiUse successBody
* @apiUse errorBody
*/

  /**
   * Upload entity assessors via csv.
   * @method
   * @name upload
   * @param {Object} req - All requested Data.
   * @param {String} req.userDetails.userId - Logged in user id.
   * @param {Object} req.files - requested files.
   * @param {String} req.rspObj.userToken - requested user token.
   * @returns {JSON} - message indicating entity assessors created.
   */

  async upload(req) {

    return new Promise(async (resolve, reject) => {

      try {

        await entityAssessorsHelper.upload(req.files, null, null, req.userDetails.userId, req.rspObj.userToken);

        let response = { message : messageConstants.apiResponses.ASSESSOR_CREATED };

        return resolve(response);

      } catch (error) {

        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });

      }

    })

  }

  /**
* @api {post} /assessment/api/v1/entityAssessors/uploadForPortal?programId=:programExternalId&solutionId=:solutionExternalId Upload Entity Information CSV Using Portal
* @apiVersion 1.0.0
* @apiName Upload Entity Assessor Information CSV Using Portal
* @apiGroup Entity Assessor
* @apiParam {File} assessors Mandatory assessors file of type CSV.
* @apiSampleRequest /assessment/api/v1/entityAssessors/uploadForPortal?programId=PROGID01&solutionId=EF-DCPCR-2018-001
* @apiUse successBody
* @apiUse errorBody
*/

/**
   * Upload entity assessors via csv in portal.
   * @method
   * @name uploadForPortal
   * @param {Object} req - All requested Data.
   * @param {String} req.userDetails.userId - Logged in user id.
   * @param {String} req.query.programId - program id.
   * @param {String} req.query.solutionId - solution id. 
   * @param {Object} req.files - requested files.
   * @param {String} req.rspObj.userToken - requested user token.
   * @returns {JSON} - message indicating entity assessors created.
  */

  async uploadForPortal(req) {

    return new Promise(async (resolve, reject) => {

      try {

        let programId = req.query.programId;
        let solutionId = req.query.solutionId;

        await entityAssessorsHelper.upload(req.files, programId, solutionId, req.userDetails.userId, req.rspObj.userToken);

        let response = { message: messageConstants.apiResponses.ASSESSOR_CREATED };

        return resolve(response);

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }

    })
  }

  /**
* @api {get} /assessment/api/v1/entityAssessors/pendingAssessments Pending Assessments
* @apiVersion 1.0.0
* @apiName Pending Assessments
* @apiGroup Entity Assessor
* @apiHeader {String} X-authenticated-user-token Authenticity token
* @apiSampleRequest /assessment/api/v1/entityAssessors/pendingAssessments
* @apiUse successBody
* @apiUse errorBody
* @apiParamExample {json} Response:
{
    "message": "Pending Assessments",
    "status": 200,
    "result": [
        {
            "_id": "5dca4478284feccded8f35c6",
            "userId": "e97b5582-471c-4649-8401-3cc4249359bb",
            "solutionId": "5b98fa069f664f7e1ae7498c",
            "createdAt": "2019-01-01T00:00:00.000Z",
            "entityId": "5c0bbab881bdbe330655d83c",
            "programId": "5b98d7b6d4f87f317ff615ee"
        }
      ]
  }
*/

/**
   * Pending Assessments.
   * @method
   * @name pendingAssessments
   * @returns {JSON} - List of pending assessments.
  */

  async pendingAssessments() {
    return new Promise(async (resolve, reject) => {
      try {

        let status = {
          pending: true,
        };

        let pendingAssessmentDocument = await entityAssessorsHelper.pendingOrCompletedAssessment(status);

        return resolve({
          message: messageConstants.apiResponses.PENDING_ASSESSMENT,
          result: pendingAssessmentDocument
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }


  /**
* @api {get} /assessment/api/v1/entityAssessors/completedAssessments Completed Assessments
* @apiVersion 1.0.0
* @apiName Completed Assessments
* @apiGroup Entity Assessor
* @apiHeader {String} X-authenticated-user-token Authenticity token
* @apiSampleRequest /assessment/api/v1/entityAssessors/completedAssessments
* @apiUse successBody
* @apiUse errorBody
* @apiParamExample {json} Response:
{
    "message": "Completed Assessments",
    "status": 200,
    "result": [
        {
            "_id": "5dca4478284feccded8f35c6",
            "userId": "e97b5582-471c-4649-8401-3cc4249359bb",
            "solutionId": "5b98fa069f664f7e1ae7498c",
            "createdAt": "2019-01-01T00:00:00.000Z",
            "entityId": "5c0bbab881bdbe330655d83c",
            "programId": "5b98d7b6d4f87f317ff615ee"
        }
      ]
}
*/

/**
   * Completed Assessments.
   * @method
   * @name completedAssessments
   * @returns {JSON} - List of completed assessments.
  */

  async completedAssessments() {
    return new Promise(async (resolve, reject) => {
      try {

        let status = {
          completed: true
        }

        let completedAssessmentDocument = await entityAssessorsHelper.pendingOrCompletedAssessment(status)

        return resolve({
          message: messageConstants.apiResponses.COMPLETED_ASSESSMENT,
          result: completedAssessmentDocument
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

};
