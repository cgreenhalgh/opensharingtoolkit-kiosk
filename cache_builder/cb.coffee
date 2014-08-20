# coffee-script version of cache builder
https = require 'https'
http = require 'http'
fs = require 'fs'
xml2js = require 'xml2js'
parse_url = (require 'url').parse
resolve_url = (require 'url').resolve

if process.argv.length<3 
  console.log 'usage: coffee cb.coffee <KIOSK-ATOM-FILE>'
  process.exit -1

# devices cofig
devicesfn = "devices.json"
console.log "read devices from #{devicesfn}"
devicesin = fs.readFileSync devicesfn,'utf8'
try 
  devices = JSON.parse devicesin
catch err
  console.log "Error parsing JSON from #{devicesfn}: #{err.message}"
  process.exit -1

# mimetypes defaults
mimetypesinfn = "mimetypes-in.json"
mimetypesfn = "mimetypes.json"
console.log "read default mimetypes from #{mimetypesinfn}"
mimetypesin = fs.readFileSync mimetypesinfn,'utf8'
try 
  mimetypes = JSON.parse mimetypesin
catch err
  console.log "Error parsing JSON from #{mimetypesinfn}: #{err.message}"
  process.exit -1

# built-in mimetypes
for mt,mtinfo of mimetypes
  console.log "Check default mimetype #{mt}"
  if not mtinfo.compat?
    mtinfo.compat = {}
  exclusive = false
  for dt,dtinfo of devices
    if dtinfo.supportsMimeExclusive? and dtinfo.supportsMimeExclusive.indexOf(mt) >= 0 
      exclusive = true
  for dt,dtinfo of devices
    #console.log "- against device #{dt}"
    dtcompat = {}
    if dtinfo.userAgentPattern?
      dtcompat.userAgentPattern = dtinfo.userAgentPattern
    if dtinfo.supportsMimeExclusive? and dtinfo.supportsMimeExclusive.indexOf(mt) >= 0 
      dtcompat.builtin = true
    else if dtinfo.supportsMime? and dtinfo.supportsMime.indexOf(mt) >= 0 
      dtcompat.builtin = true
    else if not dtinfo.optionalSupportsMime? or dtinfo.optionalSupportsMime.indexOf(mt) < 0
      dtcompat.builtin = false
    # undefined = maybe / optional
    if exclusive
      dtcompat.appsComplete = true
    dtcompat.apps = []
    mtinfo.compat[dt] = dtcompat

console.log "Write initial mimetypes to #{mimetypesfn}"
fs.writeFileSync mimetypesfn,JSON.stringify mimetypes

# process atom file...
atomfn = process.argv[2]

parser = new xml2js.Parser()

# is file hidden
is_hidden = (entry) ->
  #console.dir entry
  for cs in entry.category ? [] when cs.$.scheme == 'visibility' and cs.$.term == 'hidden'
    return true
  return false

# read main atom file 
console.log 'read '+atomfn
data = fs.readFileSync atomfn, 'utf8'
console.log 'read '+data.length+' bytes'

# try reading shorturls.json
shorturls = []
shorturlsfn = 'shorturls.json'
try 
  shorturlsdata = fs.readFileSync shorturlsfn,'utf8'
  shorturls = JSON.parse shorturlsdata
catch e
  console.log 'could not read '+shorturlsfn+': '+e

# try reading cache.json
cache = {}
cachefn = 'cache.json'
try 
  cachedata = fs.readFileSync cachefn,'utf8'
  cache = JSON.parse cachedata
catch e
  console.log 'could not read '+cachefn+': '+e

# make one shorturl
add_shorturl = (shorturls,url) ->
  #console.log 'shorturl for '+url
  sus = for su in shorturls when su.url == url
    su.shorturl ? ''

  if sus.length == 0
    # work out shorturl later
    shorturls.push { url: url } 

get_feedurl = (feed) ->
  feedurl = for link in feed.link when link.$.rel == 'self'
    link.$.href
  if feedurl.length < 1
    console.log 'No self link found - cannot work out shorturls'
    process.exit -1
  return feedurl[0]

get_baseurl = (feed) ->
  baseurl = get_feedurl feed
  ix = baseurl.lastIndexOf '/'
  baseurl = baseurl.slice 0,ix+1
  console.log 'Base URL = '+baseurl
  return baseurl

