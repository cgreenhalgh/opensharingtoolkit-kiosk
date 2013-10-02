// chooser.js - Javascript for kiosk chooser view.
// work in progress...

// standard file types
// Note: application/x-itunes-app is a made-up mime type for consistency
var standardFileTypes = [ { mime: "application/pdf", ext: "pdf", icon: "icons/pdf.png", label: "PDF" },
                          { mime: "text/html", ext: "html", icon: "icons/html.png", label: "HTML" },
                          { mime: "application/vnd.android.package-archive", ext: "apk", icon: "icons/get_it_on_google_play.png", name: "Android app" },
                          { mime: "application/x-itunes-app", icon: "icons/available_on_the_app_store.png", label: "iPhone app" },
                          ];
// main device types and standard (built-in supported) mime types.
// Note: application/x-itunes-app is a made-up mime type for consistency
var deviceTypes = [ { term: "android", label: "Android", supportsMime: [ "text/html", "application/vnd.android.package-archive" ] },
                    { term: "ios", label: "iPhone", supportsMime: [ "text/html", "application/x-itunes-app" ] } ];

function getHostAddress() {
	if (kiosk!==undefined) 
		return kiosk.getHostAddress();
	console.log('Note: kiosk undefined');
	return "localhost";
}

// entry type:
// { title:, iconurl:, summary:, index:, enclosures: [{mime:, url:}], 
//   supportsMime:["..."], requiresDevice:["..."] }
var entries = [];
// mime type -> label
var customMimeTypeLabels = new Object;
var mousedownEvent = null;
var mousemoved = false;
var MOUSE_MOVE_MIN = 10;
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
			customMimeTypeLabels[mime] = label;
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
	$('#tray').append('<div id="entry_'+index+'" class="entry"><p class="entrytitle">'+title+'</p>'+
			'<div class="entryicon"><img src="icons/loading.gif" alt="loading" class="loading entryicon"></div>'+
			'</div>');
	// replace icon with actual one; 
	// TODO handle load delay?
	$('div#entry_'+index+' .entryicon img', tray).replaceWith('<img src="'+iconurl+'" alt="'+title+' icon" class="entryicon">');
	//console.log('icon = '+iconurl);
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
		for (var si in standardFileTypes) {
			var sft = standardFileTypes[si];
			if (sft.mime==enc.mime && sft.icon) {
				iconurl = sft.icon;
				break;
			}
		}
		// custom file types => use application icon
		if (!iconurl) {
			for (var eni in entries) {
				var en2 = entries[eni];
				if (en2.supportsMime.indexOf(enc.mime)>=0 && en2.iconurl) {
					iconurl = en2.iconurl;
				}
			}
		}
		// fall-back
		if (!iconurl)
			iconurl = 'icons/_blank.png';
		
		console.log('requires '+iconurl);
		$('#entrypopup_requires').append('<img src="'+iconurl+'" alt="'+enc.mime+'" class="entrypopup_requires_mime">');		
	}
	// device label(s)
	for (var di in deviceTypes) {
		var dt = deviceTypes[di];
		if (entry.requiresDevice.indexOf(dt.term)>=0) {
			console.log('requires '+dt.term);
			$('#entrypopup_requires').append('<div class="entrypopup_requires_device">'+dt.label+'</div>');
		}
	}
	$('#entrypopup_requires').append('<div id="entrypopup_requires_end"></div>');
	// options...
	$('#entrypopup_options').empty();
	
	$('#entrypopup_options').append('<p class="option" id="option_back">Back</p>');
	if (entry.enclosures.length>0) {
		// kiosk...?
		$('#entrypopup_options').append('<p class="option" id="option_view">View</p>');
		
		if (kiosk!==undefined) {
			$('#entrypopup_options').append('<p class="option" id="option_send">Get on Phone</p>');			
		}
	}	
	$('#entrypopup').css('visibility','visible');
	$('#entrypopup').show();

	updateScrollHints();
}

