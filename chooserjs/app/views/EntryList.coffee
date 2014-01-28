# EntryList View
EntryInListView = require 'views/EntryInList'

recorder = require 'recorder'

module.exports = class EntryListView extends Backbone.View

  tagName: 'div'
  className: 'entry-list'

  initialize: ->
    @model.bind 'change', @render
    @model.bind 'add', @add
    window.options.on 'change:devicetype',@render
    #@$el.append '<div class="floating-help-button"><img src="icons/help.png"></div>'

  render: =>
    # TODO
    console.log "EntryListView render (devicetype #{window.options.attributes.devicetype?.attributes.term})"
    @$el.empty()
    #@$el.append '<div class="floating-help-button"><img src="icons/help.png"></div>'

    views = []
    @model.forEach @add
    @

  views: []

  add: (entry, entrylist) =>
    if not entry.attributes.hidden
      # show all?!
      #if window.options.attributes.devicetype? and not window.options.attributes.devicetype.supportsEntry entry
      #  return false
      view = new EntryInListView model: entry
      @$el.append view.$el
      @views.push view

  events: 
    'click .floating-help-button': 'showHelp'

  showHelp: =>
    recorder.i 'user.requestHelp.floatingHelp'
    console.log "EntryList help..."
    window.router.navigate 'help', trigger:true
    