# your google shortener API key?!
API_KEY = 'AIzaSyAZ2wia3BqnEkJEBQ7WYiDw3_VMi0bCC8s'

# app-defined mimetypes...
make_mimetypes = (feed,mimetypes) ->
  console.log "make_mimetypes..."

  for appentry in feed.entry 
      title = appentry.title[0]
      requires = for cat in appentry.category ? [] when cat.$.scheme == 'requires-device' and cat.$.term?
        cat.$.term
      supports = for cat in appentry.category ? [] when cat.$.scheme == 'supports-mime-type' and cat.$.term?
        { mime: cat.$.term, label: cat.$.label ?= cat.$.term }
      exclusive = for cat in appentry.category ? [] when cat.$.scheme == 'supports-mime-type-exclusive' and cat.$.term?
        cat.$.term
      appurls = for link in appentry.link ? [] when link.$.rel == 'enclosure' and link.$.href?
        link.$.href

      for device in requires

        for support in supports
          mt = support.mime
          if not mimetypes[mt]?
            mimetypes[mt] = { }
          mtinfo = mimetypes[mt]
          if support.label? and (not mtinfo.label? or mtinfo.label==mt)
            mtinfo.label = support.label
          # icon
          iconurls = for link in appentry.link ? [] when link.$.rel == 'alternate' and link.$.type? and link.$.href? and /^image/.test link.$.type
            link.$.href
          if iconurls.length > 0 and not mtinfo.icon?
            mtinfo.icon = iconurls[0]

          if not mtinfo.compat?
            mtinfo.compat = {}
          if not mtinfo.compat[device]?
            mtinfo.compat[device] = {}
          dtcompat = mtinfo.compat[device]
          if not dtcompat.userAgentPattern? and devices[device]?.userAgentPattern?
            dtcompat.userAgentPattern = devices[device].userAgentPattern
          if exclusive.length > 0
            dtcompat.appsComplete = true

          if not dtcompat.apps?
            dtcompat.apps = []
          for appurl in appurls
            dtcompat.apps.push { name: title, url: appurl }


# shorturl for each 
make_shorturls = (feed,shorturls) ->
  console.log 'make_shorturls...'

  # campaignids...
  campaignids = for cat in feed.category ? [] when cat.$.scheme == 'campaign' and cat.$.term?
    cat.$.term
  campaignsuffix = for cid in campaignids
    '&c='+encodeURIComponent(cid)
  campaignsuffix.push ''

  # atom url -> get url
  baseurl = get_baseurl feed
  # .html?? .php for now!
  geturl = baseurl+'get.php'

  # request a short-url for internet kiosk view
  feedurl =get_feedurl feed
  kioskurl = baseurl+'index.html?f='+encodeURIComponent(feedurl)
  url = geturl+'?u='+encodeURIComponent(kioskurl)+'&t='+encodeURIComponent("Kiosk View")  
  mimeparam = '&m='+encodeURIComponent('text/html')
  for cs in campaignsuffix
    add_shorturl shorturls,url+mimeparam+cs
    # qr flag
    add_shorturl shorturls,url+mimeparam+cs+'&qr'
    # device is now sniffed from agent only


  # work out URLs to be shortened
  # get.html?u=URL&t=TITLE[&m=MIMETYPE]
  # each entry...
  for entry in feed.entry when not is_hidden entry
    title = entry.title[0]
    # each enclosure    
    for link in entry.link ?= [] when link.$.rel == 'enclosure'
      fileurl = link.$.href
      mime = link.$.type

      url = geturl+'?u='+encodeURIComponent(fileurl)+'&t='+encodeURIComponent(title) 

      mimeparam = if mime? then '&m='+encodeURIComponent(mime) else ''
      for cs in campaignsuffix
        add_shorturl shorturls,url+mimeparam+cs
        # qr flag
        add_shorturl shorturls,url+mimeparam+cs+'&qr'
        # device is now sniffed from agent only

add_fileurl = (url, fileurls) ->
    #console.log "check #{url}"
    # not sure why indexOf doesn't seem to match it
    us = for u in fileurls when u == url
      u
    if not us? or us.length == 0
      #console.log 'add '+url+' to fileurls'
      fileurls.push url 

fix_relative_url = (url,path) ->
  resolve_url url, path

