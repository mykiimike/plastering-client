const fs = require('fs');
const crypto = require('crypto');
var EC = require('elliptic').ec;

var ApiPath = '/';

const Networks = []

function GetNetwork() {
  return (Networks[0])
}

function SetNetwork(array) {
  do { } while (Networks.shift())

  array.map((a) => {
    Networks.push(a);
  })
}

function InitNetwork(options) {
  const net = [];
  const t = options.server.split(",");
  t.map((e) => {
    net.push(e.trim())
  })
  SetNetwork(net);
  ApiPath = options.api;
}

function RouteNetwork(rcs) {
  return (`${GetNetwork()}${ApiPath}${rcs}`)
}

function InitWallet(options) {
  const pubKeyFile = `${options.dataDir}/pub.key`;
  const privKeyFile = `${options.dataDir}/priv.key`;

  try {
    fs.statSync(pubKeyFile);
  } catch (e) {
    console.log(`No public key found, create one`)
    process.exit(-1)
  }

  try {
    fs.statSync(privKeyFile);
  } catch (e) {
    console.log(`No private key found, create one`)
    process.exit(-1)
  }

  const ret = {
    pubPlain: fs.readFileSync(pubKeyFile).toString(),
    privPlain: fs.readFileSync(privKeyFile).toString(),
  }

  var ec = new EC('secp256k1');
  ret.pub = ec.keyFromPublic(ret.pubPlain, 'hex');
  ret.priv = ec.keyFromPrivate(ret.privPlain, 'hex');

  const h = crypto.createHash('sha256');
  h.update(ret.pubPlain);
  ret.hash = h.digest("hex");
  ret.id = ret.hash.substr(0, 32);

  return (ret);
}

function GetWalletToken(wallet) {
  const ret = { headers: {} }
  const payload = {
    timing: Date.now(),
    id: wallet.id,
    seed: crypto.randomBytes(16).toString("hex")
  }

  const h = crypto.createHash("sha256")
  h.update(JSON.stringify(payload))
  const hash = h.digest("hex");

  for (var key in payload) {
    const value = payload[key];
    ret.headers[`x-${key}`] = value;
  }

  const signature = wallet.priv.sign(hash);
  ret.headers[`x-sign`] = signature.toDER("hex");

  return (ret)
}

module.exports = {
  InitWallet,
  GetWalletToken,
  InitNetwork,
  GetNetwork,
  SetNetwork,
  RouteNetwork,
  Networks
}
