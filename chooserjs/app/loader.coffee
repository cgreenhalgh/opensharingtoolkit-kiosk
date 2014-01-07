# Atom file loader
Entry = require 'models/Entry'

getCachePath = (url,cacheFiles,prefix) ->
  if url?
    file = cacheFiles[url]
    if file? 
      prefix+file.path
    else
      null
  else
    null

addEntry = (entries, atomentry, atomurl, prefix, baseurl, cacheFiles) ->
  id = $('id', atomentry).text()
  title = $('title', atomentry).text()
  iconurl = $('link[rel=\'alternate\'][type^=\'image\']', atomentry).attr('href')
  if not iconurl?
    console.log 'iconurl unknown for '+title
  iconpath = getCachePath iconurl, cacheFiles, prefix
  summary = $('content', atomentry).text()		
	
  entry = 
    id: id
    title: title
    iconurl: iconurl
    iconpath: iconpath
    summary: summary
    baseurl: baseurl
    #index, prefix, cacheinfo

  entry.enclosures = []
  $('link[rel=\'enclosure\']', atomentry).each (index, el) ->
    type = $(el).attr 'type'
    href = $(el).attr 'href'
    if href?
      path = getCachePath href, cacheFiles, prefix
      entry.enclosures.push {mime: type, url: href, path: path}
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

  entry.thumbnails = []
  # namespace media: explicitly by media|thumbnail, or explicit wildcard by *|thumbnail
  $('thumbnail', atomentry).each (index, el) ->
    url = $(el).attr 'url'
    if url?
      path = getCachePath url, cacheFiles, prefix
      entry.thumbnails.push { url: url, path: path }

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

# convert cache files entries, to map by url
getCacheFileMap = (cache) ->
  map = {}
  if not cache? or not cache.files?
    return map
  for f in cache.files
    if f.url?
      map[f.url] = f
  map

loadCache = (entries,atomurl,prefix) ->
  cacheurl = prefix + 'cache.json'
  console.log "Loading cache info from #{cacheurl}"
  $.ajax
    url: cacheurl
    type: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: (data, textStatus, xhr) ->
      console.log 'ok, got cache.json'
      loadShorturls entries, atomurl, prefix, data.baseurl, getCacheFileMap(data)
    error: (xhr, textStatus, errorThrown) ->
      console.log 'error getting cache.json: '+textStatus+': '+errorThrown
      loadShorturls entries, atomurl, prefix, null, {}

# convert short urls to map by url
addShorturls = (sus,map) ->
  for su in sus
    if su.url? and su.shorturl?
      map[su.url] = su.shorturl

loadShorturls = (entries, atomurl, prefix, baseurl, cacheFiles) ->
  shorturlsurl = prefix + 'shorturls.json'
  console.log "Loading shorturls from #{shorturlsurl}"
  $.ajax
    url: shorturlsurl
    type: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: (data, textStatus, xhr) ->
      console.log 'ok, got shorturls.json'
      addShorturls data,entries.shorturls
      loadEntries entries, atomurl, prefix, baseurl, cacheFiles
    error: (xhr, textStatus, errorThrown) ->
      console.log 'error getting shorturls.json: '+textStatus+': '+errorThrown
      loadEntries entries, atomurl, prefix, baseurl, cacheFiles

get_baseurl = (data) ->
  feedurl = $('link[rel=\'self\']', data).attr('href')
  if not feedurl?
    return null
  else
    ix = feedurl.lastIndexOf '/'
    baseurl = feedurl.slice 0,ix+1
    console.log 'Base URL = '+baseurl
    return baseurl


loadEntries = (entries,atomurl,prefix,baseurl,cacheFiles) ->  
  console.log('loading entries from '+atomurl);
  # shorturls.json ?
  $.ajax 
    url: atomurl
    type: 'GET'
    dataType: 'xml'
    timeout: 10000
    success: (data, textStatus, xhr) -> 
      console.log 'ok, got '+data
      # link self -> baseurl
      feedbaseurl = get_baseurl data
      baseurl = feedbaseurl ? baseurl
      $( data ).find('entry').each (index, el) ->
        addEntry entries, el, atomurl, prefix, baseurl, cacheFiles
    error: (xhr, textStatus, errorThrown) ->
      console.log 'error, '+textStatus+': '+errorThrown	

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
  # cache.json -> shorturls.json -> atomurl
  si = atomurl.lastIndexOf '/'
  prefix = if si<0 then '' else atomurl.substring 0,si+1
  loadCache entries, atomurl, prefix

