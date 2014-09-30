# kiosk-specific utilities, e.g. depending on kiosk javascript API
Entry = require 'models/Entry'

kiosk = module.exports

module.exports.isKiosk = () ->
  window.kiosk?

urlParams = null
getParameter = (p) ->
  if not urlParams?
    pl     = /\+/g  
    # Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g
    decode = (s) -> decodeURIComponent(s.replace(pl, " "))
    query  = window.location.search.substring(1)

    urlParams = {}
    while (match = search.exec(query))
      urlParams[decode(match[1])] = decode(match[2])
  urlParams[p]

module.exports.getParameter = getParameter

module.exports.getLocalFilePrefix = () ->
  window.kiosk?.getLocalFilePrefix()

module.exports.getCampaignId = () ->
  window.kiosk?.getCampaignId()

module.exports.getAtomFile = () ->
  if window.kiosk?
    window.kiosk?.getLocalFilePrefix()+'/'+window.kiosk.getAtomFile()
  else
    atomfile = getParameter('f') ? "default.xml"

module.exports.getWifiSsid = () ->
  window.kiosk?.getWifiSsid()

module.exports.getHostAddress = () ->
  if window.kiosk?
    window.kiosk.getHostAddress()
  else
    window.location.hostname

module.exports.registerMimeType = (path,mime) ->
  if window.kiosk?
    window.kiosk.registerMimeType path,mime

module.exports.registerMimetypeCompat = (mime,device,compat) ->
  if window.kiosk?
    window.kiosk.registerMimetypeCompat mime,device,(JSON.stringify compat)

module.exports.getPort = () ->
  if window.kiosk?
    window.kiosk.getPort()
  else
    window.location.port

getPortOpt = () ->
  port = module.exports.getPort()
  if port?
    if port==80
      ""
    else
      ":#{port}"
  else
    ""

vibrate = navigator.vibrate ?= navigator.webkitVibrate ?= navigator.mozVibrate ?= navigator.msVibrate ?= null

module.exports.vibrate = (duration) ->
  if window.kiosk?
    window.kiosk.vibrate(duration)
  else if vibrate?
    try
      vibrate duration
    catch err
      console.log "vibrate error: #{err}"
    true
  else
    false

module.exports.getUrlForPath = (path) ->
  'http://'+kiosk.getHostAddress()+getPortOpt()+path

asset_prefix = 'file:///android_asset/'
localhost_prefix = 'http://localhost'
localhost2_prefix = 'http://127.0.0.1'

module.exports.getPortableUrl = getPortableUrl = (url) ->
  # convert any kiosk-internal URLs to externally accessible ones...
  # TODO any external portmapping?
  if window.kiosk?
    portOpt = getPortOpt()  
    kiosk = window.kiosk
    if url.indexOf(asset_prefix)==0
      console.log "getPortableUrl for asset #{url}"
      'http://'+kiosk.getHostAddress()+portOpt+'/a/'+url.substring(asset_prefix.length)
    else if url.indexOf('file:')==0
      file_prefix = kiosk.getLocalFilePrefix()+'/'
      if url.indexOf(file_prefix)==0
        console.log "getPortableUrl for app file #{url}"
        'http://'+kiosk.getHostAddress()+portOpt+'/f/'+url.substring(file_prefix.length)
      else 
        console.log "Warning: file URL which does not match local file prefix: #{url}"
        url
    else if url.indexOf(localhost_prefix)==0
      console.log "getPortableUrl for local url #{url}"
      'http://'+kiosk.getHostAddress()+url.substring(localhost_prefix.length)
    else if url.indexOf(localhost2_prefix)==0
      console.log "getPortableUrl for local url #{url}"
      'http://'+kiosk.getHostAddress()+url.substring(localhost2_prefix.length)
    else
      url
  else
    url

# 60 minutes
REDIRECT_LIFETIME_MS = 60*60*1000
module.exports.getTempRedirect = (url) ->
  if window.kiosk?
    kiosk = window.kiosk
    redir = kiosk.registerTempRedirect url, REDIRECT_LIFETIME_MS
    "http://"+kiosk.getHostAddress()+getPortOpt()+redir
  else
    console.log "getTempRedirect when not kiosk for #{url}"
    url

