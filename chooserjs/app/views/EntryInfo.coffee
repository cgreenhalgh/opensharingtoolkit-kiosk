# Entry Info View
templateEntryInfo = require 'templates/EntryInfo'

getter = require 'getter'
kiosk = require 'kiosk'
recorder = require 'recorder'
attract = require 'attract'

module.exports = class EntryInfoView extends Backbone.View

  tagName: 'div'
  className: 'entry-info row'

  initialize: ->
    @listenTo @model,'change', @render
    @listenTo window.options,'change:devicetype',@render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateEntryInfo d

  render: =>
    # TODO show send cache if we are not kiosk but are being served directly by cache
    url = (_.find @model.attributes.enclosures, (enc)->enc.url?)?.url
    path = (_.find @model.attributes.enclosures, (enc)->enc.path?)?.path
    console.log "render EntryInfo #{ @model.id } #{ @model.attributes.title } url=#{url} path=#{path}"
    data =
      entry: @model.attributes
      optionGet: not kiosk.isKiosk()
      optionSendInternet: url?
      optionSendCache: path? and kiosk.isKiosk()
      optionPreview: (@model.attributes.thumbnails.length > 0) or (not kiosk.getSafePreview() and not @model.attributes.isKiosk)     
    @$el.html @template data 
    @

  events: 
    'click .help-option-view': 'helpOptionView'
    'click .help-option-send-internet': 'helpOptionSendInternet'
    'click .help-option-send-cache': 'helpOptionSendCache'
    'click .help-option-get': 'helpOptionGet'
    'click .option-view': 'optionView'
    'click .option-get': 'optionGet'
    'click .option-send-internet': 'optionSendInternet'
    'click .option-send-cache': 'optionSendCache' 
    #'click .more-help-option-send-internet': 'moreHelpOptionSendInternet'
    #'click .more-help-option-send-cache': 'moreHelpOptionSendCache'

  click: () ->
    if window.clickFeedback?
      window.clickFeedback()

  helpOption: (name) =>
    @click()
    attract.active()
    recorder.i 'user.requestHelp.option',{option:name}
    $( ".help-option-#{name}", @$el ).toggleClass 'hide'
    b = $( ".help-option-#{name}", @$el ).get(1)
    if not $(b).hasClass 'hide'
      offset = $(b).offset()
      recorder.d 'app.scroll',{scrollTop:offset.top,scrollLeft:0}
      window.scrollTo 0,offset.top
      #$(b).scrollIntoView()
    false

  helpOptionView: =>
    @helpOption 'view'

  helpOptionSendInternet: =>
    @helpOption 'send-internet'

  helpOptionSendCache: =>
    @helpOption 'send-cache'

  helpOptionGet: =>
    @helpOption 'get'

  optionView: =>
    @click()
    attract.active()
    recorder.i 'user.option.view',{id:@model.id}
    console.log "option:view entry #{ @model.id }"
    if not kiosk.getSafePreview() and not @model.attributes.isKiosk
      enc = @model.attributes.enclosures[0]
      url =  if not kiosk.isKiosk() then enc.url else (enc.path ? enc.url)
      url = kiosk.getPortableUrl url
      console.log "view #{@model.attributes.title} as #{url}, enc #{enc.path}  / #{enc.url}"
      if not kiosk.openUrl url, enc.mime
        console.log "openUrl failed - try window.open"
        window.open url, "_blank"
    else
      window.router.navigate "preview/#{ encodeURIComponent @model.id }", trigger:true

  optionGet: =>
    @click()
    attract.active()
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
      devicetype = window.options.attributes.devicetype

    url = getter.getGetUrl @model, devicetype

    recorder.i 'user.option.get',{id:@model.id,devicetype:devicetype.attributes.term,url:url}

    window.open(url,'_self')

  optionSendInternet: =>
    @click()
    attract.active()
    recorder.i 'user.option.sendInternet',{id:@model.id}
    console.log "option:send(internet) entry #{ @model.id }"
    window.router.navigate "sendInternet/#{ encodeURIComponent @model.id }", trigger:true

  optionSendCache: =>
    @click()
    attract.active()
    recorder.i 'user.option.sendCache',{id:@model.id}
    console.log "option:send(cache) entry #{ @model.id }"
    window.router.navigate "sendCache/#{ encodeURIComponent @model.id }", trigger:true

