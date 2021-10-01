import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origPlanetsResourceScheme, wookieePlanetsResourceScheme } from "../../interfaces/dbInterfacesAll";
import { v1 } from 'node-uuid';
import { RestApiResponse } from "./helper/restApiResponse";

async function putPlanetsRecordOrigWooTable(
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
    let origRecord: origPlanetsResourceScheme = JSON.parse(origRawData);
    origRecord.id = recordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    console.debug(`origParams: ${JSON.stringify(origParams)}`);
    // parsing input for wookiee table record with according interface
    // let wookieeRecord: wookieePlanetsResourceScheme = JSON.parse(wookieeRawData);
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
    let url: string = process.env.starWarsResourceUrl;
    console.debug(`request url: ${url}`);
    // gathering all planets into a single array
    let allPlanetsList: any[] = [];
    // the paging loop
    try {
        do {
            let allPlanetsResponce = await fetch(url)
            let allPlanetsBody = await allPlanetsResponce.json();
            allPlanetsList = allPlanetsList.concat(allPlanetsBody["results"]);
            url = allPlanetsBody["next"]
        }
        while (url !== null);
        console.debug(`allPlanetsList is gathered. Data: ${JSON.stringify(allPlanetsList)}`);
    } catch (_err) {
        let errorStr = `Error during paging planets. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    try {
        // for (let i = 0; i < allPlanetsList.length; i++) {
        //     let url = `${allPlanetsList[i]['url']}?format=wookiee`
        //     let wookieePlanetsResponce = await fetch(url);
        //     let wookieePlanetsBodyOrig = await wookieePlanetsResponce.text();
        //     let regex = /\\rc\\w/gm;
        //     let wookieePlanetsBodyFixed = wookieePlanetsBodyOrig.replace(regex, "\\r\\n");
        //     putPlanetsRecordOrigWooTable(JSON.stringify(allPlanetsList[i]), wookieePlanetsBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
        // }
        await Promise.all(allPlanetsList.map(async (planet) => {
            await putPlanetsRecordOrigWooTable(JSON.stringify(planet), process.env.ddbOrigTableName);
        }));
    } catch (_err) {
        let errorStr = `Error during DynamoDB filling. Planets db. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    return new RestApiResponse("200", "Success");

}

// handler();