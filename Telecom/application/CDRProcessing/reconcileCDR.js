'use strict';

const fs = require('fs');
const yaml =  require('js-yaml');
const {FileSystemWallet, Gateway} = require('fabric-network');

let gateway;

async function reconCDR(cdrDate){
    try {
        const gatewayInsatnce = await getGatewayInstance();
        const cdrBuffer = await gatewayInsatnce.submitTransaction('cdrReconcilation', cdrDate)
        let cdrResponse = JSON.parse(cdrBuffer.toString());
        return cdrResponse;
}
catch (error){
    console.log("error ", error);
    throw error; 
} finally {
    console.log("...disconnecting from gateway");
    gateway.disconnect();
}
}

async function getGatewayInstance(){
    
    gateway = new Gateway();
    const dirPath = `./identity/operatorA`
    const wallet = new FileSystemWallet(dirPath);
    const fabricUserName ='operatorA_admin';
    const ccp_file = `./connetion-profile-operatorA.yaml`

    let connectionProfile = yaml.safeLoad(fs.readFileSync(ccp_file, 'utf8'));

    let connectioOptions = {
        wallet: wallet,
        identity: fabricUserName,
        discovery: {enabled: false, asLocalhost: true}
    };

    //console.log("========connectionProfile=========", connectionProfile);
    //console.log("=========connectioOptions==========", connectioOptions);
    console.log('....connecting to fabric gateway');
    await gateway.connect(connectionProfile, connectioOptions);

    console.log('....connecting to channel');
    const channel =  await gateway.getNetwork('telecomnetwork');

    console.log('....connecting to smartcontract');
    return channel.getContract('telnet','org.telecom-network.telnet');

}

module.exports.execute = reconCDR;

reconCDR('02/25/2020').then((data)=>{
    console.log(data);

});