#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/crypto-config/ordererOrganizations/telecom-network.com/orderers/orderer.telecom-network.com/msp/tlscacerts/tlsca.telecom-network.com-cert.pem
export PEER0_operatorA_CA=${PWD}/crypto-config/peerOrganizations/operatorA.telecom-network.com/peers/peer0.operatorA.telecom-network.com/tls/ca.crt
export PEER0_operatorB_CA=${PWD}/crypto-config/peerOrganizations/operatorB.telecom-network.com/peers/peer0.operatorB.telecom-network.com/tls/ca.crt


# Set OrdererOrg.Admin globals
setOrdererGlobals() {
  export CORE_PEER_LOCALMSPID="OrdererMSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/crypto-config/ordererOrganizations/telecom-network.com/orderers/orderer.telecom-network.com/msp/tlscacerts/tlsca.telecom-network.com-cert.pem
  export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/ordererOrganizations/telecom-network.com/users/Admin@telecom-network.com/msp
}

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"  
  fi
  echo "Using organization ${USING_ORG}"
  if [ "$USING_ORG" == "operatorA" ]; then
    export CORE_PEER_LOCALMSPID="operatorAMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_operatorA_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/operatorA.telecom-network.com/users/Admin@operatorA.telecom-network.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
  elif [ "$USING_ORG" == "operatorB" ]; then
    export CORE_PEER_LOCALMSPID="operatorBMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_operatorB_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/operatorB.telecom-network.com/users/Admin@operatorB.telecom-network.com/msp
    export CORE_PEER_ADDRESS=localhost:9051

  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# parsePeerConnectionParameters $@
# Helper function that takes the parameters from a chaincode operation
# (e.g. invoke, query, instantiate) and checks for an even number of
# peers and associated org, then sets $PEER_CONN_PARMS and $PEERS
parsePeerConnectionParameters() {
  # check for uneven number of peer and org parameters

  PEER_CONN_PARMS=""
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1
    PEER="peer0.$1"
    PEERS="$PEERS $PEER"
    PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses $CORE_PEER_ADDRESS"
    if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "true" ]; then
      TLSINFO=$(eval echo "--tlsRootCertFiles \$PEER0_$1_CA")
      PEER_CONN_PARMS="$PEER_CONN_PARMS $TLSINFO"
    fi
    # shift by two to get the next pair of peer/org parameters
    shift
  done
  # remove leading space for output
  PEERS="$(echo -e "$PEERS" | sed -e 's/^[[:space:]]*//')"
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo
    exit 1
  fi
}