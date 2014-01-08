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


 
