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

function GetWalletToken(wallet, options) {
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

  // impersonate
  if(options && options.impersonate) {
    ret.headers[`x-impersonate`] = options.impersonate;
  }
  return (ret)
}

class MultiQueueList {
  constructor() {
    this.receivers = {}
  }

  push(id, data) {
    if (!this.scheduler) this.scheduler = setTimeout(this.tick.bind(this), 100)
    this.receivers[id].queue.push(data);
  }
  receiver(id, cb) {
    this.receivers[id] = {
      queue: [],
      cb
    }
  }

  async tick() {
    var count = 0;

    for (var id in this.receivers) {
      const entry = this.receivers[id];
      const { queue, cb } = entry;

      const list = [];

      for (var a = 0; a < 200; a++) {
        const item = queue.shift();
        if (!item) break;
        list.push(item)
        count++;
      }
      if (list.length > 0) {
        await cb(list)
      }
    }
    if (count > 0)
      this.scheduler = setImmediate(this.tick.bind(this))
    else
      this.scheduler = setTimeout(this.tick.bind(this), 1000)
  }


  async waitEnd() {
    await new Promise((accept)=>{
      function check() {
        var count = 0;
        for (var id in this.receivers) count += this.receivers[id].queue.length;
        if(count > 0) {
          return(setTimeout(check, 1000))
        }
        accept();
      } 
      setTimeout(check, 1000)
    })
  }
}

module.exports = {
  InitWallet,
  GetWalletToken,
  InitNetwork,
  GetNetwork,
  SetNetwork,
  RouteNetwork,
  Networks,
  MultiQueueList
}
