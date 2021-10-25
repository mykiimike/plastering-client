

const sc = require('subcommander');
const fs = require('fs');
const zlib = require('zlib');
const readline = require("readline");
const axios = require("axios");
const cliProgress = require('cli-progress');

const { GetNetwork, InitWallet, GetWalletToken, InitNetwork, RouteNetwork } = require("../index");
const { format } = require('path');

sc.command('digest', {
  desc: 'Digest a log file',
  callback: async function (options) {
    InitNetwork(options);

    const wallet = InitWallet(options);

    const catcher = await axios.get(RouteNetwork(`catcher`), GetWalletToken(wallet));

    // build catcherList
    const catcherList = []
    for (var el of catcher.data) {
      catcherList.push(eval(el));
    }

    // prepare to send
    const queue = [];

    // create a new progress bar instance and use shades_classic theme
    var barTotal = 0;
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    // start the progress bar with a total value of 200 and start value of 0
    bar1.start(1);

    const dequeue = async () => {
      barTotal = barTotal > queue.length ? barTotal : queue.length;
      bar1.setTotal(barTotal);

      const list = [];

      for (a = 0; a < 200; a++) {
        const item = queue.shift();
        if (!item) break;
        list.push(item)
        bar1.increment();
      }
      if (list.length > 0) {
        const ret = await axios.post(RouteNetwork(`watcher`), list, GetWalletToken(wallet));
      }
      else {
        bar1.stop();
        process.exit(0)
      }
      return (setImmediate(dequeue))
    }
    setTimeout(dequeue, 1000)

    const file = options[0];
    if (!file) {
      console.log("Specify log file to inject")
      process.exit(-1);
    }

    // open the source stream 
    var st = fs.createReadStream(file);

    // support gziped files
    if(/\.gz$/.test(file)) {
      const intermediate = zlib.createGunzip();
      st.pipe(intermediate);

      // swap stream source
      st = intermediate;
    }

    // readline interface
    const rl = readline.createInterface({
      input: st
    });

    rl.on('line', async (input) => {
      const msg = {
        message: input
      }
      for (var cat of catcherList) {
        const r = cat(msg);
        if (r) {
          // console.log(input)
          queue.push(input);
          break;
        }
      }

      // const log = parse(input);
      // rd.queue(input);
    });
    st.on('end', () => {
      // console.log(`Log file injected`)
    })


  }
});
