var flatiron = require('flatiron')
  , app = flatiron.app
  , socketio = require('socket.io')
  , fs = require('fs')
  , urlparse = require('url').parse
  , crypto = require('crypto')
  , path = require('path')
  ;

var mimes = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.png': 'image/png'
};

app.use(flatiron.plugins.http);

function staticServer() {
  var self = this;
  var sentEtag = this.req.headers['if-none-match'];
  var urlo = urlparse(this.req.url);
  if(urlo.pathname === '/' || urlo.pathname === '') {
    urlo.pathname = '/index.html';
  }
  fs.readFile(__dirname + urlo.pathname, function(err, data) {
    if(err) {
      self.res.writeHead(404);
      return self.res.end('Error loading ' + urlo.pathname);
    }
    var md5 = crypto.createHash('md5');
    md5.update(data);
    var etag = new Buffer(md5.digest()).toString('hex');
    if(etag == sentEtag) {
      self.res.writeHead(304);
      self.res.end();
      return;
    }
    self.res.writeHead(200, {
      'ETag': etag,
      'Content-Type': mimes[path.extname(urlo.pathname)]
    });
    self.res.end(data);
  });
}

app.router.get(/\/images\/[\w\.\_\-]*/, staticServer);
app.router.get(/\/[\w\.\_\-]*/, staticServer);

app.start(8080);
