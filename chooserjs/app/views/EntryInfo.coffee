# Entry Info View
templateEntryInfo = require 'templates/EntryInfo'

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
    data = _.clone @model.attributes
    # TODO visible options filter
    console.log "render EntryInfo #{ @model.id } #{ @model.attributes.title }"
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
    enc = @model.attributes.enclosures[0]
    # use cache copy if available
    url = enc.path ? enc.url;
    console.log('get '+@model.attributes.title+' as '+url)

    # leave app URLs alone for now (assumed internet-only)
    as = window.options.attributes.devicetype?.getAppUrls enc.mime

    # relative URL
    baseurl = window.location.href
    hix = baseurl.indexOf '#'
    baseurl = if (hix>=0) then baseurl.substring(0,hix) else baseurl
    ix = baseurl.lastIndexOf '/'
    baseurl = if (ix>=0) then baseurl.substring(0,ix+1) else ''
    url = baseurl+'get.html?'+
      'u='+encodeURIComponent(url)+
      '&t='+encodeURIComponent(@model.attributes.title)
    for ai in as ? []
      url = url+'&a='+encodeURIComponent(as[ai])

    console.log "Using helper page url #{url}"	
    window.open(url)

  optionSendInternet: =>
    if not window.options.attributes.devicetype?
      $('#chooseDeviceModal').foundation 'reveal','open'
    else
      console.log "option:send(internet) entry #{ @model.id }"
      window.router.navigate "sendInternet/#{ encodeURIComponent @model.id }", trigger:true

  optionSendCache: =>
    if not window.options.attributes.devicetype?
      $('#chooseDeviceModal').foundation 'reveal','open'
    else
      console.log "option:send(cache) entry #{ @model.id }"
      window.router.navigate "sendCache/#{ encodeURIComponent @model.id }", trigger:true

