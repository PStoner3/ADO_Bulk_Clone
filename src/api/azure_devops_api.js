#!/usr/bin/env node
import fetch from "node-fetch";
import ora from "ora";

import StatusError from "../errorHandlers/handle_status_error.js"
import { logger } from '../logging/logger.js'

export default class AzureDevOpsApi {
    #org = null;
    #token = null;
    #spinner = ora();

    #statuserr = new StatusError();

    constructor( options ) {
        this.#org = options.organization;
        this.#token = options.token;
    }

    authorization = async () => {
        let retVal = true;

        this.#spinner.info( `Logging into Azure DevOps organization ${ this.#org }` );

        await fetch(
            `https://dev.azure.com/${ this.#org }/_apis/projects?api-version=6.0`,
            this.#getHeaders( "GET", this.#token )
        )
            .then( ( res ) => {
                retVal = this.#statuserr.handleStatusError( res.status );
            } )
            .catch( ( _err ) => {
                retVal = this.#statuserr.handleStatusError( res.status, _err );
            } );

        return retVal;
    }

    getAllProjects = async () => {
        let skip = 0;
        let result = {};
        let projects = new Map();

        this.#spinner.start( 'Collecting project information' );

        do {
            result = await fetch(
                `https://dev.azure.com/${ this.#org }/_apis/projects?skip=${ skip }&top=100&api-version=6.0`,
                this.#getHeaders( "GET", this.#token )
            )
                .then( ( res ) => {
                    this.#statuserr.handleStatusError( res.status );
                    return res.json();
                } )
                .catch( ( _err ) => {
                    logger.error( new Error( _err ), { label: 'getAllProjects' } );
                    this.#statuserr.handleStatusError( res.status );
                    return false;
                } );
            skip += 100

            this.#spinner.info( `\tCount: ${ result.count }` );

            for ( let project of result.value ) {
                projects.set( project.name, project.id );
            }
        } while ( result.count === 100 );

        this.#spinner.succeed( 'Finished collecting project information' );

        return projects;
    }

    getSingleProject = async ( project ) => {
        let skip = 0;
        let result = {};
        let projects = new Map();

        this.#spinner.start( 'Collecting project information' );

        result = await fetch(
            `https://dev.azure.com/${ this.#org }/${ project }/_apis/git/repositories?skip=${ skip }&top=100&api-version=6.0`,
            this.#getHeaders( "GET", this.#token )
        )
            .then( ( res ) => {
                this.#statuserr.handleStatusError( res.status );
                return res.json();
            } )
            .catch( ( _err ) => {
                logger.error( new Error( _err ), { label: 'getAllProjects' } );
                this.#statuserr.handleStatusError( res.status );
                return false;
            } );

        for ( let item of result.value ) {
            projects.set( item.project.name, item.project.id );
        }

        this.#spinner.succeed( 'Finished collecting project information' );

        return projects;
    }

    getRepositoriesForProject = async ( project ) => {
        let skip = 0;
        let repos = new Map();
        let result = {}
        let projectName = project[ 0 ];
        let projectId = project[ 1 ];

        this.#spinner.start( `Collecting repsoitory information for project ${ projectName }` );

        do {
            result = await fetch(
                `https://dev.azure.com/${ this.#org }/${ projectId }/_apis/git/repositories?skip=${ skip }&top=100&api-version=6.0`,
                this.#getHeaders( "GET", this.#token )
            )
                .then( async ( res ) => {
                    if ( !this.#statuserr.handleStatusError( result.status ) ) {
                        this.#spinner.fail( `\nOrganization and/or Project does not exist\n` );
                        return false;
                    }
                    return res.json();
                } ).catch( ( _err ) => {
                    logger.error( new Error( _err ), { label: 'getRepositoriesForProject' } );
                    this.#statuserr.handleStatusError( 500, _err );
                    return false;
                } );
            skip += 100;

            if ( result.typeKey === 'ProjectDoesNotExistWithNameException' ) {
                this.#spinner.fail( `\nProject ${ projectName } does not exist\n` );
                return false;
            }

            this.#spinner.info( `Collecting repository information for ${ projectName }` );
            this.#spinner.info( `\tContains ${ result.count } repositories` );

            for ( let repo of result.value ) {
                repos.set( repo.id, { "project": repo.project.name, "name": repo.name, "url": repo.webUrl } );
            }
        } while ( result.count === 100 );

        this.#spinner.succeed( `Finished collecting repsoitory information for project ${ projectName }` );

        return repos;
    }

    #getHeaders = ( method, token ) => {
        return {
            method,
            headers: {
                Authorization:
                    "Basic " + Buffer.from( `Basic :${ token }` ).toString( "base64" )
            }
        }
    }
}