import url from 'url';

export default class MergeHandler {
  constructor(handlers) {
    this.handlers = handlers;
  }

  async process(request, response) {
    console.log(request.method);
    if (request.method == 'OPTIONS') {
      const headers = {};
      headers['Access-Control-Allow-Methods'] = 'GET';
      headers['Access-Control-Allow-Origin'] = '*';
      if (request.headers['access-control-request-headers']) {
        headers['Access-Control-Allow-Headers'] = request.headers['access-control-request-headers'];
      }
      response.writeHead(200, headers);
      response.end();
      return;
    }
    const parsedUrl = url.parse(request.url, true);
    const serverPath = parsedUrl.pathname;
    console.log('Serving ' + serverPath);

    if (serverPath.split('/').includes('.git')) {
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.end('Not found :(\n');
      return;
    }

    for (const handler of this.handlers) {
      if (await handler.serveFile(serverPath, response, parsedUrl)) {
        return;
      }
    }

    let directoryContents = null;
    for (const handler of this.handlers) {
      const contents = handler.listDirectory(serverPath);

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
      const contents = [];
      for (const handler of this.handlers) {
        const root = handler.root.substr(1);
        contents.push(root);
      }
      this.sendDirectoryListing(serverPath, contents, response);
      return;
    }

    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end('Not found :(\n');
  }

  sendDirectoryListing(serverPath, contents, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    const dirParts = serverPath.split('/');
    let dirPath = '';
    for (let i = 0; i < dirParts.length; ++i) {
      const url = dirParts.slice(0, i + 1).join('/');
      const anchor = '<a href="' + url + '">' + dirParts[i] + '</a>';
      dirPath += anchor + '/';
    }

    const header = [
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

    for (const filename of contents) {
      response.write('      <li><a href="' + serverPath + '/' + filename + '">' + filename + '</a></li>\n');
    }
    const footer = [
  '    </ul>',
  '  </code>',
  '</body>',
  '</html'].join('\n');
      response.end(footer);
      return;
  }
}
