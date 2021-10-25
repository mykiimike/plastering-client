

const sc = require('subcommander');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require("axios");
var EC = require('elliptic').ec;

var wallet = sc.command('wallet', {
  desc: 'wallet'
});

wallet.command('show', {
  desc: 'Search information about an IPv4/IPv6',
  callback: async function (options) {
    try {
      fs.statSync(options.dataDir);
    } catch (e) { fs.mkdirSync(options.dataDir) }

    try {
      fs.statSync(options.dataDir);
    } catch (e) {
      console.log(e)
      process.exit(-1)
    }

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

    const pub = fs.readFileSync(pubKeyFile).toString();

    console.log(pub)
  }
});


wallet.command('create', {
  desc: 'Create a wallet',
  callback: async function (options) {
    try {
      fs.statSync(options.dataDir);
    } catch (e) { fs.mkdirSync(options.dataDir) }

    try {
      fs.statSync(options.dataDir);
    } catch (e) {
      console.log(e)
      process.exit(-1)
    }

    const pubKeyFile = `${options.dataDir}/pub.key`;
    const privKeyFile = `${options.dataDir}/priv.key`;

    try {
      fs.statSync(pubKeyFile);
      console.log(`Public key exists, remove it first`)
      process.exit(-1)
    } catch (e) { }

    try {
      fs.statSync(privKeyFile);
      console.log(`Private key exists, remove it first`)
      process.exit(-1)
    } catch (e) { }

    // Create and initialize EC context
    // (better do it once and reuse it)
    var ec = new EC('secp256k1');

    // Generate keys
    var key = ec.genKeyPair();

    var pub = key.getPublic().encode("hex");
    var priv = key.getPrivate().toString(16);

    fs.writeFileSync(pubKeyFile, pub);
    fs.writeFileSync(privKeyFile, priv);

    console.error(`Wallet create, use show`)
  }
});
