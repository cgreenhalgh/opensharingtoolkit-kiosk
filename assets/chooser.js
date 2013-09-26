// chooser.js - Javascript for kiosk chooser view.
// work in progress...

$( document ).ready(function() {
	$('#status').html('Loaded!');
	console.log('try to get test.xml...');
	$.ajax({
		url: 'test.xml',
		type: 'GET',
		dataType: 'xml',
		timeout: 10000,
		success: function(data, textStatus, xhr) {
			console.log('ok, got '+data);
			
			$( data ).find('entry').each(function(index, el) {
				console.log('  entry['+index+']: '+$('title', el).text());
			});
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log('error, '+textStatus+': '+errorThrown);
		}
		});
});
