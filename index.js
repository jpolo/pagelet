/*jslint nodejs: true, indent:2 */
/*global define*/
(function () {
  "use strict";

  var
  global       = (function (Fn) {
    return (new Fn("return this"))();
  }(Function)),
  isNode       = typeof process !== "undefined",
  hasDefine    = typeof define !== "undefined",
  hasRequire   = typeof require !== "undefined",
  requirejs    = global.requirejs,
  warn         = typeof console !== "undefined" ? console.warn : function () {},
  JASMINE_DOM  = "./node_modules/jasmine-dom";

  //set globals
  if (!requirejs) {
    requirejs = global.requirejs = isNode ? require('requirejs') : hasRequire ? require : null;
    if (!requirejs) {
      warn("Cannot find requirejs");
    }
  }
  if (!hasDefine) {
    global.define = requirejs.define;
    if (!global.define) {
      warn("Cannot find define AMD");
    }
  }

  //configure requirejs
  requirejs.config({
    baseUrl: '.',
    paths: {
      "jquery": JASMINE_DOM + "/examples/lib/jquery/jquery",
      "jasmine": JASMINE_DOM + "/examples/lib/jasmine",
      "jasmine_html": JASMINE_DOM + "/examples/lib/jasmine_html",
      "pagelet": ".",
      "text": "./spec/require.text"
    },
    nodeRequire: isNode ? require : null
  });

  //exports
  if (global.define) {
    define("pagelet", [ "pagelet/pagelet" ], function () {
      return global.pagelet;
    });
  }
  if (isNode) {
    require('./pagelet');
    module.exports = global.pagelet;
  }
}());
