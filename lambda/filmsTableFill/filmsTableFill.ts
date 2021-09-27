import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origFilmResourceScheme, wookieeFilmResourceScheme } from "../../interfaces/dbInterfacesAll";
import { v1 } from 'node-uuid';
import { RestApiResponse } from "./helper/restApiResponse";

async function putFilmRecordOrigWooTable(
    origRawData: string,
    wookieeRawData: string,
    origTableName: string,
    wookieeTableName: string,
): Promise<void> {
    // creating a db client
    const ddbAgent = new AWS.DynamoDB.DocumentClient();
    //generated record id for a record in original table.
    // will be used as search key in wookiee table
    const recordId = v1();
    // parsing input and creating a db record for original table
    let origRecord: origFilmResourceScheme = JSON.parse(origRawData);
    // film doesn't have name it's a title, but we need all tables to 
    // have the same structure to make a standard request functions
    origRecord.name = JSON.parse(origRawData)["title"];
    origRecord.id = recordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    // parsing input for wookiee table record with according interface
    let wookieeRecord: wookieeFilmResourceScheme = JSON.parse(wookieeRawData);
    wookieeRecord.id = recordId;
    let wookieeParams = {
        TableName: wookieeTableName,
        Item: wookieeRecord,
    }

    var originalResponce = await ddbAgent.put(origParams).promise();
    var wookieeResponce = await ddbAgent.put(wookieeParams).promise();
}

export const handler = async () => {
    // first URL from environment variables;
    // let url: string = "https://swapi.dev/api/films/";
    let url: string = process.env.starWarsResourceUrl;
    // gathering all films into a single array
    let allFilmsList: any[] = [];
    // the paging loop
    try {
        do {
            let allFilmsResponce = await fetch(url)
            let allFilmsBody = await allFilmsResponce.json();
            allFilmsList = allFilmsList.concat(allFilmsBody["results"]);
            url = allFilmsBody["next"]
        }
        while (url !== null);
    } catch (_err) {
        let errorStr = `Error during paging films. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    try {
        for (let i = 0; i < allFilmsList.length; i++) {
            let url = `${allFilmsList[i]['url']}?format=wookiee`
            let wookieeFilmResponce = await fetch(url);
            let wookieeFilmBodyOrig = await wookieeFilmResponce.text();
            let regex = /\\rc\\w/gm;
            let wookieeFilmBodyFixed = wookieeFilmBodyOrig.replace(regex, "\\r\\n");
            putFilmRecordOrigWooTable(JSON.stringify(allFilmsList[i]), wookieeFilmBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
        }
    } catch (_err) {
        let errorStr = `Error during DynamoDB filling. Films db. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    return new RestApiResponse("200", "Success");
}

// handler();