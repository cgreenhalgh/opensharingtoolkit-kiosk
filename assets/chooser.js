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
var deviceTypes = [ { term: "android", label: "Android", supportsMime: [ "text/html", "application/vnd.android.package-archive" ] },
                    { term: "ios", label: "iPhone", supportsMime: [ "text/html", "application/x-itunes-app" ] },
                    { term: "other", label: "Other smartphone", supportsMime: [ "text/html" ] },
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
// mime type -> label
var allFileTypes = new Object();
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

function addEntry(atomentry, prefix) {
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
	var entry = { title: title, iconurl: iconurl, summary: summary, index: index };
	entry.enclosures = [];
	$('link[rel=\'enclosure\']', atomentry).each(function(index, el) {
		var type = $(el).attr('type');
		var href = $(el).attr('href');
		if (href) {
			href = getPrefixedUrl(prefix,href);
			entry.enclosures.push({mime: type, url: href});
		}
	});
	entry.supportsMime = [];
	$('category[scheme=\'supports-mime-type\']', atomentry).each(function(index, el) {
		var mime = $(el).attr('term');
		var label = $(el).attr('label');
		if (mime) {
			entry.supportsMime.push(mime);
			if (!allFileTypes[mime]) 
				allFileTypes[mime] = { mime: mime, label: label };
			if (!allFileTypes[mime].icon || allFileTypes[mime].icon=="icons/_blank.png")
				allFileTypes[mime].icon = iconurl;
		}
	});
	entry.requiresDevice = [];
	$('category[scheme=\'requires-device\']', atomentry).each(function(index, el) {
		var device = $(el).attr('term');
		if (device) {
			entry.requiresDevice.push(device);
		}
	});
	
	entries[index] = entry;
	console.log('  entry['+index+']: '+title);
}
function refreshTray() {
	$('#tray').empty();
	for (var index in entries) {
		var entry = entries[index];
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
				addEntry(el, prefix);
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
	
	$('#entrypopup_options').append('<p class="option touchable" id="option_back">Back</p>');
	if (entry.enclosures.length>0) {
		// kiosk...?
		$('#entrypopup_options').append('<p class="option touchable" id="option_view">View</p>');
		
		if (isKiosk()) {
			$('#entrypopup_options').append('<p class="option touchable" id="option_send">Get on Phone</p>');			
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
	
function handleOption(optionid) {
	if ('option_back'==optionid) {
		// no-op (other than hide)
		currententry = null;
		showScreen('screen_tray');
	}
	else if ('option_view'==optionid) {
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
	else if ('option_send'==optionid) {
		var enc = currententry.enclosures[0];
		var url = enc.url;
		url = getExternalUrl(url);
		console.log('send '+currententry.title+' as '+url);
		// replace options...
		$('#entrypopup_options').empty();
		$('#entrypopup_options').append('<p class="option touchable" id="option_back">Back</p>');
		if (isKiosk()) {
			var ssid = kiosk.getWifiSsid();
			$('#entrypopup_options').append('<p class="option_info">Join Wifi Network <span class="ssid">'+ssid+'</span> and scan/enter...</p>');

			url = "http://"+getHostAddress()+":8080/a/phonehelper.html?mime="+
				encodeURIComponent(enc.mime)+"&url="+encodeURIComponent(url)+
				"&ssid="+encodeURIComponent(kiosk.getWifiSsid())+
				"&title="+encodeURIComponent(currententry.title);
			console.log('Using helper page url '+url);

			var redir = kiosk.registerTempRedirect(url, REDIRECT_LIFETIME_MS);
			url = "http://"+getHostAddress()+":8080"+redir;
			console.log('Using temp url '+url);
			
			$('#entrypopup_options').append('<img class="option_qrcode" src="http://localhost:8080/qr?url='+encodeURIComponent(url)+'&size=150" alt="qrcode for item">');
		} else {
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

// initialise the options screen 
function initOptions() {
	// phone types (term: label:)
	for (var di in deviceTypes) {
		var dt = deviceTypes[di];
		$('#option_device').append('<div id="option_device_'+dt.term+'" class="optionvalue touchable"><img src="icons/emptybox.png" alt="blank" class="optionvalueicon"><div class="optionvaluelabel">'+dt.label+'</div></div>');
	}
	$('#option_device').append('<div id="option_device_any" class="optionvalue touchable"><img src="icons/emptybox.png" alt="blank" class="optionvalueicon"><div class="optionvaluelabel">Any!</div></div>');
}
// update the options screen
function updateOptions() {
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
				'class="optionvalueicon"><div class="optionvaluelabel">'+
				mt.label+'</div></div>');
		$('#'+id).data('mime', mt.mime);
		//console.log('added option for media type '+mt.mime);
	}
	//$('#option_mediatype').append('<div id="option_device_any" class="optionvalue touchable"><img src="icons/emptybox.png" alt="blank" class="optionvalueicon"><div class="optionvaluelabel">Any!</div></div>');
}
function handleOptionvalue(el) {
	var id = el.id;
	console.log('handleOptionvalue('+id+')');
	if (!id)
		return;
	if (id.indexOf('option_device_')==0) {
		var dev = id.substring('option_device_'.length);
		console.log('select device '+dev);
		if (dev=='any')  {
			delete options.device;
			// initialise mediatype options for any device
			options.mediatypes = new Object();
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
			for (var mti in allFileTypes) {
				var mt = allFileTypes[mti];
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
		}
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

	$('#screen_debug').hide();
	
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
	
	addEntries('test/test.xml');
});
