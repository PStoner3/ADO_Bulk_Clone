/* eslint-disable no-undef */
import { expect } from "chai";
import AzureDevOpsApi from "../src/api/azureDevOpsApi.js";

let api = null;

describe( "Azure DevOps API", function () {
    describe( "Authentication", function () {

        it( "should authenticate with proper PAT", async function () {
            let options = {
                organization: "[Enter your source organization]",
                token: "[Enter personal access token for organization]"
            };

            api = new AzureDevOpsApi( options );
            return api.authorization().then( data => {
                expect( data ).to.be.true;
            } );
        } );

        it( "should not authenticate with incorrect PAT", async function () {
            let options = {
                organization: "[Enter your source organization]",
                token: "false"
            };

            api = new AzureDevOpsApi( options );
            return api.authorization().then( data => {
                expect( data ).to.be.false;
            } );
        } )
    } );

    describe( "Projects", function () {
        let map = new Map();

        it( "should return a list of projects for the organization", async function () {
            let options = {
                organization: "[Enter your source organization]",
                token: "[Enter personal access token for organization]"
            };

            api = new AzureDevOpsApi( options );
            map = await api.getAllProjects();
            expect( map.size ).to.be.above( 0 );
        } );

        it( "should contain a key representing a project in the organization", async function () {
            map = await api.getAllProjects();
            expect( map.has( '[Enter project name here]' ) ).to.be.true;
        } );
    } );

    describe( "Repositories", function () {
        let map = new Map();

        it( "should return false for invalid project", async function () {
            let options = {
                organization: "[Enter your source organization]",
                token: "[Enter personal access token for organization]"
            };
            api = new AzureDevOpsApi( options );
            map = await api.getRepositoriesForProject( [ "", 0 ] )
            expect( map ).to.be.false;
        } );

        it( "should return an object of type \"Map\"", async function () {
            map = await api.getRepositoriesForProject( [ "[Enter project name here]", "[Enter Azure Project ID Here]" ] );
            expect( map ).to.have.lengthOf( 1 );
        } );

        it( "should return repositories for specified project", async function () {
            map = await api.getRepositoriesForProject( [ "[Enter project name here]", "[Enter Azure Project ID Here]" ] );
            expect( map.size ).to.be.above( 0 );
        } );

        it( "should return exactly one repository if only one exists", async function () {
            map = await api.getRepositoriesForProject( [ "[Enter project name here]", "[Enter Azure Project ID Here]" ] );
            expect( map ).to.have.lengthOf( 1 );
        } );

        it( "should return an empty object if project has no repositories", async function () {
            map = await api.getRepositoriesForProject( [ "[Enter project name here]", "[Enter Azure Project ID Here]" ] );
            expect( map ).to.be.a( 'map' );
        } );
    } );
} );