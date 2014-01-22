# EntryList View
templateDevicetypeInChoice = require 'templates/DevicetypeInChoice'
recorder = require 'recorder'
attract = require 'attract'

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
    'click .devicetype-help-show': 'help'
    'click .devicetype-help-hide': 'helpHide'

  helpHide: =>
    attract.active()
    $( '.devicetype-help-panel', @$el ).addClass 'hide'
    $( '.devicetype-help-show', @$el ).removeClass 'hide'
    $( '.devicetype-help-hide', @$el ).addClass 'hide'
    false

  help: (ev) =>
    @helpHide()
    dtel = $( ev.target ).parents '.devicetype'
    $( '.devicetype-help-button', dtel ).toggleClass 'hide'
    dtel.next('.panel').removeClass 'hide'

    term = dtel.get(0).id
    if term.substring(0,'devicetype-'.length)=='devicetype-'
      term = term.substring 'devicetype-'.length
    recorder.i 'user.requestHelp.devicetype',{term:term}

    false

  selectDevice: (ev) =>
    attract.active()
    term = ev.currentTarget.id
    if term.substring(0,'devicetype-'.length)=='devicetype-'
      term = term.substring 'devicetype-'.length
    devicetype = @model.attributes.devicetypes.find ((dt)->dt?.attributes.term==term)

    if devicetype?
      console.log "select device #{term} = #{devicetype?.attributes.label}"
      @model.set devicetype: devicetype
      recorder.i 'user.selectDevice',{term:term,label:devicetype.attributes.label}
    else
      console.log "select unknown device #{term}"
    
    # only if you are sure this is where we are...
    $('#chooseDeviceModal').foundation 'reveal','close'

