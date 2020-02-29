'use strict';

const { Contract } = require('fabric-contract-api');

class InterconnectContract extends Contract {


  constructor() {
    // Provide a custom name to refer to this smart contract
    super('org.telecom-network.telnet');
  }

  /* ****** All custom functions are defined below ***** */

  // This is a basic user defined function used at the time of instantiating the smart contract
  // to print the success message on console
  async instantiate(ctx) {
    //cdrId = 100000;
    console.log('telnet Smart Contract Instantiated. cdrID is ');
  }

  /**
 * Add the incoming CDR on the network
 * @param ctx - The transaction context object
 * @param callingNumber - number from which call is initiated
 * @param calledNumber - called number
 * @param startDate - date of  call
   * @param startTime - time of call
   * @param callDuration - call duration
   * @param switchUsed - which switch was used to route the call
   * @param callType - incoming or outgoing call
 * @returns
 */

  async addCDR(ctx, cdrId, callingNumber, calledNumber, startDateTime, callDuration, callType, switchUsed) {
    if (isNaN(calledNumber)) {
      throw new Error("invalid called number")
    }
    if (isNaN(callingNumber)) {
      throw new Error("invalid called number")
    }

    if (callType != 'IN' && callType != 'OUT') {
      throw new Error("call type not valid")
    }

    if (callType == 'IN' && (switchUsed != 'B' && switchUsed != 'C')) {
      throw new Error("data not valid")
    }

    let partyID;
    if (ctx.clientIdentity.getID().includes('operatorA')) {
      partyID = 'operatorA';
    } else if (ctx.clientIdentity.getID().includes('operatorB')) {
      partyID = 'operatorB';
    } else {
      throw new Error("invalid operator")
    }

    //partyID = 'operatorB';
    let dateArr = startDateTime.split(' ');
    let startDate = dateArr[0];
    let startTime = dateArr[1];
    
    //Convert partyA timestamp, which is for India to EST
    if (partyID == 'operatorA') {
      let offset = -5.0

      let clientDate = new Date(startDateTime);
      let utc = clientDate.getTime() + (-330 * 60000);

      let serverDate = new Date(utc + (3600000 * offset));

      let partyAest = serverDate.toLocaleString("en-us");
      //console.log("partyAest: ", partyAest);


      let dateArr = partyAest.split(',');
      let ddA = dateArr[0].split('/');
      let mm = ddA[0];
      let dd = ddA[1];
      let yyyy = ddA[2];

      if (dd < 10)
      {
        dd = '0'+dd;
      }
      if (mm < 10)
      {
        mm = '0'+mm;
      }

      startDate = mm +'/' + dd +'/' + yyyy;

      let sTime = dateArr[1].trim();
      let timearr = sTime.split(' ');
      let startTimeAP = timearr[1];
      //console.log("sTime ", sTime);
      //console.log("timearr ", timearr[0], "- ", timearr[1]);
      startTime = timearr[0];
      if (startTimeAP == 'PM' ) {
        let timeArr = timearr[0].split(':');
        let hour = parseInt(timeArr[0], 10) + 12;
        if (hour != 24){
        startTime = hour.toString().concat(':', timeArr[1], ':', timeArr[2]);}
      }

      if (startTimeAP == 'AM') {
        let timeArr = timearr[0].split(':');
        let hour = parseInt(timeArr[0], 10);
        if (hour == 12) {
          startTime = '00'.concat(':', timeArr[1], ':', timeArr[2]);
        }

      }
    }


    //console.log("party id", partyID);
    //console.log("startDate: ", startDate);
    //console.log("startTime: ", startTime);

    let newCDRObject = {};
    newCDRObject.docType = "CDR"
    newCDRObject.cdrId = cdrId;
    newCDRObject.operatorId = partyID;
    newCDRObject.callingNumber = callingNumber;
    newCDRObject.calledNumber = calledNumber;
    newCDRObject.startDate = startDate;
    newCDRObject.startTime = startTime;
    newCDRObject.callDuration = callDuration;
    newCDRObject.callType = callType;
    newCDRObject.switchUsed = switchUsed;

    let dataBuffer = Buffer.from(JSON.stringify(newCDRObject));
    await ctx.stub.putState(cdrId, dataBuffer);

    return newCDRObject;

  }

