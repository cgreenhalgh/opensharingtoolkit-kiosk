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
    # iconurl
    # prefix
    # cacheinfo
