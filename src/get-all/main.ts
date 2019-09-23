const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB() 
const ddbGeo = require('dynamodb-geo')

const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'offers')
config.hashKeyLength = 7
const myGeoTableManager = new ddbGeo.GeoDataManager(config)
const setupTable = async () => {

  // Use GeoTableUtil to help construct a CreateTableInput.
  const createTableInput = ddbGeo.GeoTableUtil.getCreateTableRequest(config)

  // Tweak the schema as desired
  createTableInput.ProvisionedThroughput.ReadCapacityUnits = 5
  
  console.log('Creating table with schema:')
  console.dir(createTableInput, { depth: null })
  
  // Create the table
  await ddb.createTable(createTableInput).promise();
}

export const handler = async () : Promise <any> => {
    //await setupTable();
    /*
    await myGeoTableManager.putPoint({
      RangeKeyValue: { S: '1234' }, // Use this to ensure uniqueness of the hash/range pairs.
      GeoPoint: { // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
          latitude: 51.51,
          longitude: -0.13
      },
      PutItemInput: { // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
          Item: { // The primary key, geohash and geojson data is filled in for you
              country: { S: 'UK' }, // Specify attribute values using { type: value } objects, like the DynamoDB API.
              capital: { S: 'London' }
          },
          // ... Anything else to pass through to `putItem`, eg ConditionExpression
      }
    }).promise();*/

    return await myGeoTableManager.queryRadius({
      RadiusInMeter: 100000,
      CenterPoint: {
          latitude: 51.509953,
          longitude: -0.130373
      }
    });
};