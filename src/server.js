const MergeHandler = require('./merge_handler.js');
const PathHandler = require('./path_handler.js');
const fs = require('fs');
const http = require('http');
const https = require('https');
const optimist = require('optimist');
const url = require('url');

const opts = optimist.options('port', {
      default: 9898,
      describe: 'HTTP service port'
    })
    .options('https-port', {
      default: 9899,
      describe: 'HTTPS service port'
    })
    .options('help', {
      alias: '?',
      describe: 'Display this help'
    })
    .boolean('help')
    .options('path', {
      describe: 'Paths for serving, of the form "localpath:serverpath"',
      default: '.:/'
    })
    .string('path');

var argv = opts.argv;

if (argv.help) {
  opts.showHelp();
  return;
}

var paths = argv.path;

if (!(paths instanceof Array)) {
  paths = [paths];
}

var handlers = [];
for (var i = 0; i < paths.length; ++i) {
  var pathMapping = paths[i].split(':');
  var handler = new PathHandler(pathMapping[0], pathMapping[1]);
  handlers.push(handler);
}

var mergeHandler = new MergeHandler(handlers);

const httpsOpts = {
  key: fs.readFileSync('./src/key.pem'),
  cert: fs.readFileSync('./src/cert.pem')
};

https.createServer(httpsOpts, (request, response) => {
  mergeHandler.process(request, response);
}).listen(argv['https-port'], '0.0.0.0');

console.log(`Server running at https://127.0.0.1:${argv['https-port']}/`);

http.createServer((request, response) => {
  mergeHandler.process(request, response);
}).listen(argv.port, '0.0.0.0');

console.log(`Server running at http://127.0.0.1:${argv.port}/`);
