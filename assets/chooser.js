// chooser.js - Javascript for kiosk chooser view.
// work in progress...

/* URL parameters - http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values */
var urlParams;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();

// standard file types
// Note: application/x-itunes-app is a made-up mime type for consistency
var standardFileTypes = [ { mime: "application/pdf", ext: "pdf", icon: "icons/pdf.png", label: "PDF" },
                          { mime: "text/html", ext: "html", icon: "icons/html.png", label: "HTML" },
                          { mime: "application/vnd.android.package-archive", ext: "apk", icon: "icons/get_it_on_google_play.png", label: "Android app" },
                          { mime: "application/x-itunes-app", icon: "icons/available_on_the_app_store.png", label: "iPhone app" },
                          ];
// main device types and standard (built-in supported) mime types.
// Note: application/x-itunes-app is a made-up mime type for consistency
var deviceTypes = [ { term: "android", label: "Android", userAgentPattern: 'Android', supportsMime: [ "text/html", "application/vnd.android.package-archive" ] },
                    { term: "ios", label: "iPhone", userAgentPattern: '(iPhone)|(iPod)|(iPad)', supportsMime: [ "text/html", "application/x-itunes-app" ] },
                    { term: "other", label: "Other Devices", supportsMime: [ "text/html" ] },
                    ];

function getHostAddress() {
	if (isKiosk()) 
		return kiosk.getHostAddress();
	console.log('Note: kiosk undefined');
	return "localhost";
}

// entry type:
// { title:, iconurl:, summary:, index:, enclosures: [{mime:, url:}], 
//   supportsMime:["..."], requiresDevice:["..."] }
var entries = [];
// mime type -> {mime: label: icon: ?ext: }
var allFileTypes = new Object();
// url -> shorturl
var shorturls = new Object();
var mousedownEvent = null;
var mousemoved = false;
var MOUSE_MOVE_MIN = 20;
var currententry = null;

var kioskFilePrefix = null;

function saveOptions() {
	// persistent?
	if(typeof(Storage)!=="undefined") {
		localStorage.options = JSON.stringify(options);
		console.log('saved options');
	}
}
function loadOptions() {
	if(typeof(Storage)!=="undefined") {
		if (localStorage.options) {
			options = JSON.parse(localStorage.options);
			console.log('loaded options');
		}
		else
			console.log('no saved options');
	}
	else
		console.log('Warning: No local storage available');
	
}

function getTouchedEntry(ev) {
	var el = ev.target;
	while (el) {
		var id = el.id;
		//console.log('- check target '+el+' ('+id+')');
		if (id && id.indexOf('entry_')==0)
			break;
		el = el.parentNode;
	}
	if (el) {
		var index = el.id.substring(6);
		console.log('touch entry '+index);
		return entries[index];
	}
	return undefined;
}

