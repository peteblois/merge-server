import MergeHandler from './merge_handler';
import PathHandler from './path_handler';
import fs from 'fs';
import http from 'http';
import https from 'https';
import optimist from 'optimist';

function main() {
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

  const argv = opts.argv;

  if (argv.help) {
    opts.showHelp();
  }

  let paths = argv.path;
  if (!(paths instanceof Array)) {
    paths = [paths];
  }

  const handlers = [];
  for (const path of paths) {
    const pathMapping = path.split(':');
    const handler = new PathHandler(pathMapping[0], pathMapping[1]);
    handlers.push(handler);
  }

  const mergeHandler = new MergeHandler(handlers);

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
}
main();
