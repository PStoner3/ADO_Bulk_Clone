#!/usr/bin/env node
import fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import { logger } from '../logging/logger.js';
import SpawnUtilities from '../utilities/spawn_utils.js'

export default class GitApi {
    spawnUtils = new SpawnUtilities();
    #spinner = ora();
    #project = '';
    #repo = '';

    migrateAdoGitToGitHub = async ( repositories ) => {
        for ( let details of repositories.entries() ) {
            let project = this.#project = details[ 1 ].project.replaceAll( ' ', '_' ).replaceAll( '%20', '_' );
            let repo = this.#repo = details[ 1 ].name.replaceAll( ' ', '_' ).replaceAll( '%20', '_' );
            let remoteRepoName = ( project + '_' + repo );

            let repoParentDirName = path.resolve( "F:\\Cooper\\repositories", project );
            let repoDirName = path.resolve( repoParentDirName, repo );

            if ( repositories.size === 1 && ( project === repo ) ) {
                repoDirName = repoParentDirName;
                remoteRepoName = project;
            }

            logger.info( `Processing ${ project }:${ repo }` );

            try {
                if ( fs.existsSync( repoParentDirName ) ) {
                    fs.rmSync( repoParentDirName, { recursive: true, force: true } )
                }
                this.#makeRepoTempDir( repoParentDirName );

                if ( !fs.existsSync( repoDirName ) ) {
                    this.#makeRepoTempDir( repoDirName );
                }

                this.#spinner.start( `Initializing local repo for ${ this.#repo }` );
                await this.#executeGitCmd( repoDirName, 'git', 'init' )
                this.#spinner.succeed( `Initializing local repo ${ this.#repo } succcessful` );

                this.#spinner.start( `Installing LFS to ${ this.#repo }` );
                await this.#executeGitCmd( repoDirName, 'git', 'lfs', 'install' )
                this.#spinner.succeed( `Installing LFS to ${ this.#repo } successful` );

                await this.#addRemote( repoDirName, 'origin', details[ 1 ].url );

                this.#spinner.start( `Fetching ${ this.#project }: ${ this.#repo }` );
                await this.#executeGitCmd( repoDirName, 'git', 'fetch', 'origin', '--progress' );
                this.#spinner.succeed( `Fetching ${ this.#project }: ${ this.#repo } successful` );

                this.#spinner.start( `Collecting branch details for ${ this.#repo }` );
                await this.#executeGitCmd( repoDirName, 'git', 'branch', '-r' );
                this.#spinner.succeed( `Collecting branch details for ${ this.#repo } successful` );

                await this.#createGitHubRepo( repoDirName, '[Enter organization/personal github name]', remoteRepoName );
                await this.#addRemote( repoDirName, 'github', 'github', '[Enter organization/personal github name]', remoteRepoName );

                let branchList = this.spawnUtils.getBranchData();

                if ( branchList.includes( 'master' ) ) {

                    await this.#checkoutBranch( repoDirName, 'master' );
                    await this.#analyzeBranch( repoDirName, 'master' );

                    logger.info( 'Pushing branch master to GitHub' );
                    await this.#pushToGitHub( repoDirName, 'master' );
                    logger.info( 'Pushing branch master to GitHub complete' );
                }

                if ( branchList.includes( 'main' ) ) {
                    await this.#checkoutBranch( repoDirName, 'main' );
                    await this.#analyzeBranch( repoDirName, 'main' );

                    logger.info( 'Pushing branch "main" to GitHub' );
                    await this.#pushToGitHub( repoDirName, 'main' );
                    logger.info( 'Pushing branch "main" to GitHub complete' );
                }

                for ( let branch of this.spawnUtils.getBranchData() ) {
                    let b = branch.trim().replaceAll( 'origin/', '' );
                    if ( b.includes( '->' ) || b === '' || b === 'master' ) {
                        continue;
                    }

                    await this.#checkoutBranch( repoDirName, b );
                    await this.#analyzeBranch( repoDirName, b );

                    logger.info( `Pushing branch ${ b } to GitHub` );
                    await this.#pushToGitHub( repoDirName, b );
                    logger.info( `Pushing branch ${ b } to GitHub complete` );
                }
            } catch ( _e ) {
                logger.error( _e );
                this.#spinner.fail( _e.message );
            };
        };
    };

