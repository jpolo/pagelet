/*jslint nodejs:true, browser: true, indent:2, plusplus:false */
/*global define, beforeEach, jasmine, waitsFor, runs, describe, it, expect */
/*global window, pagelet */
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
    };

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
          var el = $("#simple");
          //alert(el.innerText);
          return (el && el.text().replace(" ", "") !== "Simple");
        });
        runs(function () {
          expect($("#simple").text()).toEqual("Helloworld");
        });
      });
      it("should load pagelets with script", function () {
        waitsFor(function () {
          var el = $("#script");
          return (el && el.text().replace(" ", "") !== "Script");
        });
        runs(function () {
          expect($("#script").text()).toEqual("Helloscript!");
        });
      });
      it("should load pagelets with css resources", function () {
        waitsFor(function () {
          var el = $("#resources1");
          return (el && el.text().replace(" ", "") !== "Resources1");
        });
        runs(function () {
          var
          message = $("#resources1-message"),
          error   = $("#resources1-error");

          expect(message.css('color')).toEqual("rgb(0, 128, 0)");
          expect(fontWeight(message.css('font-weight'))).toEqual("700");
          expect(error.css('color')).toEqual("rgb(255, 0, 0)");
          expect(fontWeight(error.css('font-weight'))).toEqual("700");
        });

        waitsFor(function () {
          var el = $("#resources2");
          return (el && el.text().replace(" ", "") !== "Resources2");
        });
        runs(function () {
          var error   = $("#resources2-error");

          expect(error.css('color')).toEqual("rgb(255, 0, 0)");
          expect(fontWeight(error.css('font-weight'))).toEqual("400");
        });
      });

      it("should load pagelets with js resources", function () {
        waitsFor(function () {
          return global.p2_loaded;
        });
        runs(function () {
          expect(global.p2_loaded).toBe(true);
          expect(global.p2_executed).toBe(true);
        });
        waitsFor(function () {
          return global.p1_loaded;
        });
        runs(function () {
          expect(global.p1_loaded).toBe(true);
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
