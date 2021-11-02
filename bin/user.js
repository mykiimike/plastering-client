const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");
const { GetWalletToken, InitNetwork, RouteNetwork, InitWallet } = require("../index")
const Table = require('cli-table');

var user = sc.command('user', {
  desc: 'User Management'
});

user.command('create', {
  desc: 'Create a new user',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);
    const post = { email: options[0], name: options[1] }
    const ret = await axios.postCheck(RouteNetwork("user/create"), post, GetWalletToken(wallet));
    console.log(ret)
  }
});

user.command('remove', {
  desc: 'Delete ID',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);
    const post = { id: options[0] }
    const ret = await axios.postCheck(RouteNetwork("user/remove"), post, GetWalletToken(wallet));
    console.log(ret)
  }
});

user.command('list', {
  desc: 'List users',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);
    const ret = await axios.postCheck(RouteNetwork("user/list"), null, GetWalletToken(wallet));
    if (ret) {

      // instantiate
      var table = new Table({
        head: ['ID', 'Name', 'Email', 'Vars']
      });

      var count = 0;
      for (var line of ret.list) {
        var vars = '-';
        if(line.vars) {
          vars = '';
          for(var k in line.vars) vars += `${k}=${line.vars[k]} `
        }
        vars = vars.trim()
        table.push([
          line.id,
          line.name,
          line.email,
          vars
        ])
      }
      console.log(table.toString());
    }

  }
});

user.command('password', {
  desc: 'Change user password',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);
    const post = { id: options[0] }
    const ret = await axios.postCheck(RouteNetwork("user/password"), post, GetWalletToken(wallet));
    console.log(ret)
  }
});
