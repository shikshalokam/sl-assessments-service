module.exports = {
  async up(db) {
    global.migrationMsg = "Create a view combining criteria and questions."

    return await db.createCollection('criteriaQuestions', {
      viewOn: 'criteria',
      pipeline : [ 
        {
            "$unwind" : "$evidences"
        }, 
        {
            "$unwind" : "$evidences.sections"
        }, 
        {
            "$lookup" : {
                "from" : "questions",
                "localField" : "evidences.sections.questions",
                "foreignField" : "_id",
                "as" : "evidences.sections.questions"
            }
        }, 
        {
            "$addFields" : {
                "evidences.sections.questions.criteriaId" : "$_id"
            }
        }, 
        {
            "$group" : {
                "_id" : {
                    "_id" : "$_id",
                    "evidences_name" : "$evidences.name"
                },
                "name" : {
                    "$first" : "$name"
                },
                "externalId" : {
                    "$first" : "$externalId"
                },
                "frameworkCriteriaId" : {
                    "$first" : "$frameworkCriteriaId"
                },
                "owner" : {
                    "$first" : "$owner"
                },
                "timesUsed" : {
                    "$first" : "$timesUsed"
                },
                "weightage" : {
                    "$first" : "$weightage"
                },
                "description" : {
                    "$first" : "$description"
                },
                "criteriaType" : {
                    "$first" : "$criteriaType"
                },
                "score" : {
                    "$first" : "$score"
                },
                "remarks" : {
                    "$first" : "$remarks"
                },
                "flag" : {
                    "$first" : "$flag"
                },
                "resourceType" : {
                    "$first" : "$resourceType"
                },
                "language" : {
                    "$first" : "$language"
                },
                "keywords" : {
                    "$first" : "$keywords"
                },
                "concepts" : {
                    "$first" : "$concepts"
                },
                "createdFor" : {
                    "$first" : "$createdFor"
                },
                "rubric" : {
                    "$first" : "$rubric"
                },
                "evidenceExternalId" : {
                    "$first" : "$evidences.externalId"
                },
                "evidenceName" : {
                    "$first" : "$evidences.name"
                },
                "evidenceTip" : {
                    "$first" : "$evidences.tip"
                },
                "evidenceDescription" : {
                    "$first" : "$evidences.description"
                },
                "evidenceStartTime" : {
                    "$first" : "$evidences.startTime"
                },
                "evidenceEndTime" : {
                    "$first" : "$evidences.endTime"
                },
                "evidenceIsSubmitted" : {
                    "$first" : "$evidences.isSubmitted"
                },
                "evidenceModeOfCollection" : {
                    "$first" : "$evidences.modeOfCollection"
                },
                "evidenceCanBeNotApplicable" : {
                    "$first" : "$evidences.canBeNotApplicable"
                },
                "sections" : {
                    "$push" : "$evidences.sections"
                }
            }
        }, 
        {
            "$group" : {
                "_id" : "$_id._id",
                "name" : {
                    "$first" : "$name"
                },
                "externalId" : {
                    "$first" : "$externalId"
                },
                "frameworkCriteriaId" : {
                    "$first" : "$frameworkCriteriaId"
                },
                "owner" : {
                    "$first" : "$owner"
                },
                "timesUsed" : {
                    "$first" : "$timesUsed"
                },
                "weightage" : {
                    "$first" : "$weightage"
                },
                "description" : {
                    "$first" : "$description"
                },
                "criteriaType" : {
                    "$first" : "$criteriaType"
                },
                "score" : {
                    "$first" : "$score"
                },
                "remarks" : {
                    "$first" : "$remarks"
                },
                "flag" : {
                    "$first" : "$flag"
                },
                "resourceType" : {
                    "$first" : "$resourceType"
                },
                "language" : {
                    "$first" : "$language"
                },
                "keywords" : {
                    "$first" : "$keywords"
                },
                "concepts" : {
                    "$first" : "$concepts"
                },
                "createdFor" : {
                    "$first" : "$createdFor"
                },
                "rubric" : {
                    "$first" : "$rubric"
                },
                "evidences" : {
                    "$push" : {
                        "name" : "$evidenceName",
                        "externalId" : "$evidenceExternalId",
                        "tip" : "$evidenceTip",
                        "description" : "$evidenceDescription",
                        "startTime" : "$evidenceStartTime",
                        "endTime" : "$evidenceEndTime",
                        "isSubmitted" : "$evidenceIsSubmitted",
                        "modeOfCollection" : "$evidenceModeOfCollection",
                        "canBeNotApplicable" : "$evidenceCanBeNotApplicable",
                        "sections" : "$sections"
                    }
                }
            }
        }
      ],
    });

  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
