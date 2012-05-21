/*jslint nodejs:true, browser: true, indent:2, plusplus:false */
/*global define, beforeEach, jasmine, waitsFor, runs */
/*global pagelet*/
define("pagelet/spec/pagelet_spec", [], function () {

  describe("[module pagelet]", function () {
    it("should be an object", function () {
      expect(typeof pagelet === "object").toBe(true);
    });

    describe(".parse", function () {
      var topic = pagelet.parse;
      it('should be a function with 1 parameters', function () {
        expect(topic).toBeInstanceOf(Function);
        expect(topic.length).toEqual(1);
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
