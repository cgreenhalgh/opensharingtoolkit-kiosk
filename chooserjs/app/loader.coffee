# Atom file loader
Entry = require 'models/Entry'
Mimetype = require 'models/Mimetype'
Devicetype = require 'models/Devicetype'
#parse_url = (require 'url').parse

kiosk = require 'kiosk'
recorder = require 'recorder'

getCachePath = (url,cacheFiles,prefix) ->
  if url?
    file = cacheFiles[url]
    if file? and file.path?
      prefix+file.path
    else 
      #purl = parse_url url
      #if not purl.protocol and not purl.host and pathname.indexOf('/')!=0
      #  # relative url
      #  console.log "Relative url #{url} assumed cached"
      #  prefix+url
      #else
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
      if path? and type?
        kiosk.registerMimeType path,type
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
      # new mime type?
      if not (window.mimetypes.find (mt)->mt.attributes.mime==mime)?
        console.log "add mimetype #{mime} #{label}" 
        mt = { mime: mime, label: label, icon: iconpath ?= iconurl }
        window.mimetypes.add new Mimetype mt

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

addDevice = (devicename,deviceinfo) ->
  devicetype = window.options.attributes.devicetypes.get(devicename)
  if not devicetype?
    console.log "Add device #{devicename}"
    devicetype = new Devicetype
      id: devicename
      term: devicename
      label: deviceinfo.label ?= devicename
      supportsMime: deviceinfo.supportsMime ?= []
      optionalSupportsMime: deviceinfo.optionalSupportsMime ?= []
      helpHtml: deviceinfo.helpHtml ?= "Sorry, can't tell you much about device type #{devicename}."
      userAgentPattern: deviceinfo.userAgentPattern ?= null
    # keep other at end
    window.options.attributes.devicetypes.add devicetype, {at:(window.options.attributes.devicetypes.length-1)}
  else
    console.log "Update device #{devicename}"
    if deviceinfo.label?
      devicetype.set label: deviceinfo.label
    if deviceinfo.supportsMime?
      devicetype.set supportsMime: deviceinfo.supportsMime
    if deviceinfo.optionalSupportsMime?
      devicetype.set optionalSupportsMime: deviceinfo.optionalSupportsMime
    if deviceinfo.label?
      devicetype.set helpHtml: deviceinfo.helpHtml
    if deviceinfo.userAgentPattern?
      devicetype.set userAgentPattern: deviceinfo.userAgentPattern

loadDevices = (entries,atomurl,prefix,donefn) ->
  devicesurl = prefix + 'devices.json'
  console.log "Loading devices info from #{devicesurl}"
  $.ajax
    url: devicesurl
    type: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: (data, textStatus, xhr) ->
      console.log "ok, got #{devicesurl}"
      for dn,dtinfo of data
        addDevice dn,dtinfo
      if not kiosk.isKiosk()
        # default device
        devicetype = window.options.getBrowserDevicetype()
        if devicetype?
          console.log 'set non-kiosk devicetype to '+devicetype.attributes.term
          options.set devicetype: devicetype
      loadMimetypes entries, atomurl, prefix,donefn
    error: (xhr, textStatus, errorThrown) ->
      console.log "error getting #{devicesurl}: #{textStatus}: #{errorThrown}"
      loadMimetypes entries, atomurl, prefix,donefn

addMimetype = (mime,mtinfo) ->
  mimetype = window.mimetypes.get(mime)
  if not mimetype?
    console.log "Add mimetype #{mime}"
    mimetype = new Mimetype
       id: mime
       icon: mtinfo.icon ?= 'icons/unknown.png' 
       label: mtinfo.label ?= mime
       mime: mime
       ext: mtinfo.ext ?= if mtinfo.exts?.length > 0 then mtinfo.exts[0] else undefined 
       compat: mtinfo.compat
    # keep other at end
    window.mimetypes.add mimetype
    if mtinfo.compat?
      for dt,dtcompat of mtinfo.compat
        kiosk.registerMimetypeCompat mime,dt,dtcompat
  else
    console.log "Update mimetype #{mime}"
    if not mimetype.compat?
      mimetype.compat = {}
    if mtinfo.compat?
      for dt,dtcompat of mtinfo.compat
        if mimetype.compat[dt]?
          console.log "Update mimetype compatibility of #{mime} with #{dt}"
        #if not mimetype.compat[dt]?
        mimetype.compat[dt] = dtcompat    
        kiosk.registerMimetypeCompat mime,dt,dtcompat

