#!/usr/bin/env node

const sc = require('subcommander');
const os = require('os');
const axios = require("axios");

axios.postCheck = async function (a, b, c) {

  try {
    const ret = await axios.post(a, b, c);
    if (!ret) {
      console.log("Null return")
      process.exit(-1)
    }
    if (!ret.data && ret.data.error) {
      console.log(ret.data)
      process.exit(-1)
    }

    return(ret.data)
  } catch (e) {
    console.log(e.message)
    process.exit(-1)
  }
}

sc.option('dataDir', {
  abbr: 'd',
  desc: 'Data directory',
  default: `${os.homedir()}/.plastering`
});

sc.option('server', {
  abbr: 's',
  desc: 'Plastering servers to use',
  default: `https://plastering.vergoz.ch`
});

sc.option('api', {
  abbr: 'a',
  desc: 'API Path',
  default: `/api/`
});

sc.option('impersonate', {
  abbr: 'i',
  desc: 'Impersonate call'
});

require("./digest")
require("./search")
require("./blacklist")
require("./watch")
require("./wallet")
require("./ipset")
require("./pm2")
require("./remove")
require("./report")
require("./trigger")
require("./user")
sc.parse()
