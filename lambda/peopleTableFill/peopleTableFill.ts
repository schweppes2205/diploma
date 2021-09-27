import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origPeopleResourceScheme, wookieePeopleResourceScheme } from "../../interfaces/dbInterfacesAll";
import { v1 } from 'node-uuid';
import { RestApiResponse } from "./helper/restApiResponse";

async function putPeopleRecordOrigWooTable(
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
    let origRecord: origPeopleResourceScheme = JSON.parse(origRawData);
    // film doesn't have name it's a title, but we need all tables to 
    // have the same structure to make a standard request functions
    origRecord.id = recordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    // parsing input for wookiee table record with according interface
    let wookieeRecord: wookieePeopleResourceScheme = JSON.parse(wookieeRawData);
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
    let allPeopleList: any[] = [];
    // the paging loop
    try {
        do {
            let allPeopleResponce = await fetch(url)
            let allPeopleBody = await allPeopleResponce.json();
            allPeopleList = allPeopleList.concat(allPeopleBody["results"]);
            url = allPeopleBody["next"]
        }
        while (url !== null);
    } catch (_err) {
        let errorStr = `Error during paging people. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    try {
        for (let i = 0; i < allPeopleList.length; i++) {
            let url = `${allPeopleList[i]['url']}?format=wookiee`
            let wookieePeopleResponce = await fetch(url);
            let wookieePeopleBodyOrig = await wookieePeopleResponce.text();
            let regex = /\\rc\\w/gm;
            let wookieePeopleBodyFixed = wookieePeopleBodyOrig.replace(regex, "\\r\\n");
            putPeopleRecordOrigWooTable(JSON.stringify(allPeopleList[i]), wookieePeopleBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
        }
    } catch (_err) {
        let errorStr = `Error during DynamoDB filling. People db. Error: ${_err}`;
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    return new RestApiResponse("200", "Success");
}

// handler();