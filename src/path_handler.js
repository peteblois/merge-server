var fs = require("fs");
var path = require("path");

var mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
}

var PathHandler = function(directory, root) {
  this.dirPath = path.resolve(process.cwd(), directory);
  this.root = root;
};

PathHandler.prototype.serveFile = function(serverPath, response) {
  var filename = this.localizePath(serverPath);
  if (!filename) {
    return false;
  }
  if (!fs.existsSync(filename)) {
    return false;
  }

  var stat = fs.statSync(filename);
  if (!stat.isFile()) {
    return false;
  }

  fs.readFile(filename, 'binary', function(err, file) {
    if (err) {
      response.writeHead(500, {
          "Content-Type": "text/plain"
        });
      response.write(err + "\n");
      response.end();
      return;
    }
    var mimeType = mimeTypes[path.extname(filename)];// || 'application/binary';

    response.writeHead(200, {
        'Content-Type': mimeType,
        'access-control-allow-origin': '*'
    });
    response.write(file, 'binary');
    response.end();
  });

  return true;
};

PathHandler.prototype.localizePath = function(serverPath) {
  if (serverPath.indexOf(this.root) != 0) {
    return null;
  }
  serverPath = serverPath.substr(this.root.length);
  var localPath = path.join(this.dirPath, serverPath);
  console.log('localPath: ' + localPath);
  return localPath;
};

PathHandler.prototype.listDirectory = function(serverPath) {
  var dirname = this.localizePath(serverPath);
  if (!dirname) {
    if (serverPath[serverPath.length - 1] != '/') {
      dirname = this.localizePath(serverPath + '/');
    }
  }
  if (!fs.existsSync(dirname)) {
    return null;
  }
  var stat = fs.statSync(dirname);
  if (!stat.isDirectory()) {
    return null;
  }
  return fs.readdirSync(dirname);
};

module.exports = PathHandler;
