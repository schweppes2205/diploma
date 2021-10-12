import * as AWS from 'aws-sdk';
import { RestApiResponse } from "./helper/restApiResponse";
class QueryParamHelper {
    constructor(public resource: string, public name: string, public wookiee: boolean = false) { }
}

export const handler = async (event: any) => {
    console.log(JSON.stringify(event));
    if (!event.queryStringParameters) { return new RestApiResponse("400", "No parameters are mentioned") };
    // all user parameters came from the API Request
    const restQueryParams: QueryParamHelper = event.queryStringParameters;
    const ddbAgent = new AWS.DynamoDB.DocumentClient();
    if (restQueryParams.name) {
        let ddbQueryParams = {
            TableName: restQueryParams.resource,
            Key: {
                name: restQueryParams.name
            }
        };
        try {
            let originalResponce = await ddbAgent.get(ddbQueryParams).promise();
            console.log(`record found with params: ${JSON.stringify(ddbQueryParams)}`);
            return new RestApiResponse("200", JSON.stringify(originalResponce));
        } catch (_err) {
            return new RestApiResponse("500", `Error appeared. Error message: ${_err}`);
        }
    }
    else {
        let ddbScanParams = {
            TableName: restQueryParams.resource
        }
        try {
            let originalResponce = await ddbAgent.scan(ddbScanParams).promise();
            return new RestApiResponse("200", JSON.stringify(originalResponce.Items));
        } catch (_err) {
            return new RestApiResponse("500", `Error appeared. Error message: ${_err}`);
        }
    }
}