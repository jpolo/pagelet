/*jslint nodejs: true*/
/*global jasmine, requirejs*/
var
isNode       = typeof process !== "undefined",
JASMINE_NODE = 'jasmine-node/lib/jasmine-node',
lib, reporter, property;

//loader
if (isNode) {
  require("../index");
  lib = require(JASMINE_NODE + '/jasmine-2.0.0.rc1.js');
  reporter = require(JASMINE_NODE + '/reporter.js').jasmineNode;

  //make jasmine available globally like it is in the browser
  for (property in lib) {
    if (lib.hasOwnProperty(property)) {
      global[property] = lib[property];
    }
  }

  //
  for (property in reporter) {
    if (reporter.hasOwnProperty(property)) {
      jasmine[property] = reporter[property];
    }
  }
}

//bring in and list all the tests to be run
requirejs(["pagelet/spec/_base", "pagelet/spec/all"], function () {

  var
  env      = jasmine.getEnv(),
  Reporter = jasmine.TerminalReporter;

  env.addReporter(new Reporter({
    color: true,
    onComplete: function (runner) {
      process.exit();
    }
  }));
  env.execute();
});
