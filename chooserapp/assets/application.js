
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
  var App, ConsentView, Devicetype, DevicetypeChoiceView, DevicetypeList, Entry, EntryInfoView, EntryList, EntryListHelpView, EntryListView, EntryPreviewView, EntrySendCacheView, EntrySendInternetView, Mimetype, MimetypeList, Options, OptionsDevicetypeLabelView, Router, SHORT_VIBRATE, addView, attract, canVibrate, chooseDevicetype, clickFeedback, kiosk, loader, popView, recorder, testentry1, touchFeedback, touchsound;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Mimetype = require('models/Mimetype');

  MimetypeList = require('models/MimetypeList');

  Devicetype = require('models/Devicetype');

  DevicetypeList = require('models/DevicetypeList');

  Options = require('models/Options');

  Entry = require('models/Entry');

  EntryList = require('models/EntryList');

  EntryListView = require('views/EntryList');

  EntryInfoView = require('views/EntryInfo');

  EntryPreviewView = require('views/EntryPreview');

  EntrySendInternetView = require('views/EntrySendInternet');

  EntrySendCacheView = require('views/EntrySendCache');

  DevicetypeChoiceView = require('views/DevicetypeChoice');

  OptionsDevicetypeLabelView = require('views/OptionsDevicetypeLabel');

  EntryListHelpView = require('views/EntryListHelp');

  ConsentView = require('views/Consent');

  loader = require('loader');

  kiosk = require('kiosk');

  attract = require('attract');

  recorder = require('recorder');

  window.views = [];

  addView = function(view, title, path) {
    var bc, bcas, bcix, bcpath, v, _len;
    path = '#' + path;
    bc = $('.breadcrumbs');
    bcas = $('a', bc);
    for (bcix = 0, _len = bcas.length; bcix < _len; bcix++) {
      bcpath = bcas[bcix];
      if (($(bcpath).attr('href')) === path) {
        while (bcix + 1 < bcas.length) {
          popView();
          bcix++;
        }
        console.log("Re-show existing view");
        view.remove();
        recorder.i('view.add.existing', {
          title: title,
          path: path,
          level: window.views.length
        });
        return;
      }
    }
    if (window.views.length > 0) {
      v = window.views[window.views.length - 1];
      v.scrollTop = $(window).scrollTop();
      v.$el.hide();
      $('#topbar-menu').addClass('hide');
      $('#topbar-back').removeClass('hide');
    }
    window.views.push(view);
    $('#mainEntrylistHolder').after(view.el);
    bc.append("<li><a href='" + path + "'>" + title + "</a></li>");
    recorder.d('app.scroll', {
      scrollTop: 0,
      scrollLeft: 0
    });
    window.scrollTo(0, 0);
    return recorder.i('view.page.add', {
      title: title,
      path: path,
      level: window.views.length
    });
  };

  popView = function() {
    var bc, bcas, path, v, view;
    if (window.views.length > 0) {
      view = window.views.pop();
      view.remove();
    }
    $('.breadcrumbs li:last-child').remove();
    if (window.views.length > 0) {
      v = window.views[window.views.length - 1];
      v.$el.show();
      if (v.scrollTop != null) {
        console.log("scroll to " + v.scrollTop);
        recorder.d('app.scroll', {
          scrollTop: v.scrollTop,
          scrollLeft: 0
        });
        window.scrollTo(0, v.scrollTop);
      }
      bc = $('.breadcrumbs');
      bcas = $('a', bc);
      path = bcas.length > 0 ? $(bcas[bcas.length - 1]).attr('href') : void 0;
      recorder.i('view.page.reveal', {
        path: path,
        level: window.views.length
      });
    } else {
      console.log("no scrollTop found");
      recorder.i('view.page.reveal.empty', {
        level: window.views.length
      });
    }
    if (window.views.length <= 1) {
      $('#topbar-menu').removeClass('hide');
      return $('#topbar-back').addClass('hide');
    }
  };

  Router = (function() {

    __extends(Router, Backbone.Router);

    function Router() {
      Router.__super__.constructor.apply(this, arguments);
    }

    Router.prototype.routes = {
      "entries": "entries",
      "help": "help",
      "entry/:eid": "entry",
      "preview/:eid": "preview",
      "sendInternet/:eid": "sendInternet",
      "sendCache/:eid": "sendCache",
      "consent": "consent"
    };

    Router.prototype.back = function() {
      var bcas, href;
      attract.active();
      bcas = $('.breadcrumbs a');
      if (bcas.length >= 2) {
        href = $(bcas[bcas.length - 2]).attr('href');
        console.log("back to " + href);
        return router.navigate(href, {
          trigger: true
        });
      } else {
        return console.log("back with nothing to go back to");
      }
    };

    Router.prototype.entries = function() {
      var _results;
      attract.active();
      _results = [];
      while (window.views.length > 1) {
        _results.push(popView());
      }
      return _results;
    };

    Router.prototype.help = function() {
      var v, view;
      attract.active();
      if (window.views.length === 0) {
        return console.log("cannot show help - no initial view");
      } else {
        v = window.views[window.views.length - 1];
        view = new EntryListHelpView();
        addView(view, "Help", "help");
        v.scrollTop = 0;
        return v.$el.show();
      }
    };

    Router.prototype.consent = function() {
      var view;
      if (window.views.length === 0) {
        return console.log("cannot show consent - no initial view");
      } else {
        attract.active();
        view = new ConsentView();
        return addView(view, "Consent", "consent");
      }
    };

    Router.prototype.getEntry = function(id) {
      var entry, _ref;
      attract.active();
      entry = (_ref = window.entries) != null ? _ref.get(id) : void 0;
      if (!(entry != null)) {
        console.log("Could not find entry " + id);
        $('#entryNotFoundModal').foundation('reveal', 'open');
        recorder.w('view.error.entryNotFound', {
          id: id
        });
        return null;
      } else {
        return entry;
      }
    };

    Router.prototype.entry = function(id) {
      var entry, view;
      attract.active();
      entry = this.getEntry(id);
      if (!(entry != null)) return false;
      console.log("show entry " + id + " " + entry.attributes.title);
      view = new EntryInfoView({
        model: entry
      });
      return addView(view, entry.attributes.title, "entry/" + (encodeURIComponent(id)));
    };

    Router.prototype.preview = function(id) {
      var entry, view;
      attract.active();
      entry = this.getEntry(id);
      if (!(entry != null)) return false;
      console.log("preview entry " + id);
      view = new EntryPreviewView({
        model: entry
      });
      return addView(view, "Preview", "preview/" + (encodeURIComponent(id)));
    };

    Router.prototype.sendInternet = function(id) {
      var entry, view;
      attract.active();
      entry = this.getEntry(id);
      if (!(entry != null)) return false;
      console.log("send(internet) entry " + id);
      view = new EntrySendInternetView({
        model: entry
      });
      return addView(view, "Send over Internet", "sendInternet/" + (encodeURIComponent(id)));
    };

    Router.prototype.sendCache = function(id) {
      var entry, view;
      attract.active();
      entry = this.getEntry(id);
      if (!(entry != null)) return false;
      console.log("send(cache) entry " + id);
      view = new EntrySendCacheView({
        model: entry
      });
      return addView(view, "Send locally", "sendCache/" + (encodeURIComponent(id)));
    };

    return Router;

  })();

  testentry1 = new Entry({
    title: 'Test entry 1',
    summary: 'test entry 1...',
    iconurl: 'icons/_blank.png'
  });

  chooseDevicetype = function() {
    console.log("chooseDevicetype");
    $('#chooseDeviceModal').foundation('reveal', 'open');
    recorder.w('view.modal.chooseDevice.show');
    return false;
  };

  App = {
    init: function() {
      var atomfile, devicetypeChooser, devicetypeLabelView, devicetypes, entries, entryview, mimetypes, options, router;
      Backbone.sync = function(method, model, success, error) {
        return success();
      };
      router = new Router;
      Backbone.history.start();
      window.router = router;
      mimetypes = new MimetypeList();
      window.mimetypes = mimetypes;
      devicetypes = new DevicetypeList();
      devicetypes.add(new Devicetype({
        id: "other",
        term: "other",
        label: "Other Device",
        supportsMime: [],
        optionalSupportsMime: ["text/html"],
        helpHtml: '<p>If you have another sort of smart phone or tablet to the ones listed then some of the content here may work, but unfortunately we can\'t make any guarantees. If you just aren\'t sure what sort of phone it is then make guess!</p>'
      }));
      options = new Options({
        devicetypes: devicetypes
      });
      window.options = options;
      devicetypeChooser = new DevicetypeChoiceView({
        model: options
      });
      $('#chooseDeviceModal').append(devicetypeChooser.$el);
      devicetypeLabelView = new OptionsDevicetypeLabelView({
        model: options
      });
      devicetypeLabelView.setElement($('#chooseDevicetype a'));
      devicetypeLabelView.render();
      entries = new EntryList();
      window.entries = entries;
      entryview = new EntryListView({
        model: entries
      });
      addView(entryview, 'All', 'entries');
      atomfile = kiosk.getAtomFile();
      loader.load(entries, atomfile);
      router.navigate("entries", {
        trigger: true
      });
      $(document).on('click', 'a', function(ev) {
        var href;
        $(this).removeClass("touch-active");
        clickFeedback();
        attract.active();
        ev.preventDefault();
        href = $(this).attr('href');
        console.log("click " + href);
        recorder.i('user.click', {
          href: href
        });
        if (href != null) {
          if (href.substring(0, 1) === '-') {
            if (href === '-chooseDevicetype') {
              chooseDevicetype();
            } else if (href === '-back') {
              router.back();
            } else if (href === '-info') {
              attract.show();
            } else if (href === '-menu') {
              console.log('pass -menu for zurb?');
              return true;
            } else {
              console.log("ignore click " + href);
            }
          } else {
            router.navigate(href, {
              trigger: true
            });
          }
        }
        return false;
      });
      $('.title-area .name').on('mousedown touchstart', function() {
        var arm, armed, reload, start, timer;
        attract.active();
        start = new Date().getTime();
        armed = [false];
        reload = function() {
          return location.reload();
        };
        arm = function() {
          recorder.i('user.reload');
          $('#reloadModal').foundation('reveal', 'open');
          armed[0] = true;
          return setInterval(reload, 5000);
        };
        timer = setInterval(arm, 5000);
        return $(document).one('mouseup touchend', function() {
          clearInterval(timer);
          if (armed[0]) {
            recorder.w('reload');
            return reload();
          }
        });
      });
      window.delayedNavigate = null;
      $(document).on('closed', '[data-reveal]', function() {
        var modal, url;
        modal = $(this).attr('id');
        console.log("closed " + modal);
        recorder.i('view.modal.closed', {
          id: modal
        });
        attract.active();
        if (modal === 'chooseDeviceModal' && (window.delayedNavigate != null)) {
          url = window.delayedNavigate;
          window.delayedNavigate = null;
          if (window.options.attributes.devicetype != null) {
            console.log("delayed navigate to " + url);
            return router.navigate(url, {
              trigger: true
            });
          } else {
            return console.log("chooseDeviceModal closed cancels delayed navigate to " + url);
          }
        }
      });
      $(document).on("touchstart mousedown", ".clickable, .button, .entry-option, .entry-option-step-help-button, .entry-option-help-button", function(ev) {
        var clear, el;
        touchFeedback();
        el = $(ev.currentTarget);
        el.addClass("touch-active");
        clear = function() {
          try {
            el.removeClass('touch-active');
            return console.log("clear touch-active");
          } catch (err) {
            return console.log("error clearing touch-active " + err);
          }
        };
        setTimeout(clear, 500);
        return true;
      });
      return $(document).on("click", ".clickable, .button, .entry-option, .entry-option-step-help-button, .entry-option-help-button", function(ev) {
        clickFeedback();
        return true;
      });
    }
  };

  SHORT_VIBRATE = 50;

  touchsound = kiosk.audioLoad("audio/click1.ogg", "audio/click1.mp3");

  canVibrate = true;

  touchFeedback = function() {
    if (!kiosk.vibrate(SHORT_VIBRATE)) {
      canVibrate = false;
      return touchsound.playclip();
    }
  };

  clickFeedback = function() {
    if (canVibrate) return touchsound.playclip();
  };

  window.clickFeedback = clickFeedback;

  module.exports = App;

}).call(this);
}, "attract": function(exports, require, module) {(function() {
  var ATTRACT_DELAY, AttractView, RESET_DELAY, active, currentAttract, kiosk, recorder, reset, resetTimer, showAttract, timer;

  AttractView = require('views/Attract');

  recorder = require('recorder');

  kiosk = require('kiosk');

  currentAttract = null;

  resetTimer = null;

  RESET_DELAY = 60000;

  reset = function() {
    resetTimer = null;
    if (kiosk.isKiosk()) {
      console.log("!!!reset!!!");
      recorder.i('app.reset');
      window.options.set({
        devicetype: null
      });
      if (window.views.length > 0) window.views[0].scrollTop = 0;
      return window.router.navigate("entries", {
        trigger: true
      });
    }
  };

  showAttract = function() {
    if ((currentAttract != null) && $(currentAttract.el).is(":visible")) {} else {
      if (currentAttract != null) {
        try {
          currentAttract.remove();
        } catch (error) {
          console.log("error re-showing attract: " + error);
        }
      }
      recorder.i('view.attract.show');
      currentAttract = new AttractView();
      $('#mainEntrylistHolder').after(currentAttract.el);
      $(currentAttract.el).trigger('isVisible');
      if (resetTimer != null) clearTimeout(resetTimer);
      return resetTimer = setTimeout(reset, RESET_DELAY);
    }
  };

  ATTRACT_DELAY = 60000;

  timer = setTimeout(showAttract, 1000);

  active = function() {
    clearTimeout(timer);
    timer = setTimeout(showAttract, ATTRACT_DELAY);
    if (resetTimer != null) {
      clearTimeout(resetTimer);
      return resetTimer = null;
    }
  };

  $(window).on('touchstart touchmove touchend mousedown mousemove mouseup', function() {
    active();
    return true;
  });

  $(window).on('scroll', function() {
    active();
    return true;
  });

  module.exports.active = active;

  module.exports.show = showAttract;

}).call(this);
}, "getter": function(exports, require, module) {(function() {
  var kiosk;

  kiosk = require('kiosk');

  module.exports.getGetUrl = function(entry, devicetype, nocache) {
    var baseurl, campaignid, enc, getscript, hix, ix, ssid, url, _ref;
    if (nocache == null) nocache = false;
    if (!kiosk.isKiosk()) nocache = true;
    enc = entry.attributes.enclosures[0];
    url = nocache ? enc.url : (_ref = enc.path) != null ? _ref : enc.url;
    url = kiosk.getPortableUrl(url);
    console.log("get " + entry.attributes.title + " as " + url + ", enc " + enc.path + "  / " + enc.url);
    baseurl = nocache && (entry.attributes.baseurl != null) ? entry.attributes.baseurl : window.location.href;
    hix = baseurl.indexOf('#');
    baseurl = hix >= 0 ? baseurl.substring(0, hix) : baseurl;
    ix = baseurl.lastIndexOf('/');
    baseurl = ix >= 0 ? baseurl.substring(0, ix + 1) : '';
    getscript = nocache ? 'get.php' : 'get';
    url = kiosk.getPortableUrl(baseurl + getscript) + '?' + 'u=' + encodeURIComponent(url) + '&t=' + encodeURIComponent(entry.attributes.title);
    if (enc.mime != null) url = url + '&m=' + encodeURIComponent(enc.mime);
    if (kiosk.isKiosk() && !nocache) {
      ssid = kiosk.getWifiSsid();
      url = url + '&n=' + encodeURIComponent(ssid);
    }
    campaignid = kiosk.getCampaignId();
    if ((campaignid != null) && campaignid !== '') {
      url = url + '&c=' + encodeURIComponent(campaignid);
    }
    console.log("Using helper page url " + url);
    return url;
  };

}).call(this);
}, "kiosk": function(exports, require, module) {(function() {
  var Entry, REDIRECT_LIFETIME_MS, asset_prefix, createsoundbite, fixaudiourl, getParameter, getPortOpt, getPortableUrl, html5_audiotypes, kiosk, localhost2_prefix, localhost_prefix, makeaudiourl, urlParams, vibrate, _ref, _ref2, _ref3, _ref4;

  Entry = require('models/Entry');

  kiosk = module.exports;

  module.exports.isKiosk = function() {
    return window.kiosk != null;
  };

  urlParams = null;

  getParameter = function(p) {
    var decode, match, pl, query, search;
    if (!(urlParams != null)) {
      pl = /\+/g;
      search = /([^&=]+)=?([^&]*)/g;
      decode = function(s) {
        return decodeURIComponent(s.replace(pl, " "));
      };
      query = window.location.search.substring(1);
      urlParams = {};
      while ((match = search.exec(query))) {
        urlParams[decode(match[1])] = decode(match[2]);
      }
    }
    return urlParams[p];
  };

  module.exports.getParameter = getParameter;

  module.exports.getLocalFilePrefix = function() {
    var _ref;
    return (_ref = window.kiosk) != null ? _ref.getLocalFilePrefix() : void 0;
  };

  module.exports.getCampaignId = function() {
    var _ref;
    return (_ref = window.kiosk) != null ? _ref.getCampaignId() : void 0;
  };

  module.exports.getAtomFile = function() {
    var atomfile, _ref, _ref2;
    if (window.kiosk != null) {
      return ((_ref = window.kiosk) != null ? _ref.getLocalFilePrefix() : void 0) + '/' + window.kiosk.getAtomFile();
    } else {
      return atomfile = (_ref2 = getParameter('f')) != null ? _ref2 : "default.xml";
    }
  };

  module.exports.getWifiSsid = function() {
    var _ref;
    return (_ref = window.kiosk) != null ? _ref.getWifiSsid() : void 0;
  };

  module.exports.getHostAddress = function() {
    if (window.kiosk != null) {
      return window.kiosk.getHostAddress();
    } else {
      return window.location.hostname;
    }
  };

  module.exports.registerMimeType = function(path, mime) {
    if (window.kiosk != null) return window.kiosk.registerMimeType(path, mime);
  };

  module.exports.registerMimetypeCompat = function(mime, device, compat) {
    if (window.kiosk != null) {
      return window.kiosk.registerMimetypeCompat(mime, device, JSON.stringify(compat));
    }
  };

  module.exports.getPort = function() {
    if (window.kiosk != null) {
      return window.kiosk.getPort();
    } else {
      return window.location.port;
    }
  };

  getPortOpt = function() {
    var port;
    port = module.exports.getPort();
    if (port != null) {
      if (port === 80) {
        return "";
      } else {
        return ":" + port;
      }
    } else {
      return "";
    }
  };

  vibrate = (_ref = navigator.vibrate) != null ? _ref : navigator.vibrate = (_ref2 = navigator.webkitVibrate) != null ? _ref2 : navigator.webkitVibrate = (_ref3 = navigator.mozVibrate) != null ? _ref3 : navigator.mozVibrate = (_ref4 = navigator.msVibrate) != null ? _ref4 : navigator.msVibrate = null;

  module.exports.vibrate = function(duration) {
    if (window.kiosk != null) {
      return window.kiosk.vibrate(duration);
    } else if (vibrate != null) {
      try {
        vibrate(duration);
      } catch (err) {
        console.log("vibrate error: " + err);
      }
      return true;
    } else {
      return false;
    }
  };

  module.exports.getUrlForPath = function(path) {
    return 'http://' + kiosk.getHostAddress() + getPortOpt() + path;
  };

  asset_prefix = 'file:///android_asset/';

  localhost_prefix = 'http://localhost';

  localhost2_prefix = 'http://127.0.0.1';

  module.exports.getPortableUrl = getPortableUrl = function(url) {
    var file_prefix, portOpt;
    if (window.kiosk != null) {
      portOpt = getPortOpt();
      kiosk = window.kiosk;
      if (url.indexOf(asset_prefix) === 0) {
        console.log("getPortableUrl for asset " + url);
        return 'http://' + kiosk.getHostAddress() + portOpt + '/a/' + url.substring(asset_prefix.length);
      } else if (url.indexOf('file:') === 0) {
        file_prefix = kiosk.getLocalFilePrefix() + '/';
        if (url.indexOf(file_prefix) === 0) {
          console.log("getPortableUrl for app file " + url);
          return 'http://' + kiosk.getHostAddress() + portOpt + '/f/' + url.substring(file_prefix.length);
        } else {
          console.log("Warning: file URL which does not match local file prefix: " + url);
          return url;
        }
      } else if (url.indexOf(localhost_prefix) === 0) {
        console.log("getPortableUrl for local url " + url);
        return 'http://' + kiosk.getHostAddress() + url.substring(localhost_prefix.length);
      } else if (url.indexOf(localhost2_prefix) === 0) {
        console.log("getPortableUrl for local url " + url);
        return 'http://' + kiosk.getHostAddress() + url.substring(localhost2_prefix.length);
      } else {
        return url;
      }
    } else {
      return url;
    }
  };

  REDIRECT_LIFETIME_MS = 60 * 60 * 1000;

  module.exports.getTempRedirect = function(url) {
    var redir;
    if (window.kiosk != null) {
      kiosk = window.kiosk;
      redir = kiosk.registerTempRedirect(url, REDIRECT_LIFETIME_MS);
      return "http://" + kiosk.getHostAddress() + getPortOpt() + redir;
    } else {
      console.log("getTempRedirect when not kiosk for " + url);
      return url;
    }
  };

  module.exports.registerRedirect = function(path, url) {
    if (window.kiosk != null) {
      kiosk = window.kiosk;
      return kiosk.registerRedirect(path, url, 0);
    } else {
      console.log("registerRedirect when not kiosk for " + url);
      return false;
    }
  };

  module.exports.registerExternalRedirect = function(host, path, url) {
    if (window.kiosk != null) {
      kiosk = window.kiosk;
      return kiosk.registerExternalRedirect(host, path, url, 0);
    } else {
      console.log("registerExternalRedirect when not kiosk for " + url);
      return false;
    }
  };

  module.exports.isCaptiveportal = function() {
    var active;
    if (!(window.kiosk != null)) return false;
    active = module.exports.getShared('captiveportal');
    if (!(active != null)) return false;
    return active;
  };

  module.exports.setShared = function(key, value) {
    if (!(window.kiosk != null)) {
      console.log("ignore setShared non-kiosk " + key + "=" + value);
      return;
    }
    if (!(value != null)) {
      return window.kiosk.setShared(key, 'JSON', 'null');
    } else if (typeof value === 'string') {
      return window.kiosk.setShared(key, 'STRING', value);
    } else {
      try {
        return window.kiosk.setShared(key, 'JSON', JSON.stringify(value));
      } catch (err) {
        return console.log("error setShared " + key + "=" + value + ": " + err);
      }
    }
  };

  module.exports.getShared = function(key) {
    var vs;
    if (!(window.kiosk != null)) {
      console.log("getShared non-kiosk " + key);
      return null;
    }
    vs = window.kiosk.getShared(key);
    console.log("getShared " + key + " -> " + vs);
    if (!(vs != null)) return null;
    if (vs.indexOf('STRING:') === 0) return vs.substring(7);
    try {
      return JSON.parse(vs.substring(vs.indexOf(':') + 1));
    } catch (err) {
      console.log("Error parsing shared " + key + "=" + vs + ": " + err);
    }
    return null;
  };

  module.exports.getCaptiveportalHostname = function() {
    if (!(window.kiosk != null)) return null;
    return window.kiosk.getCaptiveportalHostname();
  };

  module.exports.getQrCode = function(url) {
    var qrurl;
    return qrurl = window.kiosk != null ? 'http://localhost:8080/qr?url=' + encodeURIComponent(url) + '&size=150' : window.location.pathname === '/a/index.html' ? 'http://' + window.location.host + '/qr?url=' + encodeURIComponent(url) + '&size=150' : 'http://chart.apis.google.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl=' + encodeURIComponent(url);
  };

  module.exports.addKioskEntry = function(entries, atomurl, ineturl) {
    var baseurl, e, enc, entry, inetbaseurl, ix, path, url;
    console.log("add kiosk entry " + atomurl + " / " + ineturl);
    if (!(window.kiosk != null)) return null;
    baseurl = window.location.href;
    ix = baseurl.lastIndexOf('/');
    if (ix >= 0) baseurl = baseurl.substring(0, ix + 1);
    entry = {
      id: "tag:cmg@cs.nott.ac.uk,20140108:/ost/kiosk/self",
      title: "Kiosk View",
      iconurl: baseurl + "icons/kiosk.png",
      iconpath: baseurl + "icons/kiosk.png",
      summary: "Browse the same content directly on your device",
      baseurl: baseurl,
      thumbnails: [],
      requiresDevice: [],
      supportsMime: [],
      isKiosk: true
    };
    url = null;
    if (ineturl != null) {
      ix = ineturl.lastIndexOf('/');
      inetbaseurl = ineturl.slice(0, ix + 1);
      entry.baseurl = inetbaseurl;
      url = inetbaseurl + "index.html?f=" + encodeURIComponent(ineturl);
    }
    path = baseurl + "index.html?f=" + encodeURIComponent(getPortableUrl(atomurl));
    console.log("- kiosk entry expanded to " + url + " / " + path);
    enc = {
      url: url,
      mime: "text/html",
      path: path
    };
    entry.enclosures = [];
    entry.enclosures.push(enc);
    e = new Entry(entry);
    window.entries.add(e);
    console.log("added kiosk entry " + e.attributes.enclosures[0].url + " / " + e.attributes.enclosures[0].path);
    return e;
  };

  html5_audiotypes = {
    "mp3": "audio/mpeg",
    "mp4": "audio/mp4",
    "ogg": "audio/ogg",
    "wav": "audio/wav"
  };

  makeaudiourl = function(path) {
    var base, hi, si;
    if ((path.indexOf(':')) < 0) {
      base = window.location.href;
      hi = base.indexOf('#');
      if (hi >= 0) base = base.substring(0, hi);
      if ((path.indexOf('/')) === 0) {
        si = base.indexOf('//');
        si = si < 0 ? 0 : si + 2;
        si = base.indexOf('/', si);
        return (si < 0 ? base : base.substring(0, si)) + path;
      } else {
        si = base.lastIndexOf('/');
        return (si < 0 ? base + '/' : base.substring(0, si + 1)) + path;
      }
    } else {
      return path;
    }
  };

  fixaudiourl = function(path) {
    return makeaudiourl(path);
  };

  createsoundbite = function(sound) {
    var arg, html5audio, i, sourceel, type, url, _len;
    console.log("create soundeffect " + sound);
    html5audio = document.createElement('audio');
    if (html5audio.canPlayType) {
      for (i = 0, _len = arguments.length; i < _len; i++) {
        arg = arguments[i];
        sourceel = document.createElement('source');
        url = fixaudiourl(arguments[i]);
        sourceel.setAttribute('src', url);
        if (arguments[i].match(/\.(\w+)$/i)) {
          type = html5_audiotypes[RegExp.$1];
          sourceel.setAttribute('type', type);
        }
        console.log("- source " + arguments[i] + " = " + url + " " + type);
        html5audio.appendChild(sourceel);
      }
      html5audio.load();
      html5audio.playclip = function() {
        console.log("playclip " + sound + " state=" + html5audio.readyState + " currentTime=" + html5audio.currentTime + " duration=" + html5audio.duration + " paused=" + html5audio.paused);
        try {
          if (!html5audio.paused) html5audio.pause();
          html5audio.currentTime = 0;
          return html5audio.play();
        } catch (err) {
          return console.log("Error playing clip: " + err);
        }
      };
      return html5audio;
    } else {
      console.log("Could not create HTML5 audio");
      return function() {
        return false;
      };
    }
  };

  module.exports.audioLoad = function(path) {
    var url;
    if (window.kiosk != null) {
      url = makeaudiourl(path);
      window.kiosk.audioLoad(url);
      return {
        playclip: function() {
          return window.kiosk.audioPlay(url);
        }
      };
    }
    return createsoundbite(path);
  };

}).call(this);
}, "loader": function(exports, require, module) {(function() {
  var Devicetype, Entry, Mimetype, addDevice, addEntry, addMimetype, addShorturls, fixMimetypeIcons, getCacheFileMap, getCachePath, get_baseurl, kiosk, loadCache, loadDevices, loadEntries, loadMimetypes, loadShorturls, recorder;

  Entry = require('models/Entry');

  Mimetype = require('models/Mimetype');

  Devicetype = require('models/Devicetype');

  kiosk = require('kiosk');

  recorder = require('recorder');

  getCachePath = function(url, cacheFiles, prefix) {
    var file;
    if (url != null) {
      file = cacheFiles[url];
      if ((file != null) && (file.path != null)) {
        return prefix + file.path;
      } else {
        return null;
      }
    } else {
      return null;
    }
  };

  addEntry = function(entries, atomentry, atomurl, prefix, baseurl, cacheFiles) {
    var e, entry, iconpath, iconurl, id, summary, title;
    id = $('id', atomentry).text();
    title = $('title', atomentry).text();
    iconurl = $('link[rel=\'alternate\'][type^=\'image\']', atomentry).attr('href');
    if (!(iconurl != null)) console.log('iconurl unknown for ' + title);
    iconpath = getCachePath(iconurl, cacheFiles, prefix);
    summary = $('content', atomentry).text();
    entry = {
      id: id,
      title: title,
      iconurl: iconurl,
      iconpath: iconpath,
      summary: summary,
      baseurl: baseurl
    };
    entry.enclosures = [];
    $('link[rel=\'enclosure\']', atomentry).each(function(index, el) {
      var href, path, type;
      type = $(el).attr('type');
      href = $(el).attr('href');
      if (href != null) {
        path = getCachePath(href, cacheFiles, prefix);
        entry.enclosures.push({
          mime: type,
          url: href,
          path: path
        });
        if ((path != null) && (type != null)) {
          return kiosk.registerMimeType(path, type);
        }
      }
    });
    entry.requiresDevice = [];
    $('category[scheme=\'requires-device\']', atomentry).each(function(index, el) {
      var device;
      device = $(el).attr('term');
      if (device != null) return entry.requiresDevice.push(device);
    });
    entry.supportsMime = [];
    $('category[scheme=\'supports-mime-type\']', atomentry).each(function(index, el) {
      var label, mime, mt;
      mime = $(el).attr('term');
      label = $(el).attr('label');
      if (mime != null) {
        entry.supportsMime.push(mime);
        if (!((window.mimetypes.find(function(mt) {
          return mt.attributes.mime === mime;
        })) != null)) {
          console.log("add mimetype " + mime + " " + label);
          mt = {
            mime: mime,
            label: label,
            icon: iconpath != null ? iconpath : iconpath = iconurl
          };
          return window.mimetypes.add(new Mimetype(mt));
        }
      }
    });
    entry.thumbnails = [];
    $('thumbnail', atomentry).each(function(index, el) {
      var path, url;
      url = $(el).attr('url');
      if (url != null) {
        path = getCachePath(url, cacheFiles, prefix);
        return entry.thumbnails.push({
          url: url,
          path: path
        });
      }
    });
    $('category[scheme=\'visibility\']', atomentry).each(function(index, el) {
      var visibility;
      visibility = $(el).attr('term');
      if (visibility === 'hidden') {
        entry.hidden = true;
        return console.log('entry visibility ' + visibility + ' (hidden=' + entry.hidden + ' for ' + title);
      }
    });
    $('category', atomentry).each(function(index, el) {
      var scheme, term;
      term = $(el).attr('term');
      scheme = $(el).attr('scheme');
      return console.log('category ' + scheme + '=' + term);
    });
    e = new Entry(entry);
    entries.add(e);
    return e;
  };

  getCacheFileMap = function(cache) {
    var f, map, _i, _len, _ref;
    map = {};
    if (!(cache != null) || !(cache.files != null)) return map;
    _ref = cache.files;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      if (f.url != null) map[f.url] = f;
    }
    return map;
  };

  addDevice = function(devicename, deviceinfo) {
    var devicetype, _ref, _ref2, _ref3, _ref4, _ref5;
    devicetype = window.options.attributes.devicetypes.get(devicename);
    if (!(devicetype != null)) {
      console.log("Add device " + devicename);
      devicetype = new Devicetype({
        id: devicename,
        term: devicename,
        label: (_ref = deviceinfo.label) != null ? _ref : deviceinfo.label = devicename,
        supportsMime: (_ref2 = deviceinfo.supportsMime) != null ? _ref2 : deviceinfo.supportsMime = [],
        optionalSupportsMime: (_ref3 = deviceinfo.optionalSupportsMime) != null ? _ref3 : deviceinfo.optionalSupportsMime = [],
        helpHtml: (_ref4 = deviceinfo.helpHtml) != null ? _ref4 : deviceinfo.helpHtml = "Sorry, can't tell you much about device type " + devicename + ".",
        userAgentPattern: (_ref5 = deviceinfo.userAgentPattern) != null ? _ref5 : deviceinfo.userAgentPattern = null
      });
      return window.options.attributes.devicetypes.add(devicetype, {
        at: window.options.attributes.devicetypes.length - 1
      });
    } else {
      console.log("Update device " + devicename);
      if (deviceinfo.label != null) {
        devicetype.set({
          label: deviceinfo.label
        });
      }
      if (deviceinfo.supportsMime != null) {
        devicetype.set({
          supportsMime: deviceinfo.supportsMime
        });
      }
      if (deviceinfo.optionalSupportsMime != null) {
        devicetype.set({
          optionalSupportsMime: deviceinfo.optionalSupportsMime
        });
      }
      if (deviceinfo.label != null) {
        devicetype.set({
          helpHtml: deviceinfo.helpHtml
        });
      }
      if (deviceinfo.userAgentPattern != null) {
        return devicetype.set({
          userAgentPattern: deviceinfo.userAgentPattern
        });
      }
    }
  };

  loadDevices = function(entries, atomurl, prefix) {
    var devicesurl;
    devicesurl = prefix + 'devices.json';
    console.log("Loading devices info from " + devicesurl);
    return $.ajax({
      url: devicesurl,
      type: 'GET',
      dataType: 'json',
      timeout: 10000,
      success: function(data, textStatus, xhr) {
        var devicetype, dn, dtinfo;
        console.log("ok, got " + devicesurl);
        for (dn in data) {
          dtinfo = data[dn];
          addDevice(dn, dtinfo);
        }
        if (!kiosk.isKiosk()) {
          devicetype = window.options.getBrowserDevicetype();
          if (devicetype != null) {
            console.log('set non-kiosk devicetype to ' + devicetype.attributes.term);
            options.set({
              devicetype: devicetype
            });
          }
        }
        return loadMimetypes(entries, atomurl, prefix);
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log("error getting " + devicesurl + ": " + textStatus + ": " + errorThrown);
        return loadMimetypes(entries, atomurl, prefix);
      }
    });
  };

  addMimetype = function(mime, mtinfo) {
    var dt, dtcompat, mimetype, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _results, _results2;
    mimetype = window.mimetypes.get(mime);
    if (!(mimetype != null)) {
      console.log("Add mimetype " + mime);
      mimetype = new Mimetype({
        id: mime,
        icon: (_ref = mtinfo.icon) != null ? _ref : mtinfo.icon = 'icons/unknown.png',
        label: (_ref2 = mtinfo.label) != null ? _ref2 : mtinfo.label = mime,
        mime: mime,
        ext: (_ref3 = mtinfo.ext) != null ? _ref3 : mtinfo.ext = ((_ref4 = mtinfo.exts) != null ? _ref4.length : void 0) > 0 ? mtinfo.exts[0] : void 0,
        compat: mtinfo.compat
      });
      window.mimetypes.add(mimetype);
      if (mtinfo.compat != null) {
        _ref5 = mtinfo.compat;
        _results = [];
        for (dt in _ref5) {
          dtcompat = _ref5[dt];
          _results.push(kiosk.registerMimetypeCompat(mime, dt, dtcompat));
        }
        return _results;
      }
    } else {
      console.log("Update mimetype " + mime);
      if (!(mimetype.compat != null)) mimetype.compat = {};
      if (mtinfo.compat != null) {
        _ref6 = mtinfo.compat;
        _results2 = [];
        for (dt in _ref6) {
          dtcompat = _ref6[dt];
          if (mimetype.compat[dt] != null) {
            console.log("Update mimetype compatibility of " + mime + " with " + dt);
          }
          mimetype.compat[dt] = dtcompat;
          _results2.push(kiosk.registerMimetypeCompat(mime, dt, dtcompat));
        }
        return _results2;
      }
    }
  };

  loadMimetypes = function(entries, atomurl, prefix) {
    var mimetypesurl;
    mimetypesurl = prefix + 'mimetypes.json';
    console.log("Loading devices info from " + mimetypesurl);
    return $.ajax({
      url: mimetypesurl,
      type: 'GET',
      dataType: 'json',
      timeout: 10000,
      success: function(data, textStatus, xhr) {
        var mt, mtinfo;
        console.log("ok, got " + mimetypesurl);
        for (mt in data) {
          mtinfo = data[mt];
          addMimetype(mt, mtinfo);
        }
        return loadCache(entries, atomurl, prefix);
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log("error getting " + mimetypesurl + ": " + textStatus + ": " + errorThrown);
        return loadCache(entries, atomurl, prefix);
      }
    });
  };

  fixMimetypeIcons = function(cacheFiles, prefix) {
    return window.mimetypes.forEach(function(mt) {
      var iconpath;
      if (mt.attributes.icon != null) {
        iconpath = getCachePath(mt.attributes.icon, cacheFiles, prefix);
        if (iconpath != null) {
          console.log("Fix mimetype " + mt.attributes.mime + " icon " + mt.attributes.icon + " -> " + iconpath);
          return mt.attributes.icon = iconpath;
        }
      }
    });
  };

  loadCache = function(entries, atomurl, prefix) {
    var cacheurl;
    cacheurl = prefix + 'cache.json';
    console.log("Loading cache info from " + cacheurl);
    return $.ajax({
      url: cacheurl,
      type: 'GET',
      dataType: 'json',
      timeout: 10000,
      success: function(data, textStatus, xhr) {
        var cacheFiles;
        console.log('ok, got cache.json');
        cacheFiles = getCacheFileMap(data);
        fixMimetypeIcons(cacheFiles, prefix);
        return loadShorturls(entries, atomurl, prefix, data.baseurl, cacheFiles);
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log('error getting cache.json: ' + textStatus + ': ' + errorThrown);
        return loadShorturls(entries, atomurl, prefix, null, {});
      }
    });
  };

  addShorturls = function(sus, map) {
    var ix, su, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = sus.length; _i < _len; _i++) {
      su = sus[_i];
      if ((su.url != null) && (su.shorturl != null)) {
        map[su.url] = su.shorturl;
        if (su.shorturl.indexOf('http://') === 0) {
          ix = su.shorturl.indexOf('/', 7);
          if (ix > 7) {
            _results.push(kiosk.registerExternalRedirect(su.shorturl.substring(7, ix), su.shorturl.substring(ix), su.url));
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  loadShorturls = function(entries, atomurl, prefix, baseurl, cacheFiles) {
    var shorturlsurl;
    shorturlsurl = prefix + 'shorturls.json';
    console.log("Loading shorturls from " + shorturlsurl);
    return $.ajax({
      url: shorturlsurl,
      type: 'GET',
      dataType: 'json',
      timeout: 10000,
      success: function(data, textStatus, xhr) {
        console.log('ok, got shorturls.json');
        addShorturls(data, entries.shorturls);
        return loadEntries(entries, atomurl, prefix, baseurl, cacheFiles);
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log('error getting shorturls.json: ' + textStatus + ': ' + errorThrown);
        return loadEntries(entries, atomurl, prefix, baseurl, cacheFiles);
      }
    });
  };

  get_baseurl = function(data) {
    var baseurl, feedurl, ix;
    feedurl = $('link[rel=\'self\']', data).attr('href');
    if (!(feedurl != null)) {
      return null;
    } else {
      ix = feedurl.lastIndexOf('/');
      baseurl = feedurl.slice(0, ix + 1);
      console.log('Base URL = ' + baseurl);
      return baseurl;
    }
  };

  loadEntries = function(entries, atomurl, prefix, baseurl, cacheFiles) {
    console.log('loading entries from ' + atomurl);
    return $.ajax({
      url: atomurl,
      type: 'GET',
      dataType: 'xml',
      timeout: 10000,
      success: function(data, textStatus, xhr) {
        var feedbaseurl, feedurl;
        console.log('ok, got ' + data);
        feedbaseurl = get_baseurl(data);
        baseurl = feedbaseurl != null ? feedbaseurl : baseurl;
        feedurl = $('link[rel=\'self\']', data).attr('href');
        console.log("loadEntries " + atomurl + " self " + feedurl);
        kiosk.addKioskEntry(entries, atomurl, feedurl);
        return $(data).find('entry').each(function(index, el) {
          return addEntry(entries, el, atomurl, prefix, baseurl, cacheFiles);
        });
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log('error, ' + textStatus + ': ' + errorThrown);
        $('#atomfileErrorModal').foundation('reveal', 'open');
        return recorder.w('view.error.atomFileError', {
          atomurl: atomurl,
          status: textStatus,
          error: errorThrown
        });
      }
    });
  };

  module.exports.load = function(entries, atomurl) {
    var base, hi, prefix, si;
    if ((atomurl.indexOf(':')) < 0) {
      console.log('converting local name ' + atomurl + ' to global...');
      base = window.location.href;
      hi = base.indexOf('#');
      if (hi >= 0) base = base.substring(0, hi);
      if ((atomurl.indexOf('/')) === 0) {
        si = base.indexOf('//');
        si = si < 0 ? 0 : si + 2;
        si = base.indexOf('/', si);
        atomurl = (si < 0 ? base : base.substring(0, si)) + atomurl;
      } else {
        si = base.lastIndexOf('/');
        atomurl = (si < 0 ? base + '/' : base.substring(0, si + 1)) + atomurl;
      }
    }
    si = atomurl.lastIndexOf('/');
    prefix = si < 0 ? '' : atomurl.substring(0, si + 1);
    return loadDevices(entries, atomurl, prefix);
  };

}).call(this);
}, "models/Devicetype": function(exports, require, module) {(function() {
  var Devicetype;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  module.exports = Devicetype = (function() {

    __extends(Devicetype, Backbone.Model);

    function Devicetype() {
      Devicetype.__super__.constructor.apply(this, arguments);
    }

    Devicetype.prototype.defaults = {
      label: 'Default device type',
      supportsMime: [],
      optionalSupportsMime: []
    };

    Devicetype.prototype.supportsEntry = function(entry) {
      var enc, helper, mimetypes, self, supportedMime;
      console.log("check if " + this.attributes.term + " supports " + entry.attributes.title);
      mimetypes = (function() {
        var _i, _len, _ref, _results;
        _ref = entry.attributes.enclosures;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          enc = _ref[_i];
          _results.push(enc.mime);
        }
        return _results;
      })();
      self = this;
      supportedMime = _.find(mimetypes, function(mt) {
        return self.attributes.supportsMime.indexOf(mt) >= 0;
      });
      if (supportedMime != null) return true;
      helper = window.entries.find(function(entry) {
        var _ref;
        if (((_ref = entry.attributes.requiresDevice) != null ? _ref.indexOf(self.attributes.term) : void 0) >= 0) {
          supportedMime = _.find(mimetypes, function(mt) {
            return entry.attributes.supportsMime.indexOf(mt) >= 0;
          });
          return supportedMime != null;
        } else {
          return false;
        }
      });
      return helper != null;
    };

    Devicetype.prototype.getAppUrls = function(mimetype) {
      var appEntries, appUrls, entry, self;
      console.log("getAppUrls for " + mimetype + ":");
      self = this;
      appEntries = window.entries.filter(function(entry) {
        var supported, _ref;
        if (((_ref = entry.attributes.requiresDevice) != null ? _ref.indexOf(self.attributes.term) : void 0) >= 0) {
          supported = entry.attributes.supportsMime.indexOf(mimetype) >= 0;
          console.log("- entry " + entry.attributes.title + " " + supported);
          return supported;
        } else {
          return false;
        }
      });
      appUrls = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = appEntries.length; _i < _len; _i++) {
          entry = appEntries[_i];
          _results.push(entry.attributes.enclosures[0].url);
        }
        return _results;
      })();
      return appUrls;
    };

    return Devicetype;

  })();

}).call(this);
}, "models/DevicetypeList": function(exports, require, module) {(function() {
  var Devicetype, DevicetypeList;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Devicetype = require('models/Devicetype');

  module.exports = DevicetypeList = (function() {

    __extends(DevicetypeList, Backbone.Collection);

    function DevicetypeList() {
      DevicetypeList.__super__.constructor.apply(this, arguments);
    }

    DevicetypeList.prototype.model = Devicetype;

    return DevicetypeList;

  })();

}).call(this);
}, "models/Entry": function(exports, require, module) {(function() {
  var Entry;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  module.exports = Entry = (function() {

    __extends(Entry, Backbone.Model);

    function Entry() {
      this.checkDeviceCompatibility = __bind(this.checkDeviceCompatibility, this);
      this.checkMimetypeIcon = __bind(this.checkMimetypeIcon, this);
      Entry.__super__.constructor.apply(this, arguments);
    }

    Entry.prototype.defaults = {
      title: 'Unnamed entry',
      summary: 'A default entry',
      enclosures: [],
      supportsMime: [],
      requiresDevice: [],
      hidden: false
    };

    Entry.prototype.checkMimetypeIcon = function() {
      var enc, mimetypeicon, _i, _len, _ref, _ref2;
      if (this.attributes.mimetypeicon != null) {
        return this.attributes.mimetypeicon;
      }
      _ref = this.attributes.enclosures;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        enc = _ref[_i];
        if (!(enc.mime != null)) continue;
        mimetypeicon = (_ref2 = window.mimetypes.find(function(mt) {
          return mt.attributes.mime === enc.mime && (mt.attributes.icon != null);
        })) != null ? _ref2.attributes.icon : void 0;
        if (mimetypeicon != null) {
          console.log("found mimetypeicon for " + enc.mime + ": " + mimetypeicon);
          this.set({
            mimetypeicon: mimetypeicon
          });
          return this.attributes.mimetypeicon;
        }
        console.log("cannot find mimetype " + enc.mime);
      }
      return;
    };

    Entry.prototype.checkDeviceCompatibility = function() {
      var appsComplete, compat, dt, dtcompat, enc, mimetype, _i, _len, _ref, _ref2, _ref3;
      if (this.attributes.compat != null) return this.attributes.compat;
      compat = {};
      appsComplete = false;
      _ref = this.attributes.enclosures;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        enc = _ref[_i];
        if (!(enc.mime != null)) continue;
        console.log("Check device compat for type " + enc.mime);
        mimetype = window.mimetypes.get(enc.mime);
        if ((mimetype != null) && (mimetype.attributes.compat != null)) {
          _ref2 = mimetype.attributes.compat;
          for (dt in _ref2) {
            dtcompat = _ref2[dt];
            if (dtcompat.appsComplete === true) appsComplete = true;
            if (dtcompat.builtin === true) {
              compat[dt] = 'builtin';
            } else if (((_ref3 = dtcompat.apps) != null ? _ref3.length : void 0) > 0) {
              compat[dt] = 'app';
            } else if (!(dtcompat.builtin != null)) {
              compat[dt] = 'optional';
            }
          }
        } else {
          console.log("- could not find " + enc.mime + " compatibility, mimetype=" + (JSON.stringify(mimetype)));
        }
      }
      window.options.attributes.devicetypes.forEach(function(dt) {
        if (!(compat[dt.attributes.term] != null)) {
          if (appsComplete) {
            return compat[dt.attributes.term] = 'none';
          } else {
            return compat[dt.attributes.term] = 'unknown';
          }
        }
      });
      console.log("Initialise compatibility for " + this.attributes.title + " to " + (JSON.stringify(compat)));
      this.set({
        compat: compat
      });
      return this.attributes.compat;
    };

    return Entry;

  })();

}).call(this);
}, "models/EntryList": function(exports, require, module) {(function() {
  var Entry, EntryList;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Entry = require('models/Entry');

  module.exports = EntryList = (function() {

    __extends(EntryList, Backbone.Collection);

    function EntryList() {
      EntryList.__super__.constructor.apply(this, arguments);
    }

    EntryList.prototype.model = Entry;

    EntryList.prototype.shorturls = {};

    EntryList.prototype.getAppUrls = function(mimetype) {};

    return EntryList;

  })();

}).call(this);
}, "models/Mimetype": function(exports, require, module) {(function() {
  var Mimetype;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  module.exports = Mimetype = (function() {

    __extends(Mimetype, Backbone.Model);

    function Mimetype() {
      Mimetype.__super__.constructor.apply(this, arguments);
    }

    Mimetype.prototype.defaults = {
      icon: 'icons/unknown.png'
    };

    return Mimetype;

  })();

}).call(this);
}, "models/MimetypeList": function(exports, require, module) {(function() {
  var Mimetype, MimetypeList;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Mimetype = require('models/Mimetype');

  module.exports = MimetypeList = (function() {

    __extends(MimetypeList, Backbone.Collection);

    function MimetypeList() {
      MimetypeList.__super__.constructor.apply(this, arguments);
    }

    MimetypeList.prototype.model = Mimetype;

    return MimetypeList;

  })();

}).call(this);
}, "models/Options": function(exports, require, module) {(function() {
  var Options;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  module.exports = Options = (function() {

    __extends(Options, Backbone.Model);

    function Options() {
      Options.__super__.constructor.apply(this, arguments);
    }

    Options.prototype.defaults = {
      kioskmode: false,
      kiosk: false,
      devicetype: null
    };

    Options.prototype.getBrowserDevicetype = function() {
      var devicetype, userAgent;
      userAgent = navigator.userAgent;
      devicetype = this.attributes.devicetypes.find(function(dt) {
        var pat;
        if (dt.attributes.userAgentPattern != null) {
          pat = new RegExp(dt.attributes.userAgentPattern);
          if (pat.test(userAgent)) {
            console.log("host device seems to be " + dt.attributes.term + " (user agent: " + userAgent + ")");
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      });
      if (!(devicetype != null)) {
        console.log("host device unknown (user agent: " + userAgent + ")");
        devicetype = this.attributes.devicetypes.find(function(dt) {
          return dt.attributes.term === 'other';
        });
      }
      return devicetype;
    };

    return Options;

  })();

}).call(this);
}, "recorder": function(exports, require, module) {(function() {
  var log;

  log = function(level, event, info) {
    var jsoninfo;
    jsoninfo = null;
    if (info != null) {
      try {
        jsoninfo = JSON.stringify(info);
      } catch (error) {
        console.log("error stringifying log info " + info + ": " + error.message);
      }
    }
    if (window.kiosk != null) {
      return window.kiosk.record(level, event, jsoninfo);
    } else {
      return console.log("record: " + level + " " + event + " " + jsoninfo);
    }
  };

  module.exports.d = function(event, info) {
    return log(2, event, info);
  };

  module.exports.i = function(event, info) {
    return log(4, event, info);
  };

  module.exports.w = function(event, info) {
    return log(6, event, info);
  };

  module.exports.e = function(event, info) {
    return log(8, event, info);
  };

  $(window).on('touchstart', function(ev) {
    log(2, 'user.window.touchstart', {
      pageX: ev.pageX,
      pageY: ev.pageY
    });
    return true;
  });

  $(window).on('touchend', function(ev) {
    log(2, 'user.window.touchend', {
      pageX: ev.pageX,
      pageY: ev.pageY
    });
    return true;
  });

  $(window).on('mousedown', function(ev) {
    log(2, 'user.window.mousedown', {
      pageX: ev.pageX,
      pageY: ev.pageY
    });
    return true;
  });

  $(window).on('mouseup', function(ev) {
    log(2, 'user.window.mouseup', {
      pageX: ev.pageX,
      pageY: ev.pageY
    });
    return true;
  });

  $(window).on('scroll', function() {
    log(2, 'user.window.scroll', {
      scrollTop: $(window).scrollTop(),
      scrollLeft: $(window).scrollLeft()
    });
    return true;
  });

}).call(this);
}, "templates/Attract": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    
      __out.push('\n<canvas id="attractCanvas">\n</canvas>\n');
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/Consent": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    
      __out.push('\n<div class="row">\n  <div class="small-12 large-12 columns">\n    <div class="panel">\n      <img src="icons/uon_logo.png" class="consent-logo">\n      <p>This is a prototype being developed by the University of Nottingham.</p>\n      <p>Anonymous usage data is collected to allow us to understand how it is being used and how to improve it. To find out more look at the poster or leaflets nearby.</p>\n      <div class="clear-both"></div>\n    </div>\n  </div>\n</div>\n<div class="row button-row">\n  <div class="small-6 large-6 columns">\n    <a href="-consent-yes" class="button consent-button">OK, that\'s fine</a>\n  </div>\n  <div class="small-6 large-6 columns">\n    <a href="-consent-no" class="button consent-button">No thanks</a>\n  </div>\n</div>\n');
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/DevicetypeInChoice": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    
      __out.push('\n<div class="');
    
      __out.push(__sanitize(this.selected ? 'devicetype-selected' : 'devicetype-unselected'));
    
      __out.push(' devicetype clickable" id="');
    
      __out.push(__sanitize('devicetype-' + this.devicetype.term));
    
      __out.push('">\n  <div class="option-value-icon"><img class="" src="icons/');
    
      __out.push(__sanitize(this.selected ? 'cross.png' : 'emptybox.png'));
    
      __out.push('"></div>\n  ');
    
      __out.push(__sanitize(this.devicetype.label));
    
      __out.push('\n  <img src="icons/help.png" class="devicetype-help-button devicetype-help-show clickable" >\n  <img src="icons/help-down.png" class="devicetype-help-button devicetype-help-hide hide clickable" >\n</div>\n<div class="panel hide devicetype-help-panel" >');
    
      __out.push(this.devicetype.helpHtml);
    
      __out.push('<div class="clear-both"></div></div>\n\n');
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/EntryInList": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var compat, dt, _base, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
    
      __out.push('\n<div class="entry-in-list-button clickable">\n<a href="#" class="open">\n<div class="entry-in-list-title-holder"><h4 class="entry-in-list-title">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</h4></div>\n<div class="entry-in-list-icon">\n  <div class="dummy"></div>');
    
      __out.push('\n  <img src="');
    
      __out.push(__sanitize((_ref = this.iconpath) != null ? _ref : this.iconurl));
    
      __out.push('" class="entry-icon-image">\n  <div class="entry-in-list-compats">\n  ');
    
      _ref3 = ((_ref2 = this.compat) != null ? _ref2 : this.compat = {});
      for (dt in _ref3) {
        compat = _ref3[dt];
        __out.push('<!--\n    --><div class="entry-in-list-compat');
        __out.push(__sanitize(((_ref4 = window.options.attributes.devicetype) != null ? _ref4.attributes.term : void 0) === dt ? '-current' : ''));
        __out.push('"><!--\n      --><p>');
        __out.push(__sanitize((_ref5 = window.options.attributes.devicetypes.get(dt)) != null ? (_ref6 = (_base = _ref5.attributes).label) != null ? _ref6 : _base.label = dt : void 0));
        __out.push('</p><!--\n      --><img src="icons/');
        __out.push(__sanitize(compat === 'builtin' ? 'tick.png' : compat === 'optional' ? 'query.png' : compat === 'app' ? 'tick app.png' : compat === 'none' ? 'cross.png' : 'query app.png'));
        __out.push('"><!--\n    --></div><!--\n  -->');
      }
    
      __out.push('\n  </div>\n  ');
    
      if (this.mimetypeicon != null) {
        __out.push('\n    <div class="entry-in-list-mimetype">\n      <img src="');
        __out.push(__sanitize(this.mimetypeicon));
        __out.push('">\n    </div>\n  ');
      }
    
      __out.push('\n</div>\n</a>\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/EntryInfo": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var compat, dt, _base, _base2, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
    
      __out.push('\n<div class="small-12 large-12 columns">\n  <h1>');
    
      __out.push(__sanitize(this.entry.title));
    
      __out.push('</h1>\n');
    
      if (window.options.attributes.devicetype != null) {
        __out.push('\n');
        compat = this.entry.compat != null ? this.entry.compat[window.options.attributes.devicetype.attributes.term] : null;
        __out.push('\n');
        if (compat !== 'builtin') {
          __out.push('\n<div data-alert class="alert-box warning">\n  ');
          __out.push(__sanitize(compat === 'optional' ? 'This content may be supported on your device, or you may need to find and download an app to view it' : compat === 'app' ? 'You may need to download an app to view this content' : compat === 'none' ? 'This content is not probably not compatible with your device (see top of screen)' : 'This content may not be supported on your device, or you may need to find and download an app to view it'));
          __out.push('\n</div>\n');
        }
        __out.push('\n');
      }
    
      __out.push('\n</div>\n<div class="small-12 medium-6 large-6 columns">\n  <p>');
    
      __out.push(__sanitize(this.entry.summary));
    
      __out.push('</p> \n  <div class="entry-in-list-icon">\n    <div class="dummy"></div>');
    
      __out.push('\n    <img src="');
    
      __out.push(__sanitize((_ref = this.entry.iconpath) != null ? _ref : this.entry.iconurl));
    
      __out.push('"  class="entry-icon-image">\n  </div>\n</div>\n<div class="small-12 medium-6 large-6 columns">\n  <div class="entry-info-compats">\n    ');
    
      _ref3 = ((_ref2 = (_base = this.entry).compat) != null ? _ref2 : _base.compat = {});
      for (dt in _ref3) {
        compat = _ref3[dt];
        __out.push('<!--\n    --><div class="entry-in-list-compat');
        __out.push(__sanitize(((_ref4 = window.options.attributes.devicetype) != null ? _ref4.attributes.term : void 0) === dt ? '-current' : ''));
        __out.push('"><!--\n      --><p>');
        __out.push(__sanitize((_ref5 = window.options.attributes.devicetypes.get(dt)) != null ? (_ref6 = (_base2 = _ref5.attributes).label) != null ? _ref6 : _base2.label = dt : void 0));
        __out.push('</p><!--\n      --><img src="icons/');
        __out.push(__sanitize(compat === 'builtin' ? 'tick.png' : compat === 'optional' ? 'query.png' : compat === 'app' ? 'tick app.png' : compat === 'none' ? 'cross.png' : 'query app.png'));
        __out.push('"><!--\n    --></div><!--\n  -->');
      }
    
      __out.push('\n    ');
    
      if (this.entry.mimetypeicon != null) {
        __out.push('\n      <div class="entry-info-mimetype">\n        <img src="');
        __out.push(__sanitize(this.entry.mimetypeicon));
        __out.push('">\n      </div>\n    ');
      }
    
      __out.push('\n  </div>\n');
    
      if (this.optionPreview) {
        __out.push('\n  <div class="entry-option option-view">Preview\n    <img src="icons/help.png" class="entry-option-help-button help-option-view">\n    <img src="icons/help-down.png" class="entry-option-help-button help-option-view hide">\n  </div>\n  <div class="panel help-option-view hide">\n    <p>Have a look before you download anything.<p>\n  </div>\n');
      } else {
        __out.push('\n  <div class="entry-option disabled">Sorry, cannot preview this\n  </div>\n');
      }
    
      __out.push('\n');
    
      if (this.optionSendInternet) {
        __out.push('\n  <div class="entry-option option-send-internet">Send over Internet\n    <img src="icons/help.png" class="entry-option-help-button help-option-send-internet">\n    <img src="icons/help-down.png" class="entry-option-help-button help-option-send-internet hide">\n  </div>\n  <div class="panel help-option-send-internet hide">\n    <p>Download this content onto your phone using your own mobile data connection.<p>\n    <!--<p class="text-right">Find out more...<img src="icons/help.png" class="entry-option-more-help-button more-help-option-send-internet"></p>-->\n  </div>\n');
      }
    
      __out.push('\n');
    
      if (this.optionSendCache) {
        __out.push('\n  <div class="entry-option option-send-cache">Send locally\n    <img src="icons/help.png" class="entry-option-help-button help-option-send-cache">\n    <img src="icons/help-down.png" class="entry-option-help-button help-option-send-cache hide">\n  </div>\n  <div class="panel help-option-send-cache hide">\n    <p>Download this content onto your phone using a direct WiFi connection.<p>\n    <!--<p class="text-right">Find out more...<img src="icons/help.png" class="entry-option-more-help-button more-help-option-send-cache"></p>-->\n  </div>\n');
      }
    
      __out.push('\n');
    
      if (this.optionGet) {
        __out.push('\n  <div class="entry-option option-get">Get on this device\n    <img src="icons/help.png" class="entry-option-help-button help-option-get">\n    <img src="icons/help-down.png" class="entry-option-help-button help-option-get hide">\n  </div>\n  <div class="panel help-option-get hide">\n    <p>Download this content on this device.<p>\n  </div>\n');
      }
    
      __out.push('\n</div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/EntryListHelp": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    
      __out.push('\n<div class="entry-list-help-top"></div>\n<div class="row">\n  <div class="small-6 large-6 columns">\n    <p class="text-centre"><img class="help-scroll-vertical" src="icons/scroll-vertical-hint.png">Drag to scroll up and down</p>\n  </div>\n  <div class="small-6 large-6 columns">\n    <p class="text-centre">Touch an item to find out more</p>\n  </div>\n</div>\n<div class="entry-list-help-info"><a href="-info" class="clickable"><img src="icons/information.png"></a></div>\n<div class="entry-list-help-ok">\n  <a href="-back" class="button">OK</a>\n</div>\n\n');
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/EntryPreview": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var thumbnail, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5;
    
      __out.push('\n<div class="small-12 large-12 columns">\n  <h1>Preview: ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</h1>\n</div>\n<!-- clearing  \n<div class="small-12 medium-6 large-6 columns">\n  <ul class="preview-thumbnails" data-clearing>\n    ');
    
      _ref = this.thumbnails;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        thumbnail = _ref[_i];
        __out.push('\n    <li>\n      <a href="');
        __out.push(__sanitize((_ref2 = thumbnail.path) != null ? _ref2 : thumbnail.url));
        __out.push('">\n        <img src="');
        __out.push(__sanitize((_ref3 = thumbnail.path) != null ? _ref3 : thumbnail.url));
        __out.push('" alt="thumbnail">\n      </a>\n    </li>\n    ');
      }
    
      __out.push('\n  </ul> \n</div> -->\n<div class="small-12 medium-6 large-6 columns">\n  <!-- orbit -->\n  <ul class="preview-thumbnails" style="height:600px" data-orbit \n      data-options="animation:slide;animation_speed:1000;pause_on_hover:true;navigation_arrows:true;bullets:true;">\n    ');
    
      _ref4 = this.thumbnails;
      for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
        thumbnail = _ref4[_j];
        __out.push('\n    <li>\n      <img src="');
        __out.push(__sanitize((_ref5 = thumbnail.path) != null ? _ref5 : thumbnail.url));
        __out.push('" width="400" height="600" alt="thumbnail">\n    </li>\n    ');
      }
    
      __out.push('\n  </ul> \n</div>\n<div class="small-12 medium-6 large-6 columns">\n  <!-- placeholder --> \n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/EntrySendCache": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var compat;
    
      __out.push('<div class="small-12 large-12 columns">\n  <h1>');
    
      __out.push(__sanitize(this.entry.title));
    
      __out.push('</h1>\n');
    
      if (window.options.attributes.devicetype != null) {
        __out.push('\n');
        compat = this.entry.compat != null ? this.entry.compat[window.options.attributes.devicetype.attributes.term] : null;
        __out.push('\n');
        if (compat !== 'builtin') {
          __out.push('\n<div data-alert class="alert-box warning">\n  ');
          __out.push(__sanitize(compat === 'optional' ? 'This content may be supported on your device, or you may need to find and download an app to view it' : compat === 'app' ? 'You may need to download an app to view this content' : compat === 'none' ? 'This content is not probably not compatible with your device (see top of screen)' : 'This content may not be supported on your device, or you may need to find and download an app to view it'));
          __out.push('\n</div>\n');
        }
        __out.push('\n');
      }
    
      __out.push('\n  <div class="row" help-section="join wifi">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info"><span class="option-step">1</span>\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Join this Wifi Network:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-url">');
    
      __out.push(__sanitize(this.ssid));
    
      __out.push('</p>\n    </div>\n    <div class="small-12 medium-5 large-5 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>You can get this content directly from this device using its own WiFi network.</p>\n        <p>Note: if you want to install a QR code reader from the Internet then do that first (see the next step).<p>\n        <p>Use the settings on your phone or tablet to search for WiFi networks; find the one called <span class="ssid">');
    
      __out.push(__sanitize(this.ssid));
    
      __out.push('</span> and join it. Within about 10 seconds you should have joined the network.</p>\n        <p>If you are unable to find or join this WiFi network then you will have to try downloading over the Internet - go back and choose that option.</p>\n      </div>\n    </div>\n  </div>    \n\n  <div class="row" help-section="enter url">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info"><span class="option-step">2</span>\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Either (a) enter this URL in your web browser, all on one line:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-url">');
    
      __out.push(__sanitize(this.geturl));
    
      __out.push('</p>\n    </div>\n    <div class="small-12 medium-5 large-5 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>Typing this URL into your phone\'s web browser is just the same as scanning the QR code.</p>\n        <p>Note: type it all together on one line, even it is appears split here. There are no spaces in it.</p>\n      </div>\n    </div>\n  </div>    \n\n  <div class="row" help-section="scan qr">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info">\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Or (b) scan this QR-code:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-qrcode"><img src="');
    
      __out.push(__sanitize(this.qrurl));
    
      __out.push('" alt="qrcode for item"></p>\n    </div>\n    <div class="small-12 medium-5 large-5 columns">\n      <div class="panel hide entry-option-step-panel">\n        ');
    
      __out.push(this.templateQRCodeHelp(this));
    
      __out.push('\n        <p>Note that you CANNOT access the app store or download new apps while you are connected to this device\'s WiFi network. You will have to disconnect from it and connect to the Internet.\n      </div>\n    </div>\n  </div>    \n\n  <div class="row" help-section="wait">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info"><span class="option-step">3</span>\n        In a few seconds you should see a simple web page with a link to this content.\n      </p>\n    </div>\n  </div>\n\n  <div class="row" help-section="disconnect wifi">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info">\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        <span class="option-step">4</span>\n        Disconnect from this device\'s WiFi network when you have the content you want.\n      </p>\n    </div>\n    <div class="small-12 medium-5 large-5 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>This may be called "forgetting" or deleting this network on your phone\'s WiFi settings.</p>\n        <p>If you don\'t do this then your phone may keep connecting to this WiFi network and you will not able to access the Internet while you are near this device.</p>\n      </div>\n    </div>\n  </div>\n</div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/EntrySendInternet": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var compat;
    
      __out.push('\n<div class="small-12 large-12 columns">\n  <h1>');
    
      __out.push(__sanitize(this.entry.title));
    
      __out.push('</h1>\n');
    
      if (window.options.attributes.devicetype != null) {
        __out.push('\n');
        compat = this.entry.compat != null ? this.entry.compat[window.options.attributes.devicetype.attributes.term] : null;
        __out.push('\n');
        if (compat !== 'builtin') {
          __out.push('\n<div data-alert class="alert-box warning">\n  ');
          __out.push(__sanitize(compat === 'optional' ? 'This content may be supported on your device, or you may need to find and download an app to view it' : compat === 'app' ? 'You may need to download an app to view this content' : compat === 'none' ? 'This content is not probably not compatible with your device (see top of screen)' : 'This content may not be supported on your device, or you may need to find and download an app to view it'));
          __out.push('\n</div>\n');
        }
        __out.push('\n');
      }
    
      __out.push('\n  <div class="row" help-section="enable internet">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info"><span class="option-step">1</span>\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Enable internet access\n        <div class="clear-both"></div>\n      </p>\n    </div>\n    <div class="small-12 medium-5 large-5 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>If you can access the internet on your phone or tablet at the moment then move to the next step.</p>\n        <p>If your phone or tablet has WiFi and you know and trust a network here then connect to that now.</p>\n        <p>If you have a data contract that you are happy to use (and a SIM, if you are using a tablet) then check that the signal strength is OK. If you cannot get a signal here then you may not be able to use the Internet - try WiFi instead.</p>\n      </div>\n    </div>\n  </div>    \n\n  <div class="row" help-section="enter url">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info"><span class="option-step">2</span>\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Either (a) enter this URL in your web browser, all on one line:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-url">');
    
      __out.push(__sanitize(this.geturl));
    
      __out.push('</p>\n    </div>\n    <div class="small-12 medium-5 large-5 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>Typing this URL into your phone\'s web browser is just the same as scanning the QR code.</p>\n        <p>Note: type it all together on one line, even it is appears split here. There are no spaces in it.</p>\n      </div>\n    </div>\n  </div>    \n\n  <div class="row" help-section="scan qr">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info">\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Or (b) scan this QR-code:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-qrcode"><img src="');
    
      __out.push(__sanitize(this.qrurl));
    
      __out.push('" alt="qrcode for item"></p>\n    </div>\n    <div class="small-12 medium-5 large-5 columns">\n      <div class="panel hide entry-option-step-panel">\n        ');
    
      __out.push(this.templateQRCodeHelp(this));
    
      __out.push('\n      </div>\n    </div>\n  </div>    \n\n  <div class="row" help-section="wait">\n    <div class="small-12 medium-7 large-7 columns">\n      <p class="option-info"><span class="option-step">3</span>\n        In a few seconds you should see a simple web page with a link to this content.\n      </p>\n    </div>\n  </div>\n</div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/QRCodeHelp": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var _ref, _ref2, _ref3;
    
      __out.push('        <p>You need a scanning app on your phone or tablet to scan this "QR Code" - it is just the same as the web link below.</p>\n');
    
      if (((_ref = this.devicetype) != null ? _ref.attributes.term : void 0) === 'ios') {
        __out.push('\n        <p>If you don\'t have a scanner already try searching in the app store for "QR Reader" - at least some apps are free. Note that you will need Internet access to download a new app.</p>\n');
      } else if (((_ref2 = this.devicetype) != null ? _ref2.attributes.term : void 0) === 'android') {
        __out.push('\n        <p>If you don\'t have a scanner already try searching in google play for "ZXing" - their app is good and free. Note that you will need Internet access to download a new app.</p>\n');
      } else if (((_ref3 = this.devicetype) != null ? _ref3.attributes.term : void 0) === 'windowsphone') {
        __out.push('\n        <p>If you don\'t have a scanner already try searching in the app store "QR" - at least some apps are free. Note that you will need Internet access to download a new app.</p>\n');
      } else {
        __out.push('\n        <p>If you don\'t have a scanner app already try searching in your device\'s app store for "QR"; hopefully there will be a free app! Note that you will need Internet access to download a new app.</p>\n');
      }
    
      __out.push('\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "views/Attract": function(exports, require, module) {(function() {
  var AttractView, SLIDE_INTERVAL, TRANSITION_DURATION, data, images, queue, recorder, slide, slides, templateAttract;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateAttract = require('templates/Attract');

  recorder = require('recorder');

  createjs.Ticker.timingMode = createjs.Ticker.RAF;

  createjs.Ticker.setFPS(40);

  slides = [
    [
      {
        text: "Do you have a\nsmart phone or\ntablet?",
        x: 50,
        y: 50,
        font: "100px Arial,sans-serif"
      }, {
        bitmap: "icons/example_android.png",
        height: 700,
        x: 500,
        y: 300
      }
    ], [
      {
        text: "Get free digital\nleaflets and other\ndownloads here",
        x: 50,
        y: 350,
        font: "100px Arial,sans-serif"
      }
    ], [
      {
        text: "Touch the screen\n to start...",
        x: 50,
        y: 700,
        font: "bold 110px Arial,sans-serif"
      }, {
        bitmap: "icons/pointing hand dark.png",
        height: 700,
        x: 250,
        y: 0
      }
    ], [
      {
        text: "Download straight\nto your phone\nusing WiFi or 3G",
        x: 50,
        y: 50,
        font: "100px Arial,sans-serif"
      }
    ], [
      {
        text: "View downloads,\nand take them away\nwith you",
        x: 50,
        y: 350,
        font: "100px Arial,sans-serif"
      }
    ], [
      {
        text: "Downloads have been\ncarefully selected\nfor you",
        x: 30,
        y: 650,
        font: "90px Arial,sans-serif"
      }
    ]
  ];

  queue = new createjs.LoadQueue(true);

  images = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = slides.length; _i < _len; _i++) {
      slide = slides[_i];
      _results.push((function() {
        var _j, _len2, _results2;
        _results2 = [];
        for (_j = 0, _len2 = slide.length; _j < _len2; _j++) {
          data = slide[_j];
          if (data.bitmap != null) {
            _results2.push({
              src: data.bitmap
            });
          }
        }
        return _results2;
      })());
    }
    return _results;
  })();

  console.log("images to load: " + (JSON.stringify(images)));

  queue.loadManifest(_.flatten(images));

  TRANSITION_DURATION = 300;

  SLIDE_INTERVAL = 3500;

  module.exports = AttractView = (function() {

    __extends(AttractView, Backbone.View);

    function AttractView() {
      this.remove = __bind(this.remove, this);
      this.resize = __bind(this.resize, this);
      this.template = __bind(this.template, this);
      this.render = __bind(this.render, this);
      this.nextSlide = __bind(this.nextSlide, this);
      AttractView.__super__.constructor.apply(this, arguments);
    }

    AttractView.prototype.tagName = 'div';

    AttractView.prototype.className = 'attract-modal';

    AttractView.prototype.initialize = function() {
      this.render();
      if (queue.loaded) {
        console.log('queue already loaded on create attract');
        return this.initStage();
      } else {
        return queue.on('complete', this.initStage, this);
      }
    };

    AttractView.prototype.initStage = function() {
      var bounds, data, o, obj, qi, slide, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
      console.log('initStage');
      this.stage = new createjs.Stage($('canvas', this.$el).get(0));
      createjs.Ticker.addEventListener("tick", this.stage);
      for (_i = 0, _len = slides.length; _i < _len; _i++) {
        slide = slides[_i];
        slide.show = new createjs.Timeline();
        slide.show.loop = false;
        slide.show.setPaused(true);
        slide.hide = new createjs.Timeline();
        slide.hide.loop = false;
        slide.hide.setPaused(true);
        for (_j = 0, _len2 = slide.length; _j < _len2; _j++) {
          data = slide[_j];
          obj = data.text != null ? (o = new createjs.Text(data.text), o.font = (_ref = data.font) != null ? _ref : data.font = '100px sans-serif', o) : data.bitmap ? (qi = queue.getResult(data.bitmap), console.log("queue item " + data.bitmap + " = " + qi), o = new createjs.Bitmap(qi), bounds = o.getBounds(), (data.width != null) && (data.height != null) ? o.scaleX = o.scaleY = Math.min(data.width / bounds.width, data.height / bounds.height) : data.width != null ? o.scaleX = o.scaleY = data.width / bounds.width : data.height != null ? o.scaleX = o.scaleY = data.height / bounds.height : void 0, o) : (console.log('Unknown attract item ' + JSON.stringify(data)), null);
          if (obj != null) {
            obj.color = (_ref2 = data.font) != null ? _ref2 : data.font = '#000';
            obj.x = (_ref3 = data.x) != null ? _ref3 : data.x = 500;
            obj.y = (_ref4 = data.y) != null ? _ref4 : data.y = 500;
            obj.visible = false;
            this.stage.addChild(obj);
            data.obj = obj;
            slide.show.addTween(createjs.Tween.get(obj).to({
              visible: true,
              alpha: 0,
              x: data.text != null ? obj.x - 1000 : obj.x + 1000
            }).to({
              visible: true,
              alpha: 1,
              x: obj.x
            }, TRANSITION_DURATION, createjs.Ease.quadOut));
            slide.hide.addTween(createjs.Tween.get(obj).to({
              alpha: 1,
              visible: true
            }).to({
              alpha: 0,
              visible: false
            }, TRANSITION_DURATION));
          }
        }
      }
      slides[0].show.setPosition(0);
      slides[0].show.setPaused(false);
      this.slideIx = 0;
      this.timer = setInterval(this.nextSlide, SLIDE_INTERVAL);
      return this.stage.update();
    };

    AttractView.prototype.nextSlide = function() {
      slides[this.slideIx].show.setPaused(true);
      slides[this.slideIx].hide.setPosition(0);
      slides[this.slideIx].hide.setPaused(false);
      this.slideIx = this.slideIx + 1 >= slides.length ? 0 : this.slideIx + 1;
      slides[this.slideIx].show.setPosition(0);
      return slides[this.slideIx].show.setPaused(false);
    };

    AttractView.prototype.render = function() {
      data = {};
      this.$el.html(this.template(data));
      $(window).on('resize', this.resize);
      return this;
    };

    AttractView.prototype.template = function(d) {
      return templateAttract(d);
    };

    AttractView.prototype.events = {
      'click': 'close',
      'mousedown': 'close',
      'touchstart': 'close',
      'isVisible': 'resize'
    };

    AttractView.prototype.resize = function() {
      var $canvasel, ph, pw, size;
      console.log('attract resize...');
      pw = this.$el.width();
      ph = this.$el.height();
      size = pw > ph ? ph : pw;
      console.log("keepMaxSquare: size=" + size);
      $canvasel = $('canvas', this.$el);
      $canvasel.css('height', size + 'px');
      $canvasel.css('width', size + 'px');
      $canvasel.css('top', (ph - size) / 2 + 'px');
      $canvasel.css('left', (pw - size) / 2 + 'px');
      this.stage.scaleX = size / 1000;
      this.stage.scaleY = size / 1000;
      this.stage.canvas.height = size;
      this.stage.canvas.width = size;
      return this.stage.update();
    };

    AttractView.prototype.close = function(ev) {
      this.remove();
      return false;
    };

    AttractView.prototype.remove = function() {
      if (window.clickFeedback != null) window.clickFeedback();
      recorder.i('view.attract.hide');
      console.log('close/remove Attract');
      this.$el.remove();
      $(window).off('resize', this.resize);
      queue.off('complete', this.initStage, this);
      createjs.Ticker.removeEventListener("tick", this.stage);
      clearInterval(this.timer);
      return window.router.navigate("consent", {
        trigger: true
      });
    };

    return AttractView;

  })();

}).call(this);
}, "views/Consent": function(exports, require, module) {(function() {
  var ConsentView, attract, recorder, templateConsent;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateConsent = require('templates/Consent');

  recorder = require('recorder');

  attract = require('attract');

  module.exports = ConsentView = (function() {

    __extends(ConsentView, Backbone.View);

    function ConsentView() {
      this.template = __bind(this.template, this);
      ConsentView.__super__.constructor.apply(this, arguments);
    }

    ConsentView.prototype.tagName = 'div';

    ConsentView.prototype.className = 'consent-modal';

    ConsentView.prototype.initialize = function() {
      return this.render();
    };

    ConsentView.prototype.render = function() {
      var data;
      data = {};
      this.$el.html(this.template(data));
      return this;
    };

    ConsentView.prototype.template = function(d) {
      return templateConsent(d);
    };

    ConsentView.prototype.events = {
      'click [href=-consent-yes]': 'consentYes',
      'click [href=-consent-no]': 'consentNo'
    };

    ConsentView.prototype.close = function(ev) {
      window.router.back();
      return false;
    };

    ConsentView.prototype.consentYes = function() {
      if (window.clickFeedback != null) window.clickFeedback();
      recorder.i('user.consent.yes');
      return this.close();
    };

    ConsentView.prototype.consentNo = function() {
      if (window.clickFeedback != null) window.clickFeedback();
      recorder.i('user.consent.no');
      return attract.show();
    };

    return ConsentView;

  })();

}).call(this);
}, "views/DevicetypeChoice": function(exports, require, module) {(function() {
  var DevicetypeChoiceView, attract, recorder, templateDevicetypeInChoice;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateDevicetypeInChoice = require('templates/DevicetypeInChoice');

  recorder = require('recorder');

  attract = require('attract');

  module.exports = DevicetypeChoiceView = (function() {

    __extends(DevicetypeChoiceView, Backbone.View);

    function DevicetypeChoiceView() {
      this.selectDevice = __bind(this.selectDevice, this);
      this.help = __bind(this.help, this);
      this.helpHide = __bind(this.helpHide, this);
      this.render = __bind(this.render, this);
      DevicetypeChoiceView.__super__.constructor.apply(this, arguments);
    }

    DevicetypeChoiceView.prototype.tagName = 'div';

    DevicetypeChoiceView.prototype.className = 'devicetype-list';

    DevicetypeChoiceView.prototype.initialize = function() {
      this.listenTo(this.model.attributes.devicetypes, 'add', this.render);
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    DevicetypeChoiceView.prototype.render = function() {
      var dterm, list, _ref;
      dterm = (_ref = this.model.attributes.devicetype) != null ? _ref.attributes.term : void 0;
      console.log("render DevicetypeChoice " + dterm);
      list = this.$el;
      list.empty();
      this.model.attributes.devicetypes.forEach(function(devicetype) {
        var viewel;
        viewel = templateDevicetypeInChoice({
          devicetype: devicetype.attributes,
          selected: dterm === devicetype.attributes.term
        });
        return list.append(viewel);
      });
      return this;
    };

    DevicetypeChoiceView.prototype.events = {
      'click .devicetype': 'selectDevice',
      'click .devicetype-help-show': 'help',
      'click .devicetype-help-hide': 'helpHide'
    };

    DevicetypeChoiceView.prototype.helpHide = function() {
      attract.active();
      $('.devicetype-help-panel', this.$el).addClass('hide');
      $('.devicetype-help-show', this.$el).removeClass('hide');
      $('.devicetype-help-hide', this.$el).addClass('hide');
      return false;
    };

    DevicetypeChoiceView.prototype.help = function(ev) {
      var dtel, term;
      this.helpHide();
      dtel = $(ev.target).parents('.devicetype');
      $('.devicetype-help-button', dtel).toggleClass('hide');
      dtel.next('.panel').removeClass('hide');
      term = dtel.get(0).id;
      if (term.substring(0, 'devicetype-'.length) === 'devicetype-') {
        term = term.substring('devicetype-'.length);
      }
      recorder.i('user.requestHelp.devicetype', {
        term: term
      });
      return false;
    };

    DevicetypeChoiceView.prototype.selectDevice = function(ev) {
      var devicetype, term;
      attract.active();
      term = ev.currentTarget.id;
      if (term.substring(0, 'devicetype-'.length) === 'devicetype-') {
        term = term.substring('devicetype-'.length);
      }
      devicetype = this.model.attributes.devicetypes.find((function(dt) {
        return (dt != null ? dt.attributes.term : void 0) === term;
      }));
      if (devicetype != null) {
        console.log("select device " + term + " = " + (devicetype != null ? devicetype.attributes.label : void 0));
        this.model.set({
          devicetype: devicetype
        });
        recorder.i('user.selectDevice', {
          term: term,
          label: devicetype.attributes.label
        });
      } else {
        console.log("select unknown device " + term);
      }
      return $('#chooseDeviceModal').foundation('reveal', 'close');
    };

    return DevicetypeChoiceView;

  })();

}).call(this);
}, "views/EntryInList": function(exports, require, module) {(function() {
  var EntryInListView, recorder, templateEntryInList;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntryInList = require('templates/EntryInList');

  recorder = require('recorder');

  module.exports = EntryInListView = (function() {

    __extends(EntryInListView, Backbone.View);

    function EntryInListView() {
      this.view = __bind(this.view, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      EntryInListView.__super__.constructor.apply(this, arguments);
    }

    EntryInListView.prototype.tagName = 'div';

    EntryInListView.prototype.className = 'entry-in-list';

    EntryInListView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    EntryInListView.prototype.template = function(d) {
      return templateEntryInList(d);
    };

    EntryInListView.prototype.render = function() {
      if (!(this.model.attributes.mimetypeicon != null)) {
        this.model.checkMimetypeIcon();
      }
      if (!(this.model.attributes.compat != null)) {
        this.model.checkDeviceCompatibility();
      }
      console.log("render EntryInList " + this.model.attributes.title);
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    EntryInListView.prototype.view = function(ev) {
      if (window.clickFeedback != null) window.clickFeedback();
      console.log('view ' + this.model.id);
      recorder.i('user.selectEntry', {
        id: this.model.id,
        title: this.model.attributes.title
      });
      window.router.navigate('entry/' + encodeURIComponent(this.model.id), {
        trigger: true
      });
      ev.preventDefault();
      return false;
    };

    EntryInListView.prototype.events = {
      'click': 'view'
    };

    return EntryInListView;

  })();

}).call(this);
}, "views/EntryInfo": function(exports, require, module) {(function() {
  var EntryInfoView, attract, getter, kiosk, recorder, templateEntryInfo;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntryInfo = require('templates/EntryInfo');

  getter = require('getter');

  kiosk = require('kiosk');

  recorder = require('recorder');

  attract = require('attract');

  module.exports = EntryInfoView = (function() {

    __extends(EntryInfoView, Backbone.View);

    function EntryInfoView() {
      this.optionSendCache = __bind(this.optionSendCache, this);
      this.optionSendInternet = __bind(this.optionSendInternet, this);
      this.optionGet = __bind(this.optionGet, this);
      this.optionView = __bind(this.optionView, this);
      this.helpOptionGet = __bind(this.helpOptionGet, this);
      this.helpOptionSendCache = __bind(this.helpOptionSendCache, this);
      this.helpOptionSendInternet = __bind(this.helpOptionSendInternet, this);
      this.helpOptionView = __bind(this.helpOptionView, this);
      this.helpOption = __bind(this.helpOption, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      EntryInfoView.__super__.constructor.apply(this, arguments);
    }

    EntryInfoView.prototype.tagName = 'div';

    EntryInfoView.prototype.className = 'entry-info row';

    EntryInfoView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(window.options, 'change:devicetype', this.render);
      return this.render();
    };

    EntryInfoView.prototype.template = function(d) {
      return templateEntryInfo(d);
    };

    EntryInfoView.prototype.render = function() {
      var data, path, url, _ref, _ref2;
      url = (_ref = _.find(this.model.attributes.enclosures, function(enc) {
        return enc.url != null;
      })) != null ? _ref.url : void 0;
      path = (_ref2 = _.find(this.model.attributes.enclosures, function(enc) {
        return enc.path != null;
      })) != null ? _ref2.path : void 0;
      console.log("render EntryInfo " + this.model.id + " " + this.model.attributes.title + " url=" + url + " path=" + path);
      data = {
        entry: this.model.attributes,
        optionGet: !kiosk.isKiosk(),
        optionSendInternet: url != null,
        optionSendCache: (path != null) && kiosk.isKiosk(),
        optionPreview: this.model.attributes.thumbnails.length > 0
      };
      this.$el.html(this.template(data));
      return this;
    };

    EntryInfoView.prototype.events = {
      'click .help-option-view': 'helpOptionView',
      'click .help-option-send-internet': 'helpOptionSendInternet',
      'click .help-option-send-cache': 'helpOptionSendCache',
      'click .help-option-get': 'helpOptionGet',
      'click .option-view': 'optionView',
      'click .option-get': 'optionGet',
      'click .option-send-internet': 'optionSendInternet',
      'click .option-send-cache': 'optionSendCache'
    };

    EntryInfoView.prototype.click = function() {
      if (window.clickFeedback != null) return window.clickFeedback();
    };

    EntryInfoView.prototype.helpOption = function(name) {
      var b, offset;
      this.click();
      attract.active();
      recorder.i('user.requestHelp.option', {
        option: name
      });
      $(".help-option-" + name, this.$el).toggleClass('hide');
      b = $(".help-option-" + name, this.$el).get(1);
      if (!$(b).hasClass('hide')) {
        offset = $(b).offset();
        recorder.d('app.scroll', {
          scrollTop: offset.top,
          scrollLeft: 0
        });
        window.scrollTo(0, offset.top);
      }
      return false;
    };

    EntryInfoView.prototype.helpOptionView = function() {
      return this.helpOption('view');
    };

    EntryInfoView.prototype.helpOptionSendInternet = function() {
      return this.helpOption('send-internet');
    };

    EntryInfoView.prototype.helpOptionSendCache = function() {
      return this.helpOption('send-cache');
    };

    EntryInfoView.prototype.helpOptionGet = function() {
      return this.helpOption('get');
    };

    EntryInfoView.prototype.optionView = function() {
      this.click();
      attract.active();
      recorder.i('user.option.view', {
        id: this.model.id
      });
      console.log("option:view entry " + this.model.id);
      return window.router.navigate("preview/" + (encodeURIComponent(this.model.id)), {
        trigger: true
      });
    };

    EntryInfoView.prototype.optionGet = function() {
      var devicetype, url, _ref;
      this.click();
      attract.active();
      console.log("option:get entry " + this.model.id);
      devicetype = window.options.getBrowserDevicetype();
      if ((window.options.attributes.devicetype != null) && window.options.attributes.devicetype !== devicetype) {
        console.log("Warning: browser device type is not selected device type (" + (devicetype != null ? devicetype.attributes.term : void 0) + " vs " + ((_ref = window.options.devicetype) != null ? _ref.attributes.term : void 0));
        devicetype = window.options.attributes.devicetype;
      }
      url = getter.getGetUrl(this.model, devicetype);
      recorder.i('user.option.get', {
        id: this.model.id,
        devicetype: devicetype.attributes.term,
        url: url
      });
      return window.open(url, 'get');
    };

    EntryInfoView.prototype.optionSendInternet = function() {
      this.click();
      attract.active();
      recorder.i('user.option.sendInternet', {
        id: this.model.id
      });
      console.log("option:send(internet) entry " + this.model.id);
      return window.router.navigate("sendInternet/" + (encodeURIComponent(this.model.id)), {
        trigger: true
      });
    };

    EntryInfoView.prototype.optionSendCache = function() {
      this.click();
      attract.active();
      recorder.i('user.option.sendCache', {
        id: this.model.id
      });
      console.log("option:send(cache) entry " + this.model.id);
      return window.router.navigate("sendCache/" + (encodeURIComponent(this.model.id)), {
        trigger: true
      });
    };

    return EntryInfoView;

  })();

}).call(this);
}, "views/EntryList": function(exports, require, module) {(function() {
  var EntryInListView, EntryListView, recorder;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  EntryInListView = require('views/EntryInList');

  recorder = require('recorder');

  module.exports = EntryListView = (function() {

    __extends(EntryListView, Backbone.View);

    function EntryListView() {
      this.showHelp = __bind(this.showHelp, this);
      this.add = __bind(this.add, this);
      this.render = __bind(this.render, this);
      EntryListView.__super__.constructor.apply(this, arguments);
    }

    EntryListView.prototype.tagName = 'div';

    EntryListView.prototype.className = 'entry-list';

    EntryListView.prototype.initialize = function() {
      this.listenTo(this.model, 'add', this.add);
      return this.listenTo(window.options, 'change:devicetype', this.render);
    };

    EntryListView.prototype.render = function() {
      var views, _ref;
      console.log("EntryListView render (devicetype " + ((_ref = window.options.attributes.devicetype) != null ? _ref.attributes.term : void 0) + ")");
      this.$el.empty();
      views = [];
      this.model.forEach(this.add);
      return this;
    };

    EntryListView.prototype.views = [];

    EntryListView.prototype.add = function(entry, entrylist) {
      var view;
      if (!entry.attributes.hidden) {
        console.log("EntryListView add " + entry.attributes.id);
        view = new EntryInListView({
          model: entry
        });
        this.$el.append(view.$el);
        return this.views.push(view);
      }
    };

    EntryListView.prototype.events = {
      'click .floating-help-button': 'showHelp'
    };

    EntryListView.prototype.showHelp = function() {
      recorder.i('user.requestHelp.floatingHelp');
      console.log("EntryList help...");
      return window.router.navigate('help', {
        trigger: true
      });
    };

    return EntryListView;

  })();

}).call(this);
}, "views/EntryListHelp": function(exports, require, module) {(function() {
  var EntryListView, attract, recorder, templateEntryListHelp;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntryListHelp = require('templates/EntryListHelp');

  recorder = require('recorder');

  attract = require('attract');

  module.exports = EntryListView = (function() {

    __extends(EntryListView, Backbone.View);

    function EntryListView() {
      this.remove = __bind(this.remove, this);
      this.template = __bind(this.template, this);
      this.render = __bind(this.render, this);
      EntryListView.__super__.constructor.apply(this, arguments);
    }

    EntryListView.prototype.tagName = 'div';

    EntryListView.prototype.className = 'entry-list-help';

    EntryListView.prototype.initialize = function() {
      return this.render();
    };

    EntryListView.prototype.render = function() {
      var backHelp, data, deviceHelp;
      data = {};
      this.$el.html(this.template(data));
      this.extraEls = [];
      backHelp = $('<p class="help-below-left-align"><img src="icons/label-below-right.png" class="help-label"><span>Touch to go back</span></p>');
      $('#back').append(backHelp);
      this.extraEls.push(backHelp);
      deviceHelp = $('<p class="help-below-right-align"><span>Identify your phone</span><img src="icons/label-below-left.png" class="help-label"></p>');
      $('#chooseDevicetype').append(deviceHelp);
      this.extraEls.push(deviceHelp);
      return this;
    };

    EntryListView.prototype.template = function(d) {
      return templateEntryListHelp(d);
    };

    EntryListView.prototype.events = {
      'click .entry-list-help-info': 'showAttract',
      'click': 'close'
    };

    EntryListView.prototype.showAttract = function() {
      if (window.clickFeedback != null) window.clickFeedback();
      recorder.i('user.requestHelp.info');
      return attract.show();
    };

    EntryListView.prototype.close = function(ev) {
      if (window.clickFeedback != null) window.clickFeedback();
      ev.preventDefault();
      window.router.back();
      return false;
    };

    EntryListView.prototype.remove = function() {
      console.log('close/remove EntryListHelp');
      Backbone.View.prototype.remove.apply(this);
      this.$el.remove();
      $('#back .help-below-left-align').remove();
      return $('#chooseDevicetype .help-below-right-align').remove();
    };

    return EntryListView;

  })();

}).call(this);
}, "views/EntryPreview": function(exports, require, module) {(function() {
  var EntryPreviewView, templateEntryPreview;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntryPreview = require('templates/EntryPreview');

  module.exports = EntryPreviewView = (function() {

    __extends(EntryPreviewView, Backbone.View);

    function EntryPreviewView() {
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      EntryPreviewView.__super__.constructor.apply(this, arguments);
    }

    EntryPreviewView.prototype.tagName = 'div';

    EntryPreviewView.prototype.className = 'entry-preview row';

    EntryPreviewView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    EntryPreviewView.prototype.template = function(d) {
      return templateEntryPreview(d);
    };

    EntryPreviewView.prototype.render = function() {
      console.log("render EntryPreview " + this.model.id + " " + this.model.attributes.title);
      this.$el.html(this.template(this.model.attributes));
      this.$el.foundation({
        orbit: {
          variable_height: false,
          next_on_click: true
        },
        clearing: {}
      });
      return this;
    };

    return EntryPreviewView;

  })();

}).call(this);
}, "views/EntrySendCache": function(exports, require, module) {(function() {
  var EntrySendCacheView, attract, getter, kiosk, recorder, templateEntrySendCache, templateQRCodeHelp;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntrySendCache = require('templates/EntrySendCache');

  templateQRCodeHelp = require('templates/QRCodeHelp');

  getter = require('getter');

  kiosk = require('kiosk');

  attract = require('attract');

  recorder = require('recorder');

  module.exports = EntrySendCacheView = (function() {

    __extends(EntrySendCacheView, Backbone.View);

    function EntrySendCacheView() {
      this.help = __bind(this.help, this);
      this.helpHide = __bind(this.helpHide, this);
      this.render = __bind(this.render, this);
      EntrySendCacheView.__super__.constructor.apply(this, arguments);
    }

    EntrySendCacheView.prototype.tagName = 'div';

    EntrySendCacheView.prototype.className = 'entry-send-cache row';

    EntrySendCacheView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(window.options, 'change:devicetype', this.render);
      return this.render();
    };

    EntrySendCacheView.prototype.template = function(d) {
      return templateEntrySendCache(d);
    };

    EntrySendCacheView.prototype.render = function() {
      var capiveportalHostname, captiveportal, data, fullurl, geturl, item, nocache, path, qrgeturl, qrpath, qrrecenturl, qrurl, recentpath, recenturl, _base, _ref, _ref2;
      console.log("render EntrySendCache " + this.model.id + " " + this.model.attributes.title);
      captiveportal = kiosk.isCaptiveportal();
      console.log("captiveportal (send cache) = " + captiveportal);
      nocache = captiveportal && !((_ref = (_base = this.model.attributes).isKiosk) != null ? _ref : _base.isKiosk = false);
      fullurl = getter.getGetUrl(this.model, window.options.attributes.devicetype, nocache);
      item = {
        url: fullurl + '&recent',
        title: this.model.attributes.title
      };
      kiosk.setShared('sendCacheItem', item);
      path = '/';
      recentpath = '/recent';
      recenturl = kiosk.getUrlForPath(recentpath);
      if (kiosk.registerRedirect(path, recenturl)) {
        if (captiveportal) {
          capiveportalHostname = kiosk.getCaptiveportalHostname();
          geturl = "http://" + capiveportalHostname + path;
        } else {
          geturl = kiosk.getUrlForPath(path);
        }
      } else {
        geturl = recenturl;
      }
      qrpath = '/qr';
      qrrecenturl = recenturl + '?qr';
      if (kiosk.registerRedirect(qrpath, qrrecenturl)) {
        qrgeturl = kiosk.getUrlForPath(qrpath);
      } else {
        qrgeturl = qrrecenturl;
      }
      qrurl = kiosk.getQrCode(qrgeturl);
      data = {
        templateQRCodeHelp: templateQRCodeHelp,
        entry: this.model.attributes,
        geturl: geturl,
        qrurl: qrurl,
        devicetype: window.options.attributes.devicetype,
        ssid: (_ref2 = kiosk.getWifiSsid()) != null ? _ref2 : "??"
      };
      this.$el.html(this.template(data));
      return this;
    };

    EntrySendCacheView.prototype.events = {
      'click .entry-option-step-show': 'help',
      'click .entry-option-step-hide': 'helpHide'
    };

    EntrySendCacheView.prototype.click = function() {
      if (window.clickFeedback != null) return window.clickFeedback();
    };

    EntrySendCacheView.prototype.helpHide = function() {
      this.click();
      attract.active();
      $('.entry-option-step-panel', this.$el).addClass('hide');
      $('.entry-option-step-show', this.$el).removeClass('hide');
      $('.entry-option-step-hide', this.$el).addClass('hide');
      return false;
    };

    EntrySendCacheView.prototype.help = function(ev) {
      var dtel, offset;
      this.click();
      attract.active();
      $('.entry-option-step-panel', this.$el).addClass('hide');
      offset = $(ev.target).offset();
      $('.entry-option-step-show', this.$el).removeClass('hide');
      $('.entry-option-step-hide', this.$el).addClass('hide');
      dtel = $(ev.target).parents('.row').first();
      recorder.i('user.requestHelp.sendCache', {
        section: $(dtel).attr('help-section')
      });
      $('.entry-option-step-help-button', dtel).toggleClass('hide');
      $('.entry-option-step-panel', dtel).removeClass('hide');
      recorder.d('app.scroll', {
        scrollTop: offset.top,
        scrollLeft: 0
      });
      window.scrollTo(0, offset.top);
      return false;
    };

    return EntrySendCacheView;

  })();

}).call(this);
}, "views/EntrySendInternet": function(exports, require, module) {(function() {
  var EntrySendInternetView, attract, getter, kiosk, recorder, templateEntrySendInternet, templateQRCodeHelp;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntrySendInternet = require('templates/EntrySendInternet');

  templateQRCodeHelp = require('templates/QRCodeHelp');

  getter = require('getter');

  kiosk = require('kiosk');

  attract = require('attract');

  recorder = require('recorder');

  module.exports = EntrySendInternetView = (function() {

    __extends(EntrySendInternetView, Backbone.View);

    function EntrySendInternetView() {
      this.help = __bind(this.help, this);
      this.helpHide = __bind(this.helpHide, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      EntrySendInternetView.__super__.constructor.apply(this, arguments);
    }

    EntrySendInternetView.prototype.tagName = 'div';

    EntrySendInternetView.prototype.className = 'entry-send-internet row';

    EntrySendInternetView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(window.options, 'change:devicetype', this.render);
      return this.render();
    };

    EntrySendInternetView.prototype.template = function(d) {
      return templateEntrySendInternet(d);
    };

    EntrySendInternetView.prototype.render = function() {
      var data, fullurl, geturl, qrfullurl, qrgeturl, qrurl, _ref, _ref2;
      console.log("render EntrySendInternet " + this.model.id + " " + this.model.attributes.title);
      fullurl = getter.getGetUrl(this.model, window.options.attributes.devicetype, true);
      geturl = (_ref = window.entries.shorturls[fullurl]) != null ? _ref : fullurl;
      qrfullurl = fullurl + '&qr';
      qrgeturl = (_ref2 = window.entries.shorturls[qrfullurl]) != null ? _ref2 : qrfullurl;
      qrurl = kiosk.getQrCode(qrgeturl);
      data = {
        templateQRCodeHelp: templateQRCodeHelp,
        entry: this.model.attributes,
        geturl: geturl,
        qrurl: qrurl,
        devicetype: window.options.attributes.devicetype
      };
      this.$el.html(this.template(data));
      return this;
    };

    EntrySendInternetView.prototype.events = {
      'click .entry-option-step-show': 'help',
      'click .entry-option-step-hide': 'helpHide'
    };

    EntrySendInternetView.prototype.click = function() {
      if (window.clickFeedback != null) return window.clickFeedback();
    };

    EntrySendInternetView.prototype.helpHide = function() {
      this.click();
      attract.active();
      $('.entry-option-step-panel', this.$el).addClass('hide');
      $('.entry-option-step-show', this.$el).removeClass('hide');
      $('.entry-option-step-hide', this.$el).addClass('hide');
      return false;
    };

    EntrySendInternetView.prototype.help = function(ev) {
      var dtel, offset;
      this.click();
      attract.active();
      $('.entry-option-step-panel', this.$el).addClass('hide');
      offset = $(ev.target).offset();
      $('.entry-option-step-show', this.$el).removeClass('hide');
      $('.entry-option-step-hide', this.$el).addClass('hide');
      dtel = $(ev.target).parents('.row').first();
      recorder.i('user.requestHelp.sendInternet', {
        section: $(dtel).attr('help-section')
      });
      $('.entry-option-step-help-button', dtel).toggleClass('hide');
      $('.entry-option-step-panel', dtel).removeClass('hide');
      recorder.d('app.scroll', {
        scrollTop: offset.top,
        scrollLeft: 0
      });
      window.scrollTo(0, offset.top);
      return false;
    };

    return EntrySendInternetView;

  })();

}).call(this);
}, "views/OptionsDevicetypeLabel": function(exports, require, module) {(function() {
  var OptionsDevicetypeLabelView;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  module.exports = OptionsDevicetypeLabelView = (function() {

    __extends(OptionsDevicetypeLabelView, Backbone.View);

    function OptionsDevicetypeLabelView() {
      this.render = __bind(this.render, this);
      OptionsDevicetypeLabelView.__super__.constructor.apply(this, arguments);
    }

    OptionsDevicetypeLabelView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    OptionsDevicetypeLabelView.prototype.render = function() {
      if (this.model.attributes.devicetype != null) {
        return this.$el.text('For ' + this.model.attributes.devicetype.attributes.label + ' (change...)');
      } else {
        return this.$el.text('Unspecified device (change...)');
      }
    };

    return OptionsDevicetypeLabelView;

  })();

}).call(this);
}});
