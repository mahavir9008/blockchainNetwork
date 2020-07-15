"use strict";

const indy = require('indy-sdk');
const util = require('./util');
const assert = require('assert');
const { create } = require('domain');

console.log("User authentication for the digital volunteers -> started");


// ** Move these constant to an separate file
const stewardWalletConfig = {'id': 'stewardWalletName'};
const stewardWalletCredentials = {'key': 'steward_key'};
const stewardWalledSeed = '000000000000000000000000Steward1';

const poolHandle = initialisePool();

const initialisePool = () => {

    let poolName = 'pool1';
    console.log(`Open Pool Ledger: ${poolName}`);
    let poolGenesisTxnPath = await util.getPoolGenesisTxnPath(poolName);
    let poolConfig = {
        "genesis_txn": poolGenesisTxnPath
    };
    try {
        await indy.createPoolLedgerConfig(poolName, poolConfig);
    } catch(e) {
        if(e.message !== "PoolLedgerConfigAlreadyExistsError") {
            throw e;
        }
    }

    await indy.setProtocolVersion(2)

    let poolHandle = await indy.openPoolLedger(poolName);
    return poolHandle;

}

const initStewardAgent = () => {

    console.log("Initialize Stewards agent as its automatically a Trust Anchors agent");
    console.log("The Steward agent will be used to create the Digital volunteer agent");

    createWallet(stewardWalletConfig, stewardWalletCredentials);

    let stewardWallet = await indy.openWallet(stewardWalletConfig, stewardWalletCredentials);

    const stewardDid = createUserDid(stewardWalletConfig, userWalletCredentials, stewardWalledSeed);

    return {stewardWallet, stewardDid}
}

const initAppAgent = (stewardWallet, stewardDid) => {

    //Get steward id, Did and creds

    console.log("==============================");
    console.log("== Getting Trust Anchor credentials - Application Agent  ==");
    console.log(" This will be the main agent of the application")
    console.log("------------------------------");

    let appWalletConfig = {'id': 'appWallet'}
    let appWalletCredentials = {'key': 'app_key'}
    let [appWallet, stewardAppKey, appStewardDid, appStewardKey] = await onboarding(poolHandle, "Sovrin Steward", stewardWallet, stewardDid, "Application", null, appWalletConfig, appWalletCredentials);

    console.log("==============================");
    console.log("== Getting Trust Anchor credentials - Application getting Verinym  ==");
    console.log("------------------------------");

    let governmentDid = await getVerinym(poolHandle, "Sovrin Steward", stewardWallet, stewardDid,
        stewardAppKey, "Application", appWallet, appStewardDid,
        appStewardKey, 'TRUST_ANCHOR');
}



const createWallet = (id, key) => {

    // The ID: wallet name, key: wallet key

    console.log(`Sovrin ${id} -> Create wallet`);
    let userWalletConfig = {'id': id}
    let userWalletCredentials = {'key': key}

    try {
        await indy.createWallet(stewardWalletConfig, stewardWalletCredentials)
    } catch(e) {
        if(e.message !== "WalletAlreadyExistsError") {
            throw e;
        }
    }

    console.log(`Wallet created for id ${id}`);
}

const createUserDid = (userID, userCreds, seed) => {

    let userWallet = await indy.openWallet({'id': userID}, {'key': userCreds});

    console.log(`Sovrin \ ${userID} -> Create and store in Wallet DID from seed`);
    let userDidInfo = {
        'seed': seed
    };

    let [userDid,] = await indy.createAndStoreMyDid(userWallet, userDidInfo);

    return userDid;
}



const deleteWallet = () =>{

}

async function run() {
    
    /*
    This run will test the creation of 2 users (wallet and DID), 
    a person providing the service and the person receiving the service
        
    */

    let poolHandle = initialisePool();
    const userID = 'UserID';
    const userCreds = 'UserCredentions123';
    const userSeed = '000000000000000User1';
    
    let {stewardWallet, stewardDid} = initStewardAgent();
    initAppAgent(stewardWallet, stewardDid);

    createUserWallet(userID, userCreds);
    let userDid = createUserDid(userID, userCreds, userSeed);

    console.log("==============================");
    console.log("=== Credential Schemas Setup ==");
    console.log("------------------------------");

    console.log("Create schema to request a volunteering service");
    

    console.log("==============================");

    console.log(" \"Sovrin Steward\" -> Close and Delete wallet");
    await indy.closeWallet(stewardWallet);
    await indy.deleteWallet(stewardWalletConfig, stewardWalletCredentials);

    console.log("\"Thrift\" -> Close and Delete wallet");
    await indy.closeWallet(thriftWallet);
    await indy.deleteWallet(thriftWalletConfig, thriftWalletCredentials);

    console.log("\"Alice\" -> Close and Delete wallet");
    await indy.closeWallet(aliceWallet);
    await indy.deleteWallet(aliceWalletConfig, aliceWalletCredentials);

    console.log("Close and Delete pool");
    await indy.closePoolLedger(poolHandle);
    await indy.deletePoolLedgerConfig(poolName);

    console.log("Testing blochain -> done")
}


