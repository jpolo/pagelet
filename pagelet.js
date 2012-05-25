/*jslint browser:true, devel:true, indent:2 */
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
 *
 *
 *
 */
(function (global, $module) {
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
  hasQuery      = !!document.querySelectorAll,
  hasConsole    = (typeof console !== 'undefined') && console.log,
  hasConsoleBug = hasConsole && typeof console.log === "object",
  hasBind       = Function.prototype.bind,
  hasAMD        = typeof define !== 'undefined',
  isIE          = /msie/i.test(navigator.userAgent)/* && !/opera/i.test(navigator.userAgent)*/;
  stringify     = String,

  Void          = function Void() {},
  
  /**
   * @param {Function} callback
   * @param {Object=} thisp
   * @return {Function}
   */
  bind          = function (fn, thisp) {
    var apply = Function.prototype.apply;
    return hasBind ? hasBind.call(fn, thisp) : function () {
      return apply.call(fn, thisp, arguments);
    };
  },
  
  //shim for defineProperty
  defDefault    = function defDefault(object, propertyName, value) {
    object[propertyName] = value;
  },
  def           = Object.defineProperty ? function (object, propertyName, value, enumerable) {
    var descriptor = {
      value: value,
      enumerable: !!enumerable,
      writable: true
    };
    try {
      Object.defineProperty(object, propertyName, descriptor);
    } catch (e) {
      defDefault(object, propertyName, value);
    }
  } : defDefault,
  
  /**
   * Will call `fn` at next cycle
   *
   * @param {Function} fn
   * @param {Object=} thisp
   */
  queue = function queue(fn, thisp) {
    if (thisp) {
      setTimeout(bind(fn, thisp), 0);
    } else {
      setTimeout(fn, 0);
    }
  },
  
  /**
   * evaluate code
   *
   * @param {string} stringCode
   */
  runScript = function runScript(stringCode) {
    /*jslint evil:true*/
    if (global.execScript) {
      global.execScript(stringCode);
    } else {
      var property = 'eval';
      global[property](stringCode);
    }
    /*jslint evil:false*/
  },
  
  /**
   * @param {Array|Object} iterable
   * @param {Function} callback
   * @param {Object=} thisp
   */
  forEach = function forEach(iterable, callback, thisp) {
    var length = iterable.length, i;
    try {
      if (typeof length !== 'undefined') {
        for (i = 0; i < length; i += 1) {
          callback.call(thisp, iterable[i], i, iterable);
        }
      } else {
        for (i in iterable) {
          if (iterable.hasOwnProperty(i)) {
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
    var filtered = [];
    forEach(iterable, function (value, index) {
      if (callback.call(thisp, value, index)) {
        filtered.push(value);
      }
    });
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
  
  createLogger = function (level) {
    var 
    slice  = Array.prototype.slice,
    writer = hasConsole ? bind(console[level] || console.log, console) : Void;
    return function (/*...*/) {
      if ((level !== 'debug' || configuration.debug) && hasConsole) {
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


  

  //shortcut for method implementation
  function implement(klassOrObject, extension/*, ...*/) {
    forEach(arguments, function (extension, i) {
      if (i > 0) {
        var isFunction = typeof klassOrObject === 'function';
        forEach(extension, function (method, methodName) {
          def(this, methodName, method, !isFunction);
        }, isFunction ? klassOrObject.prototype : klassOrObject);
      }
    });
    return klassOrObject;
  }

  /**
   * @param {Object=} data
   * @return {Object|pagelet}
   */
  $module.config = function config(/*[data]*/) {
    if (arguments.length) {
      var data = arguments[0];
      if (data.hasOwnProperty('debug')) {
        configuration.debug = !!data.debug;
      }
      if (data.hasOwnProperty('stream')) {
        configuration.stream = stringify(data.stream);
      }
      return $module;
    } else {
      return configuration;
    }
  }
  
  /**
   * Start pagelet engine
   *
   * @return {pagelet}
   */
  $module.start  = function start() {
    $module.dom.createStream(configuration.stream);
    return $module;
  }
  
  /**
   * Callback when module is loaded
   */
  $module.onload = $module.onload || null;

  /**
   * @trait Identifiable
   */
  $module.TStats = {
    /**
     * @constructor
     */
    Stats: function Stats() {
      this.stats();//will initialize class data
    },
    
    
    stats: function stats(/*[key[, value]]*/) {
      var 
      constructor = this.constructor,
      stats       = constructor._stats,
      argc        = arguments.length;
      if (!stats) {
        stats = constructor._stats = {};
      }
      if (!argc) {
        return stats;
      } else if (argc === 1) {
        return stats[arguments[1]];
      } else {
        stats[arguments[1]] = arguments[2];
        return this;
      }
    }
  };
  
  /**
   * @trait Identifiable
   */
  $module.TIdentifiable = implement($module.TStats, {

    /**
     * @constructor
     * @param {number=} value
     */
    Identifiable: function Identifiable(id) {
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
        instances   = constructor.instances;
        if (!instances) {
          instances = constructor.instances = {};
          constructor.instancesCount = 0;
        }
        if (instances[value]) {
          throw new Error(instances[value] + ' is already existing');
        }
        instances[value] = this;
        constructor.instancesCount += 1;

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
  $module.TState = {
    /**
     * @constructor
     */
    State: function State() {
      if (typeof this._state === "undefined") {
        this._state = this.state('INIT');
      }
    },

    /**
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

    state: function state(name) {
      var result = requireProperty(this.constructor, 'state')[name];
      if (typeof result === "undefined") {
        throw new RangeError(name + " is not a valid state");
      }
      return result;
    }
  };

  /**
   * @trait TLoadable
   */
  $module.TLoadable = implement({}, $module.TState, {
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
     * @return {boolean}
     */
    isDone: function isDone() {
      return this.isState('DONE');
    },

    /**
     *
     * @param {Function=} callback
     * @param {*} thisp
     */
    load: function load(callback, thisp) {
      if (callback) {
        this.done(callback, thisp);
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
        this.callbacks.push([callback, thisp]);
      }
    },

    /**
     * @return {boolean}
     */
    _onreadystatechange: function _onreadystatechange(newState, oldState) {

      switch (newState) {
      case this.state('INIT'):
        break;
      case this.state('DONE'):
        forEach(this.callbacks, function (callback) {
          callback[0].call(callback[1]);
        });
        this.callbacks.length = 0;
        break;
      default:
        requireProperty(this, '_onLoading').call(this, newState, oldState);
      }
    }
  });

  /**
   * @class Resource
   */
  $module.Resource = (function () {
    function Resource(data) {
      if (this instanceof Resource) {
        this.initialize(data);
      } else {
        return new Resource(data);
      }
    }
    Resource.displayName = 'Resource';
    Resource.TYPE_JAVASCRIPT = "javascript";
    Resource.TYPE_STYLESHEET = "stylesheet";
    Resource.state = {
      INIT   : 0,
      LOADING: 1,
      DONE   : 2
    };
    Resource.extensions = {
      js: Resource.TYPE_JAVASCRIPT,
      css: Resource.TYPE_STYLESHEET
    };

    /**
     * Returns a Resource from cache or creates new if the resource has not yet been created.
     *
     * @protected Called from Pagelet
     * @param {string} url Filename of the resource. eg "/js/talk.js"
     * @return {pagelet.Resource}
     */
    Resource.get = function get(url) {
      var
      instances = Resource.instances,
      resource  = instances && instances[url];

      if (!resource) {
        resource = new Resource({
          _id: url,
          url: url
        });
      }
      return resource;
    };

    implement(Resource, $module.TIdentifiable, $module.TLoadable, {
      /**
       * @constructor
       * @param {Object} data
       * - _id
       * - url
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
      },

      /**
       * @return {boolean}
       */
      isType: function isType(type) {
        if (typeof type === "string") {
          type = this.constructor["TYPE_" + type];
        }
        return this.type === type;
      },

      /**
       *
       */
      _onLoading: function _onLoading(newState, oldState) {
        var
        self          = this,
        createElement = $module.dom.createElement,
        onload        = function onload() {
          self.readyState('DONE');
        },
        node;

        //Load resource
        switch (this.type) {
        case Resource.TYPE_STYLESHEET:
          node = createElement('link', {
            rel : 'stylesheet',
            media  : 'screen',
            type   : 'text/css',
            href   : this.url,
            onload : onload,
            onerror: onload
          });
          break;
        case Resource.TYPE_JAVASCRIPT:
          node = createElement('script', {
            type   : 'text/javascript',
            src : this.url,
            async  : true,
            onload : onload,
            onerror: onload
          });
          break;
        }
        this.node = node;
        $module.dom.head().appendChild(node);
      },

      /**
       *
       */
      onreadystatechange: function onreadystatechange() {
        debug(this + " in state " + this.readyState(), this);
      }
    });
    return Resource;
  }());

  $module.loader = (function (loader) {

    var
    statesCount = [0, 0, 0, 0, 0, 0],//number of states
    waiting     = [];

    loader.add = function add(pglt) {
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

  $module.Pagelet = (function () {
    var
    instancesStateCount = [0, 0, 0, 0, 0, 0, 0],//number of states

    ifState      = function ifState(state, iterator) {
      if (instancesStateCount[state] === $module.Pagelet.instancesCount) {
        forEach($module.Pagelet.instances, iterator);
      }
    };

    function Pagelet(data) {
      if (this instanceof Pagelet) {
        this.initialize(data);
      } else {
        return new Pagelet(data);
      }
    }
    Pagelet.displayName = 'Resource';
    Pagelet.state = {
      INIT        : 0,
      LOADING      : 1,
      LOADING_STYLESHEET: 2,
      LOADING_HTML    : 3,
      LOADING_JAVASCRIPT: 4,
      LOADING_JAVASCRIPT_INLINE: 5,
      DONE        : 6
    };

    implement(Pagelet, $module.TIdentifiable, $module.TLoadable, {
      /**
       * @constructor
       * @param {Object} data
       * - _id
       * - node
       * - resources
       * - innerHTML
       */
      initialize: function initialize(data) {
        this.Identifiable(data._id);
        this.Loadable();
        this.node      = requireProperty(data, 'node');
        this.resources = {};
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
          this.loadStylesheets();
          break;
        case this.state('LOADING_HTML'):
          this.loadHtml();
          break;
        case this.state('LOADING_JAVASCRIPT'):
          ifState(this.state('LOADING_JAVASCRIPT'), function (pglt) {
            pglt.loadJavascripts();
          });
          break;
        case this.state('LOADING_JAVASCRIPT_INLINE'):
          this.loadJavascriptInline();
          break;
        }
      },

      /**
       * callback after state change
       */
      onreadystatechange: function onreadystatechange() {
        var state = this.readyState();
        instancesStateCount[state] += 1;
        debug(this + " in state " + state, this);
      },

      /**
       * Attaches a CSS resource to this Pagelet.
       *
       * @param {pagelet.Resource|string} resourceOrUrl
       * @return this
       */
      addResource: function addResource(resourceOrUrl) {
        var
        resources = this.resources,
        resource  = (typeof resourceOrUrl === "string" ?
          $module.Resource.get(resourceOrUrl) :
          resourceOrUrl
        );

        if (!resources[resource._id]) {
          debug(this + " linked to " + resource, this);
          resources[resource._id] = resource;
          resource.done(function () {
            this.onResourceLoaded(resource);
          }, this);
        }
        return this;
      },

      /**
       * Set node innerHTML
       */
      html: function html(content) {
        this.innerHTML = content;
        if (this.readyState() >= this.state('LOADING_HTML')) {
          $module.dom.html(this.node, content);
        }
      },

      onResourceLoaded: function (resource) {
        if (this.isState('LOADING_STYLESHEET') && this._isLoaded('STYLESHEET')) {
          this.readyState('LOADING_HTML');
        } else if (this.isState('LOADING_JAVASCRIPT') && this._isLoaded('JAVASCRIPT')) {
          this.readyState('LOADING_JAVASCRIPT_INLINE');
        }
      },

      _isLoaded: function _isLoaded(type) {
        var allLoaded = true;
        forEach(this.resources, function (resource) {
          if (resource.isType(type) && !resource.isDone()) {
            allLoaded = false;
            throw false;
          }
        });
        return allLoaded;
      },

      loadStylesheets: function loadStylesheets() {
        this.loadType('STYLESHEET');
      },

      loadJavascripts: function loadJavascripts() {
        this.loadType('JAVASCRIPT');
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
      },

      loadHtml: function loadHtml() {
        if (this.innerHTML !== "") {
          this.html(this.innerHTML);
        }
        this.readyState('LOADING_JAVASCRIPT');
      },

      loadType: function loadType(type, callback, thisp) {
        var resources = filter(this.resources, function (resource) {
          if (resource.isType(type)) {
            resource.load();
            return true;
          }
          return false;
        });

        if (!resources.length) {
          this.onResourceLoaded(null);
        }
      }
    });
    return Pagelet;
  }());

  $module.dom = (function (dom) {
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
      var result = true, attr = dom.attr;
      forEach(template, function (value, key) {
        switch (key) {
        case 'nodeName':
          result = (element[key].toLowerCase() === value.toLowerCase());
          break;
        case 'nodeType':
          result = (element[key] === value);
          break;
        default:
          result = (attr(element, key) === value);
          break;
        }
        if (!result) {
          throw false;//break
        }
      });
      return result;
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
      loader;

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
      
      forEach(attributes, function (value, key) {
        attr(this, key, value);
      }, element);
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
      watcher   = null,
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
      dom  = $module.dom,
      urls = [];
      if (pglt) {
        return pglt;
        //throw new Error(element, 'has already a pagelet');
      }
      forEach(element.getElementsByTagName('resource'), function (node) {
        urls.push(dom.attr(node, 'url'));
      });

      pglt = element._pagelet = $module.Pagelet({
        _id:  dom.attr(element, 'id'), //will generate if not set
        node: element,
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
      match   = dom.match,
      gc      = [],
      watcher = setInterval(function () {
        var streamNode = dom.streamNode, i, l;
        if (!streamNode) {
          streamNode = dom.streamNode = dom.byId(elementId);

          //at creation
          if (streamNode) {
            dom.attr(streamNode, "style", "display:none");
            debug(streamNode, "as pagelet stream");
          }
        }
        if (streamNode) {
          forEach(streamNode.childNodes, function (child, i, children) {
            if (i === children.length - 1) {
              return;//avoid last one that could be unterminated
            }
            gc.push(child);
            if (match(child, configuration.pageletNode)) {
              debug(child, "parsed as pagelet");

              var
              targetId = dom.attr(child, configuration.attributeId),
              target   = dom.byId(targetId),
              targetPagelet;

              if (!target) {
                throw new Error("#" + targetId + " does not exist");
              }
              targetPagelet = dom.createPagelet(target);
              forEach(child.childNodes, function (pageletContent) {

                if (match(pageletContent, configuration.contentNode)) {
                  debug(pageletContent, "parsed as content");
                  targetPagelet.html(pageletContent.nodeValue);
                } else if (match(pageletContent, configuration.scriptNode)) {
                  debug(pageletContent, "parsed as script");
                  targetPagelet.script = dom.html(pageletContent);
                } else if (match(pageletContent, configuration.resourceNode)) {
                  debug(pageletContent, "parsed as resource");
                  targetPagelet.addResource(dom.attr(pageletContent, 'url'));
                } else if (match(pageletContent, configuration.textNode)) {//text node
                  //ignored
                } else {
                  warn(pageletContent, " not recognized");
                }
              });

              $module.loader.add(targetPagelet);
            } else if (match(child, configuration.textNode)) {//text node
              //ignored
              debug(child, " ignored");
            } else {
              warn(child, " should be a <" + configuration.pageletNode.nodeName + " />");
            }
          });

          while (gc.length) {
            streamNode.removeChild(gc.pop());
          }
        }
      }, configuration.streamWatch);
    };

    return dom;
  }({}));

  //Export
  global.pagelet = $module;

  if (hasAMD) {
    define("pagelet/pagelet", [], function () {
      return pagelet;
    });
  }

  if (pagelet.onload) {
    pagelet.onload();
  }
}((
function () {
  return this;
}()),
typeof pagelet !== "undefined" ? pagelet : {}
));
