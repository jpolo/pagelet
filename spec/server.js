
(function () {

  var
  express   = require('express'),
  fs        = require('fs'),
  url       = require('url'),
  app       = express.createServer(),
  timeout   = 30;

  /**
   * Helper to parse a string into chunks
   */
  function parse(filePath, callback) {
    fs.readFile(filePath, function (error, result) {
      if (error) {
        return callback(error);
      }
      var
      chunks    = [],
      chunkSize = 25,
      pos       = 0,
      text      = result.toString('utf8');
      while (pos < text.length) {
        chunks.push(text.substr(pos, chunkSize));
        pos += chunkSize;
      }
      callback(null, chunks);
    });
  }

  /**
   * Helper to pipe filecontent to response
   */
  function pipe(filePath, response) {
    var ext = ~filePath.lastIndexOf(".") ? filePath.slice(filePath.lastIndexOf("."), filePath.length) : filePath;

    response.writeHead(200, {
      "content-type": (
      ext === ".js" ? "text/javascript" :
      ext === ".css" ? "text/css" :
      null)
    });
    parse(filePath, function (error, chunks) {
      var
      pos    = 0,
      size   = chunks.length,
      timer  = setInterval(function () {
        if (pos === size) {
          response.end();
          clearInterval(timer);
        } else {
          response.write(chunks[pos]);
          pos += 1;
        }
      }, timeout);
    });
  }

  app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + '/..'));
    app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });

  app.get('/', function (request, response) {
    response.redirect('/spec/runner.test');
  });
  app.get('/spec/runner.html', function (request, response) {
    pipe(__dirname + '/../spec/runner.html', response);
  });
  app.get('/spec/resource/*', function (request, response) {
    var path = url.parse(request.url).pathname;
    pipe(__dirname + '/..' + path, response);
  });
  app.listen(3000);

}());
