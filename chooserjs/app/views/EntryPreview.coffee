# Entry Preview View
templateEntryPreview = require 'templates/EntryPreview'

module.exports = class EntryPreviewView extends Backbone.View

  tagName: 'div'
  className: 'entry-preview row'

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