// convert possibly internal URL to simple external/global URL
function getExternalUrl(url) {
	if (kiosk!==undefined) {
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
	if (kiosk!==undefined) {
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
		$('#entrypopup').hide();
	}
	else if ('option_view'==optionid) {
		var enc = currententry.enclosures[0];
		var url = enc.url;
		console.log('view '+currententry.title+' as '+url);
		var done = false;
		if (kiosk!==undefined) {
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
		$('#entrypopup').hide();
	}
	else if ('option_send'==optionid) {
		var enc = currententry.enclosures[0];
		var url = enc.url;
		url = getExternalUrl(url);
		console.log('send '+currententry.title+' as '+url);
		// replace options...
		$('#entrypopup_options').empty();
		$('#entrypopup_options').append('<p class="option" id="option_back">Back</p>');
		if (kiosk!==undefined) {
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

$( document ).ready(function() {
	$('#status').html('Loaded!');

	$('.scrollhint').on('scroll', function(ev) { 
		updateScrollHints(ev.target);
	});
	
	if (kiosk!==undefined)
		$('#status').html('getWifiSsid()='+kiosk.getWifiSsid()+', getHostAddress()='+getHostAddress());
	else 
		$('#status').html('getHostAddress()='+getHostAddress());
		
	// touch listeners
	$( 'body' ).on('touchstart',function(ev) {
		console.log('touchstart '+ev);
		var entry= getTouchedEntry(ev);
		if (entry!==undefined)
			$('div#entry_'+entry.index).addClass('entrytouched');
		if ($(ev.target).hasClass('option'))
			$(ev.target).addClass('optiontouched');
	});
	$( 'body' ).on('touchmove',function(ev) {
		console.log('touchmove'+ev);
	});
	$( 'body' ).on('touchend',function(ev) {
		console.log('touchend '+ev);
		$('div.entry').removeClass('entrytouched');
		$('.optiontouched').removeClass('optiontouched');
	});
	$( 'body' ).on('touchcancel',function(ev) {
		console.log('touchcancel '+ev);
	});
	// touchend, touchmove, touchcancel
	// mouse listeners
	$( 'body' ).on('mousedown',function(ev) {
		console.log('mousedown at '+ev.pageX+','+ev.pageY+' on '+ev.target);
		mousedownEvent = { pageX: ev.pageX, pageY: ev.pageY, target: ev.target };
		mousemoved = false;
		var entry= getTouchedEntry(ev);
		if (entry!==undefined)
			$('div#entry_'+entry.index).addClass('entrytouched');
	});
	$( 'body' ).on('mousemove',function(ev) {
		if (mousedownEvent!==null && 
				(Math.abs(ev.pageX-mousedownEvent.pageX)>MOUSE_MOVE_MIN ||
				Math.abs(ev.pageY-mousedownEvent.pageY)>MOUSE_MOVE_MIN)) {
			mousemoved = true;
			$('div.entry').removeClass('entrytouched');
		}
	});
	$( 'body' ).on('mouseup',function(ev) {
		$('div.entry').removeClass('entrytouched');
		if (mousedownEvent!==null && 
				(Math.abs(ev.pageX-mousedownEvent.pageX)>MOUSE_MOVE_MIN ||
				Math.abs(ev.pageY-mousedownEvent.pageY)>MOUSE_MOVE_MIN))
			mousemoved = true;
		if (!mousemoved) {
			console.log('mouseup=touch (target equal? '+(mousedownEvent.target===ev.target)+')');	
			var entry = getTouchedEntry(ev);
			if (entry!==undefined) {
				showEntryPopup(entry);
			}
			if ($(ev.target).hasClass('option')) {
				handleOption(ev.target.id);
			}
		}
		else
			console.log('mouseup moved');
	});
	
	// load test/initial entries
	$('#tray').empty();
	entries = [];
	
	addEntries('test/test.xml');
});
