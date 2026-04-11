import path from 'path'
import fs from 'fs'
import winston from 'winston'

// Prefer project-root logs/ (run.bat runs from repo root)
const logsDir = path.join(process.cwd(), 'logs')
try {
  fs.mkdirSync(logsDir, { recursive: true })
} catch {
  // ignore
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    const base = `${timestamp} [${level.toUpperCase()}] ${message}`
    return stack ? `${base}\n${stack}` : base
  })
)

const errorLogPath = path.join(logsDir, 'errors.log')

export const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'app.log'), maxsize: 1024 * 1024, maxFiles: 2 }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format((info) => {
          if (info.level !== 'error') return info
          return false
        })(),
        winston.format.simple()
      ),
      level: 'info',
    }),
    new winston.transports.File({
      filename: errorLogPath,
      level: 'error',
      format: logFormat,
      maxsize: 1024 * 1024,
      maxFiles: 3,
    }),
  ],
})

export function logErrorToErrorsFile(message: string, stack?: string): void {
  const line = `${new Date().toISOString()} ERROR ${message}${stack ? '\n' + stack : ''}\n`
  try {
    fs.appendFileSync(errorLogPath, line)
  } catch {
    // ignore
  }
}
