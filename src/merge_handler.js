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
  if (serverPath == '/') {
    var contents = [];
    for (var i = 0; i < this.handlers.length; ++i) {
      var root = this.handlers[i].root.substr(1);
      contents.push(root);
    }
    this.sendDirectoryListing(serverPath, contents, response);
    return;
  }

  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.end('Not found :(\n');
};

MergeHandler.prototype.sendDirectoryListing = function(serverPath, contents, response) {
  response.writeHead(200, {'Content-Type': 'text/html'});
  var dirParts = serverPath.split('/');
  var dirPath = '';
  for (var i = 0; i < dirParts.length; ++i) {
    var url = dirParts.slice(0, i + 1).join('/');
    var anchor = '<a href="' + url + '">' + dirParts[i] + '</a>';
    dirPath += anchor + '/';
  }

  var header = [
'<!DOCTYPE html>',
'<html>',
'<head>',
'  <title>' + serverPath + '</title>',
'</head>',
'<body>',
'  <code>',
'    <div>' + dirPath + '</div>',
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