/*function getPrefixedUrl(prefix, href) {
	if (href.indexOf(':')<0 && href.indexOf('/')!=0) {
		// no scheme and doesn't start with /
		href = prefix+href;
		// TODO relative ..?
	}
	return href;
}
*/
function getCachePath(entry, url) {
	if (!url)
		return null;
	var gurl = getInternetUrl(entry, url);
	// in cache??
	if (entry.cacheinfo && entry.cacheinfo.files)
   	  	for (var i=0; i<entry.cacheinfo.files.length; i++) {
   	  		file = entry.cacheinfo.files[i];
   	  		if (file.url==gurl && file.path) {
   	  			console.log('Cache hit '+url+' -> '+gurl+' = '+file.path);
   	  			return file.path
   	  		}
   	  	}
	console.log('Cache miss '+url+' -> '+gurl);
	return null;
}
function addEntry(atomentry, prefix, cacheinfo) {
	// prefix is root path from which atom file was loaded;
	// typically this would be correct for relative paths,
	// but may be application-specific (asset) or 
	// device-specific (file)
	//
	// cache baseurl is root path from atom file was 
	// originally hosted on the web (and presumably still is).
	// typically this would be correct for internet paths.
	//
	// cache path (if it exists) is relative to atom file/cache.js of a
	// copy of the original file.
	//
	index = entries.length;
	var title = $('title', atomentry).text();
	var iconurl = $('link[rel=\'alternate\'][type^=\'image\']', atomentry).attr('href');
	if (!iconurl) {
		// relative to html page
		//iconurl = "icons/_blank.png";
		console.log('iconurl unknown for '+title);
	}
	var summary = $('content', atomentry).text();		
	
	var entry = { title: title, iconurl: iconurl, summary: summary, index: index, prefix: prefix, cacheinfo: cacheinfo };
	entry.iconpath = getCachePath(entry, iconurl)
	
	entry.enclosures = [];
	$('link[rel=\'enclosure\']', atomentry).each(function(index, el) {
		var type = $(el).attr('type');
		var href = $(el).attr('href');
		if (href) {
			var path = getCachePath(entry, href);
			entry.enclosures.push({mime: type, url: href, path: path});
		}
	});
	entry.requiresDevice = [];
	$('category[scheme=\'requires-device\']', atomentry).each(function(index, el) {
		var device = $(el).attr('term');
		if (device) {
			entry.requiresDevice.push(device);
		}
	});
	// add before support check
	entries[index] = entry;
	entry.supportsMime = [];
	$('category[scheme=\'supports-mime-type\']', atomentry).each(function(index, el) {
		var mime = $(el).attr('term');
		var label = $(el).attr('label');
		if (mime) {
			entry.supportsMime.push(mime);
			if (!allFileTypes[mime]) {
				mt = { mime: mime, label: label };
				allFileTypes[mime] = mt;
				checkFileTypeSupport(mt);
			}
			if (!allFileTypes[mime].icon || allFileTypes[mime].icon=="icons/_blank.png")
				allFileTypes[mime].icon = getIconUrl(entry);
		}
	});
	
	$('category[scheme=\'visibility\']', atomentry).each(function(index, el) {
		var visibility = $(el).attr('term');
		if (visibility=='hidden')
			entry.hidden = true;
		console.log('entry visibility '+visibility+' (hidden='+entry.hidden+' for '+title);
	});
	$('category', atomentry).each(function(index, el) {
		var term= $(el).attr('term');
		var scheme = $(el).attr('scheme');
		console.log('category '+scheme+'='+term);
	});
	console.log('  entry['+index+']: '+title);
}
// add an entry for the kiosk view itself
function addKioskEntry(cacheinfo, atomurl) {
	if (isKiosk()) {
		// kiosk.html is this page
		// relative ref
		var baseurl = location.href;
		var ix = baseurl.lastIndexOf('/');
		if (ix>=0)
			baseurl = baseurl.substring(0,ix+1);

		index = entries.length;
		var entry = { title: "Kiosk View", 
				iconurl: "icons/kiosk.png",
				iconpath: "icons/kiosk.png",
				summary: "Browse the same content directly on your device", 
				index: index, 
				prefix: baseurl, 
				// note: using baseurl from given atomfile/global for internet fallback
				cacheinfo: cacheinfo };
		// TODO atomfile - is as loaded by kiosk, typically from local file system.
		// for internet version we know it should be in the same basedir;
		// but for local it is a file rather than a resource, so we'll need to fix/fiddle this!
		//var url = "kiosk.html?f="+encodeURIComponent(getExternalUrl(atomurl));
		var enc = { url: "kiosk.html", mime: "text/html", path: "kiosk.html", atomurl: atomurl };
		entry.enclosures = [enc];
		entry.requiresDevice = [];
		entries[index] = entry;
		entry.supportsMime = [];	
	}
}
// get absolute/global path
function getInternetUrl(entry, url) {
	var ix = url.indexOf(':');
	if (ix>=0)
		// global already
		return url;
	if (entry.cacheinfo && entry.cacheinfo.baseurl) {
		if (url.indexOf('/')!=0)
			// relative
			return entry.cacheinfo.baseurl+url;
		// absolute path
		var ix = entry.cacheinfo.baseurl.indexOf("://");
		if (ix<0) {
			console.log('getInternetUrl for local path '+url+' with local baseurl '+entry.cacheinfo.baseurl);
			// no host??
			return url;
		}
		var pix = entry.cacheinfo.baseurl.indexOf("/",ix+3);
		if (pix<0)
			return entry.cacheinfo.baseurl+url;
		return entry.cacheinfo.baseurl.substring(0,pix)+url;
	}
	else {
		console.log('getInternetUrl for local path '+url+' with no baseurl');
		if (entry.prefix)
			// using the prefix might work, sometimes
			return entry.prefix+url;
		return url;
	}
}
// get an icon URL that can be used within the browser/kiosk (only).
// Should be from the cache if present.
function getIconUrl(entry) {
	var url = entry.iconurl;
	if (!url)
		// unknown - relative to HTML
		return "icons/_blank.png";
	
	// Used on this device: 
	// build global address (with prefix), 
	// but try cache if possible (from cache path and prefix)
	if (entry.iconpath && entry.prefix) {
		return entry.prefix+entry.iconpath;
	}
	return getInternetUrl(entry, url);
}

function refreshTray() {
	$('#tray').empty();
	for (var index in entries) {
		var entry = entries[index];
		if (entry.hidden)
			continue;
		// filter
		var title = entry.title;
		var iconurl = getIconUrl(entry);
		// device
		if (entry.requiresDevice.length>0) {
			if (options.device && entry.requiresDevice.indexOf(options.device)<0) {
				console.log('entry not supported on '+options.device+': '+title);
				continue;
			}
		}
		// mime type(s)
		var mimeok = false;
		for (var enci in entry.enclosures) {
			var enc = entry.enclosures[enci];
			var mime = enc.mime;
			if (options.mediatypes && options.mediatypes[mime]===false) {
				console.log('mimetype not wanted: '+mime+' for '+title+' '+enc.url);
				continue;
			}
			mimeok = true;
			break;
		}
		if (!mimeok)
			continue;
		
		$('#tray').append('<div id="entry_'+index+'" class="entry touchable"><p class="entrytitle">'+title+'</p>'+
				'<div class="entryicon"><img src="icons/loading.gif" alt="loading" class="loading entryicon"></div>'+
		'</div>');
		// replace icon with actual one; 
		// TODO handle load delay?
		$('div#entry_'+index+' .entryicon img', tray).replaceWith('<img src="'+iconurl+'" alt="'+title+' icon" class="entryicon">');
		//console.log('icon = '+iconurl);
	}
}

