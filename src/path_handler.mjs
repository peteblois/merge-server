import fs from 'fs';
import path from 'path';

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.py': 'text/x-python',
}

const fsp = fs.promises;

export default class PathHandler {
  constructor(directory, root) {
    this.dirPath = path.resolve(process.cwd(), directory);
    this.root = root;
  }

  async serveFile(serverPath, response, url) {
    const filename = this.localizePath(serverPath);
    if (!filename) {
      return false;
    }

    try {
      const stat = await fsp.stat(filename);
      if (!stat.isFile()) {
        return false;
      }
    } catch (e) {
      return false;
    }

    try {
      const file = await fsp.readFile(filename, 'binary');
      const header = {
        'access-control-allow-origin': '*'
      };
      const mimeType = mimeTypes[path.extname(filename)];
      if (mimeType) {
        header['Content-Type'] = mimeType;
      }
      if (url.query.download) {
        const name = path.basename(filename);
        header['Content-Disposition'] = `attachment;filename="${name}";filename*=UTF-8''${name}`;
      }

      response.writeHead(200, header);
      response.write(file, 'binary');
      response.end();
    } catch (err) {
      response.writeHead(500, {
          "Content-Type": "text/plain"
        });
      response.write(err + "\n");
      response.end();
    }

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
