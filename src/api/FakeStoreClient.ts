import { APIRequestContext } from '@playwright/test';

export class FakeStoreClient {
    private request: APIRequestContext;
    private baseUrl: string;

    constructor(request: APIRequestContext) {
        this.request = request;
        // Obtenemos la URL del .env, con un fallback por seguridad
        this.baseUrl = process.env.FAKESTORE_BASE_URL || 'https://fakestoreapi.com';
    }

    async getAllProducts() {
        return await this.request.get(`${this.baseUrl}/products`);
    }

    async createProduct(payload: object) {
        return await this.request.post(`${this.baseUrl}/products`, {
            data: payload
        });
    }
}