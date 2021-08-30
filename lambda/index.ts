import * as fetch from 'node-fetch';

export const handler = async function customFunc() {
    var b = await fetch.default('https://swapi.dev/api/people');
    var c = await b.json();
    console.log(c);
}
