/**
 * name : pollsController.js
 * author : Deepa
 * created-date : 01-Aug-2020
 * Description : Polls information
 */

// Dependencies
const pollsHelper = require(MODULES_BASE_PATH + "/polls/helper");


/**
    * Polls
    * @class
*/
module.exports = class Polls extends Abstract {

    constructor() {
        super(pollsSchema);
    }

    static get name() {
        return "polls";
    }

     /**
    * @api {get} /assessment/api/v1/polls/metaForm Poll Creation Meta Form
    * @apiVersion 1.0.0
    * @apiName Poll Creation Meta Form
    * @apiGroup Polls
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/polls/metaForm
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    * "staus": 200,
    * "message": "Form fetched successfully",
    * "result": [
       {
        field: "name",
        label: "Name of the Poll",
        value: "",
        visible: true,
        editable: true,
        validation: {
          required: true
        },
        input: "text"
      },
      {
        field: "creator",
        label: "Name of the Creator",
        value: "",
        visible: true,
        editable: true,
        validation: {
          required: true
        },
        input: "text"
      },
      {
        field: "endDate",
        label: "End Date",
        value: "",
        visible: true,
        editable: true,
        validation: {
          required: true
        },
         input: "radio",
         options: [
          {
            value : 1,
            label : "one day"
          },
          {
            value : 2,
            label : "two days"
          },
          {
            value : 3,
            label : "three days"
          },
          {
            value : 4,
            label : "four days"
          },
          {
            value : 5,
            label : "five days"
          },
          {
            value : 6,
            label : "six days"
          },
          {
            value : 7,
            label : "seven days"
          }
        ]
      },
       {
        field : "responseType",
        label : "Choose response type",
        value : "",
        visible : true,
        editable : true,
        validation : {
          required : true
        },
        input : "radio",
              options : [
          {
            value : "radio",
            label : "Single select"
          },
          {
            value : "multiselect",
            label : "Multiselect"
          },
          {
            value : "emoji",
            label : "Emoji"
          },
          {
            value : "gesture",
            label : "Gesture"
          }
        ]
  
      },
      {
        field : "question",
        label : "Question",
        value : "",
        visible : true,
        editable : true,
        validation : {
          required : true
        },
        input : "text"
      }
    ]
    }
    */

     /**
   * Poll Creation Meta Form
   * @method
   * @name metaForm
   * @param {Object} req -request Data.
   * @returns {JSON} - Poll Creation Meta Form.
   */

   async metaForm(req) {

    return new Promise(async (resolve, reject) => {

        try {
           
            let pollCreationForm = 
            await pollsHelper.metaForm();

            return resolve({
                          message: pollCreationForm.message,
                          result: pollCreationForm.data
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
     * @api {post} /assessment/api/v1/polls/create Create Poll
     * @apiVersion 1.0.0
     * @apiName Create Poll
     * @apiGroup Polls
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/polls/create
     * @apiParamExample {json} Request-Body:
     * {
     *   "name": "Feedback",
         "questions": [{
             "question": "Which app do you use the most ?",
             "responseType": "radio",
             "options": [{ "value": "","label":"samiksha"},
                         { "value": "","label":"unnati"},
                         { "value": "","label":"bodh"}] 
         }],
          "endDate" : 2
     * }
     * @apiParamExample {json} Response:
     * { 
     *  "status": 200,
     *  "message": "Poll created successfully",
     *  "result": {
     *      "link": "samiksha://shikshalokam.org/take-poll/4f0f10c0-e2ca-11ea-825b-d958912b038c/5f3e46f03b1fd32ceab97099"
     *   }
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */
     
    /**
    * Create Poll
    * @method
    * @name create
    * @param {Object} req - request Data. 
    * @param req.body - poll creation  object
    * @returns {String} - Sharable link.
    */

   create(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let createDocument = await pollsHelper.create(
               req.body,
               req.userDetails.userId
            );

            return resolve({
                  message : createDocument.message,
                  result: createDocument.data
            });

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
     * @api {get} /assessment/api/v1/polls/list List polls
     * @apiVersion 1.0.0
     * @apiName List polls
     * @apiGroup Polls
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/polls/list
     * @apiParamExample {json} Response:
     * {
     *  "status": 200,
     *  "message": "Polls list fetched successfully",
     *  "result": [{
     *      "_id": "5f3a72359e156a44ee7565b8",
     *      "name": "Feedback"
     *     }]
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */
     
    /**
    * List active polls.
    * @method
    * @name list
    * @param {Object} req -request Data. 
    * @returns {JSON} - active polls list.
    */

   list(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let pollsList = await pollsHelper.list(
               req.userDetails.userId
            );

            return resolve({
                message: pollsList.message,
                result: pollsList.data
            });

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
     * @api {get} /assessment/api/v1/polls/delete/:pollId Delete an poll
     * @apiVersion 1.0.0
     * @apiName Delete an poll
     * @apiGroup Polls
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/polls/delete/5b98fa069f664f7e1ae7498c
     * @apiParamExample {json} Response:
     * {
     *  "status": 200,
     *  "message": "Poll deleted successfully"
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */
     
    /**
    * Delete poll.
    * @method
    * @name delete
    * @param {Object} req -request Data.
    * @param {String} req.params._id - pollId.  
    * @returns {String} - message
    */

   delete(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let result = await pollsHelper.delete(
                req.params._id
            );

            return resolve({
               message: result.message
            });

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
     * @api {get} /assessment/api/v1/polls/getpollQuestions/:pollId Get the poll questions
     * @apiVersion 1.0.0
     * @apiName Get the poll questions
     * @apiGroup Polls
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/polls/getpollQuestions/5f2bcc04456a2a770c4a5f3b
     * @apiParamExample {json} Response:
     * {
     *  "status": 200,
     *  "message": "Poll questions fetched successfully",
     *  "result": [{
            "qid": "5e98fa069f664f7e1ae7498c",
            "question": "Which app do you use the most?",
            "responseType": "radio",
            "options": [{ "value": "","label":"samiksha"},
                         { "value": "","label":"unnati"},
                         { "value": "","label":"bodh"}] 
     *     }]
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */
     
    /**
    * Get the poll questions
    * @method
    * @name getpollQuestions
    * @param {Object} req -request Data.
    * @param {String} req.params._id - pollId.  
    * @returns {JSON} - poll questions and options
    */

   getpollQuestions(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let pollQuestions = await pollsHelper.getpollQuestions(
                req.params._id
            );

            return resolve({
                  message: pollQuestions.message,
                  result: pollQuestions.data
            });

        } catch (error) {

            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }
    })
}

}