// Functions from the getting started tutorials (will need adapt or remove unsused functions)

async function onboarding(poolHandle, From, fromWallet, fromDid, to, toWallet, toWalletConfig, toWalletCredentials) {
    console.log(`\"${From}\" > Create and store in Wallet \"${From} ${to}\" DID`);
    let [fromToDid, fromToKey] = await indy.createAndStoreMyDid(fromWallet, {});

    console.log(`\"${From}\" > Send Nym to Ledger for \"${From} ${to}\" DID`);
    await sendNym(poolHandle, fromWallet, fromDid, fromToDid, fromToKey, null);

    console.log(`\"${From}\" > Send connection request to ${to} with \"${From} ${to}\" DID and nonce`);
    let connectionRequest = {
        did: fromToDid,
        nonce: 123456789
    };

    if (!toWallet) {
        console.log(`\"${to}\" > Create wallet"`);
        try {
            await indy.createWallet(toWalletConfig, toWalletCredentials);
        } catch(e) {
            if(e.message !== "WalletAlreadyExistsError") {
                throw e;
            }
        }
        toWallet = await indy.openWallet(toWalletConfig, toWalletCredentials);
    }

    console.log(`\"${to}\" > Create and store in Wallet \"${to} ${From}\" DID`);
    let [toFromDid, toFromKey] = await indy.createAndStoreMyDid(toWallet, {});

    console.log(`\"${to}\" > Get key for did from \"${From}\" connection request`);
    let fromToVerkey = await indy.keyForDid(poolHandle, toWallet, connectionRequest.did);

    console.log(`\"${to}\" > Anoncrypt connection response for \"${From}\" with \"${to} ${From}\" DID, verkey and nonce`);
    let connectionResponse = JSON.stringify({
        'did': toFromDid,
        'verkey': toFromKey,
        'nonce': connectionRequest['nonce']
    });
    let anoncryptedConnectionResponse = await indy.cryptoAnonCrypt(fromToVerkey, Buffer.from(connectionResponse, 'utf8'));

    console.log(`\"${to}\" > Send anoncrypted connection response to \"${From}\"`);

    console.log(`\"${From}\" > Anondecrypt connection response from \"${to}\"`);
    let decryptedConnectionResponse = JSON.parse(Buffer.from(await indy.cryptoAnonDecrypt(fromWallet, fromToKey, anoncryptedConnectionResponse)));

    console.log(`\"${From}\" > Authenticates \"${to}\" by comparision of Nonce`);
    if (connectionRequest['nonce'] !== decryptedConnectionResponse['nonce']) {
        throw Error("nonces don't match!");
    }

    console.log(`\"${From}\" > Send Nym to Ledger for \"${to} ${From}\" DID`);
    await sendNym(poolHandle, fromWallet, fromDid, decryptedConnectionResponse['did'], decryptedConnectionResponse['verkey'], null);

    return [toWallet, fromToKey, toFromDid, toFromKey, decryptedConnectionResponse];
}

async function getVerinym(poolHandle, From, fromWallet, fromDid, fromToKey, to, toWallet, toFromDid, toFromKey, role) {
    console.log(`\"${to}\" > Create and store in Wallet \"${to}\" new DID"`);
    let [toDid, toKey] = await indy.createAndStoreMyDid(toWallet, {});

    console.log(`\"${to}\" > Authcrypt \"${to} DID info\" for \"${From}\"`);
    let didInfoJson = JSON.stringify({
        'did': toDid,
        'verkey': toKey
    });
    let authcryptedDidInfo = await indy.cryptoAuthCrypt(toWallet, toFromKey, fromToKey, Buffer.from(didInfoJson, 'utf8'));

    console.log(`\"${to}\" > Send authcrypted \"${to} DID info\" to ${From}`);

    console.log(`\"${From}\" > Authdecrypted \"${to} DID info\" from ${to}`);
    let [senderVerkey, authdecryptedDidInfo] =
        await indy.cryptoAuthDecrypt(fromWallet, fromToKey, Buffer.from(authcryptedDidInfo));

    let authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));
    console.log(`\"${From}\" > Authenticate ${to} by comparision of Verkeys`);
    let retrievedVerkey = await indy.keyForDid(poolHandle, fromWallet, toFromDid);
    if (senderVerkey !== retrievedVerkey) {
        throw Error("Verkey is not the same");
    }

    console.log(`\"${From}\" > Send Nym to Ledger for \"${to} DID\" with ${role} Role`);
    await sendNym(poolHandle, fromWallet, fromDid, authdecryptedDidInfoJson['did'], authdecryptedDidInfoJson['verkey'], role);

    return toDid;
}

