# Entry Send Cache View
templateEntrySendCache = require 'templates/EntrySendCache'
templateQRCodeHelp = require 'templates/QRCodeHelp'

getter = require 'getter'
kiosk = require 'kiosk'
attract = require 'attract'
recorder = require 'recorder'

module.exports = class EntrySendCacheView extends Backbone.View

  tagName: 'div'
  className: 'entry-send-cache row'

  initialize: ->
    @listenTo @model, 'change', @render
    # link/QRcode depends on device type
    @listenTo window.options,'change:devicetype',@render
    @render()

  template: (d) ->
    templateEntrySendCache d

  render: =>
    console.log "render EntrySendCache #{ @model.id } #{ @model.attributes.title }"

    # determine get/helper URL (cache); ensure any kiosk-internal paths are external
    fullurl = getter.getGetUrl @model, window.options.attributes.devicetype, false

    # default redirect
    path = '/'
    if kiosk.registerRedirect path,fullurl
      geturl = kiosk.getUrlForPath path
    else
      # create shorturl (if provided)
      geturl = kiosk.getTempRedirect fullurl

    # determine QRCode URL
    qrurl = kiosk.getQrCode geturl
    data = 
      templateQRCodeHelp: templateQRCodeHelp
      entry: @model.attributes
      geturl: geturl
      qrurl: qrurl
      devicetype: window.options.attributes.devicetype
      ssid: kiosk.getWifiSsid() ? "??"
    @$el.html @template data
    @

  events: 
    'click .entry-option-step-show': 'help'
    'click .entry-option-step-hide': 'helpHide'

  helpHide: =>
    attract.active()
    $( '.entry-option-step-panel', @$el ).addClass 'hide'
    $( '.entry-option-step-show', @$el ).removeClass 'hide'
    $( '.entry-option-step-hide', @$el ).addClass 'hide'
    false

  help: (ev) =>
    attract.active()
    $( '.entry-option-step-panel', @$el ).addClass 'hide'
    # need to get the position at the right time!
    offset = $( ev.target ).offset()
    $( '.entry-option-step-show', @$el ).removeClass 'hide'
    $( '.entry-option-step-hide', @$el ).addClass 'hide'

    dtel = $( ev.target ).parents('.row').first()
    recorder.i 'user.requestHelp.sendCache',{section:($(dtel).attr 'help-section')}
    $( '.entry-option-step-help-button', dtel ).toggleClass 'hide'
    $( '.entry-option-step-panel', dtel ).removeClass 'hide'
    recorder.d 'app.scroll',{scrollTop:offset.top,scrollLeft:0}
    window.scrollTo 0,offset.top
    false

