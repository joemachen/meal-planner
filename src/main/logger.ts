import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import winston from 'winston'

// In production, write to %APPDATA%\Meal & Shopping Planner\logs\
// In dev, write to project root logs\
function getLogsDir(): string {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'logs')
  }
  return path.join(process.cwd(), 'logs')
}

const logsDir = getLogsDir()
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