function addEntries(atomurl) {
	// abolute URL...
	var ci = atomurl.indexOf(':');
	if (ci<0) {
		console.log('converting local name '+atomurl+' to global...');
		// relative to location
		var base = window.location.href;
		if (atomurl.indexOf('/')==0) {
			// absolute
			var si = base.indexOf('//');
			if (si<0)
				si = 0;
			else
				si = si+2;
			si = base.indexOf('/', si);
			if (si<0)
				atomurl = base+atomurl;
			else
				atomurl = base.substring(0,si)+atomurl;
		}
		else {
			// relative
			si = base.lastIndexOf('/');
			if (si<0)
				atomurl = base+"/"+atomurl;
			else
				atomurl = base.substring(0,si+1)+atomurl;
		}
	}
	console.log('loading entries from '+atomurl);
	var tray = $('#tray');
	var ix = atomurl.lastIndexOf('/');
	var prefix = '';
	if (ix>=0) {
		prefix = atomurl.substring(0, ix+1);
		console.log('entry loading prefix='+prefix);
	}
	// add loading animation
	tray.append('<img src="icons/loading.gif" alt="loading" class="loading">');
	// cache.json ?
	$.ajax({
		url: prefix+'cache.json',
		type: 'GET',
		dataType: 'json',
		timeout: 10000,
		success: function(data, textStatus, xhr) {
			console.log('ok, got cache.json '+data);
			if (cacheinfo==null) {
				console.log('Initialise global baseurl from '+prefix);
				cacheinfo = { baseurl: data.baseurl };
			}
			loadAtomFile(atomurl, prefix, data);
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log('error getting cache.json: '+textStatus+': '+errorThrown);
			loadAtomFile(atomurl, prefix, null);
		}
	});
	// shorturls.json ?
	$.ajax({
		url: prefix+'shorturls.json',
		type: 'GET',
		dataType: 'json',
		timeout: 10000,
		success: function(data, textStatus, xhr) {
			console.log('ok, got '+prefix+'shorturls.json '+data);
			for (var si in data) {
				var surl = data[si];
				if (surl.url && surl.shorturl) {
					shorturls[surl.url] = surl.shorturl;
					console.log('adding shorturl '+surl.shorturl+' -> '+surl.url);
				}
				else
					console.log('badly formatted shorturl '+JSON.stringify(surl));
			}
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log('error getting '+prefix+'shorturls.json: '+textStatus+': '+errorThrown);
		}
	});
}
function loadAtomFile(atomurl, prefix, cacheinfo) {
	$.ajax({
		url: atomurl,
		type: 'GET',
		dataType: 'xml',
		timeout: 10000,
		success: function(data, textStatus, xhr) {
			console.log('ok, got '+data);
			// remove loading animation
			$( '>img[class=\'loading\']:first', tray).remove();
			
			$( data ).find('entry').each(function(index, el) {
				addEntry(el, prefix, cacheinfo);
			});
			addKioskEntry(cacheinfo, atomurl);
			refreshTray();
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log('error, '+textStatus+': '+errorThrown);
			// remove loading animation
			$( '>img[class=\'loading\']:first', tray).remove();
		}
		});
	
}

function showEntryPopup(entry) {
	currententry = entry;
	$('#entrypopup_title').text(entry.title);
	$('#entrypopup_summary').html(entry.summary);

	$('#entrypopup_icon img').replaceWith('<img src="'+getIconUrl(entry)+'" alt="'+entry.title+' icon" class="entrypopup_icon">');
	$('#entrypopup_requires').empty();

	// requires...
	// file icon(s)
	for (var ei in entry.enclosures) {
		var enc = entry.enclosures[ei];
		var iconurl = null;
		// standard file types
		for (var si in allFileTypes) {
			var sft = allFileTypes[si];
			if (sft.mime==enc.mime && sft.icon) {
				iconurl = sft.icon;
				break;
			}
		}
		// fall-back
		if (!iconurl) {
			console.log('Could not file icon for '+enc.mime);
			iconurl = 'icons/_blank.png';
		}
		
		console.log('requires '+iconurl);
		$('#entrypopup_requires').append('<img src="'+iconurl+'" alt="'+enc.mime+'" class="entrypopup_requires_mime touchable">');		
	}
	// device label(s)
	for (var di in deviceTypes) {
		var dt = deviceTypes[di];
		if (entry.requiresDevice.indexOf(dt.term)>=0) {
			console.log('requires '+dt.term);
			$('#entrypopup_requires').append('<div class="entrypopup_requires_device touchable">'+dt.label+'</div>');
		}
	}
	$('#entrypopup_requires').append('<div id="entrypopup_requires_end"></div>');
	// options...
	$('#entrypopup_options').empty();
	
	// back is handled in title bar
	if (entry.enclosures.length>0) {
		// kiosk...?
		if (entry.enclosures[0].atomurl===undefined)
			$('#entrypopup_options').append('<p class="option touchable" id="option_view">Preview</p>');
		
		if (isKiosk() || options.kioskMode) {
			$('#entrypopup_options').append('<p class="option touchable" id="option_send_internet">Send over Internet</p>');
		}
		if (entry.enclosures[0].path && ((isKiosk() && options.localNetworkMode) || (!isKiosk() && options.kioskMode))) {
			// its in a cache; we are a kiosk offering local access (i.e. our cache),
			// or we're not a kiosk but presumably are talking to one (its cache)
			$('#entrypopup_options').append('<p class="option touchable" id="option_send_cache">Send from Kiosk</p>');
		}
		if (!isKiosk() && entry.enclosures[0].atomurl===undefined) {
			$('#entrypopup_options').append('<p class="option touchable" id="option_get">Get on this device</p>');			
		}
	}	
	showScreen('screen_entrypopup');

	updateScrollHints();
}

