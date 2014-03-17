# phpget2csv - output get events, systime, datetime, event (php.get), remoteAddr, path, device, referer

fs = require 'fs'
 
if process.argv.length<4
  console.log 'usage: coffee phpget2csv.coffee <php.log> <out.tsv>'
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

outputs = ["systime\tdatetime\tevent\tremoteAddr\tdevice\tchannel\tqr\rurl\treferer\tpath"]

for entry in entries when entry.event=='php.get'
  systime = entry.time
  datetime = new Date(systime*1000).toString()
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
  path = entry.info.path
  qix = path.indexOf '?'
  sparams = path.substring(qix+1).split('&')
  params = {}
  for sparam in sparams
    cix = sparam.indexOf '='
    key = if cix<0 then sparam else sparam.substring(0,cix)
    value = if  cix<0 then '' else sparam.substring(cix+1)
    params[key] = value

  output = entry.time+"\t"+datetime+"\t"+entry.event+"\t"+entry.info.remoteAddr+"\t"+device+"\t"+(params['c'] ?= '')+"\t"+(if params['qr']? then 'qr' else '')+"\t"+(params['u'])+"\t"+entry.info.referer+"\t"+entry.info.path
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
