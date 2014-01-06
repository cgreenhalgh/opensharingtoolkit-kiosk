# EntryList View
templateDevicetypeInChoice = require 'templates/DevicetypeInChoice'

module.exports = class DevicetypeChoiceView extends Backbone.View

  tagName: 'div'
  className: 'devicetype-list'

  # model is Options

  initialize: ->
    @model.bind 'change', @render
    @render() 

  render: =>
    # remove old; selected?
    dterm = @model.attributes.devicetype?.attributes.term
    console.log "render DevicetypeChoice #{dterm}"
    list = @$el
    list.empty()
    @model.attributes.devicetypes.forEach (devicetype) ->
      viewel = templateDevicetypeInChoice 
        devicetype: devicetype.attributes
        selected: (dterm == devicetype.attributes.term)
      list.append viewel

    @

  events: 
    'click .devicetype': 'selectDevice'

  selectDevice: (ev) =>
    term = ev.currentTarget.id
    if term.substring(0,'devicetype-'.length)=='devicetype-'
      term = term.substring 'devicetype-'.length
    devicetype = @model.attributes.devicetypes.find ((dt)->dt?.attributes.term==term)

    if devicetype?
      console.log "select device #{term} = #{devicetype?.attributes.label}"
      @model.set devicetype: devicetype
    else
      console.log "select unknown device #{term}"
    
    # only if you are sure this is where we are...
    $('#entryNotFoundModal').foundation 'reveal','close'

