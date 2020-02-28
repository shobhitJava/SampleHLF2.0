'use strict';

const fs = require('fs');
const {FileSystemWallet, X509WalletMixin} = require('fabric-network');
const path = require('path');

const crypto_materials = path.resolve(__dirname, '../../network/crypto-config');


async function main(certificatePath, privateKeyPath,operator){
    try{
        const dirName = `./identity/${operator}`
    
        const removeDir = function(dirName){
            if (fs.existsSync(dirName)) {
            const files = fs.readdirSync(dirName)
         
            if (files.length > 0) {
              files.forEach(function(filename) {
                if (fs.statSync(dirName + "/" + filename).isDirectory()) {
                  removeDir(dirName + "/" + filename)
                } else {
                  fs.unlinkSync(dirName + "/" + filename)
                }
              })
              fs.rmdirSync(dirName)
            } else {
              fs.rmdirSync(dirName)
            }
          } else {
            console.log("identity Directory path not found. creating folder")
          }}
          removeDir(dirName);

          if (fs.existsSync(privateKeyPath)) {
            const files = fs.readdirSync(privateKeyPath)
            //console.log("files: ", files.length)
            if (files.length == 1) {
              files.forEach(function(filename) {
                privateKeyPath = privateKeyPath+"/"+filename
                //console.log(privateKeyPath)
              })
              
          } else {
            console.log("private key Directory path not found.")
          }



        const wallet = new FileSystemWallet(dirName);
        const certificate = fs.readFileSync(certificatePath).toString();
        const privatekey = fs.readFileSync(privateKeyPath).toString();

        const identityLabel = `${operator}_admin`;
        const mspLabel = `${operator}MSP`
        const identity = X509WalletMixin.createIdentity(mspLabel,certificate,privatekey);
        await wallet.import(identityLabel, identity);
    }
}
    catch (error){
        console.log(`error adding to wallet ${error}`);
        throw new Error(error);
    }

}

module.exports.execute = main;
main('../../network/crypto-config/peerOrganizations/operatorA.telecom-network.com/users/Admin@operatorA.telecom-network.com/msp/signcerts/Admin@operatorA.telecom-network.com-cert.pem', '../../network/crypto-config/peerOrganizations/operatorA.telecom-network.com/users/Admin@operatorA.telecom-network.com/msp/keystore','operatorA').then(()=>{
    console.log("identity added to wallet")
});

main('../../network/crypto-config/peerOrganizations/operatorB.telecom-network.com/users/Admin@operatorB.telecom-network.com/msp/signcerts/Admin@operatorB.telecom-network.com-cert.pem', '../../network/crypto-config/peerOrganizations/operatorB.telecom-network.com/users/Admin@operatorB.telecom-network.com/msp/keystore','operatorB').then(()=>{
    console.log("identity added to wallet")
});