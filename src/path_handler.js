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
  var filename = path.join(this.dirPath, serverPath);
  if (!fs.existsSync(filename)) {
    return false;
  }

  var stat = fs.statSync(filename);
  if (!stat.isFile()) {
    return false;
  }

  fs.readFile(filename, 'binary', function(err, file) {
    if (err) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(err + "\n");
      response.end();
      return;
    }
    var mimeType = mimeTypes[path.extname(filename)];// || 'application/binary';

    console.log('mimeType: ' + mimeType);

    response.writeHead(200, {'Content-Type': mimeType});
    response.write(file, 'binary');
    response.end();
  });

  return true;
};

PathHandler.prototype.listDirectory = function(serverPath) {
  var dirname = path.join(this.dirPath, serverPath);
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
