import * as fetch from 'node-fetch';

export const handler = async () => {
    var b = fetch.default('https://swapi.dev/api');
    b.then((result) => console.log(result.json()));
    
    // var c = await b.json();
    // console.log(c);
}
