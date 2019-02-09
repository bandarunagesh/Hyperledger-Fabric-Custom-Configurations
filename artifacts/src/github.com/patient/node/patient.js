
'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Instantiated Patient Chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    console.info('Transaction ID: ' + stub.getTxID());
    console.info(util.format('Args: %j', stub.getArgs()));

    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.log('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  // ===============================================
  // Invoke Patient Call
  // ===============================================
  async initPatient(stub, args, thisClass) {
    if (args.length != 8) {
      throw new Error('Incorrect number of arguments. Expecting 4');
    }
    // ==== Input sanitation ====
    console.info('--- start init marble ---')
    if (args[0].lenth <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].lenth <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].lenth <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }
    if (args[3].lenth <= 0) {
      throw new Error('4th argument must be a non-empty string');
    }
    let userid = args[0].toLowerCase();
	let provider = args[1].toLowerCase()
    let first_name = args[2];
    let last_name = args[3];
    let mail = args[4].toLowerCase();
    let DOB =args[5];
    let SSN =args[6];
    let MSP =args[7];
    
    let userState = await stub.getState(userid);
    
    let patient = {};
    patient.docType = 'patient';
	patient.provider = provider;
    patient.first_name = first_name;
    patient.last_name = last_name;
    patient.mail = mail;
    patient.DOB = DOB;
    patient.SSN = SSN;
    patient.MSP = MSP;

    
    await stub.putState(userid, Buffer.from(JSON.stringify(patient)));
    
  }

  // ===============================================
  // Get - read a Patient details from chaincode state
  // ===============================================
  async readPatient(stub, args, thisClass) {
    
    let userid = args[0].toLowerCase();
    if (!userid) {
      throw new Error(' userid  must not be empty');
    }
    let patientdetails = await stub.getState(userid);
    if (!patientdetails.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'userid does not exist: ' + userid;
      throw new Error(JSON.stringify(jsonResp));
    }
    console.info('=======================================');
    console.log(patientdetails.toString());
    console.info('=======================================');
    return patientdetails;
  }

  async updateProvider(stub, args, thisClass) {
    
    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting provier and user')
    }

    let userid = args[0];
    let newprovider = args[1].toLowerCase();
    console.info('- start update provider ', userid, newprovider);

    let patientdetails = await stub.getState(userid);
    if (!patientdetails || !patientdetails.toString()) {
      throw new Error('user does not exist');
    }
    let providerUpdate = {};
    try {
      providerUpdate = JSON.parse(patientdetails.toString()); //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + userid;
      throw new Error(jsonResp);
    }
    console.info(providerUpdate);
    providerUpdate.provider = newprovider;

    let providerJson = Buffer.from(JSON.stringify(providerUpdate));
    await stub.putState(userid, providerJson); 

    console.info('- end Provider (success)');
  }

  async queryPatient(stub, args, thisClass) {
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting owner name.')
    }

    let userid = args[0].toLowerCase();
    let queryString = {};
    queryString.selector = {};
    queryString.selector.docType = 'patient';
    queryString.selector.userid = userid;
    let method = thisClass['getQueryResultForQueryString'];
    let queryResults = await method(stub, JSON.stringify(queryString), thisClass);
    return queryResults; //shim.success(queryResults);
  }

  
  async getAllResults(iterator, isHistory) {
    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        if (isHistory && isHistory === true) {
          jsonRes.TxId = res.value.tx_id;
          jsonRes.Timestamp = res.value.timestamp;
          jsonRes.IsDelete = res.value.is_delete.toString();
          try {
            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Value = res.value.value.toString('utf8');
          }
        } else {
          jsonRes.Key = res.value.key;
          try {
            jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Record = res.value.value.toString('utf8');
          }
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }

  
  async getHistoryForPatient(stub, args, thisClass) {

    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting 1')
    }
    let userid = args[0];
    console.info('- start getHistoryForPatient: %s\n', userid);

    let resultsIterator = await stub.getHistoryForKey(userid);
    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, true);

    return Buffer.from(JSON.stringify(results));
  }
};

shim.start(new Chaincode());