var asset_prefix = 'file:///android_asset/';
var localhost_prefix = 'http://localhost';
var localhost2_prefix = 'http://127.0.0.1';
// convert possibly internal URL to simple external/global URL
function getExternalUrl(url) {
	if (isKiosk()) {
		// convert to external URL
		if (url.indexOf(asset_prefix)==0) {
			url = 'http://'+kiosk.getHostAddress()+':'+kiosk.getPort()+'/a/'+url.substring(asset_prefix.length);
		}
		else if (url.indexOf('file:')==0) {
			file_prefix = kiosk.getLocalFilePrefix();
			if (url.indexOf(file_prefix)==0) {
				url = 'http://'+kiosk.getHostAddress()+':'+kiosk.getPort()+'/f/'+url.substring(file_prefix.length);
			} else 
				console.log('Warning: file URL which does not match local file prefix: '+url);
		}
		else if (url.indexOf(localhost_prefix)==0)
			url = 'http://'+kiosk.getHostAddress()+url.substring(localhost_prefix.length);
		else if (url.indexOf(localhost2_prefix)==0)
			url = 'http://'+kiosk.getHostAddress()+url.substring(localhost2_prefix.length);
	} 
	return url;
}
// 60 minutes
var REDIRECT_LIFETIME_MS = (60*60*1000);
	
// get URLs of apps supporting mime type
function getAppUrls(mime) {
	var as = [];
	if (mime) {
		var apps = getSupportingEntries(mime, options.device);
		if (apps==null)
			// unknown support
			as.push('');
		else if (apps.length==0) {
			// built-in
		}
		else {
			for (var ai in apps) {
				var app = apps[ai];
				if (!app.enclosures)
					continue;
				for (var enci in app.enclosures) {
					var appenc = app.enclosures[enci];
					if (appenc.url) {
						as.push(appenc.url);
						break;
					}
				}
			}
			if (as.length==0) {
				console.log('Could not find url(s) for apps supporting '+enc.mime);
				as.push('');
			}
		}
	}
	return as;
}

