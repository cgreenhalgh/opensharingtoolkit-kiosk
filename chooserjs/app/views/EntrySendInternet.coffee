# Entry Send Internet View
templateEntrySendInternet = require 'templates/EntrySendInternet'
templateQRCodeHelp = require 'templates/QRCodeHelp'

getter = require 'getter'
kiosk = require 'kiosk'
attract = require 'attract'
recorder = require 'recorder'

module.exports = class EntrySendInternetView extends Backbone.View

  tagName: 'div'
  className: 'entry-send-internet row'

  initialize: ->
    @listenTo @model, 'change', @render
    # link/QRcode depends on device type
    @listenTo window.options, 'change:devicetype',@render
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

    # look up shorturl (if provided)
    qrfullurl = fullurl+'&qr'
    qrgeturl = window.entries.shorturls[qrfullurl] ? qrfullurl 

    # determine QRCode URL
    qrurl = kiosk.getQrCode qrgeturl
    data = 
      templateQRCodeHelp: templateQRCodeHelp
      entry: @model.attributes
      geturl: geturl
      qrurl: qrurl
      devicetype: window.options.attributes.devicetype
    @$el.html @template data
    @

  events: 
    'click .entry-option-step-show': 'help'
    'click .entry-option-step-hide': 'helpHide'

  click: () ->
    if window.clickFeedback?
      window.clickFeedback()

  helpHide: =>
    @click()
    attract.active()
    $( '.entry-option-step-panel', @$el ).addClass 'hide'
    $( '.entry-option-step-show', @$el ).removeClass 'hide'
    $( '.entry-option-step-hide', @$el ).addClass 'hide'
    false

  help: (ev) =>
    @click()
    attract.active()
    $( '.entry-option-step-panel', @$el ).addClass 'hide'
    # need to get the position at the right time!
    offset = $( ev.target ).offset()
    $( '.entry-option-step-show', @$el ).removeClass 'hide'
    $( '.entry-option-step-hide', @$el ).addClass 'hide'

    dtel = $( ev.target ).parents('.row').first()
    recorder.i 'user.requestHelp.sendInternet',{section:($(dtel).attr 'help-section')}

    $( '.entry-option-step-help-button', dtel ).toggleClass 'hide'
    $( '.entry-option-step-panel', dtel ).removeClass 'hide'
    recorder.d 'app.scroll',{scrollTop:offset.top,scrollLeft:0}
    window.scrollTo 0,offset.top
    false

