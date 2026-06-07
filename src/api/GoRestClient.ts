import { APIRequestContext } from '@playwright/test';

export class GoRestClient {
    private request: APIRequestContext;
    private baseUrl: string;
    private token: string;

    constructor(request: APIRequestContext) {
        this.request = request;
        this.baseUrl = process.env.GOREST_BASE_URL || 'https://gorest.co.in/public/v2';
        this.token = process.env.GOREST_TOKEN || '';
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async createUser(payload: object) {
        return await this.request.post(`${this.baseUrl}/users`, {
            headers: this.getHeaders(),
            data: payload
        });
    }

    async getUser(userId: number) {
        return await this.request.get(`${this.baseUrl}/users/${userId}`, {
            headers: this.getHeaders()
        });
    }

    async updateUser(userId: number, payload: object) {
        return await this.request.put(`${this.baseUrl}/users/${userId}`, {
            headers: this.getHeaders(),
            data: payload
        });
    }
}