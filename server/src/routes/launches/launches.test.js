const app = require('../../app');

const request = require('supertest');

const {
    mongoConnect,
    mongoDisconnect,
} = require('../../services/mongo');

describe('Test launches API', () => {

    beforeAll(async () => {
        await mongoConnect();
    });

    afterAll(async () => {
        await mongoDisconnect();
    });
    
    describe('Test GET /launches', () => {

        test('It should respond with 200 success', async () => {
            const response = await request(app)
                .get('/v1/launches')
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });
    
    describe('Test POST /launches', () => {
    
        const compleateData = {
            mission: "first mission",
            rocket: "Explorer IS1",
            target: "Kepler-62 f",
            launchDate: "december 27, 2030",
        };
    
        const dataWithoutDate = {
            mission: "first mission",
            rocket: "Explorer IS1",
            target: "Kepler-62 f",
        };
    
        const dataWithRongDate = {
            mission: "first mission",
            rocket: "Explorer IS1",
            target: "Kepler-62 f",
            launchDate: "helloooo",
        };
    
        test('It should respond with 201 created', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(compleateData)
                .expect('Content-Type', /json/)
                .expect(201);
    
            const requestDate = new Date(compleateData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(requestDate).toBe(responseDate);
            expect(response.body).toMatchObject(dataWithoutDate);
        });
    
        test('It should catch missing required properties', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(dataWithoutDate)
                .expect('Content-Type', /json/)
                .expect(400)
    
            expect(response.body).toStrictEqual({
                error: "Missing required launch property",
            });
        });
    
        test('It should catch Invalid date', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(dataWithRongDate)
                .expect('Content-Type', /json/)
                .expect(400)
    
            expect(response.body).toStrictEqual({
                error: "Invalid launch date",
            });
        });
    });

    describe('Test DELETE /launches', () => {
    
        test('It should respond with 200 success', async () => {
            const response = await request(app)
                .delete('/v1/launches/102')
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });
});



