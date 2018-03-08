const fs = require("fs");
const path = require("path");

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
}

class PathHandler {
  constructor(directory, root) {
    this.dirPath = path.resolve(process.cwd(), directory);
    this.root = root;
  }

  serveFile(serverPath, response) {
    const filename = this.localizePath(serverPath);
    if (!filename) {
      return false;
    }
    if (!fs.existsSync(filename)) {
      return false;
    }

    const stat = fs.statSync(filename);
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
      const header = {
        'access-control-allow-origin': '*'
      };
      const mimeType = mimeTypes[path.extname(filename)];
      if (mimeType) {
        header['Content-Type'] = mimeType;
      }

      response.writeHead(200, header);
      response.write(file, 'binary');
      response.end();
    });

    return true;
  }

  localizePath(serverPath) {
    if (serverPath.indexOf(this.root) != 0) {
      return null;
    }
    serverPath = serverPath.substr(this.root.length);
    const localPath = path.join(this.dirPath, serverPath);
    console.log('localPath: ' + localPath);
    if (!localPath.startsWith(this.dirPath)) {
      return null;
    }
    return localPath;
  }

  listDirectory(serverPath) {
    let dirname = this.localizePath(serverPath);
    if (!dirname) {
      if (serverPath[serverPath.length - 1] != '/') {
        dirname = this.localizePath(serverPath + '/');
      }
    }
    if (!fs.existsSync(dirname)) {
      return null;
    }
    const stat = fs.statSync(dirname);
    if (!stat.isDirectory()) {
      return null;
    }
    return fs.readdirSync(dirname);
  }
}

module.exports = PathHandler;
