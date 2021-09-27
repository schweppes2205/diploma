export class RestApiResponse {
    headers: {};

    constructor(public statusCode: string, public body: string) {
        this.headers = { "Content-type": "application/json" };
    }
}
