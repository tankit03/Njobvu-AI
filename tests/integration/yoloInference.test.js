const request = require('supertest');

// Set up mocks before requiring app
jest.mock('decompress-zip', () => jest.fn());
jest.mock('decompress-zip/lib/extractors', () => ({
  folder: jest.fn(),
}));
jest.mock('ffmpeg', () => jest.fn());
jest.mock('sharp', () => jest.fn());
jest.mock('unzipper', () => jest.fn());

const mockExec = jest.fn((cmd, cb) => cb(null, '', ''));
jest.mock('child_process', () => ({
  exec: mockExec,
}));

jest.mock('sqlite3', () => {
  const mockDbInstance = {
    run: jest.fn((sql, params, cb) => {
      const callback = typeof params === 'function' ? params : cb;
      if (typeof callback === 'function') callback(null);
    }),
    get: jest.fn((sql, params, cb) => {
      const callback = typeof params === 'function' ? params : cb;
      if (typeof callback === 'function') callback(null, {});
    }),
    all: jest.fn((sql, params, cb) => {
      const callback = typeof params === 'function' ? params : cb;
      if (typeof callback === 'function') callback(null, []);
    }),
    close: jest.fn((cb) => {
      if (typeof cb === 'function') cb(null);
    }),
  };
  const sqlite3Mock = {
    OPEN_READWRITE: 1,
    OPEN_CREATE: 2,
    Database: jest.fn(() => mockDbInstance),
    verbose: () => sqlite3Mock,
  };
  return sqlite3Mock;
});

jest.mock('socket.io-client', () => ({
  protocol: 'http',
}));

// Mock fs functions
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  copyFileSync: jest.fn(),
  symlinkSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mockImage')),
  writeFile: jest.fn((path, data, callback) => callback(null)),
}));

// Mock probe module
jest.mock('probe-image-size', () => ({
  sync: jest.fn(() => ({ width: 800, height: 600 })),
}));

// Mock queries
const mockQueries = {
  project: {
    getAllClasses: jest.fn().mockResolvedValue({ rows: [{ CName: 'class1' }] }),
    getAllImages: jest.fn().mockResolvedValue({ rows: [{ IName: 'image1.jpg' }] }),
    getLabelsForImageName: jest.fn().mockResolvedValue({
      rows: [{ CName: 'class1', X: 10, Y: 10, W: 100, H: 100 }]
    }),
  },
};
jest.mock('../../queries/queries', () => mockQueries);

// Define global variables expected by the application/routes
global.fs = require('fs');
global.probe = require('probe-image-size');
global.currentPath = '/mock/current/path/';
global.configFile = {};

const app = require('../../app');

describe('YOLO Inference Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve custom device parameter and pass it to python command with -D', async () => {
    const payload = {
      PName: 'test-project',
      Admin: 'admin-user',
      yolovx_path: '/path/to/yolovx',
      inference_file: 'inference_image.jpg',
      device: 'gpu',
      options: '',
      yolo_task: 'detect',
      weights: 'best.pt'
    };

    const response = await request(app)
      .post('/yolo-inf')
      .set('Cookie', ['Username=test-user'])
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ Success: 'YOLO Inference Started' });
    expect(mockExec).toHaveBeenCalled();
    
    // Retrieve the executed command argument
    const executedCmd = mockExec.mock.calls[0][0];
    expect(executedCmd).toContain('-D gpu');
  });

  it('should default device parameter to cpu when not provided and pass it to python command with -D', async () => {
    const payload = {
      PName: 'test-project',
      Admin: 'admin-user',
      yolovx_path: '/path/to/yolovx',
      inference_file: 'inference_image.jpg',
      options: '',
      yolo_task: 'detect',
      weights: 'best.pt'
    };

    const response = await request(app)
      .post('/yolo-inf')
      .set('Cookie', ['Username=test-user'])
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ Success: 'YOLO Inference Started' });
    expect(mockExec).toHaveBeenCalled();
    
    // Retrieve the executed command argument
    const executedCmd = mockExec.mock.calls[0][0];
    expect(executedCmd).toContain('-D cpu');
  });

  it('should wrap path parameters with double quotes when executing the command, handling weights with parentheses', async () => {
    const payload = {
      PName: 'test-project',
      Admin: 'admin-user',
      yolovx_path: '/path/to/yolovx path',
      inference_file: 'inference_image(1).jpg',
      device: 'gpu',
      options: '',
      yolo_task: 'detect',
      weights: 'best(1).pt'
    };

    const response = await request(app)
      .post('/yolo-inf')
      .set('Cookie', ['Username=test-user'])
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ Success: 'YOLO Inference Started' });
    expect(mockExec).toHaveBeenCalled();
    
    // Retrieve the executed command argument
    const executedCmd = mockExec.mock.calls[0][0];
    
    // Check that paths are wrapped in double quotes
    expect(executedCmd).toContain('-w "/mock/current/path/public/projects/admin-user-test-project/training/weights/best(1).pt"');
    expect(executedCmd).toContain('-i "inference_image(1).jpg"');
    expect(executedCmd).toContain('-f "/path/to/yolovx path"');
  });
});
