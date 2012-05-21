/*jslint browser:true, devel:true, indent:2 */
/*global window, Element */
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
  config     = {
    idAttribute: "data-pageletid"
  },
  hasConsole = typeof console !== 'undefined' && console.log,
  hasAMD     = typeof define !== 'undefined',
  stringify  = String,

  /**
   * evaluate code
   *
   * @param {string} stringCode
   */
  globalEval   = function globalEval(stringCode) {
    /*jslint evil:true*/
    if (global.execScript) {
      global.execScript(stringCode);
    } else {
      //var property = 'eval';
      //(function () {
      global.eval(stringCode);
      //}());
    }
    /*jslint evil:false*/
  },

  //iteration shortcut
  forEach    = function forEach(iterable, callback, thisp) {
    var length = iterable.length, i;
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
  },

  /**
   * Create a new Element
   *
   * @return {Element}
   */
  element   = function element(tagName, attributes) {
    var
    attr   = $module.dom.attr,
    node   = document.createElement(tagName),
    loader = document.createElement('img');

    forEach(attributes, function (value, key) {
      attr(this, key, value);
    }, node);

    //only for css
    if (tagName === 'link') {
      loader.onload = function onload() {
        if (node.onload) {
          node.onload();
        }
      };
      loader.onerror = function onerror() {
        if (node.onerror) {
          node.onerror();
        }
      };
      loader.src = attributes.href;
    }
    return node;
  },

  //shim for defineProperty
  defineProperty = Object.defineProperty ? function (object, propertyName, value, enumerable) {
    Object.defineProperty(object, propertyName,  {
      value: value,
      enumerable: !!enumerable,
      writable: true
    });
  } : function (object, propertyName, value) {
    object[propertyName] = value;
  },

  //throw error if property is not defined
  requireProperty = function requireProperty(object, propertyName) {
    if (!propertyName in object) {
      throw new Error(object + ' has no property "' + propertyName + '"');
    }
    return object[propertyName];
  },

  //shortcut for method implementation
  implement   = function implement(klassOrObject, extension/*, ...*/) {
    forEach(arguments, function (extension, i) {
      if (i > 0) {
        var isFunction = typeof klassOrObject === 'function';
        forEach(extension, function (method, methodName) {
          defineProperty(this, methodName, method, !isFunction);
        }, isFunction ? klassOrObject.prototype : klassOrObject);
      }
    });
    return klassOrObject;
  },

  //debug shortcut
  debug    = function debug(/*...*/) {
    if ($module.debug && hasConsole) {
      console.log.apply(console, ['[pagelet]'].concat(Array.prototype.slice.call(arguments)));
    }
  };


  /**
   * default
   */
  $module.debug = true;

  /**
   * @trait Identifiable
   */
  $module.TIdentifiable = {

    /**
     * @constructor
     * @param {number=} value
     */
    Identifiable: function Identifiable(id) {
      this.id(typeof id === "undefined" ? this.generateId() : id);
    },

    /**
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
     * @return {number}
     */
    generateId: function generateId() {
      var
      constructor = this.constructor,
      lastId    = constructor.lastId || 0;
      constructor.lastId = lastId + 1;
      return lastId;
    },

    /**
     * Return
     *
     * @return {string}
     */
    toString: function toString() {
      return '[object ' + this.constructor.name + ' {id:' + this.id() + '}]';
    }
  };

  /**
   * @trait Identifiable
   */
  $module.TState = {
    /**
     * @constructor
     */
    State: function State() {
      this.state = this._stateValue('INIT');
    },

    /**
     * @param {string} state
     * @return {boolean}
     */
    isState: function isState(state) {
      return this.state === state;
    },

    /**
     * @return {boolean}
     */
    readyState: function readyState(newState) {
      var state  = this.state;
      if (!arguments.length) {
        return state;
      } else if (state < newState) {
        this.state = newState;
        //notify changes
        if (this.onreadystatechange) {
          this.onreadystatechange();
        }
        return requireProperty(this, '_onreadystatechange').call(this, newState, state);
      } else {
        return false;
      }
    },

    /**
     *
     */
    /*onreadystatechange: function onreadystatechange() {
    },*/

    _stateValue: function stateValue(name) {
      return requireProperty(this.constructor, 'state')[name];
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
      this.callbacks = [];
    },

    /**
     * @return {boolean}
     */
    isDone: function isDone() {
      return this.isState(this._stateValue('DONE'));
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
      this.readyState(this._stateValue('LOADING'));//Change state
      return this;
    },

    /**
     * @param {Function}
     * @param {*} thisp
     */
    done: function done(callback, thisp) {
      if (this.isDone()) {
        callback.call(thisp);
      } else {
        this.callbacks.push([callback, thisp]);
      }
    },

    /**
     * @return {boolean}
     */
    _onreadystatechange: function _onreadystatechange(newState, oldState) {

      switch (newState) {
      case this._stateValue('INIT'):
        break;
      case this._stateValue('DONE'):
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
   *
   */
  $module.Resource = (function () {

    function Resource(data) {
      if (this instanceof Resource) {
        this.initialize(data);
      } else {
        return new Resource(data);
      }
    }

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
      re    = new RegExp("(?:.*\/)?(.+js)"),
      m    = re.exec(url),
      id    = m ? m[1] : url,
      instances = Resource.instances,
      resource  = instances && instances[id];

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
        url   = requireProperty(data, 'url'),
        indexOfExt = url.lastIndexOf('.'),
        extension  = ~indexOfExt ? url.slice(indexOfExt + 1, url.length) : '';

        this.Identifiable(data._id);
        this.Loadable();
        this.url     = url;
        this.node   = null;
        this.type   = requireProperty(Resource.extensions, extension);
      },

      /**
       *
       */
      _onLoading: function _onLoading(newState, oldState) {
        var
        self   = this,
        onload = function onload() {
          self.readyState(self._stateValue('DONE'));
        },
        node;

        //Load resource
        switch (this.type) {
        case Resource.TYPE_STYLESHEET:
          node = element('link', {
            rel : 'stylesheet',
            media  : 'screen',
            type   : 'text/css',
            href   : this.url,
            onload : onload,
            onerror: onload
          });
          break;
        case Resource.TYPE_JAVASCRIPT:
          node = element('script', {
            type   : 'text/javascript',
            src : this.url,
            async  : true,
            onload : onload,
            onerror: onload
          });
          break;
        }
        this.node = null;
        $module.dom.head().appendChild(node);
      },

      /**
       *
       */
      onreadystatechange: function onreadystatechange() {
        debug(this + " in state " + this.state, this);
      }
    });
    return Resource;
  }());

  $module.Pagelet = (function () {
    var
    instancesStateCount = [0, 0, 0, 0, 0],//number of states

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

    Pagelet.state = {
      INIT        : 0,
      LOADING      : 1,
      LOADING_STYLESHEET: 2,
      LOADING_HTML    : 3,
      LOADING_JAVASCRIPT: 4,
      DONE        : 5
    };

    /**
     *
     */
    Pagelet.load = function load() {
      var instances = Pagelet.instances;
      if (instances) {
        forEach(instances, function (pageletObject) {
          pageletObject.load();
        });
      }
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
        this.node   = requireProperty(data, 'node');
        this.resources = {};
        this.innerHTML = data.innerHTML || '';
        forEach(data.resources, this.addResource, this);
      },

      _onLoading: function _onLoading(newState, oldState) {
        switch (newState) {
        case this._stateValue('LOADING'):
          this.readyState(this._stateValue('LOADING_STYLESHEET'));
          break;
        case this._stateValue('LOADING_STYLESHEET'):
          this.loadStylesheets();
          break;
        case this._stateValue('LOADING_HTML'):
          this.loadHtml();
          break;
        case this._stateValue('LOADING_JAVASCRIPT'):
          ifState(this._stateValue('LOADING_JAVASCRIPT'), function (pageletObject) {
            pageletObject.loadJavascripts();
          });
          break;

        }
      },

      onreadystatechange: function onreadystatechange() {
        instancesStateCount[this.state] += 1;
        debug(this + " in state " + this.state, this);
      },

      /**
       * Attaches a CSS resource to this Pagelet.
       *
       * @param {pagelet.Resource|string} resourceOrUrl
       * @return this
       */
      addResource: function addResource(resourceOrUrl) {
        var resource = typeof resourceOrUrl === "string" ? $module.Resource.get(resourceOrUrl) : resourceOrUrl;

        debug(this + " linked to " + resource);
        this.resources[resource._id] = resource;
        //return this;
      },

      loadStylesheets: function loadStylesheets() {
        this.loadType($module.Resource.TYPE_STYLESHEET, function () {
          this.readyState(this._stateValue('LOADING_HTML'));
        }, this);
      },

      loadJavascripts: function loadJavascripts() {
        this.loadType($module.Resource.TYPE_JAVASCRIPT, function () {
          var jsCode = this.jsCode;//TODO change that!
          if (jsCode && jsCode !== "") {
            try {
              debug("evaluating js code: ", jsCode);
              globalEval(jsCode);
            } catch (e) {
              throw e;
            } finally {
              this.readyState(this._stateValue('DONE'));
            }
          } else {
            this.readyState(this._stateValue('DONE'));
          }

        }, this);
      },

      loadHtml: function loadHtml() {
        var innerHTML = this.innerHTML;
        if (innerHTML !== "") {
          this.node.innerHTML = innerHTML;
        }
        this.readyState(this._stateValue('LOADING_JAVASCRIPT'));
      },

      loadType: function loadType(type, callback, thisp) {
        var
        resourcesFiltered = [],
        resourcesTotal  = 0,
        resourcesDone  = 0,
        done        = function () {
          resourcesDone += 1;
          if (resourcesTotal <= resourcesDone && callback) {
            callback.call(thisp);
          }
        };

        //count resources
        forEach(this.resources, function (resource) {
          if (resource.type === type) {
            resourcesFiltered.push(resource);
          }
        });
        resourcesTotal = resourcesFiltered.length;

        if (!resourcesTotal) {
          done();
        } else {
          forEach(resourcesFiltered, function (resource) {
            resource.load(done);
          });
        }

      }
    });
    return Pagelet;
  }());


  /**
   * Element
   */
  implement(Element, {
    pagelet: function pagelet() {
      var
      self          = this,
      pageletObject = self._pagelet,
      dom, urls;
      if (!pageletObject) {
        dom           = $module.dom;
        urls          = [];
        forEach(self.getElementsByTagName('resource'), function (node) {
          urls.push(dom.attr(node, 'url'));
        });

        pageletObject = self._pagelet = $module.Pagelet({
          _id:  dom.attr(self, 'id'), //will generate if not set
          node: self,
          resources: urls
        });
        dom.attr(self, config.idAttribute, pagelet._id);
      }
      return pageletObject;
    }
  });


  $module.dom = (function (dom) {
    var
    headNode   = null,
    bodyNode   = null,
    streamNode = null,
    boolOrFunction = { "boolean": 1, "function": 1},
    forcePropNames = { innerHTML: 1, className: 1, value: 1 },
    propNames = {
      // properties renamed to avoid clashes with reserved words
      "class": "className",
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
      classname: "class",
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
    }

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
     * Shortcut to get element by its id
     *
     * @return {Element}
     */
    dom.byId = function byId(id) {
      id = stringify(id).replace("#", "");
      return document.getElementById(id);
    }

    dom.byClass = function (klass/*[, root]*/) {

      var
      root     = arguments[1] || dom.body();
      elements = root.getElementsByTagName('*'),
      results  = [], i;
      for (i = 0; i < elements.length; i++) {
        if (elements[i].className === klass) {
          results.push(elements[i]);
        }
      }
      return results;
    }

    dom.attr = function attr(element, name/*[, value]*/) {
      var
      lc        = name.toLowerCase(),
      propName  = propNames[lc] || name,
      attrName  = attrNames[lc] || name,
      forceProp = forcePropNames[propName],
      value, valueType, attrNode;
      if (arguments.length === 3) {
        //setter
        value = arguments[2];
        if (forceProp || boolOrFunction[valueType]) {
          element[attrName] = value;
          return;
        }
        element.setAttribute(attrName, value);
      } else {
        value = element[propName];
        valueType = typeof value;
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
    }

    dom.empty = function empty(element) {
      var child;
      while (child = element.firstChild) {
        element.removeChild(child);
      }
    }

    dom.text = function text(element) {
      return element.innerHTML;
    };


    dom.stream = function stream(elementId) {

      var watcher = setInterval(function () {
        var streamNode = dom.streamNode, i, l;
        if (!streamNode) {
          streamNode = dom.streamNode = dom.byId(elementId);
        }
        if (streamNode) {
          forEach(streamNode.childNodes, function (child) {
            if (Node.ELEMENT_NODE === child.nodeType) {
              var
              targetId = dom.attr(child, config.idAttribute),
              target   = dom.byId(targetId),
              text     = dom.text(child);
              if (!target) {
                throw new Error("#" + targetId + " does not exist");
              }

              target.pagelet().innerHTML = text;
            }
          });
          dom.empty(streamNode);
        }
      }, 1);
    };

    return dom;
  }({}));

  $module.parse = function parse(element/*[, callback]*/) {
    var callback = arguments[1];
    forEach(element.getElementsByTagName('pagelet'), function (node) {
      element.pagelet();
    });
    if (callback) {
      callback();
    }
  };

  /*$module.config = function (data) {
    data = data || {};
    config.stream = requireProperty(data, 'stream');

  };*/

  //Export
  global.pagelet = $module;

  if (hasAMD) {
    define("pagelet/pagelet", [], function () {
      return pagelet;
    });
  }
}((function () {return this;}()), {}));