    #createGitHubRepo = async ( repoDir, userCompany, repoName ) => {
        try {
            this.#spinner.start( `Creating GitHub Repository ${ repoName }` );
            await this.#executeGitCmd( repoDir ?? process.cwd(), 'gh', 'repo', 'create', userCompany.concat( '/', repoName ), '--private', `--source=.`, '--remote=github' );
            this.#spinner.succeed( `Creating GitHub Repository ${ repoName } successful` );
        } catch ( _e ) {
            throw new Error( _e.message, { cause: _e } );
        }
    };

    #addRemote = async ( repoDirName, remoteName, ...params ) => {
        try {
            this.#spinner.start( `Adding remote for ${ this.#repo }` );

            let remoteUrl;

            if ( params.length === 1 ) {
                remoteUrl = params[ 0 ];
            } else {
                remoteUrl = `https://${ params[ 0 ] }.com/${ params[ 1 ] }/${ params[ 2 ] }.git`;
            }

            await this.#executeGitCmd( repoDirName, 'git', 'remote', 'add', remoteName, remoteUrl )
            this.#spinner.succeed( `Adding remote for ${ this.#repo } successful` );
        } catch ( _e ) {
            throw new Error( _e.message, { cause: _e } );
        }
    };

    #checkoutBranch = async ( repoDir, branch ) => {
        try {
            this.#spinner.start( `Checking out branch ${ this.#repo }: ${ branch }` );
            await this.#executeGitCmd( repoDir, 'git', 'checkout', branch );
            this.#spinner.start( `Checking out ${ this.#repo }: ${ branch } successful` );
        } catch ( _e ) {
            throw new Error( _e.message, { cause: _e } );
        }
    };

    #pushToGitHub = async ( repoDir, branch ) => {
        try {
            this.#spinner.start( `Pushing branch ${ this.#repo }: ${ branch } to GitHub` );
            await this.#executeGitCmd( repoDir, 'git', 'push', 'github', 'HEAD'.concat( ':', 'refs/', 'heads/', branch ) );
            this.#spinner.start( `Pushing branch ${ this.#repo }: ${ branch } successful` );
        } catch ( _e ) {
            throw new Error( _e.message, { cause: _e } );
        }
    };

    #analyzeBranch = async ( repoDir, branch ) => {
        this.#spinner.start( `Analyzing branch ${ this.#repo }: ${ branch } for large file` );
        await this.#executeGitCmd( repoDir, 'python', 'F:/Git/mingw64/libexec/git-core/git-filter-repo', '--analyze', '--force', '--report-dir', `.git/filter-repo/analysis/${ branch }` );
        this.#spinner.start( `Analyzing branch ${ this.#repo }: ${ branch } successful` );
    }

    #executeGitCmd = async ( repoPath, cli, command, ...flags ) => {
        let cmd = command.charAt( 0 ).toUpperCase() + command.slice( 1 );
        const args = [
            command
        ];

        for ( let flag of flags ) {
            args.push( flag );
        }

        await this.spawnUtils.spawnProc( repoPath, cli, command, args )
            .then( () => {
                switch ( command ) {
                    case 'branch':
                        return 'Branch details complete';
                    case 'install':
                        return 'Install of LFS support successful';
                    case 'init':
                        return `Initialized ${ repoPath } as git repo complete`;
                    case 'checkout':
                        return `Checkout of ${ this.#repo }: ${ args } complete`;
                    default:
                        return `${ cmd } of ${ this.#project }: ${ this.#repo } was successfull.`;
                }
            } )
            .catch( ( _e ) => {
                throw _e;
            } );
    };

    #makeRepoTempDir = ( directoryName ) => {
        try {
            if ( !fs.existsSync( directoryName ) ) {
                fs.mkdirSync( directoryName );
            }
        } catch ( _e ) {
            logger.error( new Error( _e ), { label: `makeRepoTempDir: ${ directoryName }` } );
            throw new Error( `Unable to create directpry: ${ directoryName }` );
        }
    };
}