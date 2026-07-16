jest.mock('decompress-zip', () => jest.fn());
jest.mock('decompress-zip/lib/extractors', () => ({
  folder: jest.fn(),
}));
jest.mock('ffmpeg', () => jest.fn());
jest.mock('unzipper', () => jest.fn());

// Mock sqlite3
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
  };
  const mockModule = {
    OPEN_CREATE: 1,
    OPEN_READWRITE: 2,
    OPEN_READONLY: 1,
    Database: jest.fn((...args) => {
      const cb = args[args.length - 1];
      if (typeof cb === 'function') cb(null);
      return mockDb;
    }),
    verbose: jest.fn().mockImplementation(() => mockModule),
  };
  return mockModule;
});

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  protocol: 'http',
}));

// Mock child_process exec
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, opts, callback) => {
    const cb = callback || opts;
    if (typeof cb === 'function') cb(null, 'stdout output', 'stderr output');
  }),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFile: jest.fn((path, data, callback) => callback(null)),
  writeFileSync: jest.fn(),
  appendFile: jest.fn((path, data, callback) => callback(null)),
  copyFile: jest.fn((src, dest, callback) => callback(null)),
  copyFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('mocked file content'),
  promises: {
    writeFile: jest.fn().mockResolvedValue(),
    copyFile: jest.fn().mockResolvedValue(),
    mkdir: jest.fn().mockResolvedValue(),
    symlink: jest.fn().mockResolvedValue(),
  },
}));

// Mock sharp
const mockSharpInstance = {
  metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
  extract: jest.fn().mockReturnThis(),
  toFile: jest.fn().mockResolvedValue(true),
};
const mockSharp = jest.fn(() => mockSharpInstance);
jest.mock('sharp', () => mockSharp);

// Mock probe-image-size
const mockProbe = {
  sync: jest.fn().mockReturnValue({ width: 640, height: 480 }),
};
jest.mock('probe-image-size', () => mockProbe);

let isQueryFinished = false;

// Mock queries with a simulated slow operation
jest.mock('../../queries/queries', () => ({
  project: {
    getAllImages: jest.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          isQueryFinished = true;
          resolve({ rows: [{ IName: 'image1.jpg' }, { IName: 'image2.jpg' }] });
        }, 150); // 150ms delay
      });
    }),
    getAllClasses: jest.fn().mockResolvedValue({
      rows: [{ CName: 'class1' }, { CName: 'class2' }],
    }),
    getLabelsForImageName: jest.fn().mockResolvedValue({
      rows: [
        { LID: 1, CName: 'class1', X: 10, Y: 20, W: 30, H: 40 },
      ],
    }),
  },
}));

// Set up globals
global.currentPath = '/test/path/';
global.configFile = {
  training_max_buffer_size: 5,
};

const request = require('supertest');
const app = require('../../app');
const { exec } = require('child_process');

describe('POST /yolo-run', () => {
  beforeEach(() => {
    isQueryFinished = false;
    jest.clearAllMocks();
  });

  it('should immediately return success status and then run processing in the background', async () => {
    const res = await request(app)
      .post('/yolo-run')
      .send({
        PName: 'test-project',
        Admin: 'admin',
        yolovx_path: '/path/to/yolo',
        TrainingPercent: 80,
        batch: 16,
        subdiv: 8,
        width: 640,
        height: 640,
        yolo_version: 'v8',
        yolo_task: 'detect',
        yolo_mode: 'train',
        epochs: 10,
        imgsz: 640,
        device: 'cpu',
        options: '',
        weights: 'yolov8n.pt',
      })
      .set('Cookie', ['Username=testuser']);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ Success: 'YOLO Training Started' });

    // The slow DB query must not have finished yet when the response is returned
    expect(isQueryFinished).toBe(false);

    // Wait a brief moment to allow background execution promise to resolve (at least 150ms + some buffer)
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(exec).toHaveBeenCalled();
  });
});
