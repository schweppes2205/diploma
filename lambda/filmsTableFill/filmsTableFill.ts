import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origFilmResourceScheme, wookieeFilmResourceScheme } from "../../interfaces/filmInterface";
import { v1 } from 'node-uuid';

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
    const origRecordId = v1();
    // parsing input and creating a db record for original table
    let origRecord: origFilmResourceScheme = JSON.parse(origRawData);
    // film doesn't have name it's a title, but we need all tables to 
    // have the same structure to make a standard request functions
    origRecord.name = JSON.parse(origRawData)["title"];
    origRecord.id = origRecordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    // wookiee table record id
    const wookieeRecordId = v1();
    // parsing input for wookiee table record with according interface
    let wookieeRecord: wookieeFilmResourceScheme = JSON.parse(wookieeRawData);
    wookieeRecord.id = wookieeRecordId;
    // using original record id as search index for the record
    wookieeRecord.origId = origRecordId;
    let wookieeParams = {
        TableName: wookieeTableName,
        Item: wookieeRecord,
    }

    var originalResponce = await ddbAgent.put(origParams).promise();
    var wookieeResponce = await ddbAgent.put(wookieeParams).promise();
}

export const handler = async () => {
    // first URL from environment variables;
    let url: string = "https://swapi.dev/api/films/";
    // let url: string = process.env.starWarsResourceUrl;
    // gathering all films into a single array
    let allFilmsList: any[] = [];
    // the paging loop
    do {
        let allFilmsResponce = await fetch(url)
        let allFilmsBody = await allFilmsResponce.json();
        allFilmsList = allFilmsList.concat(allFilmsBody["results"]);
        url = allFilmsBody["next"]
    }
    while (url !== null);
    for (let i = 0; i < allFilmsList.length; i++) {
        let url = `${allFilmsList[i]['url']}?format=wookiee`
        let wookieeFilmResponce = await fetch(url);
        let wookieeFilmBodyOrig = await wookieeFilmResponce.text();
        let regex = /\\rc\\w/gm;
        let wookieeFilmBodyFixed = wookieeFilmBodyOrig.replace(regex, "\\r\\n");
        putFilmRecordOrigWooTable(JSON.stringify(allFilmsList[i]), wookieeFilmBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
    }
}

// handler();