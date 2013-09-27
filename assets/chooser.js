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

function getTouchedEntry(ev) {
	var el = ev.target;
	while (el) {
		var id = el.id;
		console.log('- check target '+el+' ('+id+')');
		if (id && id.indexOf('entry_')==0)
			break;
		el = el.parentNode;
	}
	if (el) {
		var index = el.id.substring(6);
		console.log('touch entry '+index);
		return index;
	}
	return undefined;
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
				index = entries.length;
				entries[index] = el;
				var title = $('title', el).text();
				console.log('  entry['+index+']: '+title);
				var iconurl = $('link[rel=\'alternate\'][type^=\'image\']', el).attr('href');
				
				$('#tray').append('<div id="entry_'+index+'" class="entry"><p class="entrytitle">'+title+'</p>'+
						'<div class="entryicon"><img src="loading.gif" alt="loading" class="loading"></div>'+
						'</div>');
				// replace icon with actual one; 
				if (iconurl) {
					$('div.entryicon img', tray).replaceWith('<img src="'+iconurl+'" alt="'+title+' icon" class="entryicon">');
					console.log('icon = '+iconurl);
				// TODO default
				}
				else
					console.log('iconurl unknown for '+title);
			});
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log('error, '+textStatus+': '+errorThrown);
			// remove loading animation
			$( '>img[class=\'loading\']:first', tray).remove();
		}
		});
	
}

$( document ).ready(function() {
	$('#status').html('Loaded!');

	$('#status').html('getHostAddress()='+getHostAddress());

	// touch listeners
	$( 'body' ).on('touchstart',function(ev) {
		console.log('touchstart '+ev);
	});
	$( 'body' ).on('touchmove',function(ev) {
		console.log('touchmove'+ev);
	});
	$( 'body' ).on('touchend',function(ev) {
		console.log('touchend '+ev);
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
		var index = getTouchedEntry(ev);
		if (index!==undefined)
			$('div#entry_'+index).addClass('entrytouched');
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
			var index = getTouchedEntry(ev);
			if (index!==undefined) {
				// ...
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