# cache entry for each
make_cache = (feed,cache) ->

  fileurls = []
  for entry in feed.entry 
    #console.dir entry
    hidden = is_hidden entry
    # atom enclosures
    for link in entry.link when link.$.href? and (link.$.rel == 'alternate' or not hidden)
      add_fileurl (fix_relative_url cache.baseurl, link.$.href), fileurls
    # media-rss media:thumbnail
    for thumbnail in (entry['media:thumbnail'] ? []) when thumbnail.$.url?
      add_fileurl (fix_relative_url cache.baseurl, thumbnail.$.url), fileurls
  console.dir fileurls
 

  oldfiles = cache.files ? []
  cache.files = []

  for file in oldfiles
    file.needed = false
    # does the file exist?
    if file.path?
      fileok = false
      try 
        st = fs.statSync file.path
        if st.isFile() 
          fileok = true
        else
          console.log 'old cache path not file: '+file.path
      catch e
        console.log 'old cache file not found: '+file.path
      if not fileok
        # doesn't exist, presumably
        delete file.path
        delete file.length
        delete file.lastmod

  for fileurl in fileurls
    file = { url: fileurl }  
    oldfile = for f in oldfiles when f.url == fileurl
      f
    if oldfile.length > 0
      file = oldfile[0]
    
    file.needed = true
    cache.files.push file
    #console.log "Add to cache #{file.url}"

  # un-needed files in cache?
  for oldfile in oldfiles when oldfile.path? and not oldfile.needed 
    present = for f in cache.files when f.url == oldfile.url
      f
    if present.length==0
      cache.files.push oldfile
    else
      console.log "Discard duplicate file cache entry #{oldfile.url}" 

get_filename_for_component = (h) ->
  if h=='' 
    return '_'
  h = encodeURIComponent h
  return h.replace("~","_")
  # is that enough??

# get local cache path for an URL - like java cacheing,
# maps domain name elements and path elements to folders
get_cache_path = (url) ->
  url = parse_url url
  # hostname, port, path (includes query), hash
  hs = if url.hostname? then url.hostname.split '.' else []
  # reverse non-IP order
  number = /^[0-9]+$/
  ns = 0
  for h in hs when number.test h
    ns++
  if ns != hs.length
    hs.reverse
  # normalise domain name to lower case
  hs = for h in hs
    String(h).toLowerCase()
  # ignore port for now!
  ps = if url.path? then url.path.split '/' else []
  # leading /?
  if ps.length>1 and ps[0]==''
    ps.shift()
  hs = ["cache"].concat hs,ps
  # make safe filenames
  hs = for h in hs
    get_filename_for_component h
  path = hs.join '/'
  return path

doneShorturls = false
doneCache = false

# may be present unneeded, or not
add_cache_url = (cache,url,appcache) ->
  for f in cache.files when f.url == url
    if appcache?
      f.appcache = true
    if f.needed
      console.log "URL already needed: #{url}"
      return
    console.log "URL present, now needed: #{url}"
    f.needed = true
    return
  file = { url: url, needed: true }
  console.log "Add url #{url}"
  cache.files.push file

check_appcache = (cache,file) ->
  if not file.path?
    return
  si = file.path.lastIndexOf '/'
  ei = file.path.lastIndexOf '.'
  extn = if ei<0 or ei<si then '' else file.path.substring(ei+1)
  if extn=='appcache' 
    console.log "check appcache file #{file.url}"  
    try 
      appcache = fs.readFileSync file.path,{encoding:'utf8'}
      lines = appcache.split '\n'
      lines = for l in lines when l.trim().indexOf('#')!=0 and l.trim().length>0
        l.trim()
      if lines.length<=0
        console.log "Empty appcache manifest #{file.url}"
        return
      if lines[0]!='CACHE MANIFEST'
        console.log "Bad appcache manifest #{file.url}; first line #{lines[0]}"
      section = "CACHE:"
      for l,i in lines when i>0
        if l=="CACHE:" or l=="SETTINGS:" or l=="NETWORK:"
          section = l
        else if section=="CACHE:"
          url = fix_relative_url file.url,l
          console.log "Found manifest entry #{l} -> #{url}"
          add_cache_url cache,url

    catch err
      console.log "Error checking appcache file #{file.path}: #{err}"

