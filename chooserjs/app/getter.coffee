# utilities methods for 'getting'/sending content
kiosk = require 'kiosk'

module.exports.getGetUrl = (entry, devicetype, nocache) ->
  nocache ?= false
  if not kiosk.isKiosk()
    # with active get cannot serve from passive cache
    nocache = true
  enc = entry.attributes.enclosures[0]

  # if port 80 forwarding is notified late then kiosk path may be wrong, and be already encoded into path parameters
  if entry.attributes.isKiosk? and entry.attributes.isKiosk and kiosk.getPort()==80
    # %3A is encoded :, %2F is encoded / - first %3A for scheme
    path = enc.path
    cix = path.indexOf '%3A'
    cix = if cix>=0 then path.indexOf('%3A',cix+3) else -1
    six = if cix>=0 then path.indexOf('%2F',cix+3) else -1
    if cix>=0 && six>=0 
      newpath = path.substring(0,cix)+path.substring(six)
      enc.path = newpath
      console.log "Removed explicit port from kiosk path #{path} -> #{newpath}"

  # use cache copy if available
  url = if nocache then enc.url else (enc.path ? enc.url)
  url = kiosk.getPortableUrl url
  console.log "get #{entry.attributes.title} as #{url}, enc #{enc.path}  / #{enc.url}"

  # relative URL
  baseurl = if nocache and entry.attributes.baseurl? then entry.attributes.baseurl else window.location.href
  hix = baseurl.indexOf '#'
  baseurl = if (hix>=0) then baseurl.substring(0,hix) else baseurl
  ix = baseurl.lastIndexOf '/'
  baseurl = if (ix>=0) then baseurl.substring(0,ix+1) else ''
  getscript = if nocache then 'get.php' else 'get'
  url = kiosk.getPortableUrl(baseurl+getscript)+'?'+
    'u='+encodeURIComponent(url)+
    '&t='+encodeURIComponent(entry.attributes.title)
  if enc.mime?
    url = url+'&m='+encodeURIComponent(enc.mime)

  # kiosk cache wireless
  if kiosk.isKiosk() and not nocache
    ssid = kiosk.getWifiSsid()
    url = url+'&n='+encodeURIComponent(ssid);

  campaignid = kiosk.getCampaignId()
  if campaignid? and campaignid isnt ''
    url = url+'&c='+encodeURIComponent(campaignid)

  console.log "Using helper page url #{url}"	
  url
 
