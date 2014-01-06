# EntryList View
EntryInListView = require 'views/EntryInList'

module.exports = class EntryListView extends Backbone.View

  tagName: 'div'
  className: 'entry-list'

  initialize: ->
    @model.bind 'change', @render
    @model.bind 'add', @add
    window.options.on 'change:devicetype',@render

  render: =>
    # TODO
    console.log "EntryListView render (devicetype #{window.options.attributes.devicetype?.attributes.term})"
    @$el.empty()
    views = []
    @model.forEach @add
    @

  views: []

  add: (entry, entrylist) =>
    if not entry.attributes.hidden
      if window.options.attributes.devicetype? and not window.options.attributes.devicetype.supportsEntry entry
        return false
      view = new EntryInListView model: entry
      @$el.append view.$el
      @views.push view

  # events: 
