const request = require('supertest');
const fs = require('fs');
const child_process = require('child_process');

// Mock child_process exec
jest.mock('child_process', () => ({
    exec: jest.fn((cmd, callback) => {
        callback(null, 'stdout output', 'stderr' );
    }),
}));

// Mock queries
jest.mock('../../queries/queries', () => ({
    project: {
        getAllClasses: jest.fn().mockResolvedValue({
            rows: [
                { CName: 'fish' },
                { CName: 'crab' }
            ]
        })
    }
}));

const app = require('../../app');

describe('VIAME Inference Integration Tests', () => {
    beforeAll(() => {
        global.currentPath = process.cwd() + "/";
        global.db = {
            allAsync: jest.fn().mockResolvedValue([
                { PName: 'test-project', Admin: 'admin' }
            ]),
            getAsync: jest.fn().mockResolvedValue({
                PDescription: 'A test project description',
                AutoSave: 1
            })
        };
        
        // Mock global.readdirAsync
        global.readdirAsync = jest.fn().mockResolvedValue(['weights1.pt', 'weights2.habry']);

        // Mock fs methods if needed
        jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
        jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
        jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {});
        jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('GET /inference/viameSettings', () => {
        it('should redirect if user cookie not set', async () => {
            const res = await request(app).get('/inference/viameSettings?IDX=0');
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe('/');
        });

        it('should return 200 and render settings page if authenticated', async () => {
            const res = await request(app)
                .get('/inference/viameSettings?IDX=0')
                .set('Cookie', ['Username=admin']);
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain('VIAME CV Inference');
            expect(res.text).toContain('Weights_inf');
            expect(res.text).toContain('Inference');
        });
    });

    describe('POST /viame-inf', () => {
        it('should trigger VIAME inference and return Success message', async () => {
            const res = await request(app)
                .post('/viame-inf')
                .send({
                    PName: 'test-project',
                    Admin: 'admin',
                    inference_file: 'some_video.mp4',
                    weights: 'weights2.habry',
                    device: 'cpu'
                })
                .set('Cookie', ['Username=admin']);
            
            expect(res.statusCode).toBe(200);
            expect(res.body.Success).toContain('VIAME Inference Started');
            expect(child_process.exec).toHaveBeenCalled();
            
            // Check that it calls the python execution script controllers/inference/viame.py
            const commandCalled = child_process.exec.mock.calls[0][0];
            expect(commandCalled).toContain('viame.py');
            expect(commandCalled).toContain('-i "some_video.mp4"');
            expect(commandCalled).toContain('-w');
            expect(commandCalled).toContain('-d "cpu"');
        });
    });
});
