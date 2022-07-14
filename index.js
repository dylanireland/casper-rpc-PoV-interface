const { RuntimeArgs, CLValueBuilder, Contracts, CasperClient, DeployUtil, CLPublicKey, Keys, CLValue, CLType } = require('casper-js-sdk')
const { Option, Some } = require('ts-results')
const fs = require('fs')
const client = new CasperClient("http://136.243.187.84:7777/rpc")
const contract = new Contracts.Contract(client)

const keyPairFilePath = "secret_key_2.pem"
const keys = getKeys()
const network = "casper-test"

var collection_name = "Ready Player Casper Hackathon - Proof-of-Victory NFTs"
var collection_symbol = "RPC-PoV"


async function installContract() {

  const zero = new Some(CLValueBuilder.u8(0))

  const args = RuntimeArgs.fromMap({
    "collection_name": CLValueBuilder.string(collection_name),
    "collection_symbol": CLValueBuilder.string(collection_symbol),
    "total_token_supply": CLValueBuilder.u64(11),
    "ownership_mode": CLValueBuilder.u8(1),
    "nft_kind": CLValueBuilder.u8(1),
    "holder_mode": CLValueBuilder.option(zero),
    "nft_metadata_kind": CLValueBuilder.u8(0),
    "json_schema": CLValueBuilder.string("nft-schema"),
    "identifier_mode": CLValueBuilder.u8(1),
    "metadata_mutability": CLValueBuilder.u8(0)
  });


  const deploy = contract.install(
    getWasm("contract.wasm"),
    args,
    "300000000000", //300 CSPR
    keys.publicKey,
    network,
    [keys]
  )

  var deployHash
  try {
    deployHash = await client.putDeploy(deploy)
  } catch(error) {
    console.log(error)
  }

  var contractHash
  try {
    contractHash = await pollDeployment(deployHash)
  } catch(error) {
    console.error(error)
  }

  console.log("Contract hash: " + contractHash)
}

async function mint() {
  const args = RuntimeArgs.fromMap({
    "nft_contract_hash": CLValueBuilder.string("910f52dc86877c1c3376a97fe69327dfaa29ff5fdaee774bfc5dcac50dbfc1ca"),
    "token_owner": CLValueBuilder.string("0177a214d1c6ebdcf9f5f5e977236f3f904613eb9dcd76da61aaa64beec4c349c5"),
    "token_meta_data": CLValueBuilder.string("")
  });

  const deploy = contract.install(
    getWasm("mint_call.wasm"),
    args,
    "10000000000", //10 CSPR
    keys.publicKey,
    network,
    [keys]
  )

  var deployHash
  try {
    deployHash = await client.putDeploy(deploy)
  } catch(error) {
    console.log(error)
  }

  var contractHash
  try {
    contractHash = await pollDeployment(deployHash)
  } catch(error) {
    console.error(error)
  }

  console.log("Contract hash: " + contractHash)
}

function getKeys() {
  return Keys.Ed25519.loadKeyPairFromPrivateFile(keyPairFilePath)
}

function getWasm(file) {
  try {
    return new Uint8Array(fs.readFileSync(file).buffer)
  } catch (err) {
    console.error(err)
  }
}

function pollDeployment(deployHash) {
  return new Promise((resolve, reject) => {
    var poll = setInterval(async function(deployHash) {
      try {
        response = await client.getDeploy(deployHash)
    	  if (response[1].execution_results.length != 0) {
           //Deploy executed
           if (response[1].execution_results[0].result.Failure != null) {
             clearInterval(poll)
             reject("Deployment failed")
             return
           }
           const contractHash = iterateTransforms(response[1].execution_results[0].result.Success.effect.transforms)
           clearInterval(poll)
           resolve(contractHash)
         }
  	  } catch(error) {
        console.error(error)
  	  }
    }, 2000, deployHash)
  })
}

function iterateTransforms(transforms) {
  for (var i = 0; i < transforms.length; i++) {
    if (transforms[i].transform == "WriteContract") {
      return transforms[i].key
    }
  }
}

installContract()
