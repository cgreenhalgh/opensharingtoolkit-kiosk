# kiosk-specific utilities, e.g. depending on kiosk javascript API
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

module.exports.getPort = () ->
  if window.kiosk?
    window.kiosk.getPort()
  else
    window.location.port

asset_prefix = 'file:///android_asset/'
localhost_prefix = 'http://localhost'
localhost2_prefix = 'http://127.0.0.1'

module.exports.getPortableUrl = (url) ->
  # convert any kiosk-internal URLs to externally accessible ones...
  # TODO any external portmapping?
  if window.kiosk?
    kiosk = window.kiosk
    if url.indexOf(asset_prefix)==0
      console.log "getPortableUrl for asset #{url}"
      'http://'+kiosk.getHostAddress()+':'+kiosk.getPort()+'/a/'+url.substring(asset_prefix.length)
    else if url.indexOf('file:')==0
      file_prefix = kiosk.getLocalFilePrefix()+'/'
      if url.indexOf(file_prefix)==0
        console.log "getPortableUrl for app file #{url}"
        'http://'+kiosk.getHostAddress()+':'+kiosk.getPort()+'/f/'+url.substring(file_prefix.length)
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
    "http://"+kiosk.getHostAddress()+":"+kiosk.getPort()+redir
  else
    console.log "getTempRedirect when not kiosk for #{url}"
    url

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

