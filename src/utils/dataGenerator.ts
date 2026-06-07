export class DataGenerator {
    static generateDynamicUser() {
        const timestamp = new Date().getTime();
        return {
            name: `Ignacio Kashio QA`,
            gender: 'male',
            email: `test_kashio_${timestamp}@domain.com`,
            status: 'active'
        };
    }
}