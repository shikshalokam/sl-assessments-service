const entityHelper = require(ROOT_PATH + "/module/entity/helper")
module.exports = class Entity extends Abstract {
  constructor() {
    super(entitySchema);
  }

  static get name() {
    return "entity";
  }

  /**
* @api {post} /assessment/api/v1/entity/add?type=:entityType Entity add
* @apiVersion 0.0.1
* @apiName Entity add
* @apiGroup Entity
* @apiParamExample {json} Request-Body:
* {
*	"data": [
*       {
*	        "studentName" : "",
*	        "grade" : "",
*	        "name" : "",
*	        "gender" : "",
*   		  "type": "",
*  		    "typeLabel":"",
* 		    "phone1": "Phone",
* 		    "phone2": "",
* 		    "address": "",
*	        "schoolId" : "",
*   		  "schoolName": "",
*  		    "programId": ""
*      },
*	]
*}
* @apiUse successBody
* @apiUse errorBody
*/
  add(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entityHelper.add(req.query.type, req.body.data, req.userDetails);

        return resolve({
          message: "Entity information added successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

  /**
* @api {get} /assessment/api/v1/entity/list/:entityId?type=:entityType Entity list
* @apiVersion 0.0.1
* @apiName Entity list
* @apiGroup Entity
* @apiHeader {String} X-authenticated-user-token Authenticity token
* @apiSampleRequest /assessment/api/v1/entity/list/5bfe53ea1d0c350d61b78d0a?type=parent
* @apiUse successBody
* @apiUse errorBody
*/
  list(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entityHelper.list(req.query.type, req.params._id);

        return resolve({
          message: "Information fetched successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }


  /**
  * @api {get} /assessment/api/v1/entity/form?type=:entityType Entity form
  * @apiVersion 0.0.1
  * @apiName Entity form
  * @apiGroup Entity
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entity/form?type=parent
  * @apiUse successBody
  * @apiUse errorBody
  */
  form(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entityHelper.form(req.query.type);

        return resolve({
          message: "Information fetched successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }

    })
  }

  /**
  * @api {get} /assessment/api/v1/entity/fetch/:entityId?type=:entityType Entity profile
  * @apiVersion 0.0.1
  * @apiName Entity profile
  * @apiGroup Entity
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entity/fetch/5bfe53ea1d0c350d61b78d0a?type=parent
  * @apiUse successBody
  * @apiUse errorBody
  */
  fetch(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entityHelper.fetch(req.query.type, req.params._id);

        return resolve({
          message: "Information fetched successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

  /**
* @api {post} /assessment/api/v1/entity/update/:entityId?type=:entityType Update Entity Information
* @apiVersion 0.0.1
* @apiName Update Entity Information
* @apiGroup Entity
* @apiParamExample {json} Request-Body:
* 	{
*	        "studentName" : "",
*	        "grade" : "",
*	        "name" : "",
*	        "gender" : "",
*   		  "type": "",
*  		    "typeLabel":"",
*  		    "phone1": "",
*  	    	"phone2": "",
*     		"address": "",
*    		  "programId": "",
*    		  "callResponse":"",
*         "createdByProgramId" : "5b98d7b6d4f87f317ff615ee",
*         "parentEntityId" : "5bfe53ea1d0c350d61b78d0a"
*   }
* @apiUse successBody
* @apiUse errorBody
*/
  update(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entityHelper.update(req.query.type, req.params._id, req.body);

        return resolve({
          message: "Information updated successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

  /**
* @api {post} /assessment/api/v1/entity/upload?type=:entityType Upload Entity Information CSV
* @apiVersion 0.0.1
* @apiName Upload Entity Information CSV
* @apiGroup Entity
* @apiParamExample {json} Request-Body:
* 	Upload CSV
* @apiUse successBody
* @apiUse errorBody
*/
  upload(req) {
    return new Promise(async (resolve, reject) => {

      try {

        await entityHelper.upload(req.query.type, null, null, req.userDetails, req.files);

        return resolve({
          message: "Information updated successfully."
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

  /**
* @api {post} /assessment/api/v1/entity/uploadForPortal?type=:entityType&programId=:programExternalId&solutionId=:solutionExternalId Upload Entity Information CSV Using Portal
* @apiVersion 0.0.1
* @apiName Upload Entity Information CSV Using Portal
* @apiGroup Entity
* @apiParamExample {json} Request-Body:
* 	Upload CSV
* @apiUse successBody
* @apiUse errorBody
*/
  uploadForPortal(req) {
    return new Promise(async (resolve, reject) => {

      try {

        await entityHelper.upload(req.query.type, req.query.programId, req.query.solutionId, req.userDetails, req.files);

        return resolve({
          message: "Information updated successfully."
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

};
