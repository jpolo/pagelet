/*jslint nodejs:true, browser: true, indent:2, plusplus:false */
/*global define, beforeEach, jasmine, waitsFor, runs, describe, it, expect */
/*global window, pagelet, jQuery, report */
define("pagelet/spec/pagelet_spec", [], function () {
  "use strict";

  describe("[module pagelet]", function () {
    var
    $          = jQuery,
    global     = jasmine.getGlobal(),
    fontWeight = function (weight) {
      return ({
        "normal": "400",
        "bold": "700"
      }[weight] || weight);
    },
    clean  = function (str) {
      return String(str).replace(/\s*/g, "");
    };

    //set handler
    it("should be an object", function () {
      expect(typeof pagelet === "object").toBe(true);
    });

    describe(".config()", function () {
      var topic = pagelet.config;
      it('should be a function with 0 parameters', function () {
        expect(topic).toBeInstanceOf(Function);
        expect(topic.length).toEqual(0);
      });
    });

    describe(".start()", function () {
      var topic = pagelet.start;
      it('should be a function with 0 parameters', function () {
        expect(topic).toBeInstanceOf(Function);
        expect(topic.length).toEqual(0);
      });
      it("should load simple pagelets", function () {
        waitsFor(function () {
          return clean($("#simple").text()) !== "Simple";
        });
        runs(function () {
          expect($("#simple").text()).toEqual("Helloworld");
        });
      });
      it("should load pagelets with script", function () {
        waitsFor(function () {
          return (clean($("#script").text()) === "Helloscript!");
        });
        runs(function () {
          expect(report["script-inline-before-text"]).toEqual("Helloscript");
          expect(report["script-inline-after-text"]).toEqual("Helloscript!");
        });
      });
      it("should load pagelets with css resources", function () {
        waitsFor(function () {
          return (clean($("#resources1").text()) !== "Resources1");
        }, null);
        runs(function () {
          var
          message = $("#resources1-message"),
          error   = $("#resources1-error");

          expect(clean(message.css('color'))).toEqual("rgb(0,128,0)");
          expect(fontWeight(message.css('font-weight'))).toEqual("700");
          expect(clean(error.css('color'))).toEqual("rgb(255,0,0)");
          expect(fontWeight(error.css('font-weight'))).toEqual("700");
        });

        waitsFor(function () {
          return (clean($("#resources2").text()) !== "Resources2");
        });
        runs(function () {
          var error   = $("#resources2-error");
          expect(clean(error.css('color'))).toEqual("rgb(255,0,0)");
          expect(fontWeight(error.css('font-weight'))).toEqual("400");
        });
      });

      it("should load pagelets with js resources", function () {
        waitsFor(function () {
          return global.resources1_executed && global.resources2_executed;
        });
        runs(function () {
          expect(report["p1.js"]).toBe(true);
          expect(report["p1.js-after"]).toBe(false);
          expect(report["p2.js"]).toBe(true);
          expect(report["p2.js-after"]).toBe(false);

          expect(global.p2_loaded).toBe(true);
          expect(global.resources1_executed).toBe(true);
          expect(global.resources2_executed).toBe(true);
        });
      });
    });
  });

  describe("[class pagelet.Pagelet]", function () {
    var topic = pagelet.Pagelet;

    it('should be a function with 1 parameters', function () {
      expect(topic).toBeInstanceOf(Function);
      expect(topic.length).toEqual(1);
    });
  });

  describe("[class pagelet.Resource]", function () {
    var topic = pagelet.Resource;

    it('should be a function with 1 parameters', function () {
      expect(topic).toBeInstanceOf(Function);
      expect(topic.length).toEqual(1);
    });
  });
});
