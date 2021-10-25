#!/usr/bin/env node

const sc = require('subcommander');

const os = require('os');

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

require("./digest")
require("./search")
require("./blacklist")
require("./watch")
require("./wallet")
require("./ipset")
require("./remove")
sc.parse()
