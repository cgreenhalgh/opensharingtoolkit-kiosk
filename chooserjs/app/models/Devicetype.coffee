# a device (type)
# was { term: "android", label: "Android", userAgentPattern: 'Android', supportsMime: [ "text/html", "application/vnd.android.package-archive" ] }
module.exports = class Devicetype extends Backbone.Model
  defaults:
    label: 'Default device type' 
    supportsMime: []
    # term: 
    # userAgentPattern:

  supportsEntry: (entry) ->
    console.log "check if #{@attributes.term} supports #{entry.attributes.title}"
    # direct mime type support?
    mimetypes = for enc in entry.attributes.enclosures
      enc.mime
    self = @
    supportedMime = _.find mimetypes, (mt)->self.attributes.supportsMime.indexOf(mt)>=0
    if supportedMime?
      return true
    # support via app?
    helper = window.entries.find (entry) ->
      if entry.attributes.requiresDevice?.indexOf(self.attributes.term) >= 0
        supportedMime = _.find mimetypes, (mt)->entry.attributes.supportsMime.indexOf(mt)>=0
        return supportedMime?
      else false
    return helper?

