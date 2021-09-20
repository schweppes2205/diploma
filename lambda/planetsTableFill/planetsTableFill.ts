import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origPlanetsResourceScheme, wookieePlanetsResourceScheme } from "../../interfaces/InterfacesAll";
import { v1 } from 'node-uuid';

async function putPlanetsRecordOrigWooTable(
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
    let origRecord: origPlanetsResourceScheme = JSON.parse(origRawData);
    // film doesn't have name it's a title, but we need all tables to 
    // have the same structure to make a standard request functions
    origRecord.id = recordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    // parsing input for wookiee table record with according interface
    let wookieeRecord: wookieePlanetsResourceScheme = JSON.parse(wookieeRawData);
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
    let allPlanetsList: any[] = [];
    // the paging loop
    do {
        let allPlanetsResponce = await fetch(url)
        let allPlanetsBody = await allPlanetsResponce.json();
        allPlanetsList = allPlanetsList.concat(allPlanetsBody["results"]);
        url = allPlanetsBody["next"]
    }
    while (url !== null);
    for (let i = 0; i < allPlanetsList.length; i++) {
        let url = `${allPlanetsList[i]['url']}?format=wookiee`
        let wookieePlanetsResponce = await fetch(url);
        let wookieePlanetsBodyOrig = await wookieePlanetsResponce.text();
        let regex = /\\rc\\w/gm;
        let wookieePlanetsBodyFixed = wookieePlanetsBodyOrig.replace(regex, "\\r\\n");
        putPlanetsRecordOrigWooTable(JSON.stringify(allPlanetsList[i]), wookieePlanetsBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
    }
}

// handler();