const { MongoClient } = require("mongodb");

module.exports = {
  async connect() {

    const url = process.env.MONGODB_URL
    const databaseName = process.env.DB
    const options = {useNewUrlParser: true}

    if (!url) {
      throw new Error("No `url` defined in config file!");
    }

    if (!databaseName) {
      throw new Error(
        "No database found"
      );
    }

    const client = await MongoClient.connect(
      url,
      options
    );

    const db = client.db(databaseName);
    db.close = client.close;
    return db;
  }
};