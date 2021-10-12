import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origStarshipResourceScheme, wookieeStarshipResourceScheme } from "../../interfaces/dbInterfacesAll";
import { v1 } from 'node-uuid';
import { RestApiResponse } from "./helper/restApiResponse";

async function putStarshipRecordOrigWooTable(
    origRawData: string,
    // wookieeRawData: string,
    origTableName: string,
    // wookieeTableName: string,
): Promise<void> {
    console.debug(`Input data.origTableName: ${origTableName}\norigRawData: ${origRawData}`);
    // creating a db client
    const ddbAgent = new AWS.DynamoDB.DocumentClient();
    //generated record id for a record in original table.
    // will be used as search key in wookiee table
    const recordId = v1();
    console.debug(`New recordId: ${recordId}`);
    // parsing input and creating a db record for original table
    let origRecord: origStarshipResourceScheme = JSON.parse(origRawData);
    origRecord.id = recordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    console.debug(`origParams: ${JSON.stringify(origParams)}`);
    // parsing input for wookiee table record with according interface
    // let wookieeRecord: wookieeStarshipResourceScheme = JSON.parse(wookieeRawData);
    // wookieeRecord.id = recordId;
    // let wookieeParams = {
    //     TableName: wookieeTableName,
    //     Item: wookieeRecord,
    // }

    await ddbAgent.put(origParams).promise();
    // var wookieeResponce = await ddbAgent.put(wookieeParams).promise();
}

export const handler = async () => {
    // first URL from environment variables;
    // let url: string = "https://swapi.dev/api/films/";
    let url: string = process.env.starWarsResourceUrl!;
    console.debug(`request url: ${url}`);
    // gathering all starship into a single array
    let allStarshipList: any[] = [];
    // the paging loop
    try {
        do {
            let allStarshipResponce = await fetch(url)
            let allStarshipBody = await allStarshipResponce.json();
            allStarshipList = allStarshipList.concat(allStarshipBody["results"]);
            url = allStarshipBody["next"]
        }
        while (url !== null);
        console.debug(`allStarshipList is gathered. Data: ${JSON.stringify(allStarshipList)}`);
    } catch (_err) {
        let errorStr = `Error during paging starships. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    try {
        // for (let i = 0; i < allStarshipList.length; i++) {
        //     let url = `${allStarshipList[i]['url']}?format=wookiee`
        //     let wookieeStarshipResponce = await fetch(url);
        //     let wookieeStarshipBodyOrig = await wookieeStarshipResponce.text();
        //     let regex = /\\rc\\w/gm;
        //     let wookieeStarshipBodyFixed = wookieeStarshipBodyOrig.replace(regex, "\\r\\n");
        //     putStarshipRecordOrigWooTable(JSON.stringify(allStarshipList[i]), wookieeStarshipBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
        // }
        await Promise.all(allStarshipList.map(async (starship) => {
            await putStarshipRecordOrigWooTable(JSON.stringify(starship), process.env.ddbOrigTableName!);
        }));
    } catch (_err) {
        let errorStr = `Error during DynamoDB filling. Starships db. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    return new RestApiResponse("200", "Success");
}

// handler();