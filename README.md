pagelet module
=======

### DESCRIPTION:

This a javascript module for html pages progressive rendering. This technique 
is well known since the publication on the Facebook developer blog about their 
`Bigpipe` module.
This implementation is intended as asynchronous as possible and rely on markup
more than javascript api. This will help to be more agile on the implementation
API.


### HOW TO INSTALL:

 1. Install plugin `git clone git://github.com/jpolo/pagelet.git .`
 2. Include the library `pagelet/pagelet.js` in your page
 
### HOW TO CODE:

 * avoid abbreviations
 * explicit better than implicit
 * closure should be named for easier debugging when this make sense
 * open `spec/runner.html` in web browser to run the tests as standalone
 * run `node spec/server.js` to run tests in a server with simulated latency
 * compatibility with at least Firefox, Chrome, IE>=7

### CHANGELOG:

#### 1.0 
 * tested and functional package

### TODO:

 1. fix markup api
 2. handle priorities between pagelets
 3. do some benchmarks


### CONTRIBUTION:

Contributions are welcome, feel free to push changes on github.
