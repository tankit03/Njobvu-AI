const fs = require('fs');
const path = require('path');

const LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

const LEVEL_SEVERITY = {
    [LEVELS.ERROR]: 0,
    [LEVELS.WARN]: 1,
    [LEVELS.INFO]: 2,
    [LEVELS.DEBUG]: 3
};

const LOG_FILE_PATH = path.join(process.cwd(), 'server.log');

class Logger {
    constructor() {
        this.level = process.env.LOG_LEVEL || LEVELS.INFO;
    }

    setLevel(level) {
        if (Object.values(LEVELS).includes(level)) {
            this.level = level;
        }
    }

    _shouldLog(level) {
        const currentSeverity = LEVEL_SEVERITY[this.level] ?? 2;
        const targetSeverity = LEVEL_SEVERITY[level] ?? 2;
        return targetSeverity <= currentSeverity;
    }

    _format(level, message, meta) {
        const logObject = {
            timestamp: new Date().toISOString(),
            level,
            message: message instanceof Error ? message.message : String(message)
        };

        if (message instanceof Error) {
            logObject.stack = message.stack;
        }

        if (meta !== undefined && meta !== null) {
            if (meta instanceof Error) {
                logObject.stack = meta.stack;
                logObject.meta = { message: meta.message };
            } else if (typeof meta === 'object') {
                logObject.meta = meta;
            } else {
                logObject.meta = { value: meta };
            }
        }

        return JSON.stringify(logObject);
    }

    _write(level, message, meta) {
        if (!this._shouldLog(level)) {
            return;
        }

        const formatted = this._format(level, message, meta);

        if (level === LEVELS.ERROR) {
            console.error(formatted);
        } else {
            console.log(formatted);
        }

        // fire and forget
        try {
            fs.appendFile(LOG_FILE_PATH, formatted + '\n', (err) => {
                if (err) {
                    process.stderr.write(`Failed to write to log file: ${err.message}\n`);
                }
            });
        } catch (e) {
            // catch block for filesystem errors
        }
    }

    error(message, meta) {
        this._write(LEVELS.ERROR, message, meta);
    }

    warn(message, meta) {
        this._write(LEVELS.WARN, message, meta);
    }

    info(message, meta) {
        this._write(LEVELS.INFO, message, meta);
    }

    debug(message, meta) {
        this._write(LEVELS.DEBUG, message, meta);
    }
}

const logger = new Logger();

logger.requestMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });

    next();
};

module.exports = logger;
