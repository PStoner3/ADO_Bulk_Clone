#!/usr/bin/env node
import prompts from "prompts";
import ora from 'ora';
import AzureDevOpsApi from "../api/azure_devops_api.js";
import GitApi from "../api/git_api.js";


export default class Controller {
    #projects;
    #spinner = ora();

    azureReposController = async ( PAT, options ) => {
        this.#spinner.info( 'Processing Azure DevOps Git Repositories and Migrating to GitHub' );

        if ( !options.token ) {
            options.token = await this.#handleToken( PAT, options );
        }

        let azureApi = new AzureDevOpsApi( options );
        let gitApi = new GitApi();

        if ( !await azureApi.authorization() ) {
            process.exit( 100 );
        };

        if ( options.project ) {
            this.#projects = await azureApi.getSingleProject( options.project );
        } else {
            this.#projects = await azureApi.getAllProjects();
        }

        for ( let project of this.#projects.entries() ) {
            let repos = await azureApi.getRepositoriesForProject( project );

            if ( repos.size === 0 ) {
                this.#spinner.warn( `Project ${ project[ 0 ] } contains no repositories` );
                continue;
            }

            if ( project[ 0 ] === 'OpticalEpi' ) {
                continue;
            }

            await gitApi.migrateAdoGitToGitHub( repos, project[ 0 ], options.organization );
        }

        this.#spinner.succeed( 'Processing Complete' );
    }

    #handleToken = async ( PAT, options ) => {
        if ( !options.token ) {
            if ( PAT ) {
                return PAT;
            } else {
                const input = await prompts( this.#askForToken() );
                return input.PAT;
            }
        }
    }

    #askForToken = () => {
        return [
            {
                "type": "text",
                "name": "PAT",
                "message": "Enter your Azure DevOps PAT"
            }
        ]
    }
}
