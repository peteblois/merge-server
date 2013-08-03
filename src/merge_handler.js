var url = require('url');

MergeHandler = function(handlers) {
  this.handlers = handlers;
};

MergeHandler.prototype.process = function(request, response) {
  var serverPath = url.parse(request.url).pathname;
  console.log('Serving ' + serverPath);

  for (var i = 0; i < this.handlers.length; ++i) {
    var handler = this.handlers[i];

    if (handler.serveFile(serverPath, response)) {
      return;
    }
  }

  var directoryContents = null;
  for (var i = 0; i < this.handlers.length; ++i) {
    var handler = this.handlers[i];
    var contents = handler.listDirectory(serverPath);

    if (contents) {
      if (!directoryContents) {
        directoryContents = contents;
      } else {
        Array.push.apply(directoryContents, contents);
      }
    }
  }

  if (directoryContents) {
    directoryContents.sort();
    this.sendDirectoryListing(serverPath, directoryContents, response);
    return;
  }

  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.end('Not found :(\n');
};

MergeHandler.prototype.sendDirectoryListing = function(serverPath, contents, response) {
  response.writeHead(200, {'Content-Type': 'text/html'});
  var header = [
'<!DOCTYPE html>',
'<html>',
'<head>',
'  <title>' + serverPath + '</title>',
'</head>',
'<body>',
'  <code>',
'    <div>' + serverPath + '</div>',
'    <hr/>',
'    <ul>\n'].join('\n');
  response.write(header);

  if (serverPath[serverPath.length - 1] == '/') {
    serverPath = serverPath.substr(0, serverPath.length - 1);
  }

  for (var i = 0; i < contents.length; ++i) {
    var filename = contents[i];
    response.write('      <li><a href="' + serverPath + '/' + filename + '">' + filename + '</a></li>\n');
  }
  var footer = [
'    </ul>',
'  </code>',
'</body>',
'</html'].join('\n');
    response.end(footer);
    return;
}


module.exports = MergeHandler;
