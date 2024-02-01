import { createLogger, format, transports } from 'winston';

const errorFormat = format.combine(
    format.timestamp( {
        format: 'YYYY-MM-DD HH:mm:ss'
    } ),
    format.errors( { stack: true } ),
    format.json()
);

export const logger = createLogger( {
    format: errorFormat,
    level: 'info',
    transports: [
        new transports.File( { filename: 'app.log' } ),
    ],
    exceptionHandlers: [
        new transports.File( { filename: 'apperror.log', level: 'error' } )
    ],
    exitOnError: false
} );