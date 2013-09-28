// chooser.js - Javascript for kiosk chooser view.
// work in progress...

function getHostAddress() {
	if (kiosk!==undefined) 
		return kiosk.getHostAddress();
	console.log('Note: kiosk undefined');
	return "127.0.0.1";
}

var entries = [];
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

function addEntry(atomentry) {
	index = entries.length;
	var title = $('title', atomentry).text();
	var iconurl = $('link[rel=\'alternate\'][type^=\'image\']', atomentry).attr('href');
	if (!iconurl) {
		iconurl = "_blank.png";
		console.log('iconurl unknown for '+title);
	}
	var summary = $('summary', atomentry).text();	
	var entry = { title: title, iconurl: iconurl, summary: summary, index: index };
	entry.enclosures = [];
	$('link[rel=\'enclosure\']', atomentry).each(function(index, el) {
		var type = $(el).attr('type');
		var href = $(el).attr('href');
		if (href) {
			entry.enclosures.push({mimeType: type, url: href});
		}
	});
	
	entries[index] = entry;
	console.log('  entry['+index+']: '+title);
	$('#tray').append('<div id="entry_'+index+'" class="entry"><p class="entrytitle">'+title+'</p>'+
			'<div class="entryicon"><img src="loading.gif" alt="loading" class="loading entryicon"></div>'+
			'</div>');
	// replace icon with actual one; 
	// TODO handle load delay?
	$('div#entry_'+index+' .entryicon img', tray).replaceWith('<img src="'+iconurl+'" alt="'+title+' icon" class="entryicon">');
	//console.log('icon = '+iconurl);
}

function addEntries(atomurl) {
	console.log('loading entries from '+atomurl);
	var tray = $('#tray');
	// add loading animation
	tray.append('<img src="loading.gif" alt="loading" class="loading">');
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
				addEntry(el);
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

	// options...
	$('#entrypopup_options').empty();
	
	$('#entrypopup_options').append('<p class="option" id="option_back">Back</p>');
	if (entry.enclosures.length>0)
		// kiosk...?
		$('#entrypopup_options').append('<p class="option" id="option_view">View</p>');
	
	$('#entrypopup').css('visibility','visible');
	$('#entrypopup').show();
}

function handleOption(optionid) {
	$('#entrypopup').hide();
	if ('option_back'==optionid) {
		// no-op (other than hide)
		currententry = null;
	}
	else if ('option_view'==optionid) {
		// TODO view current entry
		var enc = currententry.enclosures[0];
		var url = enc.url;
		console.log('view '+currententry.title+' as '+url);
		var done = false;
		if (kiosk!==undefined) {
			if (url.indexOf(':')<0) {
				if (location.href.indexOf('file:///android_asset/'==0)) {
					if (url.indexOf('/')!=0)
						url = '/'+url;
					url = 'http://'+kiosk.getHostAddress()+':'+kiosk.getPort()+'/a'+url;
					console.log('open asset '+enc.url+' as '+url);
				}
			}
			done = kiosk.openUrl(url, enc.mimeType, location.href);
		} 
		if (!done) {
			window.open(url,'_self','',false);
		}
	}
}

$( document ).ready(function() {
	$('#status').html('Loaded!');

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
	
	addEntries('test.xml');
});
