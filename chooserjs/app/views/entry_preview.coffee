# Entry Preview View
templateEntryPreview = require 'templates/entry_preview'

module.exports = class EntryPreviewView extends Backbone.View

  tagName: 'div'
  className: 'entrypreview row'

  initialize: ->
    @model.bind 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateEntryPreview d

  render: =>
    console.log "render EntryPreview #{ @model.id } #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  #events: 

