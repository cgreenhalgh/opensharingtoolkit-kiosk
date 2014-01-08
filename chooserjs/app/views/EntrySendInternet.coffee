# Entry Send Internet View
templateEntrySendInternet = require 'templates/EntrySendInternet'

getter = require 'getter'
kiosk = require 'kiosk'

module.exports = class EntrySendInternetView extends Backbone.View

  tagName: 'div'
  className: 'entry-send-internet row'

  initialize: ->
    @model.bind 'change', @render
    # link/QRcode depends on device type
    window.options.on 'change:devicetype',@render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateEntrySendInternet d

  render: =>
    console.log "render EntrySendInternet #{ @model.id } #{ @model.attributes.title }"
    # determine get/helper URL (nocache)
    fullurl = getter.getGetUrl @model, window.options.attributes.devicetype, true

    # look up shorturl (if provided)
    geturl = window.entries.shorturls[fullurl] ? fullurl 

    # determine QRCode URL
    qrurl = kiosk.getQrCode geturl
    data = 
      entry: @model.attributes
      geturl: geturl
      qrurl: qrurl
    @$el.html @template data
    @

  #events: 

