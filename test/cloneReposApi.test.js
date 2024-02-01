import { expect } from "chai";
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';
import { faker } from '@faker-js/faker';
import sinon from 'sinon';

import GitApi from '../src/api/gitApi.js'

function createNewRepository() {


    return retVal;
}

describe( "Git Repos API", function () {
    const repodetails = {
        "name": faker.string.alpha( { length: { min: 5, max: 10 } } ),
        "url": faker.internet.url( { protocol: 'https', appendSlash: false } )
    };

    let gitApi = new GitApi();
    let repositories = new Map();

    describe( "Temp Directory", function () {
        it( "should create a test temp directory with specified name", async function () {
            repositories.set( faker.string.uuid(), repodetails );
            let prefix = "test_";
            let dirname = repositories.entries().next().value[ 1 ].name;
            let expected = join( tmpdir(), `${ prefix }${ dirname }` );
            let stub = sinon.stub( gitApi, "makeRepoTempDir" ).returns( join( tmpdir(), `${ prefix }${ dirname }` ) );

            expect( await gitApi.makeRepoTempDir( join( `${ prefix }${ dirname }` ) ) ).to.contain( expected );

            stub.restore();
        } );
    } );
} )