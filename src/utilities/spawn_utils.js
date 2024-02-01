import { spawn } from 'node:child_process';
import { logger } from '../logging/logger.js';

export default class SpawnUtilities {
    #cmdOut = '';

    spawnProc = async ( workingDir, cliName, command, args ) => {
        return new Promise( ( resolve, reject ) => {
            const decoder = new TextDecoder( "utf-8" );
            let procArgs = [];
            let message = ''

            for ( const arg in args ) {
                procArgs.push( args[ arg ] );
            }

            let proc = spawn( cliName, procArgs, {
                stdio: 'overlapped',
                cwd: workingDir
            } );

            proc?.stdout?.on( 'data', ( data ) => {
                if ( command === 'branch' ) {
                    this.#cmdOut = decoder.decode( data );
                }
            } );

            proc?.stderr?.on( 'data', ( data ) => {
                message = decoder.decode( data );
                if ( !message.includes( 'Receiving objets' ) &&
                    !message.includes( 'Resolving deltas' ) &&
                    !message.includes( 'Reinitialized' ) &&
                    !message.includes( 'GraphQL' ) &&
                    !message.includes( 'remote' ) &&
                    !message.includes( 'origin/DEV' ) &&
                    !message.includes( 'Already on' ) &&
                    !message.includes( 'Processed' ) &&
                    !message.includes( 'set up to track' ) &&
                    !message.includes( 'Switched' ) &&
                    !message.includes( 'done' ) &&
                    !message.includes( 'Note: switching' ) &&
                    !message.includes( 'up-to-date' ) &&
                    !message.includes( '/' )
                ) {
                    logger.error( `Unexpected error occurred: ${ cliName } ${ command } failed with error: ${ message }` );
                }
            } );

            proc?.on( 'uncaughtException', ( data ) => {
                logger.error( decoder.decode( data ) );
                reject( new Error( `Unexpected error ocurred.` ) );
            } );

            proc?.on( 'exit', ( data ) => {
                if ( data !== 0 ) {
                    if ( data === 3 && command === 'remote' ) {
                        resolve( true );
                    } else if ( data === 1 && ( message.includes( 'Name already exists' ) || message.includes( 'is larger than' ) ) ) {
                        resolve( true );
                    } else {
                        reject( new Error( `${ workingDir }: ${ cliName } ${ command } failed with exit code ${ data }: ${ message }.` ) );
                    }
                }

                resolve( true );

                proc?.kill( 'SIGHUP' );
            } );
        } );
    };

    getBranchData = () => {
        return this.#cmdOut.replace( /^\s+/gm, '' ).replaceAll( 'origin/', '' ).trim().split( '\n' );
    }
}