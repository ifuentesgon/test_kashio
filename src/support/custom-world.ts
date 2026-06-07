import { setWorldConstructor, World, Before, After } from '@cucumber/cucumber';
import { request, APIRequestContext } from '@playwright/test';
import { FakeStoreClient } from '../api/FakeStoreClient';
import { GoRestClient } from '../api/GoRestClient'; 
import * as dotenv from 'dotenv';

dotenv.config();

export class CustomWorld extends World {
    public apiContext!: APIRequestContext;
    public fakeStoreClient!: FakeStoreClient;
    public goRestClient!: GoRestClient; 
    
    // Variables para compartir estado entre los pasos
    public response: any;
    public responseBody: any;
    public payload: any;
    
    // Persistencia E2E para GoRest adsasd
    public dynamicEmail!: string; 
    public createdUserId!: number; 
}

setWorldConstructor(CustomWorld);

Before(async function (this: CustomWorld) {
    this.apiContext = await request.newContext({
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: { 'Content-Type': 'application/json' }
    });
    this.fakeStoreClient = new FakeStoreClient(this.apiContext);
    this.goRestClient = new GoRestClient(this.apiContext); 
});

After(async function (this: CustomWorld) {
    if (this.apiContext) {
        await this.apiContext.dispose();
    }
});