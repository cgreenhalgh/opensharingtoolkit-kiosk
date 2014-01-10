# Entry Info View
templateEntryInfo = require 'templates/EntryInfo'

getter = require 'getter'
kiosk = require 'kiosk'

module.exports = class EntryInfoView extends Backbone.View

  tagName: 'div'
  className: 'entry-info row'

  initialize: ->
    @model.bind 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateEntryInfo d

  render: =>
    console.log "render EntryInfo #{ @model.id } #{ @model.attributes.title }"
    # TODO show send cache if we are not kiosk but are being served directly by cache
    url = _.find @model.attributes.enclosures, (enc)->enc.url?
    path = _.find @model.attributes.enclosures, (enc)->enc.path?
    data =
      entry: @model.attributes
      optionGet: not kiosk.isKiosk()
      optionSendInternet: url?
      optionSendCache: path? and kiosk.isKiosk()
      optionPreview: @model.attributes.thumbnails.length > 0      
    @$el.html @template data 
    @

  events: 
    'click .option-view': 'optionView'
    'click .option-get': 'optionGet'
    'click .option-send-internet': 'optionSendInternet'
    'click .option-send-cache': 'optionSendCache' 

  optionView: =>
    console.log "option:view entry #{ @model.id }"
    window.router.navigate "preview/#{ encodeURIComponent @model.id }", trigger:true

  optionGet: =>
    console.log "option:get entry #{ @model.id }"
    # non-kiosk only! (but can do this in kiosk mode)
    # get.html should be available relative to page.
    # enclosure should use cache if possible.
    # no shorturl or qrcode needed :-)
    #
    # use selected device type?? if force use from browser?!
    devicetype = window.options.getBrowserDevicetype()
    if window.options.attributes.devicetype? and window.options.attributes.devicetype != devicetype
      console.log "Warning: browser device type is not selected device type (#{devicetype?.attributes.term} vs #{window.options.devicetype?.attributes.term}"

    url = getter.getGetUrl @model, devicetype

    window.open(url)

  optionSendInternet: =>
    if not window.options.attributes.devicetype?
      window.delayedNavigate = "sendInternet/#{ encodeURIComponent @model.id }"
      $('#chooseDeviceModal').foundation 'reveal','open'
    else
      console.log "option:send(internet) entry #{ @model.id }"
      window.router.navigate "sendInternet/#{ encodeURIComponent @model.id }", trigger:true

  optionSendCache: =>
    if not window.options.attributes.devicetype?
      window.delayedNavigate = "sendCache/#{ encodeURIComponent @model.id }"
      $('#chooseDeviceModal').foundation 'reveal','open'
    else
      console.log "option:send(cache) entry #{ @model.id }"
      window.router.navigate "sendCache/#{ encodeURIComponent @model.id }", trigger:true

