# phpget2csv - output get events, systime, datetime, event (php.get), remoteAddr, path, device, referer
#/a/get?... or .../get.php?...
#(and arp.X events)

fs = require 'fs'
 
if process.argv.length<4
  console.log 'usage: coffee tabletget2tsv.coffee <php.log> <out.tsv>'
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
  else if entry.event.indexOf('user.consent.')==0
    outputs.push output
  else if entry.event.indexOf('arp.')==0
    outputs.push output+"\t"+entry.info.entry
  else if entry.event.indexOf('http.')==0
    source = entry.info.remoteAddress+":"+entry.info.remotePort
    if entry.event=='http.request'
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
      if entry.info.host=='goo.gl'
        httpRequests[source] = entry
        
      else if path.substring(0,qix)=='/a/get' or (qix>=8 and path.substring(qix-8,qix)=='/get.php')
        sparams = path.substring(qix+1).split('&')
        params = {}
        for sparam in sparams
          cix = sparam.indexOf '='
          key = if cix<0 then sparam else sparam.substring(0,cix)
          value = if  cix<0 then '' else sparam.substring(cix+1)
          params[key] = value
        entry.params = params
        httpRequests[source] = entry

      else if entry.info.host=='www.cs.nott.ac.uk'
        httpRequests[source] = entry

    else if entry.event=='http.response.error' or entry.event=='http.response'
      request = httpRequests[source]
      if not request?
        false
      else 
        output = output+(if request.params? then '.get' else '')+"."+entry.info.status+"\t"+entry.info.remoteAddress+"\t"+request.device+"\t"+request.info.host+"\t"
        if request.params?
          qix = request.info.path.indexOf '?'
          output = output+request.info.path.substring(0,qix)+"\t"+(request.params['c'] ?= '')+"\t"+(if request.params['qr']? then 'qr' else '')+"\t"+(request.params['u'])+"\t"+request.info.referer+"\t"+request.info.path      
        else
          output = output+request.info.path+"\t\t\t\t"+request.info.referer+"\t"+request.info.path
        outputs.push output

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
