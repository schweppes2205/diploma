export class RestApiResponse {
    headers: {};

    constructor(public statusCode: string, public body: string) {
        this.headers = {
            "Content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        };
    }
}
