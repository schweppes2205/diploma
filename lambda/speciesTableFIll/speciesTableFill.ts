import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origSpeciesResourceScheme, wookieeSpeciesResourceScheme } from "../../interfaces/dbInterfacesAll";
import { v1 } from 'node-uuid';
import { RestApiResponse } from "./helper/restApiResponse";

async function putSpeciesRecordOrigWooTable(
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
    let origRecord: origSpeciesResourceScheme = JSON.parse(origRawData);
    origRecord.id = recordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    console.debug(`origParams: ${JSON.stringify(origParams)}`);
    // parsing input for wookiee table record with according interface
    // let wookieeRecord: wookieeSpeciesResourceScheme = JSON.parse(wookieeRawData);
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
    // gathering all species into a single array
    let allSpeciesList: any[] = [];
    // the paging loop
    try {
        do {
            let allSpeciesResponce = await fetch(url)
            let allSpeciesBody = await allSpeciesResponce.json();
            allSpeciesList = allSpeciesList.concat(allSpeciesBody["results"]);
            url = allSpeciesBody["next"]
        }
        while (url !== null);
        console.debug(`allSpeciesList is gathered. Data: ${JSON.stringify(allSpeciesList)}`);
    } catch (_err) {
        let errorStr = `Error during paging species. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    try {
        // for (let i = 0; i < allSpeciesList.length; i++) {
        //     let url = `${allSpeciesList[i]['url']}?format=wookiee`
        //     let wookieeSpeciesResponce = await fetch(url);
        //     let wookieeSpeciesBodyOrig = await wookieeSpeciesResponce.text();
        //     let regex = /\\rc\\w/gm;
        //     let wookieeSpeciesBodyFixed = wookieeSpeciesBodyOrig.replace(regex, "\\r\\n");
        //     putSpeciesRecordOrigWooTable(JSON.stringify(allSpeciesList[i]), wookieeSpeciesBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
        // }
        await Promise.all(allSpeciesList.map(async (kind) => {
            await putSpeciesRecordOrigWooTable(JSON.stringify(kind), process.env.ddbOrigTableName!);
        }));
    } catch (_err) {
        let errorStr = `Error during DynamoDB filling. Species db. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    return new RestApiResponse("200", "Success");
}

// handler();