function handleOption(optionid) {
	if ('option_view'==optionid) {
		// TODO convert to propert preview.
		// For now, open the enclosure on the device viewing the 
		// kiosk. use the cache if possible (get.html not used).
		// enclosure should not have been an asset
		var enc = currententry.enclosures[0];
		var url = enc.url;
		if (currententry.prefix && enc.path)
			// cache
			url = currententry.prefix + enc.path;
		else
			url = getInternetUrl(currententry, url);

		console.log('preview '+currententry.title+' as '+url);
		var done = false;
		if (isKiosk()) {
			// try kiosk open...
			done = kiosk.openUrl(url, enc.mime, location.href);
		} 

		if (!done) {
			// if we are kiosk this is usually wrong 
			window.open(url,'_blank','',false);
		}
		showScreen('screen_tray');
	}
	else if ('option_get'==optionid) {
		// non-kiosk only! (but can do this in kiosk mode)
		// get.html should be available relative to page.
		// enclosure should use cache if possible.
		// no shorturl or qrcode needed :-)
		var enc = currententry.enclosures[0];
		var url = enc.url;
		if (currententry.prefix && enc.path)
			// cache
			url = currententry.prefix + enc.path;
		else
			url = getInternetUrl(currententry, url);
		console.log('get '+currententry.title+' as '+url);

		// leave app URLs alone for now (assumed internet-only)
		var as = getAppUrls(enc.mime);
		
		// relative URL
		var baseurl = location.href;
		var ix = baseurl.lastIndexOf('/');
		if (ix>=0)
			baseurl = baseurl.substring(0,ix+1);
		url = baseurl+'get.html?'+
		'u='+encodeURIComponent(url)+
		'&t='+encodeURIComponent(currententry.title);
		for (var ai in as) {
			url = url+'&a='+encodeURIComponent(as[ai]);
		}
		
		console.log('Using helper page url '+url);
		
		window.open(url);

	}
	else if ('option_send_internet'==optionid || 'option_send_cache'==optionid) {		

		// need device!
		if (options.device===undefined) {
			showScreen('screen_options');
			alert('Please select you phone type first');
			return;
		}
			
		var use_cache = ('option_send_cache'==optionid);
		var enc = currententry.enclosures[0];
		var url = enc.url;
		
		if (!use_cache || !enc.path || !currententry.prefix)
			// can't or shouldn't use cache for enclosure
			url = getInternetUrl(currententry,url);
		else {
			// should use cache
			url = currententry.prefix+enc.path;
			// this might be kiosk-local, which we should fix
			url = getExternalUrl(url);
		}

		// special case for kiosk view
		if (enc.atomurl!==undefined) {
			furl = enc.atomurl;
		    if (!use_cache && currententry.cacheinfo && currententry.cacheinfo.baseurl) {
		    	// global...
		    	var ix = furl.lastIndexOf('/', furl);
		    	if (ix>=0)
		    		furl = furl.substring(ix+1);
		    	furl = currententry.cacheinfo.baseurl+furl;
		    }	
		    else {
				// should use cache
				furl = getExternalUrl(furl);
		    }
		    url = url + "?f="+encodeURIComponent(furl);		    
		}
		
		console.log('send '+currententry.title+' as '+url);

		// replace options...
		$('#entrypopup_options').empty();

		var as = getAppUrls(enc.mime);
		// at the moment the url shortener only picks one app...
		if (isKiosk() && use_cache)
			; // our shortener is ok
		else {
			if (as.length>1) 
				as = [as[0]];
		}
		
		// url for get helper - needs to be made transferable...
		var geturl = "get.html";

		// if using cache then we'll assume it can come 
		// i.e. in the same server directory as the first atom file.
		// 
		// otherwise we need a global/internet URL as per the shorturls,
		// so we'll hope/assume that there is one at the atom file baseurl
		if (!use_cache) {
			if (currententry.cacheinfo && currententry.cacheinfo.baseurl) {
				geturl = currententry.cacheinfo.baseurl+geturl;
			}
			else if (cacheinfo && cacheinfo.baseurl) {
				console.log('having to use global baseurl to guess internet get.html location');
				geturl = cacheinfo.baseurl+geturl;
			}
			else {
				console.log('Warning: unable to guess internet get.html location');
				geturl = currententry.prefix+geturl;
			}
		}
		else {
			// relative ref
			var baseurl = location.href;
			var ix = baseurl.lastIndexOf('/');
			if (ix>=0)
				baseurl = baseurl.substring(0,ix+1);
			geturl = baseurl+geturl;			
		}
		if (isKiosk())
			geturl = getExternalUrl(geturl);

		console.log('using geturl '+geturl);

		// build and serve...
		url = geturl+'?'+
		'u='+encodeURIComponent(url)+
		'&t='+encodeURIComponent(currententry.title);
		for (var ai in as) {
			url = url+'&a='+encodeURIComponent(as[ai]);
		}
		console.log('Using helper page url '+url);

		// back is handled in title bar
		
		// generate suitable prompt and adapt url as required...
		if (use_cache) {

			if (isKiosk()) {
			
				var ssid = kiosk.getWifiSsid();
				$('#entrypopup_options').append('<p class="option_info">Join Wifi Network <span class="ssid">'+ssid+'</span> and scan/enter...</p>');

				url = url+'&n='+encodeURIComponent(kiosk.getWifiSsid());
				console.log('with network '+ssid);

				// temporary redirect for short URL
				var redir = kiosk.registerTempRedirect(url, REDIRECT_LIFETIME_MS);
				url = "http://"+kiosk.getHostAddress()+":"+kiosk.getPort()+redir;
				console.log('Using temp url '+url);

			} else {
				// this doesn't actually work well at the moment.
				// In general you can't use (internet) shorturls and you can't
				// set up a temporary redirect on the kiosk (at the moment)
				$('#entrypopup_options').append('<p class="option_info">Join the same network and scan/enter...</p>');
				console.log('note: trying to use cache with non-kiosk');
			}
			
			
		} else {
			// non-cache = Internet = try shorturls

			$('#entrypopup_options').append('<p class="option_info">Enable internet access and scan/enter...</p>');

			if (shorturls[url]) {
				url = shorturls[url];
				console.log('using shorturl '+url);
			}
			
		}
		
		// QR code
		if (isKiosk()) {
			// using kiosk qrcode generator...
			$('#entrypopup_options').append('<img class="option_qrcode" src="http://localhost:8080/qr?url='+encodeURIComponent(url)+'&size=150" alt="qrcode for item">');
		}
		else {
			var try_kiosk_qr = false;
			if (use_cache) {
				// do we really think this came from a kiosk? if so try using its qr code generator 
				// because it could just be an internet stash of files...
				if (window.location.pathname=='/a/kiosk.html') {
					console.log('Guessing this is really from a cache: '+window.location.href);
					try_kiosk_qr = true;
				}
			}
			if (try_kiosk_qr) {
				$('#entrypopup_options').append('<img class="option_qrcode" src="http://'+window.location.host+'/qr?url='+encodeURIComponent(url)+'&size=150" alt="qrcode for item">');				
			}
			else
				// assume internet?? try google qrcode generator http://chart.apis.google.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl=http%3A%2F%2F1.2.4
				$('#entrypopup_options').append('<img class="option_qrcode" src="http://chart.apis.google.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl='+encodeURIComponent(url)+'" alt="qrcode for item">');
		}

		$('#entrypopup_options').append('<p class="option_url">'+url+'</p>');

		updateScrollHint($('#entrypopup_options').get(0));
	}
}

function updateScrollHints() {
	$('.scrollhint').each(function (ix, el) { updateScrollHint(el); });
}
function updateScrollHint(el) {
	if( el.offsetHeight < el.scrollHeight) {
		if ( el.offsetHeight+el.scrollTop < el.scrollHeight ) {
			$(el).addClass('scrollhint_bottom');
			$(el).removeClass('scrollhint_top');
		}
		else {
			$(el).addClass('scrollhint_top');
			$(el).removeClass('scrollhint_bottom');			
		}
	}
	else{
	   //your element don't have overflow
		$(el).removeClass('scrollhint_bottom');
		$(el).removeClass('scrollhint_top');
	}
}

