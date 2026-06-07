import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/custom-world';
import { DataGenerator } from '../utils/dataGenerator';

// --- Escenario 1: Ciclo E2E Completo ---

Given('que genero datos dinámicos para un nuevo usuario en GoRest', async function (this: CustomWorld) {
    this.payload = DataGenerator.generateDynamicUser();
    this.dynamicEmail = this.payload.email; // Guardamos el email para el test de duplicados
});

When('realizo una petición POST para crear el usuario', async function (this: CustomWorld) {
    expect(process.env.GOREST_TOKEN, 'Falta configurar el GOREST_TOKEN en el .env').toBeDefined();
    this.response = await this.goRestClient.createUser(this.payload);
    this.responseBody = await this.response.json();
});

Then('la respuesta debe ser exitosa y guardar el ID generado', async function (this: CustomWorld) {
    expect(this.response.status()).toBe(201);
    expect(this.responseBody).toHaveProperty('id');
    this.createdUserId = this.responseBody.id; // Persistimos el ID para los siguientes pasos
});

When('actualizo el estado del usuario a {string}', async function (this: CustomWorld, newStatus: string) {
    const updatePayload = { status: newStatus };
    this.response = await this.goRestClient.updateUser(this.createdUserId, updatePayload);
    expect(this.response.status()).toBe(200);
});

When('consulto los datos del usuario por su ID', async function (this: CustomWorld) {
    this.response = await this.goRestClient.getUser(this.createdUserId);
    this.responseBody = await this.response.json();
});

Then('los datos devueltos deben reflejar el estado {string}', async function (this: CustomWorld, expectedStatus: string) {
    expect(this.response.status()).toBe(200);
    expect(this.responseBody.status).toBe(expectedStatus);
});

// --- Escenario 2: Prevenir Duplicados ---

Given('que intento utilizar el mismo correo generado anteriormente', async function (this: CustomWorld) {
    expect(this.dynamicEmail, 'El email dinámico no se guardó en el contexto').toBeDefined();
    
    // Armamos un payload usando el email que sabemos que ya existe en la BD de GoRest
    this.payload = {
        name: 'Clon Usuario',
        gender: 'female',
        email: this.dynamicEmail,
        status: 'active'
    };
});

Then('el sistema debe rechazar la creación con un error {int}', async function (this: CustomWorld, statusCode: number) {
    expect(this.response.status()).toBe(statusCode);
});

Then('el mensaje de error debe indicar que el email ya existe', async function (this: CustomWorld) {
    // GoRest suele devolver un array de errores, verificamos que el campo email tenga el error "has already been taken"
    const emailError = this.responseBody.find((err: any) => err.field === 'email');
    expect(emailError).toBeDefined();
    expect(emailError.message).toContain('has already been taken');
});