async function sendNym(poolHandle, walletHandle, Did, newDid, newKey, role) {
    let nymRequest = await indy.buildNymRequest(Did, newDid, newKey, null, role);
    await indy.signAndSubmitRequest(poolHandle, walletHandle, Did, nymRequest);
}

async function sendSchema(poolHandle, walletHandle, Did, schema) {
    // schema = JSON.stringify(schema); // FIXME: Check JSON parsing
    let schemaRequest = await indy.buildSchemaRequest(Did, schema);
    await indy.signAndSubmitRequest(poolHandle, walletHandle, Did, schemaRequest)
}

async function sendCredDef(poolHandle, walletHandle, did, credDef) {
    let credDefRequest = await indy.buildCredDefRequest(did, credDef);
    await indy.signAndSubmitRequest(poolHandle, walletHandle, did, credDefRequest);
}

async function getSchema(poolHandle, did, schemaId) {
    let getSchemaRequest = await indy.buildGetSchemaRequest(did, schemaId);
    let getSchemaResponse = await indy.submitRequest(poolHandle, getSchemaRequest);
    return await indy.parseGetSchemaResponse(getSchemaResponse);
}

async function getCredDef(poolHandle, did, schemaId) {
    let getCredDefRequest = await indy.buildGetCredDefRequest(did, schemaId);
    let getCredDefResponse = await indy.submitRequest(poolHandle, getCredDefRequest);
    return await indy.parseGetCredDefResponse(getCredDefResponse);
}

async function proverGetEntitiesFromLedger(poolHandle, did, identifiers, actor) {
    let schemas = {};
    let credDefs = {};
    let revStates = {};

    for(let referent of Object.keys(identifiers)) {
        let item = identifiers[referent];
        console.log(`\"${actor}\" -> Get Schema from Ledger`);
        let [receivedSchemaId, receivedSchema] = await getSchema(poolHandle, did, item['schema_id']);
        schemas[receivedSchemaId] = receivedSchema;

        console.log(`\"${actor}\" -> Get Claim Definition from Ledger`);
        let [receivedCredDefId, receivedCredDef] = await getCredDef(poolHandle, did, item['cred_def_id']);
        credDefs[receivedCredDefId] = receivedCredDef;

        if (item.rev_reg_seq_no) {
            // TODO Create Revocation States
        }
    }

    return [schemas, credDefs, revStates];
}


async function verifierGetEntitiesFromLedger(poolHandle, did, identifiers, actor) {
    let schemas = {};
    let credDefs = {};
    let revRegDefs = {};
    let revRegs = {};

    for(let referent of Object.keys(identifiers)) {
        let item = identifiers[referent];
        console.log(`"${actor}" -> Get Schema from Ledger`);
        let [receivedSchemaId, receivedSchema] = await getSchema(poolHandle, did, item['schema_id']);
        schemas[receivedSchemaId] = receivedSchema;

        console.log(`"${actor}" -> Get Claim Definition from Ledger`);
        let [receivedCredDefId, receivedCredDef] = await getCredDef(poolHandle, did, item['cred_def_id']);
        credDefs[receivedCredDefId] = receivedCredDef;

        if (item.rev_reg_seq_no) {
            // TODO Get Revocation Definitions and Revocation Registries
        }
    }

    return [schemas, credDefs, revRegDefs, revRegs];
}

async function authDecrypt(walletHandle, key, message) {
    let [fromVerkey, decryptedMessageJsonBuffer] = await indy.cryptoAuthDecrypt(walletHandle, key, message);
    let decryptedMessage = JSON.parse(decryptedMessageJsonBuffer);
    let decryptedMessageJson = JSON.stringify(decryptedMessage);
    return [fromVerkey, decryptedMessageJson, decryptedMessage];
}

if (require.main.filename == __filename) {
    run()
}

module.exports = {
    run
}
