// Set up global sqlite3 mock before requiring app
jest.mock('decompress-zip', () => jest.fn());
jest.mock('decompress-zip/lib/extractors', () => ({
  folder: jest.fn(),
}));
jest.mock('ffmpeg', () => jest.fn());
jest.mock('sharp', () => jest.fn());
jest.mock('unzipper', () => jest.fn());
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('sqlite3', () => ({
  OPEN_CREATE: 1,
  OPEN_READWRITE: 2,
  OPEN_READONLY: 1,
  Database: jest.fn((...args) => {
    const cb = args[1];
    if (typeof cb === 'function') cb(null);
    return {
      run: jest.fn((...cbArgs) => {
        const cb = cbArgs[cbArgs.length - 1];
        if (typeof cb === 'function') cb(null);
        return { lastID: 1, changes: 1 };
      }),
      get: jest.fn((...cbArgs) => {
        const cb = cbArgs[cbArgs.length - 1];
        if (typeof cb === 'function') cb(null, {});
      }),
      all: jest.fn((...cbArgs) => {
        const cb = cbArgs[cbArgs.length - 1];
        if (typeof cb === 'function') cb(null, []);
      }),
      close: jest.fn((cb) => cb && cb()),
    };
  }),
}));
jest.mock('socket.io-client', () => ({
  protocol: 'http',
}));

global.sqlite3 = require('sqlite3');

const request = require('supertest');
const app = require('../../app');

// Mock queries
jest.mock('../../queries/queries', () => ({
  managed: {
    createProject: jest.fn().mockResolvedValue({ row: { ProjectName: 'test-project' } }),
    deleteProject: jest.fn().mockResolvedValue({ row: { success: true } }),
    deleteAccessFromProject: jest.fn().mockResolvedValue({ row: { success: true } }),
    grantUserAccess: jest.fn().mockResolvedValue({ row: { success: true } }),
    removeAccess: jest.fn().mockResolvedValue({ row: { success: true } }),
    transferAdmin: jest.fn().mockResolvedValue({ row: { success: true } }),
    updateProjectName: jest.fn().mockResolvedValue({ row: { success: true } }),
  },
  project: {
    migrateProjectDb: jest.fn().mockResolvedValue({ row: { success: true } }),
    getAllClasses: jest.fn().mockResolvedValue({ rows: [{ CName: 'class1' }, { CName: 'class2' }] }),
    createClass: jest.fn().mockResolvedValue({ row: { success: true } }),
    addImages: jest.fn().mockResolvedValue({ row: { success: true } }),
    deleteImage: jest.fn().mockResolvedValue({ row: { success: true } }),
  },
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
  writeFile: jest.fn((path, data, callback) => callback(null)),
  readdirSync: jest.fn().mockReturnValue([]),
  unlinkSync: jest.fn(),
  rename: jest.fn((oldPath, newPath, callback) => callback(null)),
  readFileSync: jest.fn().mockReturnValue(''),
}));

// Mock file upload
jest.mock('express-fileupload', () => jest.fn(() => (req, res, next) => {
  req.files = {
    upload_images: null,
    upload_video: null,
    upload_bootstrap: null,
  };
  next();
}));

// Mock StreamZip
jest.mock('node-stream-zip', () => {
  return jest.fn().mockImplementation(() => ({
    extract: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue(),
    on: jest.fn(),
  }));
});

// Mock rimraf
jest.mock('../../public/libraries/rimraf', () => jest.fn((path, callback) => callback(null)));

// Mock Client
jest.mock('../../queries/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    // Mock client methods as needed
  })),
}));

// Mock utils
jest.mock('../../utils/unzipFile', () => jest.fn());
jest.mock('../../utils/pythonScript', () => jest.fn());

describe('Project Routes - Basic Tests', () => {
  beforeAll(() => {
    global.db = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      allAsync: jest.fn().mockResolvedValue([]),
      getAsync: jest.fn().mockResolvedValue({ row: { THING: 0 } }),
    };
    global.currentPath = '/test/path/';
    global.projectDbClients = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /* 
  * this tests if the createP route responds to project creation requests.
  * This test expects a status code 200.
  */
  it('should respond to createP route', async () => {
    const res = await request(app)
      .post('/createP')
      .send({
        project_name: 'test-project',
        input_classes: 'class1,class2',
        frame_rate: '1',
      })
      .set('Cookie', ['Username=testuser']);

    expect(res.statusCode).toBe(200);
  });

  /* 
  * this tests if the deleteProject route responds to project deletion requests.
  * This test expects a status code 302 (redirect).
  */
  it('should respond to deleteProject route', async () => {
    const res = await request(app)
      .post('/deleteProject')
      .send({
        PName: 'test-project',
        Admin: 'testuser',
        IDX: 1,
      })
      .set('Cookie', ['Username=testuser']);

    expect(res.statusCode).toBe(302);
  });

  /* 
  * this tests if the removeAccess route responds to access removal requests.
  * This test expects a status code 302 (redirect).
  */
  it('should respond to removeAccess route', async () => {
    const res = await request(app)
      .post('/removeAccess')
      .send({
        PName: 'test-project',
        Admin: 'testuser',
        Username: 'user-to-remove',
      })
      .set('Cookie', ['Username=testuser']);

    expect(res.statusCode).toBe(302);
  });

  /* 
  * this tests if the transferAdmin route responds to admin transfer requests.
  * This test expects a status code 302 (redirect).
  */
  it('should respond to transferAdmin route', async () => {
    const res = await request(app)
      .post('/transferAdmin')
      .send({
        PName: 'test-project',
        Admin: 'testuser',
        NewAdmin: 'new-admin',
      })
      .set('Cookie', ['Username=testuser']);

    expect(res.statusCode).toBe(302);
  });
}); 