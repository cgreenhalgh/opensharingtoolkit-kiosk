# Entry Send Cache View
templateEntrySendCache = require 'templates/EntrySendCache'

module.exports = class EntrySendCacheView extends Backbone.View

  tagName: 'div'
  className: 'entry-send-cache row'

  initialize: ->
    @model.bind 'change', @render
    @render()

  template: (d) ->
    templateEntrySendCache d

  render: =>
    console.log "render EntrySendCachen #{ @model.id } #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  #events: 

