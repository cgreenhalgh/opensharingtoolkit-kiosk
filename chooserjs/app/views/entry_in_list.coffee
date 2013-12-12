# EntryList View
templateEntryInList = require 'templates/entry_in_list'

module.exports = class EntryInListView extends Backbone.View

  tagName: 'div'
  className: 'entryinlist'

  initialize: ->
    @model.bind 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateEntryInList d

  render: =>
    # TODO
    console.log "render EntryInList #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  # events: 
