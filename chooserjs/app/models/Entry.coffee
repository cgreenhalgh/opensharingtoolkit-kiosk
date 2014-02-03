# An entry
# was { title:, iconurl:, summary:, index:, enclosures: [{mime:, url:}], 
#       supportsMime:["..."], requiresDevice:["..."] }
module.exports = class Entry extends Backbone.Model
  defaults:
    title: 'Unnamed entry'
    summary: 'A default entry'
    enclosures: []
    supportsMime: [] 
    requiresDevice: []
    hidden: false
    # iconurl
    # prefix
    # cacheinfo

  checkMimetypeIcon: () =>
    if @attributes.mimetypeicon?
      return @attributes.mimetypeicon
    # look in window.mimetypes for match with an enclosure
    for enc in @attributes.enclosures when enc.mime?
      mimetypeicon = (window.mimetypes.find (mt)->mt.attributes.mime==enc.mime and mt.attributes.icon?)?.attributes.icon
      if mimetypeicon?
        console.log "found mimetypeicon for #{enc.mime}: #{mimetypeicon}"
        @set mimetypeicon: mimetypeicon
        return @attributes.mimetypeicon
      console.log "cannot find mimetype #{enc.mime}"

    undefined

  checkDeviceCompatibility: () =>
    if @attributes.compat?
      return @attributes.compat
    compat = {}
    # for each enclosure (?) look in window.mimetypes
    appsComplete = false
    for enc in @attributes.enclosures when enc.mime?
      console.log "Check device compat for type #{enc.mime}"
      mimetype = window.mimetypes.get enc.mime
      if mimetype? and mimetype.attributes.compat?
        #console.log "- using #{JSON.stringify mimetype.attributes.compat}"
        for dt,dtcompat of mimetype.attributes.compat
          if dtcompat.appsComplete==true
            appsComplete = true
          if dtcompat.builtin==true
            compat[dt] = 'builtin'
          else if dtcompat.apps?.length > 0
            compat[dt] = 'app'
          else if not dtcompat.builtin?
            compat[dt] = 'optional'
      else 
        console.log "- could not find #{enc.mime} compatibility, mimetype=#{JSON.stringify mimetype}"
    window.options.attributes.devicetypes.forEach (dt)-> 
      if not compat[dt.attributes.term]?
        if appsComplete
          compat[dt.attributes.term] = 'none'
        else
          compat[dt.attributes.term] = 'unknown'
    console.log "Initialise compatibility for #{@attributes.title} to #{JSON.stringify compat}"
    @set compat: compat
    @attributes.compat