function vibrate() {
	var done = false;
	try {
		if (window.navigator.vibrate)
			done = window.navigator.vibrate(100);
	} catch (e) {
		console.log('error on vibrate: '+e.message);
	}
	if (!done) {
		// sound?
	}
}

function initFileTypes() {
	for (var i in standardFileTypes) {
		var sft = standardFileTypes[i];
		allFileTypes[sft.mime] = sft;
	}
}

var options = new Object();
var hostDevice = 'any';
var atomfile = null;

// initialise the options screen 
function initOptions() {
	loadOptions();
	if (options.localNetworkMode===undefined)
		options.localNetworkMode = false;
	if (options.kioskMode===undefined)
		options.kioskMode = false;
	if (!isKiosk()) {
		var userAgent = navigator.userAgent;
		var dev = 'other';
		for (var di in deviceTypes) {
			var dt = deviceTypes[di];
			if (dt.userAgentPattern) {
				var pat = new RegExp(dt.userAgentPattern);
				if (pat.test(userAgent)) {
					console.log('host device seems to be '+dt.term+' (user agent: '+userAgent+')');
					dev = dt.term;
				}
			}
		}
		if (dev==='other') {
			console.log('non-kiosk using default device type '+options.device);
		}
		hostDevice = dev;
		if (options.device===undefined && options.mediatypes===undefined) {
			options.device = hostDevice;
		}
		// preserve any saved config
		var mediatypes = options.mediatypes;
		setOptionDevice(options.device);
		if (mediatypes) {
			options.mediatypes = mediatypes;
			saveOptions();
		}
		$('#option_device_holder').hide();
	}
	if (options.mediatypes===undefined)
		options.mediatypes = new Object();
	// phone types (term: label:)
	for (var di in deviceTypes) {
		var dt = deviceTypes[di];
		$('#option_device').append('<div id="option_device_'+dt.term+'" class="optionvalue touchable"><img src="icons/emptybox.png" alt="blank" class="optionvalueicon"><div class="optionvaluelabel">'+dt.label+'</div></div>');
	}
	$('#option_device').append('<div id="option_device_any" class="optionvalue touchable"><img src="icons/emptybox.png" alt="blank" class="optionvalueicon"><div class="optionvaluelabel">Show me everything</div></div>');
}
// get entries for apps supporting given mime type on given device 
// return array of entries, or null if none, empty array if built-in
function getSupportingEntries(mime, device) {
	var builtin = false;
	for (var di in deviceTypes) {
		var dt = deviceTypes[di];
		if ((device===undefined || dt.term==device) && dt.supportsMime.indexOf(mime)>=0) {
			console.log('Mime type '+mime+' built-in on device '+options.device);
			builtin = true;
		}
	}
	var apps = [];
	for (var ei in entries) {
		var entry = entries[ei];
		if (entry.supportsMime && entry.supportsMime.indexOf(mime)>=0) {
			if (!entry.requiresDevice || device===undefined || device=='any' || entry.requiresDevice.indexOf(device)>=0) {
				// ok
				apps.push(entry);
				console.log('Mime type '+mime+' supported on device '+options.device+' by '+entry.title);
			}
		}
	}
	if (!builtin && apps.length==0) {
		console.log('Mime type '+mime+' unsupported on device '+options.device);
		return null;
	}
	return apps;
}
// update the options screen
function updateOptions() {
	// kiosk options
	if (isKiosk()) {
		$('#option_kiosk_holder').hide();
		$('#option_localnetwork_holder').show();
		if (options.localNetworkMode)
			$('#option_localnetwork_mode img').attr('src', 'icons/tick.png');
		else
			$('#option_localnetwork_mode img').attr('src', 'icons/emptybox.png');
	}
	else {
		$('#option_kiosk_holder').show();
		$('#option_localnetwork_holder').hide();
		if (options.kioskMode) {
			$('#option_kiosk_mode img').attr('src', 'icons/tick.png');
			$('#option_device_holder').show();
		} else {
			$('#option_kiosk_mode img').attr('src', 'icons/emptybox.png');
			$('#option_device_holder').hide();
		}
	}
	
	// device
	$('#option_device div.optionvalue img').attr('src', 'icons/emptybox.png');
	if (options.device) 
		$('#option_device_'+options.device+' img').attr('src', 'icons/tick.png');
	else
		$('#option_device_any img').attr('src', 'icons/tick.png');
	
	// mime types
	var mts = [];
	for (var mti in allFileTypes) {
		var ft = allFileTypes[mti];
		mts.push(ft);
		//console.log('got file type '+ft.mime);
	}
	$('#option_mediatype').empty();
	for (var mti in mts) {
		var mt = mts[mti];
		var allow = true;
		//if (options.mediatypes && options.mediatypes[mt.mime]===false)
		// explicit disallowed, e.g. unsupported?!
		//continue;
		if (options.mediatypes && options.mediatypes[mt.mime]!==undefined)
			allow = options.mediatypes[mt.mime];
		var iconurl = allow ? 'icons/tick.png' : 'icons/emptybox.png';
		var id = 'option_mediatype_'+mti;
		$('#option_mediatype').append('<div id="'+id+'" '+
				'class="optionvalue touchable"><img src="'+iconurl+'" alt="'+iconurl+'" '+
				'class="optionvalueicon"></div>');
		$('#'+id).data('mime', mt.mime);
		// apps required?
		var apps = getSupportingEntries(mt.mime, options.device);
		if (!apps) {
			//console.log('Mime type '+mt.mime+' unsupported on device '+options.device);
			$('#'+id).append('<img src="icons/cross.png" alt="requires unknown app" class="optionvalue_requires_app touchable">');
		} else {
			for (var ai in apps) {
				var app = apps[ai];
				$('#'+id).append('<img src="'+getIconUrl(app)+'" alt="requires '+app.title+'" class="optionvalue_requires_app touchable">');
			}
		}
		$('#'+id).append('<div class="optionvaluelabel">'+mt.label+'</div>')
		$('#'+id).append('<div class="optionvalueend"></div>')
		//console.log('added option for media type '+mt.mime);
	}
	//$('#option_mediatype').append('<div id="option_device_any" class="optionvalue touchable"><img src="icons/emptybox.png" alt="blank" class="optionvalueicon"><div class="optionvaluelabel">Any!</div></div>');
}
function checkFileTypeSupport(mt, deviceType) {
	if (options.mediatypes[mt.mime]!==undefined)
		// leave explicit options
		return;
	if (deviceType===undefined) {
		if (options.device===undefined)
			// maybe!
			return;

		for (var dti in deviceTypes) {
			var dt = deviceTypes[dti];
			if (dt.term==options.device) {
				deviceType = dt;
				break;
			}
		}
	}
	if (deviceType && deviceType.supportsMime.indexOf(mt.mime)>=0)
		// build-in support
		options.mediatypes[mt.mime] = true;
	else {
		var apps = [];
		// check applications
		for (var ei in entries) {
			var app = entries[ei];
			if (app.supportsMime.indexOf(mt.mime)>=0) {
				if (app.requiresDevice.length==0 || app.requiresDevice.indexOf(options.device)>=0) {
					// ok with this app
					apps.push(app);
					console.log('device '+options.device+' requires app for '+mt.mime+' such as '+app.title);
				}
			}
		}
		if (apps.length==0) {
			console.log('device '+options.device+' does not support '+mt.mime);
			options.mediatypes[mt.mime] = false;
		}
	}
	saveOptions();
}
function setOptionDevice(dev) {
	if (dev=='any' || dev===undefined)  {
		delete options.device;
		// initialise mediatype options for any device
		options.mediatypes = new Object();
		$('#tray_title').text('Downloads for Any Device');
	}
	else  {
		options.device = dev;
		// initialise mediatype options for device
		options.mediatypes = new Object();
		var deviceType = null;
		for (var dti in deviceTypes) {
			var dt = deviceTypes[dti];
			if (dt.term==options.device) {
				deviceType = dt;
				break;
			}
		}
		if (deviceType)
			$('#tray_title').text('Downloads for '+deviceType.label);
		else
			$('#tray_title').text('Downloads for '+options.device);

		for (var mti in allFileTypes) {
			var mt = allFileTypes[mti];
			checkFileTypeSupport(mt, deviceType);
		}
	}
	saveOptions();
}
function handleOptionvalue(el) {
	var id = el.id;
	console.log('handleOptionvalue('+id+')');
	if (!id)
		return;
	if (id.indexOf('option_device_')==0) {
		var dev = id.substring('option_device_'.length);
		console.log('select device '+dev);
		setOptionDevice(dev);
		updateOptions();
	} else if (id.indexOf('option_mediatype_')==0) {
		var mime = $('#'+id).data('mime');
		if (mime) {
			if (options.mediatypes===undefined)
				options.mediatypes = new Object();
			var val = options.mediatypes[mime];
			// toggle
			if (val===undefined || val)
				options.mediatypes[mime] = false;
			else
				options.mediatypes[mime] = true;
			saveOptions();
			updateOptions();
		}
	}
	else if (id=='option_kiosk_mode') {
		// toggle
		options.kioskMode = !options.kioskMode;
		saveOptions();
		console.log('toggle kioskMode, now '+options.kioskMode);
		if (!options.kioskMode)
			setOptionDevice(hostDevice);
		updateOptions();
	}
	else if (id=='option_localnetwork_mode') {
		// toggle
		options.localNetworkMode = !options.localNetworkMode;
		saveOptions();
		console.log('toggle localNetworkMode, now '+options.localNetworkMode);
		updateOptions();
	}
}

