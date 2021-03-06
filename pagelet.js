/*jslint browser:true, devel:true, plusplus: false, newcap: false, indent:2 */
/*global window, Element, pagelet, define */
/**
 * The MIT License
 *
 * Copyright (c) 2010 Julien Polo (author)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * @projectDescription pagelet rendering module
 *
 * @author Julien Polo<julien.polo@gmail.com>
 * @version 1.0.0
 */
(function (global, pagelet) {
  "use strict";


  var
  configuration = {
    debug        : false,
    attributeId  : "data-pageletid",
    stream       : "#pagelet-stream",
    streamWatch  : 1,
    textNode     : {
      nodeType : 3
    },
    pageletNode  : {
      nodeType : 1,
      nodeName : 'code'
    },
    contentNode  : {
      nodeType : 8//comment node
    },
    scriptNode: {
      nodeType : 1,
      nodeName : 'script',
      type     : 'text/pagelet'
    },
    resourceNode : {
      nodeType : 1,
      nodeName : 'link'
    }
  },
  undef,//forced to be undefined
  Void          = function Void() {},
  hasQuery      = !!document.querySelectorAll,
  hasConsole    = (typeof console !== 'undefined'),
  hasConsoleBug = hasConsole && typeof console.log === "object",
  hasBind       = Function.prototype.bind,
  define        = global.define || Void,
  isIE          = /msie/i.test(navigator.userAgent),// && !/opera/i.test(navigator.userAgent),
  stringify     = String,

  /**
   * @param {Function} callback
   * @param {Object=} thisp
   * @return {Function}
   */
  bind          = function (fn, thisp) {
    var apply = Void.apply;
    return hasBind ? hasBind.call(fn, thisp) : function () {
      return apply.call(fn, thisp, arguments);
    };
  },

  setImmediate = global.setImmediate || global.msSetImmediate || global.setTimeout,

  //shortcut to own property
  hasOwn        = bind(Void.call, {}.hasOwnProperty),

  //function validator
  validateFunction = function (fn) {
    if (typeof fn !== 'function') {
      throw new TypeError(fn + " is not a valid function");
    }
    return fn;
  },

  //shim for defineProperty
  def           = (Object.defineProperty ? function def(object, name, desc) {
    try {
      Object.defineProperty(object, name, desc);
    } catch (e) {
      object[name] = desc.value;
    }
  } : function def(object, name, desc) {
    object[name] = desc.value;
  }),

  /**
   * Will call `fn` as soon as possible
   *
   * @param {Function} fn
   * @param {Object=} thisp
   */
  queue = function queue(fn, thisp) {
    validateFunction(fn);
    setImmediate(thisp ? bind(fn, thisp) : fn);
  },

  /**
   * evaluate code
   *
   * @param {string} stringCode
   */
  /*jslint evil:true*/
  runScript = global.execScript || global.eval,
  /*jslint evil:false*/

  /**
   * @param {Array|Object} iterable
   * @param {Function} callback
   * @param {Object=} thisp
   */
  forEach = function forEach(iterable, callback, thisp) {
    validateFunction(callback);
    var length = iterable.length, i;
    try {
      if (typeof length !== 'undefined') {
        for (i = 0; i < length; i += 1) {
          callback.call(thisp, iterable[i], i, iterable);
        }
      } else {
        for (i in iterable) {
          if (hasOwn(iterable, i)) {
            callback.call(thisp, iterable[i], i, iterable);
          }
        }
      }
    } catch (e) {
      if (e !== false) {//`false` is a stop iteration signal
        throw e;
      }
    }
  },

  /**
   * @param {Array|Object} iterable
   * @param {Function} callback
   * @param {Object=} thisp
   */
  filter = function filter(iterable, callback, thisp) {
    validateFunction(callback);
    var filtered = [], length = iterable.length, i, value;
    try {
      if (typeof length !== 'undefined') {
        for (i = 0; i < length; i += 1) {
          value = iterable[i];
          if (callback.call(thisp, value, i, iterable)) {
            filtered.push(value);
          }
        }
      } else {
        for (i in iterable) {
          if (hasOwn(iterable, i)) {
            value = iterable[i];
            if (callback.call(thisp, iterable[i], i, iterable)) {
              filtered.push(value);
            }
          }
        }
      }
    } catch (e) {
      if (e !== false) {//`false` is a stop iteration signal
        throw e;
      }
    }
    return filtered;
  },

  /**
   * Throw error if property is not defined.
   * Else return unchanged `object[propertyName]`.
   *
   * @param {Object} object
   * @param {string} propertyName
   * @return {*}
   */
  requireProperty = function requireProperty(object, propertyName) {
    if (!propertyName in object) {
      throw new Error(object + ' has no property "' + propertyName + '"');
    }
    return object[propertyName];
  },

  //shortcut for method implementation
  implement = function implement(klassOrObject, extension/*, ...*/) {
    forEach(arguments, function (extension, i) {
      if (i > 0) {
        var isFunction = typeof klassOrObject === 'function';
        forEach(extension, function (method, methodName) {
          def(this, methodName, {
            value: method,
            enumerable: !isFunction,
            writable: true
          });
        }, isFunction ? klassOrObject.prototype : klassOrObject);
      }
    });
    return klassOrObject;
  },

  /**
   * Return a trait object
   *
   * @return {Object}
   */
  trait = function trait(/*...*/) {
    var result = {};
    forEach(arguments, function (extension) {
      forEach(extension, function (method, methodName) {
        def(result, methodName, {
          value: method,
          enumerable: true,
          writable: true
        });
      });
    });
    return result;
  },

  after = function (fn, afterCallback) {
    return afterCallback ? function () {
      var result = fn.apply(this, arguments);
      afterCallback.apply(this, arguments);
      return result;
    } : fn;
  },

  createLogger = function (level) {
    var
    slice  = Array.prototype.slice,
    writer = hasConsole ? bind(console[level] || console.log, console) : Void;
    return function (/*...*/) {
      if (hasConsole && (configuration.debug || level !== 'debug')) {
        writer.apply(
          console,
          ['[pagelet]'].concat(slice.call(arguments))
        );
      }
    };
  },
  debug        = createLogger('debug'),
  warn         = createLogger('warn'),
  error        = createLogger('error');


  /**
   * Configure pagelet engine or return configuration
   *
   * @param {Object=} data
   * @return {Object|pagelet}
   */
  pagelet.config = function config(/*[data]*/) {
    if (arguments.length) {
      var data = arguments[0];
      if (hasOwn(data, 'debug')) {
        configuration.debug = !!data.debug;
      }
      if (hasOwn(data, 'stream')) {
        configuration.stream = stringify(data.stream);
      }
      return pagelet;
    } else {
      return configuration;
    }
  };

  /**
   * Start pagelet engine
   *
   * @return {pagelet}
   */
  pagelet.start  = function start() {
    pagelet.dom.createStream(configuration.stream);
    return pagelet;
  };

  /**
   * Callback when module is loaded
   */
  pagelet.onload = pagelet.onload || null;

  /**
   * @trait Identifiable
   */
  pagelet.TStats = trait({
    /**
     * @constructor
     */
    Stats: function Stats() {
      this.stats();//will initialize class data
    },

    /**
     * @param {string=} key
     * @param {*=} value
     * @return {Object|*|this}
     */
    stats: function stats(/*[key[, value]]*/) {
      var
      constructor = this.constructor,
      data        = constructor.stats,
      argc        = arguments.length;
      if (!data) {
        data = constructor.stats = {};
      }
      if (!argc) {
        return data;
      } else if (argc === 1) {
        return data[arguments[0]];
      } else {
        data[arguments[0]] = arguments[1];
        return this;
      }
    }
  });

  /**
   * @trait Identifiable
   */
  pagelet.TIdentifiable = trait(pagelet.TStats, {

    /**
     * @constructor
     * @param {number=} value
     */
    Identifiable: function Identifiable(id) {
      this.Stats();
      this.id(typeof id === "undefined" ? this.generateId() : id);
    },

    /**
     * Getter/Setter for id
     *
     * @param {number=} value
     * @return {number|this}
     */
    id: function id(value) {
      if (!arguments.length) {
        return this._id;
      } else if (typeof this._id === "undefined") {
        this._id = value;

        var
        constructor = this.constructor,
        instances   = constructor.instances,
        stats       = this.stats();
        if (!instances) {
          instances = constructor.instances = {};
          stats.count = 0;
        }
        if (instances[value]) {
          throw new Error(instances[value] + ' is already existing');
        }
        instances[value] = this;
        stats.count += 1;

        return this;
      } else {
        throw new Error();
      }
    },

    /**
     * Return a new generated id
     *
     * @return {number}
     */
    generateId: function generateId() {
      var lastId = this.stats('lastId') || 0;
      this.stats('lastId', lastId + 1);
      return lastId;
    },

    /**
     * Return string representation
     *
     * @return {string}
     */
    toString: function toString() {
      return '[object ' + this.constructor.displayName + ' {id:' + this.id() + '}]';
    }
  });

  /**
   * @trait Identifiable
   */
  pagelet.TState = trait(pagelet.TStats, {
    /**
     * @constructor
     */
    State: function State() {
      this.Stats();
      if (!this.stats('countByState')) {
        var max = 0, stats = [];
        forEach(requireProperty(this.constructor, 'state'), function (value) {
          max = Math.max(max, value);
        });
        while (max--) {
          stats.push(0);
        }

        this.stats("countByState", stats);
      }
      if (typeof this._state === "undefined") {
        this._state = this.state('INIT');
      }
    },

    /**
     * Return true if this is at state `newState`
     *
     * @param {string|number} newState
     * @return {boolean}
     */
    isState: function isState(newState) {
      if (typeof newState === "string") {
        newState = this.state(newState);
      }
      return this._state === newState;
    },

    /**
     * Getter/Setter for readyState property
     *
     * @param {string|number=} newState
     * @return {boolean}
     */
    readyState: function readyState(newState) {

      if (!arguments.length) {
        //getter
        return this._state;
      }

      var state  = this._state;
      if (typeof newState === "string") {
        newState = this.state(newState);
      }
      if (state < newState) {
        this._state = newState;
        //notify changes
        if (this.onreadystatechange) {
          this.onreadystatechange(newState, state);
        }
        return requireProperty(this, '_onreadystatechange').call(this, newState, state);
      } else {
        return false;
      }
    },

    /**
     * To be overriden
     */
    /*onreadystatechange: function onreadystatechange() {
    },*/

    /**
     * Return state value
     */
    state: function state(name) {
      var result = requireProperty(this.constructor, 'state')[name];
      if (typeof result === "undefined") {
        throw new RangeError(name + " is not a valid state");
      }
      return result;
    }
  });

  /**
   * @trait TLoadable
   */
  pagelet.TLoadable = trait(pagelet.TState, {
    /**
     * @constructor
     */
    Loadable: function Loadable() {
      this.State();
      if (!this.callbacks) {
        this.callbacks = [];
      }
    },

    /**
     * Return true if this finished loading
     *
     * @return {boolean}
     */
    isDone: function isDone() {
      return this.isState('DONE');
    },

    /**
     * Trigger the loading
     *
     * @param {Function=} callback
     * @param {*=} thisp
     * @return this
     */
    load: function load(/*[callback[, thisp]]*/) {
      if (arguments.length) {
        this.done(arguments[0], arguments[1]);
      }
      this.readyState('LOADING');//Change state
      return this;
    },

    /**
     * @param {Function}
     * @param {*} thisp
     */
    done: function done(callback, thisp) {
      if (this.isDone()) {
        queue(callback, thisp);
      } else {
        this.callbacks.push([validateFunction(callback), thisp]);
      }
    },

    /**
     * @return {boolean}
     */
    _onreadystatechange: function _onreadystatechange(newState, oldState) {
      //update stats
      this.stats().countByState[newState] += 1;

      switch (newState) {
      case this.state('INIT'):
        break;
      case this.state('DONE'):
        var callbacks = this.callbacks, l = callbacks.length, callback;
        while (l--) {
          callback = callbacks[l];
          callback[0].call(callback[1]);
        }
        callbacks.length = 0;
        break;
      default:
        requireProperty(this, '_onLoading').call(this, newState, oldState);
      }
    }
  });

  /**
   * @class Resource
   */
  pagelet.Resource = (function () {
    
    function Resource(data) {
      this.initialize(data);
    }
    
    Resource.rel = {
      SCRIPT: "script",
      STYLESHEET: "stylesheet"
    };
    Resource.state = {
      INIT   : 0,
      LOADING: 1,
      DONE   : 2
    };
    Resource.extensions = {
      "js": "text/javascript",
      "css": "text/css"
    };

    /**
     * Returns a Resource from cache or creates new if the resource has not yet been created.
     *
     * @protected Called from Pagelet
     * @param {string} url Filename of the resource. eg "/js/talk.js"
     * @param {string|number} type
     * @return {pagelet.Resource}
     */
    Resource.get = function get(url, type) {
      var
      instances = Resource.instances,
      resource  = instances && instances[url];

      if (!resource) {
        resource = new Resource({
          _id: url,
          url: url,
          type: type
        });
      }
      return resource;
    };

    implement(Resource, pagelet.TIdentifiable, pagelet.TLoadable, {
      /**
       * @constructor
       * @param {Object} data
       * - _id
       * - url
       * - type
       */
      initialize: function initialize(data) {
        var
        url        = requireProperty(data, 'url'),
        indexOfExt = url.lastIndexOf('.'),
        extension  = ~indexOfExt ? url.slice(indexOfExt + 1, url.length) : '';

        this.Identifiable(data._id);
        this.Loadable();
        this.url    = url;
        this.node   = null;

        this.type   = data.type || requireProperty(Resource.extensions, extension);
        this.rel    = data.rel || requireProperty({
          "text/css": Resource.rel.STYLESHEET,
          "text/javascript": Resource.rel.SCRIPT
        }, this.type);
      },

      /**
       * Return true if this has type equal to `type`
       *
       * @return {boolean}
       */
      isType: function isType(type) {
        if (typeof type === "string") {
          type = this.constructor.type[type];
        }
        return this.type === type;
      },

      /**
       *
       */
      _onLoading: function _onLoading(newState, oldState) {
        var
        self          = this,
        createElement = pagelet.dom.createElement,
        onload        = function onload() {
          self.readyState('DONE');
        },
        node;

        //Load resource
        switch (this.rel) {
        case Resource.rel.STYLESHEET:
          node = createElement('link', {
            rel : 'stylesheet',
            media  : 'screen',
            type   : this.type,
            href   : this.url,
            onload : onload,
            onerror: onload
          });
          break;
        case Resource.rel.SCRIPT:
          node = createElement('script', {
            type   : this.type,
            src : this.url,
            async  : true,
            onload : onload,
            onerror: onload
          });
          break;
        }
        this.node = node;
        pagelet.dom.head().appendChild(node);
      },

      /**
       * callback after state change
       */
      onreadystatechange: function onreadystatechange() {
        debug(this + " in state " + this.readyState(), this);
      }
    });
    
    return Resource;
  }());

  /**
   * @class Set (of loadable)
   */
  pagelet.Set = (function () {
    
    function Set(klass) {
      this.initialize(klass);
    }
    
    Set.state = {
      INIT   : 0,
      LOADING: 1,
      DONE   : 2
    };
    implement(Set, pagelet.TLoadable, {
      /**
       * @constructor
       * @param {Function} klass
       */
      initialize: function initialize(klass) {
        this.Loadable();
        this._ = {};
        this._class = klass;

        //stats
        this.count = 0;
        this.countByState = [];
        var l = klass.state.DONE + 1, array = this.countByState;
        while (l--) {
          array.push(0);
        }
      },

      /**
       * Try to add `child` to this set. Return true if successfully added.
       *
       * @param {Object} child
       * @return {boolean}
       */
      add: function add(child) {
        if (!child instanceof this._class) {
          throw new TypeError();
        }
        var
        self         = this,
        children     = self._,
        id           = child._id,
        state        = child.readyState(),
        countByState = self.countByState;

        if (!children[id]) {
          children[id] = child;
          child.onreadystatechange = after(child.onreadystatechange, function () {
            countByState[child.readyState()] += 1;
          });

          self.count += 1;
          while (state >= 0) {
            countByState[state] += 1;
            --state;
          }
          child.done(self._onChildLoaded, self);

          return true;
        }
        return false;
      },

      _onLoading: function _onLoading(newState, oldState) {
        var resources = this._, property;
        for (property in resources) {
          if (hasOwn(resources, property)) {
            resources[property].load();
          }
        }
        if (!this.count) {
          this._onChildLoaded();
        }
      },

      _onChildLoaded: function () {
        var countByState = this.countByState;
        if (countByState[countByState.length - 1] === this.count) {
          this.readyState('DONE');
        }
      }
    });
    
    return Set;
  }());

  pagelet.loader = (function (loader) {

    var waiting = new Array(5);
    loader.add = function add(pglt) {
      /*waiting[pglt.priority] = waiting[pglt.priority] || pagelet.Set(pglt.constructor);
      if (waiting[pglt.priority].add(pglt)) {

      };

      console.warn(waiting)*/
      pglt.load();

      /*if (pglt.isState('INIT')) {
        waiting.push(pglt);
        pglt.onreadystatechange = after(pglt.onreadystatechange, function () {
          var state = pglt.readyState();
          statesCount[state] += 1;

          if (statesCount[state] === pglt.constructor.instancesCount) {

          }
        });
      }*/
    };
    return loader;
  }({}));

  pagelet.Pagelet = (function () {

    var
    Resource = pagelet.Resource,
    Set      = pagelet.Set,
    allState = function allState(state, iterator) {
      var stats   = pagelet.Pagelet.stats;
      return stats.countByState && stats.countByState[state] === stats.count;
    };
    
    function Pagelet(data) {
      this.initialize(data);
    }

    Pagelet.state = {
      INIT        : 0,
      LOADING      : 1,
      LOADING_STYLESHEET: 2,
      LOADING_HTML    : 3,
      LOADING_SCRIPT: 4,
      LOADING_SCRIPT_INLINE: 5,
      DONE        : 6
    };

    implement(Pagelet, pagelet.TIdentifiable, pagelet.TLoadable, {
      /**
       * @constructor
       * @param {Object} data
       * - _id
       * - node
       * - resources
       * - innerHTML
       * - script
       */
      initialize: function initialize(data) {
        this.Identifiable(data._id);
        this.Loadable();
        this.node      = requireProperty(data, 'node');
        this.priority  = requireProperty(data, 'priority');
        this.resources = new Set(Resource);
        this.resourcesByRel = {};
        forEach(Resource.rel, function (rel) {
          var resources = new Set(Resource);
          resources.done(this._onResourceRelLoaded, this);
          this.resourcesByRel[rel] = resources;
        }, this);

        this.innerHTML = data.innerHTML || '';
        this.script    = data.script || '';
        forEach(data.resources, this.addResource, this);
      },

      _onLoading: function _onLoading(newState, oldState) {
        switch (newState) {
        case this.state('LOADING'):
          this.readyState('LOADING_STYLESHEET');
          break;
        case this.state('LOADING_STYLESHEET'):
          this.resourcesByRel[Resource.rel.STYLESHEET].load();
          break;
        case this.state('LOADING_HTML'):
          if (this.innerHTML !== "") {
            this.html(this.innerHTML);
          }
          this.readyState('LOADING_SCRIPT');
          break;
        case this.state('LOADING_SCRIPT'):
          if (allState(this.state('LOADING_SCRIPT'))) {
            var instances = this.constructor.instances, id;
            for (id in instances) {
              if (hasOwn(instances, id)) {
                instances[id].resourcesByRel[Resource.rel.SCRIPT].load();
              }
            }
          }//TODO process only waiting for optimisation
          break;
        case this.state('LOADING_SCRIPT_INLINE'):
          queue(this.loadJavascriptInline, this);
          break;
        }
      },

      /**
       * callback after state change
       */
      onreadystatechange: function onreadystatechange() {
        debug(this + " in state " + this.readyState(), this);
      },

      /**
       * Attaches a CSS resource to this Pagelet.
       *
       * @param {pagelet.Resource|string} resourceOrUrl
       * @return this
       */
      addResource: function addResource(resourceOrUrl, type) {
        var resource = Resource.get(resourceOrUrl, type);
        if (this.resources.add(resource)) {
          debug(this + " linked to " + resource, this);
          this.resourcesByRel[resource.rel].add(resource);
        }
        return this;
      },

      /**
       * Set node innerHTML
       */
      html: function html(content) {
        this.innerHTML = content;
        if (this.readyState() >= this.state('LOADING_HTML')) {
          pagelet.dom.html(this.node, content);
        }
      },

      /**
       * callback when all resource from a type are loaded
       */
      _onResourceRelLoaded: function () {
        var
        resourcesByRel = this.resourcesByRel,
        rels           = Resource.rel;

        if (
          this.isState('LOADING_STYLESHEET') &&
          resourcesByRel[rels.STYLESHEET].isDone()
        ) {
          this.readyState('LOADING_HTML');
        } else if (
          this.isState('LOADING_SCRIPT') &&
          resourcesByRel[rels.SCRIPT].isDone()
        ) {
          this.readyState('LOADING_SCRIPT_INLINE');
        }
      },

      loadJavascriptInline: function () {
        //make asynchronous
        queue(function () {
          var script = this.script;//TODO change that!
          if (script && script !== "") {
            try {
              debug("evaluating script: ", script);
              runScript(script);
            } /*catch (e) {
              throw e;
            }*/ finally {
              this.readyState('DONE');
            }
          } else {
            this.readyState('DONE');
          }
        }, this);
      }
    });
    
    return Pagelet;
  }());

  pagelet.dom = (function (dom) {
    var
    headNode   = null,
    bodyNode   = null,
    streamNode = null,
    boolOrFunction = { "boolean": 1, "function": 1},
    forcePropNames = { innerHTML: 1, className: 1, value: 1 },
    propNames = {
      // properties renamed to avoid clashes with reserved words
      "class": "className"
      //"for": "htmlFor",
      // properties written as camelCase
      //tabindex: "tabIndex",
      //readonly: "readOnly",
      //colspan: "colSpan",
      //frameborder: "frameBorder",
      //rowspan: "rowSpan",
      //valuetype: "valueType"
    },
    attrNames = {
      // original attribute names
      classname: "class"
      //htmlfor: "for",
      // for IE
      //tabindex: "tabIndex",
      //readonly: "readOnly"
    };

    /**
     * Return document head
     *
     * @return {Element}
     */
    dom.head = function head() {
      if (!headNode) {
        headNode = document.getElementsByTagName('head')[0];
      }
      return headNode;
    };

    /**
     * Return document body
     *
     * @return {Element}
     */
    dom.body = function body() {
      if (!bodyNode) {
        bodyNode = document.getElementsByTagName('body')[0];
      }
      return bodyNode;
    };

    /**
     * @param {Element} element
     * @param {Object} template
     * @return {boolean}
     */
    dom.match = function match(element, template) {
      var
      attr   = dom.attr,
      key, value, result;
      for (key in template) {
        if (hasOwn(template, key)) {
          value = template[key];
          switch (key) {
          case 'nodeName':
            result = (element[key].toLowerCase() === value);
            break;
          case 'nodeType':
            result = (element[key] === value);
            break;
          default:
            result = (attr(element, key) === value);
            break;
          }
          if (!result) {
            return result;
          }
        }
      }
      return true;
    };

    /**
     * Create a new element
     *
     * @return {Element}
     */
    dom.createElement = function createElement(tagName, attributes) {
      var
      attr    = dom.attr,
      element = document.createElement(tagName),
      loader, key, value;

      //only for css
      if (tagName === 'link') {
        loader = new Image();
        loader.onload = function onload() {
          if (element.onload) {
            element.onload();
          }
        };
        loader.onerror = function onerror() {
          if (element.onerror) {
            element.onerror();
          }
        };
        loader.src = attributes.href;
      } else if (tagName === "script") {
        if (isIE) {//IE only
          element.onreadystatechange = function () {
            switch (this.readyState) {
            case 'loaded':
              this.onerror();
              break;
            case 'complete':
              this.onload();
              break;
            }
          };
        }
      }

      for (key in attributes) {
        if (hasOwn(attributes, key)) {
          attr(element, key, attributes[key]);
        }
      }
      return element;
    };

    /**
     * Shortcut to get element by its id
     *
     * @return {Element}
     */
    dom.byId = function byId(id) {
      id = stringify(id).replace("#", "");
      return document.getElementById(id);
    };

    /**
     * Getter/Setter for `element` attributes
     *
     */
    dom.attr = function attr(element, name/*[, value]*/) {
      var
      isSetter  = arguments.length > 2,
      lc        = name.toLowerCase(),
      propName  = propNames[lc] || name,
      attrName  = attrNames[lc] || name,
      forceProp = forcePropNames[propName],
      value     = isSetter ? arguments[2] : element[propName],
      valueType = typeof value, attrNode;
      if (isSetter) {
        //setter
        if (forceProp || boolOrFunction[valueType]) {
          element[attrName] = value;
          return;
        }
        element.setAttribute(attrName, value);
      } else {
        if (
          (forceProp && valueType !== "undefined") ||
          (propName !== "href" && boolOrFunction[valueType])
        ) {
          // node's property
          return value;
        }
        // node's attribute
        attrNode = element.getAttributeNode && element.getAttributeNode(attrName);
        return attrNode && attrNode.specified ? attrNode.nodeValue : null;
      }
    };

    /**
     * @param {Element} element
     * @param {string=} content
     * @return {string|Element}
     */
    dom.html = function html(element/*[, content]*/) {
      if (arguments.length > 1) {
        element.innerHTML = arguments[1];
      } else {
        return element.innerHTML;
      }
    };

    /**
     * @param {Element} element
     * @return {pagelet.Pagelet}
     */
    dom.createPagelet = function createPagelet(element) {
      var
      pglt = element._pagelet,
      dom  = pagelet.dom,
      urls = [];
      if (pglt) {
        return pglt;
        //throw new Error(element, 'has already a pagelet');
      }
      /*forEach(element.getElementsByTagName('resource'), function (node) {
        urls.push(dom.attr(node, 'url'));
      });*/

      pglt = element._pagelet = new pagelet.Pagelet({
        _id:  dom.attr(element, 'id'), //will generate if not set
        node: element,
        priority: dom.attr(element, 'data-priority') || 0,
        resources: urls
      });
      dom.attr(element, configuration.attributeId, pglt._id);
      return pglt;
    };

    /**
     * @param {string} elementId
     */
    dom.createStream = function createStream(elementId) {
      var
      match    = dom.match,
      byId     = dom.byId,
      attr     = dom.attr,
      gc       = [],
      parse    = function (pageletContent) {
        //this -> pagelet
        if (match(pageletContent, configuration.contentNode)) {
          debug(pageletContent, "parsed as content");
          this.html(pageletContent.nodeValue);
        } else if (match(pageletContent, configuration.scriptNode)) {
          debug(pageletContent, "parsed as script");
          this.script = dom.html(pageletContent);
        } else if (match(pageletContent, configuration.resourceNode)) {
          debug(pageletContent, "parsed as resource");
          this.addResource(
            attr(pageletContent, 'data-href'),
            attr(pageletContent, 'type')
          );
        } else if (match(pageletContent, configuration.textNode)) {//text node
          //ignored
        } else {
          warn(pageletContent, " not recognized");
        }
      },

      watcher = setInterval(function () {
        var
        streamNode = dom.streamNode, i, l, children, child,
        targetId, target, targetPagelet;
        if (!streamNode) {
          streamNode = dom.streamNode = byId(elementId);

          //at creation
          if (streamNode) {
            attr(streamNode, "style", "display:none");
            debug(streamNode, "as pagelet stream");
          }
        }
        if (streamNode) {
          children = streamNode.childNodes;
          l        = children.length - 1;//avoid last one that could be unterminated
          i        = 0;
          while (i < l) {
            child = children[i];
            gc.push(child);
            if (match(child, configuration.textNode)) {//text node
              debug(child, " ignored");
            } else if (match(child, configuration.pageletNode)) {
              debug(child, "parsed as pagelet");

              targetId = attr(child, configuration.attributeId);
              target   = byId(targetId);

              if (!target) {
                throw new Error("#" + targetId + " does not exist");
              }
              targetPagelet = dom.createPagelet(target);
              forEach(child.childNodes, parse, targetPagelet);

              pagelet.loader.add(targetPagelet);
            } else {
              warn(child, " should be a <" + configuration.pageletNode.nodeName + " />");
            }

            i += 1;
          }

          //garbage collect
          while (gc.length) {
            streamNode.removeChild(gc.pop());
          }
        }
      }, configuration.streamWatch);
    };

    return dom;
  }({}));

  //Export
  global.pagelet = pagelet;

  //AMD
  define("pagelet/pagelet", [], function () {
    return pagelet;
  });


  if (pagelet.onload) {
    pagelet.onload();
  }
}((
function () {
  return this;
}()),
typeof pagelet !== "undefined" ? pagelet : {}
));
