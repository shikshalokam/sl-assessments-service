module.exports = {
  async up(db) {
    global.migrationMsg = "Add isReusable flag to solutions."
    

    let solutionDocuments = await db.collection('solutions').find({}).project({entities: 1}).toArray();

    await Promise.all(solutionDocuments.map(async (solution) => {

      let isReusable = true
      
      if (solution.entities.length > 0) {
        isReusable = false
      }

      return await db.collection('solutions').findOneAndUpdate({
        _id: solution._id
      }, { $set: {isReusable: isReusable}})

    }))

    return true

  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
