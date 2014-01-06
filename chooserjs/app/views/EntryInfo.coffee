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
    # TODO

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

