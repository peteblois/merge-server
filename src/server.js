var http = require('http');
var opts = require('optimist');
var url = require("url");
var PathHandler = require('./path_handler.js');
var MergeHandler = require('./merge_handler.js');

var opts = opts.options('port', {
      default: 9898,
      describe: 'HTTP service port'
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

http.createServer(function (request, response) {
  mergeHandler.process(request, response);

}).listen(argv.port, '0.0.0.0');

console.log('Server running at http://127.0.0.1:' + argv.port + '/');
