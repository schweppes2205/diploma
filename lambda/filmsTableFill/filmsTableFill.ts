import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { filmResourceScheme } from "../../interfaces/filmInterface";

// async function fillEmptyTable(rawData: string, tableName: string) {
//     const ddbAgent = new AWS.DynamoDB.DocumentClient();
//     let jsonData: JSON = JSON.parse(rawData);
//     let index = 0;
//     for (let record in jsonData) {
//         record.id = index;
//         var params = {
//             TableName: tableName,
//             Item: record,
//         }
//         var responce = await ddbAgent.put(params).promise();
//         index++;
//     }
// }

// export const handler = async (event, context) => {
//     const allDataResourcesResponce = await fetch('https://swapi.dev/api');
//     const allDataResourcesBody = await allDataResourcesResponce.json();
//     for (let key in allDataResourcesBody) {
//         let resp = await fetch(allDataResourcesBody[key]);
//         let body = await resp.json();
//         let completeResourceData = []
//         while (true) {
//             completeResourceData.concat(body["results"]);
//             let lastBody = body;
//             if (lastBody["next"] === null) {
//                 break;
//             }
//             resp = await fetch(body["next"]);
//             body = await resp.json();

//         }
//     }
// }

// handler();