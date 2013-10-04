// chooser.js - Javascript for kiosk chooser view.
// work in progress...

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

var kioskMode = false;
var localNetworkMode = false;

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

function getPrefixedUrl(prefix, href) {
	if (href.indexOf(':')<0 && href.indexOf('/')!=0) {
		// no scheme and doesn't start with /
		href = prefix+href;
		// TODO relative ..?
	}
	return href;
}

function addEntry(atomentry, prefix, cacheinfo) {
	index = entries.length;
	var title = $('title', atomentry).text();
	var iconurl = $('link[rel=\'alternate\'][type^=\'image\']', atomentry).attr('href');
	if (!iconurl) {
		iconurl = "icons/_blank.png";
		console.log('iconurl unknown for '+title);
	} else {
		iconurl = getPrefixedUrl(prefix, iconurl);
	}
	var summary = $('summary', atomentry).text();	
	var entry = { title: title, iconurl: iconurl, summary: summary, index: index, prefix: prefix, cacheinfo: cacheinfo };
	entry.enclosures = [];
	$('link[rel=\'enclosure\']', atomentry).each(function(index, el) {
		var type = $(el).attr('type');
		var href = $(el).attr('href');
		if (href) {
			href = getPrefixedUrl(prefix,href);
			entry.enclosures.push({mime: type, url: href});
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
				allFileTypes[mime].icon = iconurl;
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
function refreshTray() {
	$('#tray').empty();
	for (var index in entries) {
		var entry = entries[index];
		if (entry.hidden)
			continue;
		// filter
		var title = entry.title;
		var iconurl = entry.iconurl;
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
	// ost/cache.json ?
	$.ajax({
		url: prefix+'ost/cache.json',
		type: 'GET',
		dataType: 'json',
		timeout: 10000,
		success: function(data, textStatus, xhr) {
			console.log('ok, got cache.json '+data);
			loadAtomFile(atomurl, prefix, data);
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log('error getting cache.json: '+textStatus+': '+errorThrown);
			loadAtomFile(atomurl, prefix, null);
		}
	});
	// ost/shorturls.json ?
	$.ajax({
		url: prefix+'ost/shorturls.json',
		type: 'GET',
		dataType: 'json',
		timeout: 10000,
		success: function(data, textStatus, xhr) {
			console.log('ok, got '+prefix+'ost/shorturls.json '+data);
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
			console.log('error getting '+prefix+'ost/shorturls.json: '+textStatus+': '+errorThrown);
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

	$('#entrypopup_icon img').replaceWith('<img src="'+entry.iconurl+'" alt="'+entry.title+' icon" class="entrypopup_icon">');
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
		$('#entrypopup_options').append('<p class="option touchable" id="option_view">View</p>');
		
		if (isKiosk() || kioskMode) {
			$('#entrypopup_options').append('<p class="option touchable" id="option_send">Get on Phone</p>');
		}
		if (!isKiosk()) {
			$('#entrypopup_options').append('<p class="option touchable" id="option_get">Get on this device</p>');			
		}
	}	
	showScreen('screen_entrypopup');

	updateScrollHints();
}

// convert possibly internal URL to simple external/global URL
function getExternalUrl(url) {
	if (isKiosk()) {
		// convert to external URL
		if (url.indexOf(':')<0) {
			if (location.href.indexOf('file:///android_asset/'==0)) {
				if (url.indexOf('/')!=0)
					url = '/'+url;
				url = 'http://'+kiosk.getHostAddress()+':'+kiosk.getPort()+'/a'+url;
			}
		}
	} 
	return url;
}
function getInternalUrl(url) {
	if (isKiosk()) {
		// convert to external URL
		if (url.indexOf(':')<0) {
			if (location.href.indexOf('file:///android_asset/'==0)) {
				if (url.indexOf('/')!=0)
					url = '/'+url;
				url = 'http://localhost:'+kiosk.getPort()+'/a'+url;
			}
		}
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
		var enc = currententry.enclosures[0];
		var url = enc.url;
		console.log('view '+currententry.title+' as '+url);
		var done = false;
		if (isKiosk()) {
			url = getInternalUrl(url);
			// try kiosk open...
			done = kiosk.openUrl(url, enc.mime, location.href);
		} 
		else
			url = getExternalUrl(url);

		if (!done) {
			// if we are kiosk this is usually wrong 
			window.open(url,'_self','',false);
		}
		showScreen('screen_tray');
	}
	else if ('option_get'==optionid) {
		// non-kiosk only!
		var enc = currententry.enclosures[0];
		var url = enc.url;
		url = getExternalUrl(url);
		console.log('get '+currententry.title+' as '+url);

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
	else if ('option_send'==optionid) {		
		
		var enc = currententry.enclosures[0];
		var url = enc.url;

		if (isKiosk() && localNetworkMode) {
			url = getExternalUrl(url);
		} 
		else {
			// need device!
			if (options.device===undefined) {
				showScreen('screen_options');
				alert('Please select you phone type first');
				return;
			}
			
			var url2 = url;
			// remove prefix?
			if (currententry.prefix && url2.indexOf(currententry.prefix)==0)
				url2 = url.substring(currententry.prefix.length);
			
			if (url2.indexOf(':')<0 && currententry.cacheinfo && currententry.cacheinfo.baseurl) {

				// not absolute, had cacheinfo with baseurl...
				if (currententry.cacheinfo.baseurl.lastIndexOf('/')!=currententry.cacheinfo.baseurl.length-1) {
					url2 = '/'+url2;
				}
				url = currententry.cacheinfo.baseurl+url2;
				console.log('using cache baseurl for '+url);
			}
			url = getExternalUrl(url);
		}
		
		console.log('send '+currententry.title+' as '+url);
		// replace options...
		$('#entrypopup_options').empty();

		var as = getAppUrls(enc.mime);

		// url for get helper - needs to be made transferable...
		var geturl = "get.html";

		var baseurl = location.href;
		var ix = baseurl.lastIndexOf('/');
		if (ix>=0)
			baseurl = baseurl.substring(0,ix+1);

		if (isKiosk() && localNetworkMode) {
			geturl = 'http://'+getHostAddress()+':8080/a/get.html';
		}
		else if (cacheinfo && cacheinfo.baseurl) {
			if (cacheinfo.baseurl.lastIndexOf('/')!=cacheinfo.baseurl.length-1)
				geturl = '/'+geturl
			geturl = cacheinfo.baseurl+geturl;
		} else  if (isKiosk() && (baseurl.indexOf('localhost')>=0 || baseurl.indexOf('file:///android_asset/')==0)) {
			// localhost would be bad!
			// as would using a file asset url
			geturl = 'http://'+getHostAddress()+':8080/a/get.html';
		} else {
			// work with relative
			geturl = baseurl+geturl;
		}
		console.log('using geturl '+geturl);

		url = geturl+'?'+
		'u='+encodeURIComponent(url)+
		'&t='+encodeURIComponent(currententry.title);
		for (var ai in as) {
			url = url+'&a='+encodeURIComponent(as[ai]);
		}
		console.log('Using helper page url '+url);

		// back is handled in title bar
		if (isKiosk()) {
			
			if (localNetworkMode) {
				var ssid = kiosk.getWifiSsid();
				$('#entrypopup_options').append('<p class="option_info">Join Wifi Network <span class="ssid">'+ssid+'</span> and scan/enter...</p>');

				url = url+'&n='+encodeURIComponent(kiosk.getWifiSsid());
				console.log('with network '+ssid);

				// temporary redirect for short URL
				var redir = kiosk.registerTempRedirect(url, REDIRECT_LIFETIME_MS);
				url = "http://"+getHostAddress()+":8080"+redir;
				console.log('Using temp url '+url);
			}
			else {
				$('#entrypopup_options').append('<p class="option_info">Enable internet access and scan/enter...</p>');

				console.log('Using helper page url '+url);
				
				if (shorturls[url]) {
					url = shorturls[url];
					console.log('using shorturl '+url);
				}
			}
			
			$('#entrypopup_options').append('<img class="option_qrcode" src="http://localhost:8080/qr?url='+encodeURIComponent(url)+'&size=150" alt="qrcode for item">');
		} else {
			$('#entrypopup_options').append('<p class="option_info">Enable internet access and scan/enter...</p>');

			if (shorturls[url]) {
				url = shorturls[url];
				console.log('using shorturl '+url);
			}
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
options.mediatypes = new Object();
var hostDevice = 'any';

// initialise the options screen 
function initOptions() {
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
		setOptionDevice(dev);
		$('#option_device_holder').hide();
	}
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
		if (localNetworkMode)
			$('#option_localnetwork_mode img').attr('src', 'icons/tick.png');
		else
			$('#option_localnetwork_mode img').attr('src', 'icons/emptybox.png');
	}
	else {
		$('#option_kiosk_holder').show();
		$('#option_localnetwork_holder').hide();
		if (kioskMode)
			$('#option_kiosk_mode img').attr('src', 'icons/tick.png');
		else
			$('#option_kiosk_mode img').attr('src', 'icons/emptybox.png');
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
				$('#'+id).append('<img src="'+app.iconurl+'" alt="requires '+app.title+'" class="optionvalue_requires_app touchable">');
			}
		}
		$('#'+id).append('<div class="optionvaluelabel">'+mt.label+'</div>')
		$('#'+id).append('<div class="optionvalueend"></div>')
		//console.log('added option for media type '+mt.mime);
	}
	//$('#option_mediatype').append('<div id="option_device_any" class="optionvalue touchable"><img src="icons/emptybox.png" alt="blank" class="optionvalueicon"><div class="optionvaluelabel">Any!</div></div>');
}
function checkFileTypeSupport(mt, deviceType) {
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
}
function setOptionDevice(dev) {
	if (dev=='any')  {
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
			updateOptions();
		}
	}
	else if (id=='option_kiosk_mode') {
		// toggle
		kioskMode = !kioskMode;
		console.log('toggle kioskMode, now '+kioskMode);
		if (kioskMode)
			$('#option_device_holder').show();
		else {
			setOptionDevice(hostDevice);
			$('#option_device_holder').hide();
		}
		updateOptions();
	}
	else if (id=='option_localnetwork_mode') {
		// toggle
		localNetworkMode = !localNetworkMode;
		console.log('toggle localNetworkMode, now '+localNetworkMode);
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
	
	// initialise...
	initFileTypes();
	initOptions();
	
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
		addEntries('test/_ost.xml');
	};
	console.log('local top-level cacheinfo');
	// _ost/cache.json ?
	$.ajax({
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

}
