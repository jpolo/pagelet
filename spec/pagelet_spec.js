/*jslint nodejs:true, browser: true, indent:2, plusplus:false */
/*global define, beforeEach, jasmine, waitsFor, runs, describe, it, expect */
/*global window, pagelet */
define("pagelet/spec/pagelet_spec", [], function () {
  "use strict";

  describe("[module pagelet]", function () {
    var
    global = jasmine.getGlobal(),
    $      = function (id) {
      return document.getElementById(id);
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
          var el = $("simple");
          //alert(el.innerText);
          return (el && el.innerText.replace(" ", "") !== "Simple");
        });
        runs(function () {
          expect($("simple").innerHTML).toEqual("Helloworld");
        });
      });
      it("should load pagelets with script", function () {
        waitsFor(function () {
          var el = $("script");
          return (el && el.innerText.replace(" ", "") !== "Script");
        });
        runs(function () {
          expect($("script").innerHTML).toEqual("Helloscript!");
        });
      });
      it("should load pagelets with css resources", function () {
        waitsFor(function () {
          var el = $("resources1");
          return (el && el.innerText.replace(" ", "") !== "Resources1");
        });
        runs(function () {
          var
          styleMessage = window.getComputedStyle($("resources1-message")),
          styleError   = window.getComputedStyle($("resources1-error"));
          expect(styleMessage.color).toEqual("rgb(0, 128, 0)");
          expect(styleMessage.fontWeight).toEqual("bold");
          expect(styleError.color).toEqual("rgb(255, 0, 0)");
          expect(styleError.fontWeight).toEqual("bold");
        });

        waitsFor(function () {
          var el = $("resources2");
          return (el && el.innerText.replace(" ", "") !== "Resources2");
        });
        runs(function () {
          var
          styleError   = window.getComputedStyle($("resources2-error"));
          expect(styleError.color).toEqual("rgb(255, 0, 0)");
          expect(styleError.fontWeight).toEqual("normal");
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
