# EntryList View
Entry = require 'models/entry'
EntryList = require 'models/entrylist'

module.exports = class EntryListView extends Backbone.View

  initialize: ->
    @model.bind 'change', @render

  render: =>
    # TODO
    @

  # events: 
