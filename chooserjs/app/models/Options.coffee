# general options
module.exports = class Options extends Backbone.Model
  defaults:
    kioskmode: false
    kiosk: false
    devicetype: null
    #devicetypes: 

  getBrowserDevicetype: () ->
    # guess from agent string and mimetypes
    userAgent = navigator.userAgent
    devicetype = @attributes.devicetypes.find (dt) ->
      if dt.attributes.userAgentPattern?
        pat = new RegExp dt.attributes.userAgentPattern
        if pat.test userAgent
          console.log "host device seems to be #{dt.attributes.term} (user agent: #{userAgent})"
          true
        else false
      else false
    # fallback to 'other'
    if not devicetype?
      console.log "host device unknown (user agent: #{userAgent})"
      devicetype = @attributes.devicetypes.find (dt) -> dt.attributes.term == 'other'
    devicetype

