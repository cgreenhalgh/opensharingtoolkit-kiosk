# EntryList View
EntryInListView = require 'views/EntryInList'

module.exports = class EntryListView extends Backbone.View

  tagName: 'div'
  className: 'entry-list'

  initialize: ->
    @model.bind 'change', @render
    @model.bind 'add', @add

  render: =>
    # TODO
    @

  views: []

  add: (entry, entrylist) =>
    if not entry.attributes.hidden
      view = new EntryInListView model: entry
      @$el.append view.$el
      @views.push view

  # events: 
