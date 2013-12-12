# EntryList View
EntryInListTemplate = require 'templates/entry_in_list'

module.exports = class EntryInListView extends Backbone.View

  tagName: 'div'
  className: 'entryinlist'

  initialize: ->
    @model.bind 'change', @render

  render: =>
    # TODO
    @

  # events: 