check_html_file = (cache,ix,file) ->
  si = file.path.lastIndexOf '/'
  ei = file.path.lastIndexOf '.'
  extn = if ei<0 or ei<si then '' else file.path.substring(ei+1)
  if extn=='htm' or extn=='html' or extn=='xhtml'
    try 
      html = fs.readFileSync file.path,{encoding:'utf8'}
      hi = html.indexOf '<html '
      hi2 = html.indexOf '>',hi
      mi = html.indexOf ' manifest="', hi
      mi2 = html.indexOf '"', mi+11
      if mi>=0 and mi2>=mi and mi2<hi2
        manifest = decodeURI(html.substring mi+11,mi2)
        # make absolute, schedule for download and check
        manifesturl = fix_relative_url file.url,manifest
        console.log "Found html manifest #{manifest} in #{file.url} -> #{manifesturl}" 
        # set appcache flag
        add_cache_url cache,manifesturl,true

    catch err
      console.log "Error checking html file: #{err}"

# parse file(s) and call worker(s)
parser.parseString data,(err,result) ->
  if err 
    console.log 'Error parsing '+atomfn+': '+err
    process.exit -1

  feed = result.feed
  console.log 'Feed '+feed.title+' ('+feed.id+')'

  make_mimetypes feed,mimetypes
  console.log "write mimetypes to #{mimetypesfn}"
  fs.writeFileSync mimetypesfn,JSON.stringify mimetypes

  make_shorturls feed,shorturls

  fix_shorturls = (shorturls,i) ->
    if i >= shorturls.length
      # done
      console.log 'write shorturls.json'
      fs.writeFileSync shorturlsfn,JSON.stringify shorturls
      doneShorturls = true
      if doneShorturls and doneCache
        process.exit 0
    else
      su = shorturls[i]
      if su.shorturl == undefined
        # see https://developers.google.com/url-shortener/v1/getting_started
        # POST application/json {"longUrl":"XXX"} ->
        #   https://www.googleapis.com/urlshortener/v1/url
        # { "kind": "urlshortener#url", "id": "http://goo.gl/XXXX",
        #  "longUrl": "XXX" }
        console.log 'Shorten '+su.url
        req = {longUrl: su.url}
        reqs = JSON.stringify req
        url = '/urlshortener/v1/url'
        if API_KEY?
          url = url+"?key="+API_KEY

        options =
          hostname: 'www.googleapis.com'
          path: url
          method: 'POST'
          headers: { 'content-type': 'application/json' }

        hreq = https.request options, (res) ->
          if res.statusCode != 200
            console.log 'got shortener response '+res.statusCode
            process.exit -1

          res.setEncoding 'utf8'
          data = ''

          res.on 'data',(chunk) ->
            #console.log 'shortener response: '+chunk
            data = data+chunk

          res.on 'end',()->
            jres = JSON.parse data
            su.shorturl = jres.id
            console.log 'Shortened to '+su.shorturl
            # recurse
            fix_shorturls shorturls,i+1

        hreq.on 'error',(e) ->
          console.log 'Error shortening url: '+e
          process.exit -1

        hreq.end reqs  
        #console.log 'sent '+reqs
      else
        # recurse
        fix_shorturls shorturls,i+1
  fix_shorturls shorturls,0

  # download icons and visible enclosures, populating cache.json
  baseurl = get_baseurl feed
  cache.baseurl = baseurl

  make_cache feed,cache

  fix_cache = (cache,ix) ->
    if ix >= cache.files.length
      # done!
      console.log 'write cache.json'
      fs.writeFileSync cachefn,JSON.stringify cache
      doneCache = true
      if doneShorturls and doneCache
        process.exit 0
    else
      file = cache.files[ix]
      #console.log 'fix_cache '+ix+': '+file.url+', was '+file.path
      if file.needed and file.url.indexOf( cache.baseurl )==0
        file.path = file.url.substring (cache.baseurl.length)
        console.log "local file #{file.url} -> #{file.path}"
        check_appcache cache,file
        check_html_file cache,ix,file
        fix_cache cache,ix+1
      else if file.needed and file.path? 
        check_file_modified cache,ix,file
      else if file.needed
        get_cache_file cache,ix,file
      else
        #check_appcache cache,file
        # not needed!
        fix_cache cache,ix+1

  check_file_modified = (cache,ix,file) ->        
    # if the local file exists and we have size and server last-modified,
    #   try a head on the remote file with if-modified-since;
    #   (prepare to) dump local copy if out of date
    # TODO
    if file.lastmod?
      console.log 'Check '+file.url
      url = parse_url file.url
      protocol = url.protocol ?= 'http'
      options = 
        hostname: url.hostname
        port: url.port
        path: url.path
        auth: url.auth
        method: 'HEAD'
        headers: { 'if-modified-since': file.lastmod }
      pmodule = if protocol=='https' then https else http   
      req = pmodule.request options,(res) ->
        res.on 'data',(data) ->
          ; # no op
        if res.statusCode == 304 
          console.log 'Not modified: '+file.url
          check_appcache cache,file
          fix_cache cache,ix+1
        else
          console.log 'Check returned '+res.statusCode+'; assume modified'
          get_cache_file cache,ix,file
          
      req.on 'error',(e) ->
        console.log 'Error checking '+file.url+' ('+JSON.stringify( options )+'): '+e
        get_cache_file cache,ix,file
 
      req.end()

    else
      get_cache_file cache,ix,file

  get_cache_file = (cache,ix,file) ->   
    # new local path = url mapped to folder hierarchy - domain name
    #   in reverse order (ip forwards), port, path elements, 
    #   final filename+fragment+query
    path = file.path ? get_cache_path file.url
    #console.log 'new file path = '+path+' for '+file.url
    # check directory exists
    dir = ''
    ps = path.split '/'
    if ps.length>1
      for i in [0..(ps.length-2)]
        dir = dir + (if i>0 then '/' else '') + ps[i]
        if !fs.existsSync(dir)
          fs.mkdirSync dir

    # if updated or missing attempt download, initially to temp file
    #   and stash header last-modified and content-length
    url = parse_url file.url
    protocol = url.protocol ? 'http'
    options = method: 'GET'
    pmodule = if protocol=='https' then https else http   

    console.log 'Download '+file.url

    req = pmodule.get file.url,(res) ->
      if res.statusCode != 200
        console.log 'Error getting file '+file.url+', response '+res.statusCode
        fix_cache cache,ix+1
      else 
        # on success remove old file if present and link/rename new file
        lastmod = res.headers['last-modified']
        length = res.headers['content-length']
        tmppath = dir + (if dir!='' then '/' else '') + '.cb_download'
        try 
          fd = fs.openSync(tmppath, 'w')
        catch e
          console.log 'Could not create tmpfile '+tmppath+': '+e
          return fix_cache cache,ix+1      
        
        count = 0;

        res.on 'data',(data) ->
          if count < 0
            return
          #console.log 'got '+data.length+' bytes for '+file.url
          try 
            fs.writeSync(fd, data, 0, data.length)
            count += data.length
          catch e
            console.log 'Error writing data chunk to '+tmppath+': '+e
            count = -1

        res.on 'end',() ->
          fs.closeSync(fd)
          if count < 0
            return fix_cache cache,ix+1
          if count < length 
            console.log 'Warning: read '+count+'/'+length+' bytes for '+file.url+' - discarding'
            try
              fs.unlinkSync tmppath
            catch e
              ; # ignore
            return fix_cache cache,ix+1

          else
            console.log 'OK: read '+count+' bytes'
          oldpath = path + '.cb_old'
          # move old file if present
          if fs.existsSync path
            try
              # remove old old file if present
              fs.unlinkSync oldpath
            catch e
              ;# ignore
            try
              fs.renameSync path,oldpath
            catch e
              console.log 'Error renaming old cache file '+path+': '+e
          # move new file
          try
            fs.renameSync tmppath,path
            # done!
            try
              fs.unlinkSync oldpath
            catch e
              ; # ignore
            file.path = path
            if lastmod? then file.lastmod = lastmod
            if length? then file.length = length
          catch e
            console.log 'Error renaming new cache file '+tmppath+' to '+path+': '+e

          # new/updated html file? check for manifest!
          # note, not needed old files should all appear after 'needed' files; this should include previously downloaded manifest, etc.
          check_html_file cache,ix,file

          # next...
          check_appcache cache,file
          fix_cache cache,ix+1

    req.on 'error',(e) ->
      console.log 'Error getting file '+file.url+': '+e
      fix_cache cache,ix+1

  fix_cache cache,0


# TODO download icons and non-hidden files

#req = http.get "http://www.google.com/index.html", (res) ->
#  console.log "Got response: " + res.statusCode
#req.on 'error', (e) ->
#  console.log "Got error: " + e.message

