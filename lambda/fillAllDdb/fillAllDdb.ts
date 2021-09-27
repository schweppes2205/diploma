import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { RestApiResponse } from "./helper/restApiResponse";

export const handler = async () => {
    // AWS API GW
    let baseApiUrl: string = process.env.apiUrl;
    let apiResources = process.env.apiResourceList?.split(";");

    apiResources?.forEach(async (apiResource) => {
        try {
            let resp = await fetch(`${baseApiUrl}/${apiResource}`, { method: 'PATCH', body: '' });
            let body = await resp.json();
            console.log(body);
            return new RestApiResponse("200", "Success");
        } catch (_err) {
            let errorStr = `Error during calling of apiResource resource. Error: ${_err}`
            console.error(errorStr);
            return new RestApiResponse("500", JSON.stringify(errorStr));
        }
    });
}

// handler();