/*jslint nodejs:true, browser: true, indent:2, plusplus:false */
/*global define, beforeEach, jasmine, waitsFor, runs */
define("pagelet/spec/_base", [], function () {

  beforeEach(function () {

    this.addMatchers({
      toBeTypeOf: function toBeTypeOf(typeString) {
        return (typeof this.actual) === typeString;
      },
      toBeInstanceOf: function toBeInstanceOf(func) {
        return (this.actual instanceof func);
      },
      toBeEnumerable: function toBeEnumerable(propertyName) {
        var actual = this.actual, property;
        if (propertyName) {
          return actual && actual.propertyIsEnumerable(propertyName);
        }
        for (property in actual) {
          if (actual.hasOwnProperty(property)) {
            return true;
          }
        }
        return false;
      },
      toHaveLengthOf: function toHaveLengthOf(length) {
        return this.actual.length === length;
      },
      toEqualAlmost: function toEqualAlmost(value) {
        var epsilon = 1e-11;
        return Math.abs(this.actual - value) <= epsilon;
      },
      toBeNative: function toBeNative() {
        //TODO check this implementation is cross platform?
        var actual = this.actual;
        return (
          typeof actual === "function" &&
          ("" + actual).indexOf('[native code]') >= 0
        );
      }
    });
  });

  (function () {

    function JSLintSpec() {
      if (!JSLintSpec.suite) {
        jasmine.getEnv().describe("JSLint : ", function () {
          JSLintSpec.suite = jasmine.getEnv().currentSuite;
        });
      }
      return JSLintSpec.suite;
    }
    JSLintSpec.add = function add(filePath) {
      //Create spec
      var
      env   = jasmine.getEnv(),
      suite = JSLintSpec(),
      spec  = new jasmine.Spec(env, suite, filePath + " should have no error");
      suite.add(spec);

      //Add error check test
      spec.runs(function () {
        var
        scriptContent = "",
        isFinished  = false,
        isSkipped  = false;

        require([ "text!" + filePath ], function (text) {
          scriptContent = text || "#ERROR_EMPTY_CONTENT";
          if (!text) {
            isSkipped = true;
          }
          isFinished = true;
        });

        waitsFor(function () {
          return isFinished;
        });
        runs(function () {
          if (isSkipped) {
            throw new Error("Impossible to load source file.");
          }

          //TODO validate with jslint
        });
      });
    };

    jasmine.Env.prototype.jslint = function jslint(scriptPath) {
      //read file content
      var filePaths = arguments, i = filePaths.length;
      while (i--) {
        JSLintSpec.add(filePaths[i] + ".js");
      }
    };

    this.jslint = function jslint(scriptPath) {
      var env = jasmine.getEnv();
      return env.jslint.apply(env, arguments);
    };
  }.call());

  console.log("Helper loaded");
});
