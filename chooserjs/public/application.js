
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"app": function(exports, require, module) {(function() {
  var App, Router;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Router = (function() {

    __extends(Router, Backbone.Router);

    function Router() {
      Router.__super__.constructor.apply(this, arguments);
    }

    Router.prototype.routes = {
      "": ""
    };

    Router.prototype.update_breadcrumbs = function(bcs) {
      var bc, path, title, _i, _len, _ref, _results;
      bc = $('.breadcrumbs');
      bc.empty();
      _results = [];
      for (_i = 0, _len = bcs.length; _i < _len; _i++) {
        _ref = bcs[_i], title = _ref.title, path = _ref.path;
        _results.push(bc.append("<li><a href='" + path + "'>" + title + "</a></li>"));
      }
      return _results;
    };

    return Router;

  })();

  App = {
    init: function() {
      var router;
      Backbone.sync = function(method, model, success, error) {
        return success();
      };
      router = new Router;
      Backbone.history.start();
      window.router = router;
      return $(document).on('click', 'a', function(ev) {
        var href;
        href = $(this).attr('href');
        console.log("click " + href);
        router.navigate(href, {
          trigger: true
        });
        return ev.preventDefault();
      });
    }
  };

  module.exports = App;

}).call(this);
}});