module.exports.registerRedirect = (path,url) ->
  if window.kiosk?
    kiosk = window.kiosk
    kiosk.registerRedirect path,url,0
  else
    console.log "registerRedirect when not kiosk for #{url}"
    false

module.exports.registerExternalRedirect = registerExternalRedirect = (host,path,url) ->
  if window.kiosk?
    kiosk = window.kiosk
    kiosk.registerExternalRedirect host,path,url,0
  else
    console.log "registerExternalRedirect when not kiosk for #{url}"
    false

module.exports.isCaptiveportal = () ->
  if not window.kiosk?
    return false
  active = module.exports.getShared 'captiveportal'
  if not active?
    return false
  active

module.exports.setShared = (key,value) ->
  # encoding is 'STRING' or 'JSON'
  if not window.kiosk?
    console.log "ignore setShared non-kiosk #{key}=#{value}"
    return
  if not value?
    window.kiosk.setShared key,'JSON','null' 
  else if typeof value == 'string'
    window.kiosk.setShared key,'STRING',value
  else 
    try 
      window.kiosk.setShared key,'JSON',JSON.stringify value
    catch err
      console.log "error setShared #{key}=#{value}: #{err}"

module.exports.getShared = (key) ->
  if not window.kiosk?
    console.log "getShared non-kiosk #{key}"
    return null
  vs = window.kiosk.getShared( key )
  console.log "getShared #{key} -> #{vs}"
  if not vs?
    return null
  if vs.indexOf('STRING:')==0
    return vs.substring 7
  try 
    return JSON.parse vs.substring( vs.indexOf(':')+1 )
  catch err
    console.log "Error parsing shared #{key}=#{vs}: #{err}"
  return null

module.exports.getCaptiveportalHostname = () ->
  if not window.kiosk?
    return null
  return window.kiosk.getCaptiveportalHostname()

module.exports.getSafePreview = () ->
  if not window.kiosk?
    return true
  return window.kiosk.getSafePreview()

module.exports.canOpenUrl = (url, mime) ->
  if not window.kiosk?
    return false
  return window.kiosk.canOpenUrl url, mime

module.exports.openUrl = (url, mime) ->
  if not window.kiosk?
    return false
  return window.kiosk.openUrl url, null #, mime

module.exports.getQrCode = (url) ->
  qrurl = 
      # really a kiosk? 
      if window.kiosk?  
        'http://localhost:8080/qr?url='+encodeURIComponent(url)+'&size=150'
      else if window.location.pathname=='/a/index.html'
        # or do we really think this came from a kiosk? if so try using its qr code generator 
        # because it could just be an internet stash of files...
        'http://'+window.location.host+'/qr?url='+encodeURIComponent(url)+'&size=150'
      else
        # try google qrcode generator http://chart.apis.google.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl=http%3A%2F%2F1.2.4
        'http://chart.apis.google.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl='+encodeURIComponent(url)