loadMimetypes = (entries,atomurl,prefix,donefn) ->
  mimetypesurl = prefix + 'mimetypes.json'
  console.log "Loading devices info from #{mimetypesurl}"
  $.ajax
    url: mimetypesurl
    type: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: (data, textStatus, xhr) ->
      console.log "ok, got #{mimetypesurl}"
      for mt,mtinfo of data
        addMimetype mt,mtinfo
      loadCache entries, atomurl, prefix,donefn
    error: (xhr, textStatus, errorThrown) ->
      console.log "error getting #{mimetypesurl}: #{textStatus}: #{errorThrown}"
      loadCache entries, atomurl, prefix,donefn

# mimetype icons may be from Internet; use cache if possible
fixMimetypeIcons = (cacheFiles,prefix) ->
  window.mimetypes.forEach (mt)->
    if mt.attributes.icon? 
      iconpath = getCachePath mt.attributes.icon, cacheFiles, prefix
      if iconpath?
        console.log "Fix mimetype #{mt.attributes.mime} icon #{mt.attributes.icon} -> #{iconpath}"
        mt.attributes.icon = iconpath

loadCache = (entries,atomurl,prefix,donefn) ->
  cacheurl = prefix + 'cache.json'
  console.log "Loading cache info from #{cacheurl}"
  $.ajax
    url: cacheurl
    type: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: (data, textStatus, xhr) ->
      console.log 'ok, got cache.json'
      cacheFiles = getCacheFileMap(data)
      fixMimetypeIcons cacheFiles,prefix
      loadShorturls entries, atomurl, prefix, data.baseurl, cacheFiles,donefn
    error: (xhr, textStatus, errorThrown) ->
      console.log 'error getting cache.json: '+textStatus+': '+errorThrown
      loadShorturls entries, atomurl, prefix, null, {},donefn

# convert short urls to map by url
addShorturls = (sus,map) ->
  for su in sus
    if su.url? and su.shorturl?
      map[su.url] = su.shorturl
      if su.shorturl.indexOf('http://')==0
        ix = su.shorturl.indexOf('/',7)
        if ix>7
          kiosk.registerExternalRedirect su.shorturl.substring(7,ix), su.shorturl.substring(ix), su.url

loadShorturls = (entries, atomurl, prefix, baseurl, cacheFiles,donefn) ->
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
      loadEntries entries, atomurl, prefix, baseurl, cacheFiles,donefn
    error: (xhr, textStatus, errorThrown) ->
      console.log 'error getting shorturls.json: '+textStatus+': '+errorThrown
      loadEntries entries, atomurl, prefix, baseurl, cacheFiles,donefn

get_baseurl = (data) ->
  feedurl = $('link[rel=\'self\']', data).attr('href')
  if not feedurl?
    return null
  else
    ix = feedurl.lastIndexOf '/'
    baseurl = feedurl.slice 0,ix+1
    console.log 'Base URL = '+baseurl
    return baseurl


loadEntries = (entries,atomurl,prefix,baseurl,cacheFiles,donefn) ->  
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
      feedurl = $('link[rel=\'self\']', data).attr('href')
      console.log "loadEntries #{atomurl} self #{feedurl}"
      kiosk.addKioskEntry entries,atomurl,feedurl
      $( data ).find('entry').each (index, el) ->
        addEntry entries, el, atomurl, prefix, baseurl, cacheFiles
      if donefn?
        donefn()
    error: (xhr, textStatus, errorThrown) ->
      console.log 'error, '+textStatus+': '+errorThrown	
      $('#atomfileErrorModal').foundation 'reveal','open'
      recorder.w 'view.error.atomFileError',{atomurl:atomurl,status:textStatus,error:errorThrown}
      if donefn?
        donefn()

module.exports.load = (entries, atomurl, donefn) ->
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
  loadDevices entries, atomurl, prefix, donefn

