import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { origVehiclesResourceScheme, wookieeVehiclesResourceScheme } from "../../interfaces/dbInterfacesAll";
import { v1 } from 'node-uuid';
import { RestApiResponse } from "./helper/restApiResponse";

async function putVehiclesRecordOrigWooTable(
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
    let origRecord: origVehiclesResourceScheme = JSON.parse(origRawData);
    origRecord.id = recordId;
    var origParams = {
        TableName: origTableName,
        Item: origRecord,
    }
    console.debug(`origParams: ${JSON.stringify(origParams)}`);
    // parsing input for wookiee table record with according interface
    // let wookieeRecord: wookieeVehiclesResourceScheme = JSON.parse(wookieeRawData);
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
    // gathering all vehicles into a single array
    let allVehiclesList: any[] = [];
    // the paging loop
    try {
        do {
            let allVehiclesResponce = await fetch(url)
            let allVehiclesBody = await allVehiclesResponce.json();
            allVehiclesList = allVehiclesList.concat(allVehiclesBody["results"]);
            url = allVehiclesBody["next"]
        }
        while (url !== null);
        console.debug(`allVehiclesList is gathered. Data: ${allVehiclesList}`);
    } catch (_err) {
        let errorStr = `Error during paging vehicles. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    try {
        // for (let i = 0; i < allVehiclesList.length; i++) {
        //     let url = `${allVehiclesList[i]['url']}?format=wookiee`
        //     let wookieeVehiclesResponce = await fetch(url);
        //     let wookieeVehiclesBodyOrig = await wookieeVehiclesResponce.text();
        //     let regex = /\\rc\\w/gm;
        //     let wookieeVehiclesBodyFixed = wookieeVehiclesBodyOrig.replace(regex, "\\r\\n");
        //     putVehiclesRecordOrigWooTable(JSON.stringify(allVehiclesList[i]), wookieeVehiclesBodyFixed, process.env.ddbOrigTableName, process.env.ddbWookieeTableName);
        // }
        await Promise.all(allVehiclesList.map(async (vehicle) => {
            await putVehiclesRecordOrigWooTable(JSON.stringify(vehicle), process.env.ddbOrigTableName);
        }));
    } catch (_err) {
        let errorStr = `Error during DynamoDB filling. Vehicles db. Error: ${_err}`
        console.error(errorStr);
        return new RestApiResponse("500", JSON.stringify(errorStr));
    }
    return new RestApiResponse("200", "Success");
}

// handler();