const fs = require('fs');
const yaml =  require('js-yaml');
const {FileSystemWallet, Gateway} = require('fabric-network');
const uuidv1 = require('uuid/v1')
const readline = require('readline');

let gateway;

async function processFile(filePath, operator){
    try{

       

       const gatewayInsatnce =  await getGatewayInstance(operator); 
       let rl = readline.createInterface({
        input: fs.createReadStream(filePath)
    });   
        console.log("returned");
        rl.on('line', async(line) => {
            //console.log("line - ", line);
            let lineArr = line.split(',');
            let callingNumber = lineArr[0];
            let calledNumber = lineArr[1];
            let startDateTime = lineArr[2];
            let callDuration = lineArr[3];
            let callType = lineArr[4];
            let switchUsed = lineArr[5];
             let cdrId =uuidv1();
             console.log(`${cdrId}, ${callingNumber}, ${calledNumber}, ${startDateTime}, ${callDuration}, ${callType}, ${switchUsed}`)
             const cdrBuffer = await gatewayInsatnce.submitTransaction('addCDR',cdrId, callingNumber, calledNumber, startDateTime, callDuration, callType, switchUsed)
             let cdrResponse = JSON.parse(cdrBuffer.toString());
             console.log(cdrResponse);
            });
            
            
   
}
catch (error){
    console.log("error ", error);
    throw error; 
    
}finally {
   
}
}

async function getGatewayInstance(operator){
    console.log("operator ===========> ", operator)
    gateway = new Gateway();
    const dirPath = `./identity/${operator}`
    const wallet = new FileSystemWallet(dirPath);
    const fabricUserName = operator+'_admin';
    const ccp_file = `./connetion-profile-${operator}.yaml`

    let connectionProfile = yaml.safeLoad(fs.readFileSync(ccp_file, 'utf8'));

    let connectioOptions = {
        wallet: wallet,
        identity: fabricUserName,
        discovery: {enabled: false, asLocalhost: true}
    };

    //console.log("========connectionProfile=========", connectionProfile);
   // console.log("=========connectioOptions==========", connectioOptions);
    console.log('....connecting to fabric gateway');
    await gateway.connect(connectionProfile, connectioOptions);

    console.log('....connecting to channel');
    const channel =  await gateway.getNetwork('telecomnetwork');

    console.log('....connecting to smartcontract');
    return channel.getContract('telnet','org.telecom-network.telnet');

}

module.exports.processFile = processFile;