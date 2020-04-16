This is sample code for hyperledger fabric 2.0

#Prerequisites:
1) MAke sure all the Prerequisites are installed as mention on https://hyperledger-fabric.readthedocs.io/en/release-2.0/prereqs.html
2) Install binaries as mentioned on link https://hyperledger-fabric.readthedocs.io/en/release-2.0/install.html
3) add binaries for fabric in network folder in bin folder.
4) run npm install in chaincode folder 

#Inculsion
It includes a project for setting up network and installing chaincode on a blockchain network.
It includes the initial drafted chaincode file 

# To start the blockchain network
Note- Ensure to have prerequisite completed for hyperledger fabric
Go to network folder, open the command terminal and run the below commands to set up the fabric network and
install the chaincode:

./fabricNetwork.sh up
./fabricNetwork.sh install
