# phpget2csv - output get events, systime, datetime, event (php.get), remoteAddr, path, device, referer
#/a/get?... or .../get.php?...
#(and arp.X events)

fs = require 'fs'
 
if process.argv.length<4
  console.log 'usage: coffee tablet2tsv.coffee <php.log> <out.tsv>'
  process.exit -1

logfn = process.argv[2]
outfn = process.argv[3]

try
  console.log "Read log #{logfn}..."
  data = fs.readFileSync logfn, 'utf8'
  lines = data.split "\n"
  entries = for line in lines when line.trim().length>0
    JSON.parse line
catch err
  console.log "Error reading/parsing #{logfn}: #{err}"
  process.exit -1

outputs = ["systime\tdatetime\tcomponent\tevent"]

httpRequests = {}

for entry in entries 
  systime = entry.time
  datetime = new Date(systime).toString()
  output = entry.time+"\t"+datetime+"\t"+entry.component+"\t"+entry.event
  if entry.event=='view.attract.hide' or entry.event=='view.attract.show' or entry.event=='activity.pause' or entry.event=='activity.resume'
    outputs.push output
  else if entry.event=='user.selectEntry'
    outputs.push output+"\t"+entry.info.id+"\t"+entry.info.title
  else if entry.event=='user.option.sendInternet'
    outputs.push output+"\t"+entry.info.id
  else if entry.event=='user.option.sendCache'
    outputs.push output+"\t"+entry.info.id
  else if entry.event=='user.click'
    outputs.push output+"\t"+entry.info.href
  else if entry.event.indexOf('user.consent.')==0
    outputs.push output
  else if entry.event.indexOf('user.window')==0
    #ignore
  else if entry.event.indexOf('view.page')==0
    #ignore
  else if entry.event=='app.scroll'
    #ignore
  else if entry.event.indexOf('user.')==0
    outputs.push output
  else if entry.event=='wifi.event'
    outputs.push output+"\t"+entry.info.line
  else if entry.event.indexOf('arp.')==0
    outputs.push output+"\t"+entry.info.entry
  else if entry.event.indexOf('http.')==0
    source = entry.info.remoteAddress+":"+entry.info.remotePort
    if entry.event=='http.request'
      httpRequests[source] = entry
      device = ''
      userAgent = entry.info.userAgent
      if userAgent?
        userAgent = userAgent.toLowerCase()
        if userAgent.indexOf('android')>=0
          device = 'android'
        else if userAgent.indexOf('iphone')>=0 or userAgent.indexOf('ipod')>=0 or userAgent.indexOf('ipad')>=0
          device = 'ios'
        else if userAgent.indexOf('windows phone')>=0
          device = 'windowsphone'
      entry.device = device
      path = entry.info.path
      qix = path.indexOf '?'
      sparams = path.substring(qix+1).split('&')
      params = {}
      for sparam in sparams
        cix = sparam.indexOf '='
        key = if cix<0 then sparam else sparam.substring(0,cix)
        value = if  cix<0 then '' else sparam.substring(cix+1)
        params[key] = value
      output = entry.time+"\t"+datetime+"\t"+entry.component+"\t"+entry.event+"\t"+entry.info.remoteAddress+":"+entry.info.remotePort+"\t"+device+"\t"+entry.info.host+"\t"+entry.info.path+"\t"+entry.info.referer
      #outputs.push output
    else if entry.event=='http.response.error'
      request = httpRequests[source]
      if not request?
        outputs.push output+".unmatched\t"+source
      else if request.info.host=='goo.gl' or request.info.host=='www.cs.nott.ac.uk'
        outputs.push output+"."+entry.info.status+"\t"+source+"\t"+request.device+"\t"+request.info.host+"\t"+request.info.path+"\t"+request.info.referer
      else
        #ignore
        false
    else if entry.event=='http.response'
      request = httpRequests[source]
      if not request?
        outputs.push output+".unmatched."+entry.info.status+"\t"+source
      else
        if entry.info.status==307
          output = output+".redirect\t"+source+"\t"+request.device+"\t"+request.info.host+"\t"+request.info.path+"\t"+request.info.referer+"\t"+entry.info.redirectLocation
          outputs.push output
        else
          outputs.push output+"."+entry.info.status+"\t"+source+"\t"+request.device+"\t"+request.info.host+"\t"+request.info.path+"\t"+request.info.referer+"\t"+entry.info.mimeType+"\t"+entry.info.responseLength

    else if entry.event=='http.response.complete'
      #skip
      false
  else
    outputs.push output+"\t"+"?"
    #outputs.push output+JSON.stringify(entry.info)

console.log "Write to #{outfn}..."
try 
  out = fs.openSync outfn, "w+"
  for output in outputs
    fs.writeSync out,output
    fs.writeSync out,"\n"
  fs.closeSync out
catch err
  console.log "Error writing #{outfn}: #{err}"
  process.exit -1
