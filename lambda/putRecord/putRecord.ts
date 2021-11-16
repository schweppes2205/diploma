import * as AWS from 'aws-sdk';
import { RestApiResponse } from "./helper/restApiResponse";
class QueryParamHelper {
    constructor(public resource: string, public record: any) { }
}

export const handler = async (event: any) => {
    console.log(JSON.stringify(event));
    if (!event.body) { return new RestApiResponse("400", "No parameters are mentioned") };
    // all user parameters came from the API Request
    const restPutParams: QueryParamHelper = JSON.parse(event.body);
    const ddbAgent = new AWS.DynamoDB.DocumentClient();
    // check essential params
    if (restPutParams.resource && restPutParams.record) {
        try {
            let ddbQueryParams: AWS.DynamoDB.PutItemInput = {
                TableName: restPutParams.resource,
                Item: restPutParams.record,
            };
            let originalResponce = await ddbAgent.put(ddbQueryParams).promise();
            console.log(`record created. params: ${JSON.stringify(ddbQueryParams)}`);
            return new RestApiResponse("200", "record successfully created");
        } catch (_err) {
            const errStr: string = `Error appeared. Error message: ${_err}`;
            console.log(errStr);
            return new RestApiResponse("500", errStr);
        }
    }
    else {
        const errStr: string = "Parameters are missed: resource, record";
        console.log(errStr);
        return new RestApiResponse("500", errStr);
    }
}
