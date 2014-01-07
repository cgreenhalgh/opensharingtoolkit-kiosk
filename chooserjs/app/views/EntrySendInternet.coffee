# Entry Send Internet View
templateEntrySendInternet = require 'templates/EntrySendInternet'

getter = require 'getter'

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
    # try google qrcode generator http://chart.apis.google.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl=http%3A%2F%2F1.2.4
    qrurl = 'http://chart.apis.google.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl='+encodeURIComponent(geturl)
    data = 
      entry: @model.attributes
      geturl: geturl
      qrurl: qrurl
    @$el.html @template data
    @

  #events: 

