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
