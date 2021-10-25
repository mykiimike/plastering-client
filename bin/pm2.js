

const sc = require('subcommander');
const fs = require('fs');


sc.command('pm2', {
  desc: 'Build PM2 command line',
  callback: async function (options) {


    var opts = ''
    for(var key in options) opts += ` --${key} ${options[key]}`

    const name = options.name; delete options.name;
    const bin = `${__dirname}/index.js`
    const cmd = `pm2 start -f ${bin} --name ${name} --cwd ${process.cwd()} -- watch ${opts}`

    console.log(cmd)
  }
}).option('name', {
  abbr: 'n',
  desc: 'Name of the PM2 Process',
  default: `plastering`
});;
