
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
  var App, Devicetype, DevicetypeChoiceView, DevicetypeList, Entry, EntryInfoView, EntryList, EntryListHelpView, EntryListView, EntryPreviewView, EntrySendCacheView, EntrySendInternetView, Mimetype, MimetypeList, Options, OptionsDevicetypeLabelView, Router, addView, chooseDevicetype, kiosk, loader, popView, testentry1;
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

  loader = require('loader');

  kiosk = require('kiosk');

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
    return window.scrollTo(0, 0);
  };

  popView = function() {
    var v, view;
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
        window.scrollTo(0, v.scrollTop);
      }
    } else {
      console.log("no scrollTop found");
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
      "sendCache/:eid": "sendCache"
    };

    Router.prototype.back = function() {
      var bcas, href;
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
      _results = [];
      while (window.views.length > 1) {
        _results.push(popView());
      }
      return _results;
    };

    Router.prototype.help = function() {
      var v, view;
      if (window.views.length === 0) {
        return console.log("cannot show help - no initial view");
      } else {
        v = window.views[window.views.length - 1];
        view = new EntryListHelpView();
        addView(view, "Help", "entries/help");
        v.scrollTop = 0;
        return v.$el.show();
      }
    };

    Router.prototype.getEntry = function(id) {
      var entry, _ref;
      entry = (_ref = window.entries) != null ? _ref.get(id) : void 0;
      if (!(entry != null)) {
        console.log("Could not find entry " + id);
        $('#entryNotFoundModal').foundation('reveal', 'open');
        return null;
      } else {
        return entry;
      }
    };

    Router.prototype.entry = function(id) {
      var entry, view;
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
      mimetypes.add(new Mimetype({
        mime: "application/pdf",
        ext: "pdf",
        icon: "icons/pdf.png",
        label: "PDF"
      }));
      mimetypes.add(new Mimetype({
        mime: "text/html",
        ext: "html",
        icon: "icons/html.png",
        label: "HTML"
      }));
      mimetypes.add(new Mimetype({
        mime: "application/vnd.android.package-archive",
        ext: "apk",
        icon: "icons/get_it_on_google_play.png",
        label: "Android app"
      }));
      mimetypes.add(new Mimetype({
        mime: "application/x-itunes-app",
        icon: "icons/available_on_the_app_store.png",
        label: "iPhone app"
      }));
      devicetypes = new DevicetypeList();
      devicetypes.add(new Devicetype({
        term: "ios",
        label: "iPhone",
        userAgentPattern: '(iPhone)|(iPod)|(iPad)',
        supportsMime: ["text/html", "application/x-itunes-app"],
        helpHtml: '<p><img class="devicetype-help-image" src="icons/example_ios.png">There are several different models of iPhone, all sold by Apple, but they are all broadly compatible. You should also use this option if you have an iPad, iPad mini or iPod Touch.</p>'
      }));
      devicetypes.add(new Devicetype({
        term: "windowsphone",
        label: "Windows Phone",
        supportsMime: ["text/html"],
        helpHtml: '<p><img class="devicetype-help-image" src="icons/example_windowsphone.png">Windows phones include newer Nokia smart phones, and also specific phones made by HTC, Samsung and others. Windows Phones have a distinctive square tile-based interface.</p>'
      }));
      devicetypes.add(new Devicetype({
        term: "android",
        label: "Android",
        userAgentPattern: 'Android',
        supportsMime: ["text/html", "application/vnd.android.package-archive"],
        helpHtml: '<p><img class="devicetype-help-image" src="icons/example_android.png">There are many different Android phones and tablets, including devices made by Google, Samsung, Motorola, HTC, Sony Ericsson and Asus (some Nexus).</p>'
      }));
      devicetypes.add(new Devicetype({
        term: "other",
        label: "Other Device",
        supportsMime: ["text/html"],
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
        ev.preventDefault();
        href = $(this).attr('href');
        console.log("click " + href);
        if (href != null) {
          if (href.substring(0, 1) === '-') {
            if (href === '-chooseDevicetype') {
              chooseDevicetype();
            } else if (href === '-back') {
              router.back();
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
        start = new Date().getTime();
        armed = [false];
        reload = function() {
          return location.reload();
        };
        arm = function() {
          $('#reloadModal').foundation('reveal', 'open');
          armed[0] = true;
          return setInterval(reload, 5000);
        };
        timer = setInterval(arm, 5000);
        return $(document).one('mouseup touchend', function() {
          clearInterval(timer);
          if (armed[0]) return reload();
        });
      });
      window.delayedNavigate = null;
      return $(document).on('closed', '[data-reveal]', function() {
        var modal, url;
        modal = $(this).attr('id');
        console.log("closed " + modal);
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
    }
  };

  module.exports = App;

}).call(this);
}, "getter": function(exports, require, module) {(function() {
  var kiosk;

  kiosk = require('kiosk');

  module.exports.getGetUrl = function(entry, devicetype, nocache) {
    var app, apps, baseurl, enc, hix, ix, ssid, url, _i, _len, _ref;
    if (nocache == null) nocache = false;
    enc = entry.attributes.enclosures[0];
    url = nocache ? enc.url : (_ref = enc.path) != null ? _ref : enc.url;
    url = kiosk.getPortableUrl(url);
    console.log("get " + entry.attributes.title + " as " + url + ", enc " + enc.path + "  / " + enc.url);
    apps = devicetype != null ? devicetype.getAppUrls(enc.mime) : void 0;
    if (apps == null) apps = [];
    if (!(devicetype != null) || (devicetype != null ? devicetype.attributes.term : void 0) === 'other') {
      apps.push('');
    }
    baseurl = nocache && (entry.attributes.baseurl != null) ? entry.attributes.baseurl : window.location.href;
    hix = baseurl.indexOf('#');
    baseurl = hix >= 0 ? baseurl.substring(0, hix) : baseurl;
    ix = baseurl.lastIndexOf('/');
    baseurl = ix >= 0 ? baseurl.substring(0, ix + 1) : '';
    url = kiosk.getPortableUrl(baseurl + 'get.html') + '?' + 'u=' + encodeURIComponent(url) + '&t=' + encodeURIComponent(entry.attributes.title);
    for (_i = 0, _len = apps.length; _i < _len; _i++) {
      app = apps[_i];
      url = url + '&a=' + encodeURIComponent(kiosk.getPortableUrl(app));
    }
    if (kiosk.isKiosk() && !nocache) {
      ssid = kiosk.getWifiSsid();
      url = url + '&n=' + encodeURIComponent(ssid);
    }
    console.log("Using helper page url " + url);
    return url;
  };

}).call(this);
}, "kiosk": function(exports, require, module) {(function() {
  var Entry, REDIRECT_LIFETIME_MS, asset_prefix, getParameter, kiosk, localhost2_prefix, localhost_prefix, urlParams;

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

  module.exports.getPort = function() {
    if (window.kiosk != null) {
      return window.kiosk.getPort();
    } else {
      return window.location.port;
    }
  };

  asset_prefix = 'file:///android_asset/';

  localhost_prefix = 'http://localhost';

  localhost2_prefix = 'http://127.0.0.1';

  module.exports.getPortableUrl = function(url) {
    var file_prefix;
    if (window.kiosk != null) {
      kiosk = window.kiosk;
      if (url.indexOf(asset_prefix) === 0) {
        console.log("getPortableUrl for asset " + url);
        return 'http://' + kiosk.getHostAddress() + ':' + kiosk.getPort() + '/a/' + url.substring(asset_prefix.length);
      } else if (url.indexOf('file:') === 0) {
        file_prefix = kiosk.getLocalFilePrefix() + '/';
        if (url.indexOf(file_prefix) === 0) {
          console.log("getPortableUrl for app file " + url);
          return 'http://' + kiosk.getHostAddress() + ':' + kiosk.getPort() + '/f/' + url.substring(file_prefix.length);
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
      return "http://" + kiosk.getHostAddress() + ":" + kiosk.getPort() + redir;
    } else {
      console.log("getTempRedirect when not kiosk for " + url);
      return url;
    }
  };

  module.exports.getQrCode = function(url) {
    var qrurl;
    return qrurl = window.kiosk != null ? 'http://localhost:8080/qr?url=' + encodeURIComponent(url) + '&size=150' : window.location.pathname === '/a/index.html' ? 'http://' + window.location.host + '/qr?url=' + encodeURIComponent(url) + '&size=150' : 'http://chart.apis.google.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl=' + encodeURIComponent(url);
  };

  module.exports.addKioskEntry = function(entries, atomurl, ineturl) {
    var baseurl, e, enc, entry, inetbaseurl, ix, path, url;
    console.log("add kiosk entry " + atomurl + " / " + ineturl);
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
      supportsMime: []
    };
    url = null;
    if (ineturl != null) {
      ix = ineturl.lastIndexOf('/');
      inetbaseurl = ineturl.slice(0, ix + 1);
      entry.baseurl = inetbaseurl;
      url = inetbaseurl + "index.html?f=" + encodeURIComponent(ineturl);
    }
    path = baseurl + "index.html?f=" + encodeURIComponent(kiosk.getPortableUrl(atomurl));
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

}).call(this);
}, "loader": function(exports, require, module) {(function() {
  var Entry, addEntry, addShorturls, getCacheFileMap, getCachePath, get_baseurl, kiosk, loadCache, loadEntries, loadShorturls;

  Entry = require('models/Entry');

  kiosk = require('kiosk');

  getCachePath = function(url, cacheFiles, prefix) {
    var file;
    if (url != null) {
      file = cacheFiles[url];
      if (file != null) {
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
        return entry.enclosures.push({
          mime: type,
          url: href,
          path: path
        });
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
      var label, mime;
      mime = $(el).attr('term');
      label = $(el).attr('label');
      if (mime != null) return entry.supportsMime.push(mime);
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
        console.log('ok, got cache.json');
        return loadShorturls(entries, atomurl, prefix, data.baseurl, getCacheFileMap(data));
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log('error getting cache.json: ' + textStatus + ': ' + errorThrown);
        return loadShorturls(entries, atomurl, prefix, null, {});
      }
    });
  };

  addShorturls = function(sus, map) {
    var su, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = sus.length; _i < _len; _i++) {
      su = sus[_i];
      if ((su.url != null) && (su.shorturl != null)) {
        _results.push(map[su.url] = su.shorturl);
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
        return $('#atomfileErrorModal').foundation('reveal', 'open');
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
    return loadCache(entries, atomurl, prefix);
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
      supportsMime: []
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
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  module.exports = Entry = (function() {

    __extends(Entry, Backbone.Model);

    function Entry() {
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
}, "templates/DevicetypeInChoice": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push(' devicetype" id="');
    
      __out.push(__sanitize('devicetype-' + this.devicetype.term));
    
      __out.push('">\n  <div class="option-value-icon"><img class="" src="icons/');
    
      __out.push(__sanitize(this.selected ? 'cross.png' : 'emptybox.png'));
    
      __out.push('"></div>\n  ');
    
      __out.push(__sanitize(this.devicetype.label));
    
      __out.push('\n  <img src="icons/help.png" class="devicetype-help-button devicetype-help-show" >\n  <img src="icons/help-down.png" class="devicetype-help-button devicetype-help-hide hide" >\n</div>\n<div class="panel hide devicetype-help-panel" >');
    
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
      var _ref;
    
      __out.push('\n<a href="#" class="open">\n<div class="entry-in-list-title-holder"><h4 class="entry-in-list-title">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</h4></div>\n<div class="entry-in-list-icon">\n  <div class="dummy"></div>');
    
      __out.push('\n  <img src="');
    
      __out.push(__sanitize((_ref = this.iconpath) != null ? _ref : this.iconurl));
    
      __out.push('">\n</div>\n</a>\n');
    
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
      var _ref;
    
      __out.push('\n<div class="small-12 large-12 columns">\n  <h1>');
    
      __out.push(__sanitize(this.entry.title));
    
      __out.push('</h1>\n</div>\n<div class="small-12 medium-6 large-6 columns">\n  <p>');
    
      __out.push(__sanitize(this.entry.summary));
    
      __out.push('</p> \n  <div class="entry-in-list-icon">\n    <div class="dummy"></div>');
    
      __out.push('\n    <img src="');
    
      __out.push(__sanitize((_ref = this.entry.iconpath) != null ? _ref : this.entry.iconurl));
    
      __out.push('">\n  </div>\n</div>\n<div class="small-12 medium-6 large-6 columns">\n');
    
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
    
      __out.push('\n<div class="entry-list-help-top"></div>\n<div class="row">\n  <div class="small-6 large-6 columns">\n    <p class="text-centre"><img class="help-scroll-vertical" src="icons/scroll-vertical-hint.png">Drag to scroll up and down</p>\n  </div>\n  <div class="small-6 large-6 columns">\n    <p class="text-centre">Touch an item to find out more</p>\n  </div>\n</div>\n<div class="entry-list-help-ok">\n  <a href="-back" class="button">OK</a>\n</div>\n\n');
    
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
    
      __out.push('<div class="small-12 large-12 columns">\n  <h1>');
    
      __out.push(__sanitize(this.entry.title));
    
      __out.push('</h1>\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info"><span class="option-step">1</span>\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Join Wifi Network <span class="ssid">');
    
      __out.push(__sanitize(this.ssid));
    
      __out.push('</span>\n        <div class="clear-both"></div>\n      </p>\n    </div>\n    <div class="small-12 medium-6 large-6 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>You can get this content directly from this device using its own WiFi network.</p>\n        <p>Note: if you want to install a QR code reader from the Internet then do that first (see the next step).<p>\n        <p>Use the settings on your phone or tablet to search for WiFi networks; find the one called <span class="ssid">');
    
      __out.push(__sanitize(this.ssid));
    
      __out.push('</span> and join it. Within about 10 seconds you should have joined the network.</p>\n        <p>If you are unable to find or join this WiFi network then you will have to try downloading over the Internet - go back and choose that option.</p>\n      </div>\n    </div>\n  </div>    \n\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info"><span class="option-step">2</span>\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Either (a) scan this QR-code:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-url"><img class="option-qrcode" src="');
    
      __out.push(__sanitize(this.qrurl));
    
      __out.push('" alt="qrcode for item"></p>\n    </div>\n    <div class="small-12 medium-6 large-6 columns">\n      <div class="panel hide entry-option-step-panel">\n        ');
    
      __out.push(this.templateQRCodeHelp(this));
    
      __out.push('\n        <p>Note that you CANNOT access the app store or download new apps while you are connected to this device\'s WiFi network. You will have to disconnect from it and connect to the Internet.\n      </div>\n    </div>\n  </div>    \n\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info">\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Or (b) enter this URL in your web browser:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-url">');
    
      __out.push(__sanitize(this.geturl));
    
      __out.push('</p>\n    </div>\n    <div class="small-12 medium-6 large-6 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>Typing this URL into your phone\'s web browser is just the same as scanning the QR code.</p>\n        <p>Note: type it all together on one line, even it is appears split here. There are no spaces in it.</p>\n      </div>\n    </div>\n  </div>    \n\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info"><span class="option-step">3</span>\n        In a few seconds you should see a simple web page with a link to this content.\n      </p>\n    </div>\n  </div>\n\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info">\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        <span class="option-step">4</span>\n        Disconnect from this device\'s WiFi network when you have the content you want.\n      </p>\n    </div>\n    <div class="small-12 medium-6 large-6 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>This may be called "forgetting" or deleting this network on your phone\'s WiFi settings.</p>\n        <p>If you don\'t do this then your phone may keep connecting to this WiFi network and you will not able to access the Internet while you are near this device.</p>\n      </div>\n    </div>\n  </div>\n</div>\n\n');
    
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
    
      __out.push('\n<div class="small-12 large-12 columns">\n  <h1>');
    
      __out.push(__sanitize(this.entry.title));
    
      __out.push('</h1>\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info"><span class="option-step">1</span>\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Enable internet access\n        <div class="clear-both"></div>\n      </p>\n    </div>\n    <div class="small-12 medium-6 large-6 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>If you can access the internet on your phone or tablet at the moment then move to the next step.</p>\n        <p>If your phone or tablet has WiFi and you know and trust a network here then connect to that now.</p>\n        <p>If you have a data contract that you are happy to use (and a SIM, if you are using a tablet) then check that the signal strength is OK. If you cannot get a signal here then you may not be able to use the Internet - try WiFi instead.</p>\n      </div>\n    </div>\n  </div>    \n\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info"><span class="option-step">2</span>\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Either (a) scan this QR-code:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-url"><img class="option-qrcode" src="');
    
      __out.push(__sanitize(this.qrurl));
    
      __out.push('" alt="qrcode for item"></p>\n    </div>\n    <div class="small-12 medium-6 large-6 columns">\n      <div class="panel hide entry-option-step-panel">\n        ');
    
      __out.push(this.templateQRCodeHelp(this));
    
      __out.push('\n      </div>\n    </div>\n  </div>    \n\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info">\n        <img src="icons/help.png" class="entry-option-step-help-button entry-option-step-show">\n        <img src="icons/help-right.png" class="entry-option-step-help-button entry-option-step-hide hide">\n        Or (b) enter this URL in your web browser:\n        <div class="clear-both"></div>\n      </p>\n      <p class="option-url">');
    
      __out.push(__sanitize(this.geturl));
    
      __out.push('</p>\n    </div>\n    <div class="small-12 medium-6 large-6 columns">\n      <div class="panel hide entry-option-step-panel">\n        <p>Typing this URL into your phone\'s web browser is just the same as scanning the QR code.</p>\n        <p>Note: type it all together on one line, even it is appears split here. There are no spaces in it.</p>\n      </div>\n    </div>\n  </div>    \n\n  <div class="row">\n    <div class="small-12 medium-6 large-6 columns">\n      <p class="option-info"><span class="option-step">3</span>\n        In a few seconds you should see a simple web page with a link to this content.\n      </p>\n    </div>\n  </div>\n</div>\n\n');
    
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
    
      __out.push('        <p>You need a scanning app on your phone or tablet to scan this "QR Code" - it is just the same as the web link below.</p>\n');
    
      if (this.devicetype.attributes.term === 'ios') {
        __out.push('\n        <p>If you don\'t have a scanner already try searching in the app store for "QR Reader" - at least some apps are free. Note that you will need Internet access to download a new app.</p>\n');
      } else if (this.devicetype.attributes.term === 'android') {
        __out.push('\n        <p>If you don\'t have a scanner already try searching in google play for "ZXing" - their app is good and free. Note that you will need Internet access to download a new app.</p>\n');
      } else if (this.devicetype.attributes.term === 'windowsphone') {
        __out.push('\n        <p>If you don\'t have a scanner already try searching in the app store "QR" - at least some apps are free. Note that you will need Internet access to download a new app.</p>\n');
      } else {
        __out.push('\n        <p>If you don\'t have a scanner app already try searching in your device\'s app store for "QR"; hopefully there will be a free app! Note that you will need Internet access to download a new app.</p>\n');
      }
    
      __out.push('\n\n');
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "views/DevicetypeChoice": function(exports, require, module) {(function() {
  var DevicetypeChoiceView, templateDevicetypeInChoice;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateDevicetypeInChoice = require('templates/DevicetypeInChoice');

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
      this.model.bind('change', this.render);
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
      $('.devicetype-help-panel', this.$el).addClass('hide');
      $('.devicetype-help-show', this.$el).removeClass('hide');
      $('.devicetype-help-hide', this.$el).addClass('hide');
      return false;
    };

    DevicetypeChoiceView.prototype.help = function(ev) {
      var dtel;
      this.helpHide();
      dtel = $(ev.target).parents('.devicetype');
      $('.devicetype-help-button', dtel).toggleClass('hide');
      dtel.next('.panel').removeClass('hide');
      return false;
    };

    DevicetypeChoiceView.prototype.selectDevice = function(ev) {
      var devicetype, term;
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
      } else {
        console.log("select unknown device " + term);
      }
      return $('#chooseDeviceModal').foundation('reveal', 'close');
    };

    return DevicetypeChoiceView;

  })();

}).call(this);
}, "views/EntryInList": function(exports, require, module) {(function() {
  var EntryInListView, templateEntryInList;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntryInList = require('templates/EntryInList');

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
      this.model.bind('change', this.render);
      return this.render();
    };

    EntryInListView.prototype.template = function(d) {
      return templateEntryInList(d);
    };

    EntryInListView.prototype.render = function() {
      console.log("render EntryInList " + this.model.attributes.title);
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    EntryInListView.prototype.view = function(ev) {
      console.log('view ' + this.model.id);
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
  var EntryInfoView, getter, kiosk, templateEntryInfo;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntryInfo = require('templates/EntryInfo');

  getter = require('getter');

  kiosk = require('kiosk');

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
      this.model.bind('change', this.render);
      return this.render();
    };

    EntryInfoView.prototype.template = function(d) {
      return templateEntryInfo(d);
    };

    EntryInfoView.prototype.render = function() {
      var data, path, url;
      console.log("render EntryInfo " + this.model.id + " " + this.model.attributes.title);
      url = _.find(this.model.attributes.enclosures, function(enc) {
        return enc.url != null;
      });
      path = _.find(this.model.attributes.enclosures, function(enc) {
        return enc.path != null;
      });
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

    EntryInfoView.prototype.helpOption = function(name) {
      var b, offset;
      $(".help-option-" + name, this.$el).toggleClass('hide');
      b = $(".help-option-" + name, this.$el).get(1);
      if (!$(b).hasClass('hide')) {
        offset = $(b).offset();
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
      console.log("option:view entry " + this.model.id);
      return window.router.navigate("preview/" + (encodeURIComponent(this.model.id)), {
        trigger: true
      });
    };

    EntryInfoView.prototype.optionGet = function() {
      var devicetype, url, _ref;
      console.log("option:get entry " + this.model.id);
      devicetype = window.options.getBrowserDevicetype();
      if ((window.options.attributes.devicetype != null) && window.options.attributes.devicetype !== devicetype) {
        console.log("Warning: browser device type is not selected device type (" + (devicetype != null ? devicetype.attributes.term : void 0) + " vs " + ((_ref = window.options.devicetype) != null ? _ref.attributes.term : void 0));
      }
      url = getter.getGetUrl(this.model, devicetype);
      return window.open(url);
    };

    EntryInfoView.prototype.optionSendInternet = function() {
      if (!(window.options.attributes.devicetype != null)) {
        window.delayedNavigate = "sendInternet/" + (encodeURIComponent(this.model.id));
        return $('#chooseDeviceModal').foundation('reveal', 'open');
      } else {
        console.log("option:send(internet) entry " + this.model.id);
        return window.router.navigate("sendInternet/" + (encodeURIComponent(this.model.id)), {
          trigger: true
        });
      }
    };

    EntryInfoView.prototype.optionSendCache = function() {
      if (!(window.options.attributes.devicetype != null)) {
        window.delayedNavigate = "sendCache/" + (encodeURIComponent(this.model.id));
        return $('#chooseDeviceModal').foundation('reveal', 'open');
      } else {
        console.log("option:send(cache) entry " + this.model.id);
        return window.router.navigate("sendCache/" + (encodeURIComponent(this.model.id)), {
          trigger: true
        });
      }
    };

    return EntryInfoView;

  })();

}).call(this);
}, "views/EntryList": function(exports, require, module) {(function() {
  var EntryInListView, EntryListView;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  EntryInListView = require('views/EntryInList');

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
      this.model.bind('change', this.render);
      this.model.bind('add', this.add);
      window.options.on('change:devicetype', this.render);
      return this.$el.append('<div class="floating-help-button"><img src="icons/help.png"></div>');
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
        if ((window.options.attributes.devicetype != null) && !window.options.attributes.devicetype.supportsEntry(entry)) {
          return false;
        }
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
      console.log("EntryList help...");
      return window.router.navigate('help', {
        trigger: true
      });
    };

    return EntryListView;

  })();

}).call(this);
}, "views/EntryListHelp": function(exports, require, module) {(function() {
  var EntryListView, templateEntryListHelp;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntryListHelp = require('templates/EntryListHelp');

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
      'click': 'close'
    };

    EntryListView.prototype.close = function(ev) {
      ev.preventDefault();
      window.router.back();
      return false;
    };

    EntryListView.prototype.remove = function() {
      console.log('close/remove EntryListHelp');
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
      this.model.bind('change', this.render);
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
  var EntrySendCacheView, getter, kiosk, templateEntrySendCache, templateQRCodeHelp;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntrySendCache = require('templates/EntrySendCache');

  templateQRCodeHelp = require('templates/QRCodeHelp');

  getter = require('getter');

  kiosk = require('kiosk');

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
      this.model.bind('change', this.render);
      window.options.on('change:devicetype', this.render);
      return this.render();
    };

    EntrySendCacheView.prototype.template = function(d) {
      return templateEntrySendCache(d);
    };

    EntrySendCacheView.prototype.render = function() {
      var data, fullurl, geturl, qrurl, _ref;
      console.log("render EntrySendCache " + this.model.id + " " + this.model.attributes.title);
      fullurl = getter.getGetUrl(this.model, window.options.attributes.devicetype, false);
      geturl = kiosk.getTempRedirect(fullurl);
      qrurl = kiosk.getQrCode(geturl);
      data = {
        templateQRCodeHelp: templateQRCodeHelp,
        entry: this.model.attributes,
        geturl: geturl,
        qrurl: qrurl,
        devicetype: window.options.attributes.devicetype,
        ssid: (_ref = kiosk.getWifiSsid()) != null ? _ref : "??"
      };
      this.$el.html(this.template(data));
      return this;
    };

    EntrySendCacheView.prototype.events = {
      'click .entry-option-step-show': 'help',
      'click .entry-option-step-hide': 'helpHide'
    };

    EntrySendCacheView.prototype.helpHide = function() {
      $('.entry-option-step-panel', this.$el).addClass('hide');
      $('.entry-option-step-show', this.$el).removeClass('hide');
      $('.entry-option-step-hide', this.$el).addClass('hide');
      return false;
    };

    EntrySendCacheView.prototype.help = function(ev) {
      var dtel, offset;
      $('.entry-option-step-panel', this.$el).addClass('hide');
      offset = $(ev.target).offset();
      $('.entry-option-step-show', this.$el).removeClass('hide');
      $('.entry-option-step-hide', this.$el).addClass('hide');
      dtel = $(ev.target).parents('.row').first();
      $('.entry-option-step-help-button', dtel).toggleClass('hide');
      $('.entry-option-step-panel', dtel).removeClass('hide');
      window.scrollTo(0, offset.top);
      return false;
    };

    return EntrySendCacheView;

  })();

}).call(this);
}, "views/EntrySendInternet": function(exports, require, module) {(function() {
  var EntrySendInternetView, getter, kiosk, templateEntrySendInternet, templateQRCodeHelp;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  templateEntrySendInternet = require('templates/EntrySendInternet');

  templateQRCodeHelp = require('templates/QRCodeHelp');

  getter = require('getter');

  kiosk = require('kiosk');

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
      this.model.bind('change', this.render);
      window.options.on('change:devicetype', this.render);
      return this.render();
    };

    EntrySendInternetView.prototype.template = function(d) {
      return templateEntrySendInternet(d);
    };

    EntrySendInternetView.prototype.render = function() {
      var data, fullurl, geturl, qrurl, _ref;
      console.log("render EntrySendInternet " + this.model.id + " " + this.model.attributes.title);
      fullurl = getter.getGetUrl(this.model, window.options.attributes.devicetype, true);
      geturl = (_ref = window.entries.shorturls[fullurl]) != null ? _ref : fullurl;
      qrurl = kiosk.getQrCode(geturl);
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

    EntrySendInternetView.prototype.helpHide = function() {
      $('.entry-option-step-panel', this.$el).addClass('hide');
      $('.entry-option-step-show', this.$el).removeClass('hide');
      $('.entry-option-step-hide', this.$el).addClass('hide');
      return false;
    };

    EntrySendInternetView.prototype.help = function(ev) {
      var dtel, offset;
      $('.entry-option-step-panel', this.$el).addClass('hide');
      offset = $(ev.target).offset();
      $('.entry-option-step-show', this.$el).removeClass('hide');
      $('.entry-option-step-hide', this.$el).addClass('hide');
      dtel = $(ev.target).parents('.row').first();
      $('.entry-option-step-help-button', dtel).toggleClass('hide');
      $('.entry-option-step-panel', dtel).removeClass('hide');
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
      this.model.bind('change', this.render);
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
