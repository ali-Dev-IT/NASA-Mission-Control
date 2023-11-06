const app = require('../../app');
const request = require('supertest');
const {
    mongoConnect,
    mongoDisconnect,
} = require('../../services/mongo');

describe('test planets API', () => {

    beforeAll(async () => {
        await mongoConnect();
    });

    afterAll(async () => {
        await mongoDisconnect();
    });

    describe('Test GET /planets', () => {
    
        test('It should respond with 200 success', async () => {
            const response = await request(app)
                .get('/v1/planets')
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });
})