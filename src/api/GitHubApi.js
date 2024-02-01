import { spawn } from 'node:child_process';
import fs from 'node:fs';
import ora from 'ora';
import { logger } from '../logging/logger.js';

export default class GitHubApi {
    #decoder = new TextDecoder( "utf-8" );
    #spinner = ora();

    createGitHubRepo = async ( repoDetails ) => {
        let path = repoDetails[ 1 ].path;
        let project = repoDetails[ 1 ].project;
        let repo = repoDetails[ 1 ].name;
        let name = ( repoDetails[ 1 ].project + '_' + repoDetails[ 1 ].name ).replaceAll( ' ', '_' ).replaceAll( '%20', '_' );

        if ( project === 'OpticalEpi' ) {
            return;
        }
        return new Promise( ( resolve, reject ) => {
            this.#spinner.start( `Pushing ${ project }: ${ repo } to GitHub.\n` );
            if ( !fs.existsSync( path ) ) {
                spinner.fail( `Repository ${ repo } does not exist.` );
                return;
            }

            let proc = spawn( 'gh', [ 'repo', 'create', '[Enter organization/personal github name]/'.concat( name ), '--private', '--push', `--source=.`, '--remote=github' ], { stdio: 'overlapped', cwd: path } );

            proc?.stdout?.on( 'data', ( data ) => {
                logger.info( this.#decoder.decode( data ) );
            } );

            proc?.stderr?.on( 'data', ( data ) => {
                logger.info( this.#decoder.decode( data ) );
            } );

            proc?.on( 'uncaughtException', ( data ) => {
                logger.error( this.#decoder.decode( data ) );
                reject( new Error( `Unexpected error ocurred: ${ cmd } of ${ project }: ${ repo } failed.` ) );
            } );

            proc?.on( 'exit', ( data ) => {
                if ( data !== 0 ) {
                    reject( new Error( `Pushing ${ project }: ${ repo } to failed with exit code ${ data }.` ) );
                    return;
                }

                resolve( `\nPushing ${ project }: ${ repo } to GitHub was successfull.` );
            } );
        } );
    }
}