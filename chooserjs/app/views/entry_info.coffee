# Entry Info View
templateEntryInfo = require 'templates/entry_info'

module.exports = class EntryInListView extends Backbone.View

  tagName: 'div'
  className: 'entryinfo row'

  initialize: ->
    @model.bind 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateEntryInfo d

  render: =>
    # TODO
    console.log "render EntryInfo #{ @model.id } #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  # events: 

