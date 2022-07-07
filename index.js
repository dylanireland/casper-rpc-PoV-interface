const { RuntimeArgs, CLValueBuilder, Contracts, CasperClient, DeployUtil, CLPublicKey, Keys } = require('casper-js-sdk')
const fs = require('fs')

async function installContract() {
  const client = new CasperClient("http://136.243.187.84:7777/rpc")
  const contract = new Contracts.Contract(client)

  const keys = getKeys()
  const wasm = getWasm()

  const json_schema = {
    "type": "object",
    "properties": {
      "uri": {
        "type": "string"
      },
      "tier": {
        "type": "string"
      },
      "bounty": {
        "type": "string"
      },
      "place": {
        "type": "number"
      },
      "name": {
        "type": "string"
      }
    }
  }

  const args = RuntimeArgs.fromMap({
    "collection_name": CLValueBuilder.string("Ready Player Casper Hackathon - Proof-of-Victory NFTs"),
    "collection_symbol": CLValueBuilder.string("RPC-PoV"),
    "total_token_supply": CLValueBuilder.u64(11),
    "ownership_mode": CLValueBuilder.u8(1),
    "nft_kind": CLValueBuilder.u8(1),
    "minting_mode": CLValueBuilder.u8(0),
    "holder_mode": CLValueBuilder.u8(0),
    "json_schema": CLValueBuilder.string(JSON.stringify(json_schema)),
  });

  const deploy = contract.install(
    wasm,
    args,
    "10000000000", //10 CSPR
    keys.publicKey,
    "casper-test",
    [keys]
  )

  var deployHash
  try {
    deployHash = await client.putDeploy(deploy)
  } catch(error) {
    console.log(error)
  }

  console.log(deployHash)

}

function getKeys() {
  return Keys.Ed25519.loadKeyPairFromPrivateFile("secret_key.pem")
}

function getWasm() {
  try {
    return new Uint8Array(fs.readFileSync('contract.wasm').buffer)
  } catch (err) {
    console.error(err)
  }

}

installContract()
