
(function () {
  
  var 
  express   = require('express'),
  fs        = require('fs'),
  app       = express.createServer(),
  content   = fs.readFileSync(__dirname + '/../spec/runner.html').toString('utf8'),
  chunks    = [],
  chunkSize = 25, 
  pos       = 0;
  
  while (pos < content.length) {
    chunks.push(content.substr(pos, chunkSize));
    pos += chunkSize;
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
  app.get('/spec/runner.test', function (request, response) {
    var 
    pos    = 0,
    size   = chunks.length;
    
    timer = setInterval(function () {
      if (pos === size) {
        response.end();
        clearInterval(timer);
      } else {
        response.write(chunks[pos]);
        pos += 1;
      }
    }, 50);
  });
  
  
  app.listen(3000); 

}());
