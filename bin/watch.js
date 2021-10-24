

const sc = require('subcommander');
const fs = require('fs');
const crypto = require('crypto');
const axios = require("axios");

var EC = require('elliptic').ec;

const { GetNetwork, InitWallet, GetWalletToken, InitNetwork, RouteNetwork } = require("../index");
const { format } = require('path');
const { Tail } = require('tail');

sc.command('watch', {
  desc: 'Watch system files',
  callback: async function (options) {
    InitNetwork(options);
    
    const wallet = InitWallet(options);

    const catcher = await axios.get(RouteNetwork("catcher"), GetWalletToken(wallet));
    const files = await axios.get(RouteNetwork("files"), GetWalletToken(wallet));

    // build catcherList
    const catcherList = []
    for (var el of catcher.data) {
      catcherList.push(eval(el));
    }

    // prepare to send
    const queue = [];

    const dequeue = async () => {
      const list = [];

      for (a = 0; a < 100; a++) {
        const item = queue.shift();
        if (!item) break;
        list.push(item)
      }
      if (list.length > 0) {
        try {
          const ret = await axios.post(RouteNetwork("watcher"), list, GetWalletToken(wallet));
        } catch(e) {}
        
      }
      return (setTimeout(dequeue, 1000))
    }
    setTimeout(dequeue, 1000)

    // prepare files list
    for (var el of files.data) {
      try {
        const st = fs.statSync(el);
        const tail = new Tail(el);

        tail.on("line", function (data) {
          const msg = {
            message: data
          }
          for (var cat of catcherList) {
            const r = cat(msg);
            if (r) {
              console.log(data)
              queue.push(data);
              break;
            }
          }
        });

        tail.on("error", function (error) {
          console.log('ERROR: ', error);
        });

        console.log(`Tailing ${el}`)
      } catch (e) { }
    }


    // watch(['file1', 'file2'], console.log);
    console.log(catcherList)

  }
});
