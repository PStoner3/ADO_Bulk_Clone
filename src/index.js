#!/usr/bin/env node
import { Command } from "commander";
import Controller from "./controllers/azure_controller.js"

const program = new Command();
const repos = new Controller();

/**
 * CLI command ADO-org
 *
 * Usage:
 * export ADO_PAT=<PAT>
 * ADO-org --organization <org>
 *
 * or
 *
 * ADO-org --organization <org>
 * <input PAT>
 *
 * or
 *
 * ADO-org --organization <org> --token <PAT>
 * <input PAT>
 *
 */
program
    .name( "migrater" )
    .requiredOption( "-o, --organization <organization>", "Organization Name" )
    .option( "-t, --token <PAT>", "Personal Access Token (PAT)" )
    .option( "-p, --project <project>", "Project Name" )
    .option( "-d, --debug", "Display debug information" )
    .description( "Clone Azure DevOps Git Repositories" )
    .action( async ( options ) => {
        repos.azureReposController(
            process.env.ADO_PAT,
            options
        )
    } );

program.parse( process.argv );