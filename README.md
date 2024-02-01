# Azure DevOps Git Repository Bulk Cloning

The Bulk Cloning tool is a command-line (cli) utility tool used to clone an oganization's entire Azure Git instance and migrate to GitHub.
This project was inspired by (and an extension of) the [GitHub Migration Analyzer](https://github.com/github/gh-migration-analyzer)

## Environment

The tool runs in a [Node.js](https://nodejs.org/) runtime environment.  It requires version 14 or greater. 

## Personal Access Tokens

You will need to generate a Personal Access Token (PAT) within your source Azure DevOps instance. The following scopes are required:

* For Azure DevOps: `read` for `Code`.

## Dependencies

Use the command ```cd <pathname of migration analyzer directory> && npm install``` to change to your ```migration-analyzer``` directory.  This will install the following project dependencies:

- [commander](https://www.npmjs.com/package/commander)
- [ora](https://www.npmjs.com/package/ora)
- [core-js](https://www.npmjs.com/package/core-js)
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- [prompts](https://www.npmjs.com/package/prompts)
- [winston](https://www.npmjs.com/package/winston)

## Usage

Usage information about the tool is available with the help command. 
````
node src/index.js help
````

Fetch Azure DevOps organization projects/repos. 
````
node src/index.js ADO-org [options]

Options:
  -p, --project <project name> Azure DevOps project name (can pass either project or organization, not necessary to pass both)
  -o, --organization <organization> Azure DevOps organization name
  -t, --token <PAT> Azure DevOps personal access token
  -h, --help Help command for Azure DevOps options
````

You can alternatively export your PAT as environment variable if you do not want to pass it in with the command. 

````export ADO_PAT=<PAT>````

The tool will cycle through the source organization collecting information about each project and repo. The tool will then clone each repo and checkout each branch. As a branch is checked out, the tool will then create a GitHub repository using the GitHub CLI. Once the repository is created, the toll will then push the Azure repo to the new GitHub repository.

Each failure is logged to a log file for review. Failed attempts to retrieve or push a repo can then be retried.


## Contributions

This application was originally written by Aryan Patel ([@arypat](https://github.com/AryPat)) and Kevin Smith ([@kevinmsmith131](https://github.com/kevinmsmith131)). 
This application was extended to migrate repos to GitHub by Paul Stoner [@PStoner3](https://github.com/PStoner3).

Please feel free to fork this repository and make it better.
