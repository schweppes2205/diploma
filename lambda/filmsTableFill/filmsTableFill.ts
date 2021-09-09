import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origFilmResourceScheme, wookieeFilmResourceScheme } from "../../interfaces/filmInterface";
import { v1 } from 'node-uuid';

async function putFilmRecordOrigWooTable(
    origRawData: string,
    wookieeRawData: string,
    origTableName: string,
    wookieeTableName: string): Promise<void> {
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

// export const handler = async (event, context) => {
    // const allDataResourcesResponce = await fetch('https://swapi.dev/api');
    // const allDataResourcesBody = await allDataResourcesResponce.json();
    // for (let key in allDataResourcesBody) {
    //     let resp = await fetch(allDataResourcesBody[key]);
    //     let body = await resp.json();
    //     let completeResourceData = []
    //     while (true) {
    //         completeResourceData.concat(body["results"]);
    //         let lastBody = body;
    //         if (lastBody["next"] === null) {
    //             break;
    //         }
    //         resp = await fetch(body["next"]);
    //         body = await resp.json();

    //     }
    // }
// }

// handler();