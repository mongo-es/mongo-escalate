const express = require('express');
// const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// app.use(bodyParser.json());
app.use(express.json());
const connectToMongo = async (mongoUri) => {
  // const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const client = new MongoClient(mongoUri);
  await client.connect();
  return client;
};

app.post('/api/v1/db/connect-mongo', async (req, res) => {
  const mongoUri = req.body.mongoUri;

  if (!mongoUri) {
    return res.status(400).json({ message: 'mongoUri is required' });
  }

  try {
    const client = await connectToMongo(mongoUri);
    const databaseList = await client.db().admin().listDatabases();

    let collectionNames = [];
    for (let database of databaseList.databases) {
      const db = client.db(database.name);
      const collections = await db.listCollections().toArray();
      const names = collections.map(collection => `${database.name}/${collection.name}`);
      collectionNames = collectionNames.concat(names);
    }

    await client.close();
    res.status(200).json({ collections: collectionNames });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error connecting to MongoDB' });
  }
});

app.post('/api/v1/db/aggregate', async (req, res) => {
  const { mongoUri, databaseName, collectionName, pipeline } = req.body;
  const uri = mongoUri;

  try {
    const client = await connectToMongo(uri);
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const results = await collection.aggregate(pipeline).toArray();
    await client.close();
    res.status(200).json(results);
  } catch (error) {
    console.error('Aggregation 실행 중 오류 발생:', error);
    res.status(500).json({ message: 'Aggregation 실행 중 오류 발생' });
  }
});

app.post('/api/v1/db/explain', async (req, res) => {
  const { mongoUri, databaseName, collectionName, pipeline } = req.body;
  const uri = mongoUri || process.env.MONGO_URI;

  try {
    const client = await connectToMongo(uri);
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const explainResult = await collection.aggregate(pipeline).explain('executionStats');
    await client.close();
    res.status(200).json(explainResult);
  } catch (error) {
    console.error('Aggregation 실행 중 오류 발생:', error);
    res.status(500).json({ message: 'Aggregation 실행 중 오류 발생' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});