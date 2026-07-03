// Set up global sqlite3 mock before requiring app
jest.mock('decompress-zip', () => jest.fn());
jest.mock('decompress-zip/lib/extractors', () => ({
  folder: jest.fn(),
}));
jest.mock('ffmpeg', () => jest.fn());
jest.mock('sharp', () => jest.fn());
jest.mock('unzipper', () => jest.fn());

const mockExec = jest.fn((cmd, cb) => cb(null, 'stdout', 'stderr'));
jest.mock('child_process', () => ({
  exec: mockExec,
}));

jest.mock('sqlite3', () => {
  const mockDb = {
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
    getAsync: jest.fn().mockResolvedValue({ 
      'COUNT(*)': 10,
      Admin: 'testuser',
      PDescription: 'Test project description',
      AutoSave: 1
    }),
    allAsync: jest.fn().mockResolvedValue([
      { CName: 'class1' },
      { CName: 'class2' },
      { IName: 'image1.jpg' },
      { IName: 'image2.jpg' },
      { Username: 'testuser' }
    ]),
  };

  const mockModule = {
    OPEN_CREATE: 1,
    OPEN_READWRITE: 2,
    OPEN_READONLY: 1,
    Database: jest.fn((...args) => {
      const cb = args[1];
      if (typeof cb === 'function') cb(null);
      return mockDb;
    }),
    verbose: jest.fn().mockImplementation(() => mockModule),
  };

  return mockModule;
});

jest.mock('socket.io-client', () => ({
  protocol: 'http',
}));

// Mock probe module
jest.mock('probe-image-size', () => ({
  sync: jest.fn(() => ({ width: 800, height: 600 })),
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFile: jest.fn((path, data, callback) => callback(null)),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue([]),
  unlinkSync: jest.fn(),
  rename: jest.fn((oldPath, newPath, callback) => callback(null)),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock img data')),
  copyFileSync: jest.fn(),
  symlinkSync: jest.fn(),
}));

global.sqlite3 = require('sqlite3');
global.fs = require('fs');
global.probe = require('probe-image-size');

const request = require('supertest');
const app = require('../../app');

// Mock queries
jest.mock('../../queries/queries', () => ({
  project: {
    getAllClasses: jest.fn().mockResolvedValue({ rows: [{ CName: 'class1' }, { CName: 'class2' }] }),
    getAllImages: jest.fn().mockResolvedValue({ rows: [{ IName: 'image1.jpg' }] }),
    getLabelsForImageName: jest.fn().mockResolvedValue({ rows: [{ CName: 'class1', X: 10, Y: 10, W: 100, H: 100 }] }),
  },
}));

describe('YOLO Inference API', () => {
  beforeAll(() => {
    global.db = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      allAsync: jest.fn().mockResolvedValue([]),
      getAsync: jest.fn().mockResolvedValue({ row: { THING: 0 } }),
    };
    global.currentPath = '/test/path/';
    global.projectDbClients = {};
    global.readdirAsync = jest.fn().mockResolvedValue([]);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully run inference with custom device and respond with status 200', async () => {
    const response = await request(app)
      .post('/yolo-inf')
      .set('Cookie', ['Username=testuser'])
      .send({
        PName: 'testproj',
        Admin: 'testuser',
        yolovx_path: '/path/to/yolovx',
        inference_file: 'image1.jpg',
        yolo_task: 'detect',
        weights: 'best.pt',
        device: 'gpu1'
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toEqual({ Success: 'YOLO Inference Started' });

    // Verify that child_process.exec was called with -D gpu1
    expect(mockExec).toHaveBeenCalled();
    const cmdArg = mockExec.mock.calls[0][0];
    expect(cmdArg).toContain('-D gpu1');
  });

  it('should successfully run inference with default cpu device if device is omitted', async () => {
    const response = await request(app)
      .post('/yolo-inf')
      .set('Cookie', ['Username=testuser'])
      .send({
        PName: 'testproj',
        Admin: 'testuser',
        yolovx_path: '/path/to/yolovx',
        inference_file: 'image1.jpg',
        yolo_task: 'detect',
        weights: 'best.pt'
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toEqual({ Success: 'YOLO Inference Started' });

    // Verify that child_process.exec was called with -D cpu
    expect(mockExec).toHaveBeenCalled();
    const cmdArg = mockExec.mock.calls[0][0];
    expect(cmdArg).toContain('-D cpu');
  });
});