module.exports.addKioskEntry = (entries,atomurl,ineturl) ->
    #ineturl=internet feedurl
    console.log "add kiosk entry #{atomurl} / #{ineturl}"
    if not window.kiosk?
      return null
    # index.html is this page; relative ref
    baseurl = window.location.href
    ix = baseurl.lastIndexOf('/')
    if ix>=0
      baseurl = baseurl.substring(0,ix+1)

    # NB need to intercept internet URLs for atomfile
    if ineturl? and ineturl.indexOf('http://')==0
        ix = ineturl.indexOf('/',7)
        if ix>7
          localatomurl = getPortableUrl(atomurl)
          console.log "register redirect for internet atom file #{ineturl} -> #{localatomurl}"
          registerExternalRedirect ineturl.substring(7,ix), ineturl.substring(ix), localatomurl
          # and index.html
          lix = ineturl.lastIndexOf '/'
          inetbaseurl = ineturl.slice 0,lix+1
          ipath = ineturl.substring(ix,lix+1)+"index.html?f="+encodeURIComponent(ineturl)
          localurl = getPortableUrl(baseurl+"index.html?f="+encodeURIComponent(localatomurl))
          console.log "register redirect for internet index file #{ineturl.substring(7,ix)} #{ipath} -> #{localurl}"
          registerExternalRedirect ineturl.substring(7,ix), ipath, localurl

    entry = 
      id: "tag:cmg@cs.nott.ac.uk,20140108:/ost/kiosk/self"
      title: "Kiosk View"
      iconurl: baseurl+"icons/kiosk.png"
      iconpath: baseurl+"icons/kiosk.png"
      summary: "Browse the same content directly on your device"
      baseurl: baseurl 
      thumbnails: []
      requiresDevice: []
      supportsMime: []
      isKiosk: true
    # index: index
    # internet
    url = null
    if ineturl?
      ix = ineturl.lastIndexOf '/'
      inetbaseurl = ineturl.slice 0,ix+1
      entry.baseurl = inetbaseurl
      #console.log 'Base URL = '+inetbaseurl
      url = inetbaseurl+"index.html?f="+encodeURIComponent(ineturl)

    # local
    path = baseurl+"index.html?f="+encodeURIComponent(getPortableUrl(atomurl))
    console.log "- kiosk entry expanded to #{url} / #{path}"
    enc = 
      url: url
      mime: "text/html"
      path: path
    entry.enclosures = []
    entry.enclosures.push enc
    e = new Entry entry
    window.entries.add e
    console.log "added kiosk entry #{e.attributes.enclosures[0].url} / #{e.attributes.enclosures[0].path}"
    e


#http://www.javascriptkit.com/script/script2/soundlink.shtml#current
html5_audiotypes={ # define list of audio file extensions and their associated audio types. Add to it if your specified audio file isn't on this list:
  "mp3": "audio/mpeg",
  "mp4": "audio/mp4",
  "ogg": "audio/ogg",
  "wav": "audio/wav"
}

makeaudiourl = (path) ->
  if (path.indexOf ':') < 0 
    #console.log 'converting local name '+atomurl+' to global...'
    base = window.location.href;
    hi = base.indexOf '#'
    if (hi >= 0)
      base = base.substring 0,hi
    if (path.indexOf '/') == 0 
      # absolute
      si = base.indexOf '//'
      si = if si<0 then 0 else si+2
      si = base.indexOf '/', si
      return (if si<0 then base else base.substring 0,si) + path
    else 
      # relative
      si = base.lastIndexOf '/'
      return (if si<0 then base+'/' else base.substring 0,si+1) + path
  else
    # full
    return path

fixaudiourl = (path) ->
  #kiosk.getPortableUrl, _, true 
  makeaudiourl(path)

createsoundbite = (sound) ->
  console.log "create soundeffect #{sound}"
  html5audio=document.createElement('audio')
  if (html5audio.canPlayType) # check support for HTML5 audio
    for arg,i in arguments
      sourceel=document.createElement('source')
      url = fixaudiourl(arguments[i])
      sourceel.setAttribute 'src', url
      if (arguments[i].match(/\.(\w+)$/i))
        type = html5_audiotypes[RegExp.$1]
        sourceel.setAttribute 'type', type
      console.log "- source #{arguments[i]} = #{url} #{type}"
      html5audio.appendChild(sourceel)
    html5audio.load()
    html5audio.playclip = ()->
      console.log "playclip #{sound} state=#{html5audio.readyState} currentTime=#{html5audio.currentTime} duration=#{html5audio.duration} paused=#{html5audio.paused}"
      try
        if !html5audio.paused
          html5audio.pause()
        html5audio.currentTime=0
        html5audio.play()
      catch err
        console.log "Error playing clip: #{err}"
    return html5audio
  else
    console.log "Could not create HTML5 audio"
    return () -> false


module.exports.audioLoad = (path) ->
  if window.kiosk?
    url = makeaudiourl path
    window.kiosk.audioLoad url
    return playclip: () -> window.kiosk.audioPlay url
  # no audio
  #createsoundbite path
  return playclip: () -> 

# dim is boolean
module.exports.dimScreen = (dim) ->
  if window.kiosk?
    window.kiosk.dimScreen dim
  else
    console.log "non-kiosk - dimScreen "+dim

