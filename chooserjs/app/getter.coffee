# utilities methods for 'getting'/sending content
module.exports.getGetUrl = (entry, devicetype, nocache) ->
  nocache ?= false
  enc = entry.attributes.enclosures[0]
  # use cache copy if available
  url = if nocache then enc.url else (enc.path ? enc.url)
  console.log "get #{entry.attributes.title} as #{url}"

  # leave app URLs alone for now (assumed internet-only)
  apps = devicetype?.getAppUrls enc.mime
  # special case for 'other' / unknown: app = '' -> warning
  apps ?= []
  if not devicetype? or devicetype?.attributes.term == 'other'
    apps.push ''

  # relative URL
  baseurl = if nocache and entry.attributes.baseurl? then entry.attributes.baseurl else window.location.href
  hix = baseurl.indexOf '#'
  baseurl = if (hix>=0) then baseurl.substring(0,hix) else baseurl
  ix = baseurl.lastIndexOf '/'
  baseurl = if (ix>=0) then baseurl.substring(0,ix+1) else ''
  url = baseurl+'get.html?'+
    'u='+encodeURIComponent(url)+
    '&t='+encodeURIComponent(entry.attributes.title)
  for app in apps
    url = url+'&a='+encodeURIComponent(app)

  console.log "Using helper page url #{url}"	
  url
 
