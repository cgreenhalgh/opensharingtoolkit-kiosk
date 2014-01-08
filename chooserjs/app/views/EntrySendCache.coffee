# Entry Send Cache View
templateEntrySendCache = require 'templates/EntrySendCache'

getter = require 'getter'
kiosk = require 'kiosk'

module.exports = class EntrySendCacheView extends Backbone.View

  tagName: 'div'
  className: 'entry-send-cache row'

  initialize: ->
    @model.bind 'change', @render
    # link/QRcode depends on device type
    window.options.on 'change:devicetype',@render
    @render()

  template: (d) ->
    templateEntrySendCache d

  render: =>
    console.log "render EntrySendCache #{ @model.id } #{ @model.attributes.title }"

    # determine get/helper URL (cache); ensure any kiosk-internal paths are external
    fullurl = getter.getGetUrl @model, window.options.attributes.devicetype, false

    # create shorturl (if provided)
    geturl = kiosk.getTempRedirect fullurl

    # determine QRCode URL
    qrurl = kiosk.getQrCode geturl
    data = 
      entry: @model.attributes
      geturl: geturl
      qrurl: qrurl
      ssid: kiosk.getWifiSsid()
    @$el.html @template data
    @

  #events: 

