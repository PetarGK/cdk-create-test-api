const AWS = require('aws-sdk');

export const handler = async (event: any = {}) : Promise <any> => {

  const requestedItemId = event.pathParameters.id;
  if (!requestedItemId) {
    return { statusCode: 400, body: `Error: You are missing the path parameter id` };
  }


  try {
    const response = { message: "This is get One lambda message" };
    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};