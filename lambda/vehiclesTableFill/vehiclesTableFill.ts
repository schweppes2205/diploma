import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origVehiclesResourceScheme, wookieeVehiclesResourceScheme } from "../../interfaces/InterfacesAll";
import { v1 } from 'node-uuid';

async function putVehiclesRecordOrigWooTable(
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
    let origRecord: origVehiclesResourceScheme = JSON.parse(origRawData);
    // film doesn't have name it's a title, but we need all tables to 
    // have the same structure to make a standard request functions
    origRecord.id = recordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    // parsing input for wookiee table record with according interface
    let wookieeRecord: wookieeVehiclesResourceScheme = JSON.parse(wookieeRawData);
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
    let allVehiclesList: any[] = [];
    // the paging loop
    do {
        let allVehiclesResponce = await fetch(url)
        let allVehiclesBody = await allVehiclesResponce.json();
        allVehiclesList = allVehiclesList.concat(allVehiclesBody["results"]);
        url = allVehiclesBody["next"]
    }
    while (url !== null);
    for (let i = 0; i < allVehiclesList.length; i++) {
        let url = `${allVehiclesList[i]['url']}?format=wookiee`
        let wookieeVehiclesResponce = await fetch(url);
        let wookieeVehiclesBodyOrig = await wookieeVehiclesResponce.text();
        let regex = /\\rc\\w/gm;
        let wookieeVehiclesBodyFixed = wookieeVehiclesBodyOrig.replace(regex, "\\r\\n");
        putVehiclesRecordOrigWooTable(JSON.stringify(allVehiclesList[i]), wookieeVehiclesBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
    }
}

// handler();