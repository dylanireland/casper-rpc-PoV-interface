const { RuntimeArgs, CLValueBuilder, Contracts, CasperClient, DeployUtil, CLPublicKey, Keys } = require('casper-js-sdk')
const fs = require('fs')
const client = new CasperClient("http://136.243.187.84:7777/rpc")
const contract = new Contracts.Contract(client)

const keys = getKeys()
const network = "casper-test"

async function installContract() {

  const args = RuntimeArgs.fromMap({
    "collection_name": CLValueBuilder.string("Ready Player Casper Hackathon - Proof-of-Victory NFTs"),
    "collection_symbol": CLValueBuilder.string("RPC-PoV"),
    "total_token_supply": CLValueBuilder.u64(11),
    "ownership_mode": CLValueBuilder.u8(1),
    "nft_kind": CLValueBuilder.u8(1),
    "holder_mode": CLValueBuilder.u8(0),
    "nft_metadata_kind": CLValueBuilder.u8(0),
    "identifier_mode": CLValueBuilder.u8(1),
    "metadata_mutability": CLValueBuilder.u8(0),
  });

  const deploy = contract.install(
    getWasm("contract.wasm"),
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

async function mint() {
  const args = RuntimeArgs.fromMap({
    "nft_contract_hash": CLValueBuilder.string("<contract_hash>"),
    "token_owner": CLValueBuilder.string("01830c0abc927f0df72866a0cdc32a9de12e90b0288b0f7ec76fd4fb942c17eb78"),
    "token_meta_data": CLValueBuilder.string("https://gateway.pinata.cloud/ipfs/QmTCZf8VSprf3qS2jQfShLRLZXNgkX64bWYrmhCZ3JPMEg/AlexNikitin.png")
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
  return Keys.Ed25519.loadKeyPairFromPrivateFile("secret_key.pem")
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