  /**
* Get a cdr details from the blockchain
* @param ctx - The transaction context
* @param cdrId - cdrID for which to fetch details
* @returns
*/
  async getCdrUsingCDRID(ctx, cdrId) {
    let queryString = "{\"selector\":{\"docType\":\"CDR\", \"cdrId\":\"" + cdrId + "\"}, \"use_index\":[\"_design/cdrDoc\", \"cdrIndex\"]}"
    console.log("query: ", queryString);
    let resultsIterator = await ctx.stub.getQueryResult(queryString);

    let allResults = [];
    while (true) {
      let res = await resultsIterator.next();
      //   console.log("res", res);
      //console.log("res.value", res.value, " and res.value.value.toString() ", res.value.value.toString())
      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        //console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }

        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await resultsIterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }
  /**
 * get the CDRs count for a particular operator on the network
 * @param ctx - The transaction context object
 * @param operatorId - operatorA or operatorB
 * @returns - count of cdr for given operator
 */

async getCdrCountUsingOperator(ctx, operatorId) {
  let queryString = "{\"selector\":{\"docType\":\"CDR\", \"operatorId\":\"" + operatorId + "\"}, \"use_index\":[\"_design/partyDoc\", \"partyIndex\"]}"
  console.log("query: ", queryString);
  let resultsIterator = await ctx.stub.getQueryResult(queryString);

  let count = 0;
  while (true) {
    let res = await resultsIterator.next();
    //console.log("res", res);
    //console.log("res.value", res.value, " and res.value.value.toString() ", res.value.value.toString())

    if (res.value && res.value.value.toString()) {
      
      count = count + 1;
      
    }
    if (res.done) {
      console.log('end of data');
      await resultsIterator.close();
     // console.info(allResults);
      // as of now returning only count. all results object has all the CRDs
      return count;
    }
  }
}
  /**
 * get the CDRs  for a particular operator on the network
 * @param ctx - The transaction context object
 * @param operatorId - operatorA or operatorB
 * @returns - cdrs for given operator
 */
  async getCdrUsingOperator(ctx, operatorId) {
    let queryString = "{\"selector\":{\"docType\":\"CDR\", \"operatorId\":\"" + operatorId + "\"}, \"use_index\":[\"_design/partyDoc\", \"partyIndex\"]}"
    console.log("query: ", queryString);
    let resultsIterator = await ctx.stub.getQueryResult(queryString);

    let allResults = [];
    let count = 0;
    while (true) {
      let res = await resultsIterator.next();
      //console.log("res", res);
      //console.log("res.value", res.value, " and res.value.value.toString() ", res.value.value.toString())

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        count = count + 1;
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await resultsIterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }
  /**
 * get the count of CDRs  for a particular operator on the network on a given date
 * @param ctx - The transaction context object
 * @param operatorId - operatorA or operatorB
 * @param dataDate - date for which cdrs are required
 * @returns - count cdrs for given operator on a given date
 */

  async getCdrCountUsingDate(ctx, operatorId, dataDate) {
    let queryString = "{\"selector\":{\"docType\":\"CDR\", \"operatorId\":\"" + operatorId + "\", \"startDate\":\"" + dataDate + "\" }, \"use_index\":[\"_design/dateDoc\", \"dateIndex\"]}"
    console.log("query: ", queryString);
    let resultsIterator = await ctx.stub.getQueryResult(queryString);

    let count = 0;
    while (true) {
      let res = await resultsIterator.next();
      //console.log("res", res);
      //console.log("res.value", res.value, " and res.value.value.toString() ", res.value.value.toString())

      if (res.value && res.value.value.toString()) {
         count = count + 1;
      }
      if (res.done) {
        console.log('end of data');
        await resultsIterator.close();
        return count;
      }
    }
  }
    /**
 * get the CDRs  for a particular operator on the network on a given date
 * @param ctx - The transaction context object
 * @param operatorId - operatorA or operatorB
 * @param dataDate - date for which cdrs are required
 * @returns - cdrs for given operator on a given date
 */

  async getCdrUsingDate(ctx, operatorId, dataDate) {
    let queryString = "{\"selector\":{\"docType\":\"CDR\", \"operatorId\":\"" + operatorId + "\", \"startDate\":\"" + dataDate + "\" }, \"use_index\":[\"_design/dateDoc\", \"dateIndex\"]}"
    console.log("query: ", queryString);
    let resultsIterator = await ctx.stub.getQueryResult(queryString);

    let allResults = [];
    let count = 0;
    while (true) {
      let res = await resultsIterator.next();
      //console.log("res", res);
      //console.log("res.value", res.value, " and res.value.value.toString() ", res.value.value.toString())

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        //console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        count = count + 1;
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await resultsIterator.close();
        //console.info(allResults);
        return count;
      }
    }
  }

 /**
 * get the count of CDRs  for a particular operator on the network on a given date for given type
 * @param ctx - The transaction context object
 * @param operatorId - operatorA or operatorB
 * @param callType - call type, IN or OUT
 * @param dataDate - date for which cdrs are required
 * @returns - count cdrs for given operator on a given date for given call type
 */

  async getCdrCountUsingType(ctx, operatorId, callType,cdrDate) {
    let queryString = "{\"selector\":{\"docType\":\"CDR\", \"operatorId\":\"" + operatorId + "\", \"callType\":\"" + callType + "\", \"startDate\":\"" + cdrDate + "\" }, \"use_index\":[\"_design/typeDoc\", \"typeIndex\"]}"
    console.log("query: ", queryString);
    let resultsIterator = await ctx.stub.getQueryResult(queryString);

    let count = 0;
    while (true) {
      let res = await resultsIterator.next();
      //console.log("res", res);
      //console.log("res.value", res.value, " and res.value.value.toString() ", res.value.value.toString())

      if (res.value && res.value.value.toString()) {
        
        count = count + 1;
       
      }
      if (res.done) {
        console.log('end of data');
        await resultsIterator.close();
        return count;
      }
    }
  }
  /**
 * get the CDRs  for a particular operator on the network on a given date for given call type
 * @param ctx - The transaction context object
 * @param operatorId - operatorA or operatorB
 * @param callType - call type IN or OUT
 * @param dataDate - date for which cdrs are required
 * @returns - count cdrs for given operator on a given date for a given call type
 */
  async getCdrUsingType(ctx, operatorId, callType,cdrDate) {
    let queryString = "{\"selector\":{\"docType\":\"CDR\", \"operatorId\":\"" + operatorId + "\", \"callType\":\"" + callType + "\", \"startDate\":\"" + cdrDate + "\" }, \"use_index\":[\"_design/typeDoc\", \"typeIndex\"]}"
    console.log("query: ", queryString);
    let resultsIterator = await ctx.stub.getQueryResult(queryString);

    let allResults = [];
    let count = 0;
    while (true) {
      let res = await resultsIterator.next();
      //console.log("res", res);
      //console.log("res.value", res.value, " and res.value.value.toString() ", res.value.value.toString())

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        //console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        count = count + 1;
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await resultsIterator.close();
        //console.info(allResults);
        return count;
      }
    }
  }

/**
 * cdr reconcilation for given date
 * @param ctx - The transaction context object
 * @param cdrDate - date for which reconciliation need to be done
 * @returns - count cdrs for 
 */

async cdrReconcilation(ctx,cdrDate){

  const interconnectContract = new InterconnectContract();

  console.log("get count for OperatorA");
  let totCountA = await interconnectContract.getCdrCountUsingDate(ctx,'operatorA',cdrDate);
  let incomingA = await interconnectContract.getCdrCountUsingType(ctx,'operatorA','IN',cdrDate);
  let outgoingA = await interconnectContract.getCdrCountUsingType(ctx,'operatorA','OUT',cdrDate);

  console.log("get count for OperatorA");
  let totCountB = await interconnectContract.getCdrCountUsingDate(ctx,'operatorB',cdrDate);
  let incomingB = await interconnectContract.getCdrCountUsingType(ctx,'operatorB','IN',cdrDate);
  let outgoingB = await interconnectContract.getCdrCountUsingType(ctx,'operatorB','OUT',cdrDate);
  
  //console.log(totCountA);
  //console.log(incomingA);
  //console.log(outgoingA);
  //console.log(totCountB);
  //console.log(incomingB);
  //console.log(outgoingB);

  let cdrReconObject = {};
  cdrReconObject.description = `CDR Reconciliation summary report for ${cdrDate}`
  cdrReconObject.totCountA = totCountA; 
  cdrReconObject.incomingA = incomingA;
  cdrReconObject.outgoingA = outgoingA;
  cdrReconObject.totCountB = totCountB;
  cdrReconObject.incomingB = incomingB;
  cdrReconObject.outgoingB = outgoingB;
  if (totCountA == totCountB){
    cdrReconObject.completeRecon = "total number of CDRs for both the operators MATCHED"
  }else if (totCountA  > totCountB){
    cdrReconObject.completeRecon = "CDRs recieved from operatorA are MORE than CDRs recieved from operatorB"
  } else {
    cdrReconObject.completeRecon = "CDRs recieved from operatorA are LESS than CDRs recieved from operatorB"
  }
  if (incomingA == outgoingB){
    cdrReconObject.incomingRecon = "incoming CDRs for operatorA IS EQUAL to outgoing CDRs for operator B"
  }else if (incomingA > outgoingB){
    cdrReconObject.incomingRecon = "incoming CDRs for operatorA are MORE THAN outgoing CDRs for operator B"
  } else {
    cdrReconObject.incomingRecon = "incoming CDRs for operatorA are LESS THAN outgoing CDRs for operator B"
  }
  if (outgoingA == incomingB){
    cdrReconObject.outgoingRecon = "outgoing CDRs for operatorA IS EQUAL to incoming CDRs for operator B"
  }else if (outgoingA > incomingB){
    cdrReconObject.outgoingRecon = "outgoing CDRs for operatorA MORE THAN incoming CDRs for operator B"
  } else {
    cdrReconObject.outgoingRecon = "outgoing CDRs for operatorA LESS THAN incoming CDRs for operator B"
  }

  return cdrReconObject;

}

}

module.exports = InterconnectContract;
