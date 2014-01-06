# Atom file loader
Entry = require 'models/Entry'

addEntry = (entries, atomentry) ->
  id = $('id', atomentry).text()
  title = $('title', atomentry).text()
  iconurl = $('link[rel=\'alternate\'][type^=\'image\']', atomentry).attr('href')
  if not iconurl?
    console.log 'iconurl unknown for '+title 
  summary = $('content', atomentry).text()		
	
  entry = 
    id: id
    title: title
    iconurl: iconurl
    summary: summary
    #index, prefix, cacheinfo
    #entry.iconpath = getCachePath(entry, iconurl)

  entry.enclosures = []
  $('link[rel=\'enclosure\']', atomentry).each (index, el) ->
    type = $(el).attr 'type'
    href = $(el).attr 'href'
    if href?
      #path = getCachePath(entry, href);
      entry.enclosures.push {mime: type, url: href}
  entry.requiresDevice = []
  $('category[scheme=\'requires-device\']', atomentry).each (index, el) ->	
    device = $(el).attr 'term'
    if device?
      entry.requiresDevice.push device
  entry.supportsMime = []
  $('category[scheme=\'supports-mime-type\']', atomentry).each (index, el) ->
    mime = $(el).attr 'term'
    label = $(el).attr 'label'
    if mime?
      entry.supportsMime.push mime
      # TODO mime types?!
	
  $('category[scheme=\'visibility\']', atomentry).each (index, el) ->
    visibility = $(el).attr 'term'
    if visibility=='hidden'
      entry.hidden = true
      console.log 'entry visibility '+visibility+' (hidden='+entry.hidden+' for '+title
  $('category', atomentry).each (index, el) ->
    term= $(el).attr 'term'
    scheme = $(el).attr 'scheme' 
    console.log('category '+scheme+'='+term);

  e = new Entry entry
  entries.add e
  e

module.exports.load = (entries, atomurl) ->
  # abolute URL...
  if (atomurl.indexOf ':') < 0 
    console.log 'converting local name '+atomurl+' to global...'
    base = window.location.href;
    hi = base.indexOf '#'
    if (hi >= 0)
      base = base.substring 0,hi
    if (atomurl.indexOf '/') == 0 
      # absolute
      si = base.indexOf '//'
      si = if si<0 then 0 else si+2
      si = base.indexOf '/', si
      atomurl = (if si<0 then base else base.substring 0,si) + atomurl
    else 
      # relative
      si = base.lastIndexOf '/'
      atomurl = (if si<0 then base+'/' else base.substring 0,si+1) + atomurl
  console.log('loading entries from '+atomurl);
  # cache.json ?
  # shorturls.json ?
  $.ajax 
    url: atomurl
    type: 'GET'
    dataType: 'xml'
    timeout: 10000
    success: (data, textStatus, xhr) -> 
      console.log 'ok, got '+data
      $( data ).find('entry').each (index, el) ->
        addEntry entries, el
    error: (xhr, textStatus, errorThrown) ->
      console.log 'error, '+textStatus+': '+errorThrown	