var supportsTouch = false;

var currentScreen;
function showScreen(screenid) {
	if (currentScreen)
		$('#'+currentScreen).hide();
	if (screenid=='screen_tray')
		refreshTray();
	$('#'+screenid).show();
	currentScreen = screenid;
}

function handleUserInput(ev) {
	$('.touched').removeClass('touched');
	
	console.log('handleUserInput=touch');
	var entry = getTouchedEntry(ev);
	if (entry!==undefined) {
		showEntryPopup(entry);
	}
	else if ($(ev.target).hasClass('option')) {
		handleOption(ev.target.id);
	}
	else if ($(ev.target).hasClass('optionsbutton')) {
		updateOptions();
		showScreen('screen_options');
	}
	else if ($(ev.target).hasClass('backbutton')) {
		showScreen('screen_tray');
	}
	else {
		var el = ev.target;
		while (el) {
			if ($(el).hasClass('touchable'))
				break;
			el = el.parentNode;
		}
		if (el && $(el).hasClass('optionvalue')) {
			handleOptionvalue(el);
		}
	}
}

function isKiosk() {
	return typeof kiosk != 'undefined' && kiosk !== undefined;
}

$( document ).ready(function() {
	$('#screen_requires_javascript').hide();
	$('#status').html('Loaded!');

	// fix initial visbilities
	$('.screen').css('visibility','visible');
	$('.screen').hide();
	showScreen('screen_tray');
	
	// initial file
	atomfile = "ost.xml"
	if (isKiosk()) {
		kioskFilePrefix = kiosk.getLocalFilePrefix();
		if (kioskFilePrefix==null) {
			alert('Could not get local file information: need local storage mounted');
			atomfile = "ost.xml"
		}
		else 
			atomfile = kioskFilePrefix+"/"+kiosk.getAtomFile();
			console.log('kiosk atomfile = '+atomfile);
	} else {
		if (urlParams['f']) {
	        atomfile = urlParams['f'];
		}
		else if (window.location.hash) 
			atomfile = decodeURIComponent(window.location.hash.substring(1));

		//alert('non-kiosk, try atomfile '+atomfile);
	}

	// initialise...
	initFileTypes();
	initOptions();
	updateOptions();
	
	$('.scrollhint').on('scroll', function(ev) { 
		updateScrollHints(ev.target);
	});
	
	if (isKiosk())
		$('#status').html('getWifiSsid()='+kiosk.getWifiSsid()+', getHostAddress()='+getHostAddress());
	else 
		$('#status').html('getHostAddress()='+getHostAddress());

	// touch listeners
	$( 'body' ).on('touchstart',function(ev) {
		console.log('touchstart '+ev);
		supportsTouch = true;
		var el = ev.target;
		while (el) {
			if ($(el).hasClass('touchable')) {
				$(el).addClass('touched');
				//vibrate();
				break;
			}
			el = el.parentNode;
		}
		mousedownEvent = { screenX: ev.originalEvent.touches[0].screenX, screenY: ev.originalEvent.touches[0].screenY, target: ev.target };
		mousemoved = false;
	});
	$( 'body' ).on('touchmove',function(ev) {
		//console.log('touch move page='+ev.originalEvent.touches[0].pageX+','+ev.originalEvent.touches[0].pageY+' screen='+ev.originalEvent.touches[0].screenX+','+ev.originalEvent.touches[0].screenY+' client='+ev.originalEvent.touches[0].clientX+','+ev.originalEvent.touches[0].clientY);
		//console.log('touchmove'+ev);
		if (ev.target!==mousedownEvent.target || 
				Math.abs(ev.originalEvent.touches[0].screenX-mousedownEvent.screenX)>MOUSE_MOVE_MIN ||
				Math.abs(ev.originalEvent.touches[0].screenY-mousedownEvent.screenY)>MOUSE_MOVE_MIN) {
			mousemoved = true;
			$('.touched').removeClass('touched');
		}
	});
	$( 'body' ).on('touchend',function(ev) {
		//console.log('touchend '+ev);
		$('.touched').removeClass('touched');
		if (!mousemoved)
			handleUserInput(ev);			
	});
	$( 'body' ).on('touchcancel',function(ev) {
		console.log('touchcancel '+ev);
		$('.touched').removeClass('touched');
	});
	// touchend, touchmove, touchcancel
	// mouse listeners
	$( 'body' ).on('mousedown',function(ev) {
		if (!supportsTouch) {
			console.log('mousedown at '+ev.screenX+','+ev.screenY+' on '+ev.target);
			mousedownEvent = { screenX: ev.screenX, screenY: ev.screenY, target: ev.target };
			mousemoved = false;
			if ($(ev.target).hasClass('touchable'))
				$(ev.target).addClass('touched');
		}
	});
	$( 'body' ).on('mousemove',function(ev) {
		if (!supportsTouch && mousedownEvent && (ev.target!==mousedownEvent.target || 
				Math.abs(ev.screenX-mousedownEvent.screenX)>MOUSE_MOVE_MIN ||
				Math.abs(ev.screenY-mousedownEvent.screenY)>MOUSE_MOVE_MIN)) {
			mousemoved = true;
			$('.touched').removeClass('touched');
		}
	});
	$( 'body' ).on('mouseup',function(ev) {
		if (!supportsTouch && !mousemoved) {
			handleUserInput(ev);
		}
	});
	
	// load test/initial entries
	$('#tray').empty();
	entries = [];
	
	loadInitialContent();
});

var cacheinfo = null;

function loadInitialContent() {
	var url = location.href;
	var ix = url.lastIndexOf('/');
	var prefix = '';
	if (ix>=0) {
		prefix = url.substring(0, ix+1);
		console.log('javascript loading prefix='+prefix);
	}
	var doLoadEntries = function() {		
		addEntries(atomfile);
	};
	doLoadEntries();
	console.log('local top-level cacheinfo');
	// _ost/cache.json ?
	/*$.ajax({
		url: prefix+'ost/cache.json',
		type: 'GET',
		dataType: 'json',
		timeout: 10000,
		success: function(data, textStatus, xhr) {
			console.log('ok, got top-level cache.json '+data);
			cacheinfo = data;
			doLoadEntries();
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log('error getting top-evel cache.json: '+textStatus+': '+errorThrown);
			doLoadEntries();
		}
	});
	*/
}
