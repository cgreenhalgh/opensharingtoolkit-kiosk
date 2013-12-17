# Entry Send Cache View
templateEntrySendCache = require 'templates/entry_send_cache'

module.exports = class EntrySendCacheView extends Backbone.View

  tagName: 'div'
  className: 'entry_send_cache row'

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

