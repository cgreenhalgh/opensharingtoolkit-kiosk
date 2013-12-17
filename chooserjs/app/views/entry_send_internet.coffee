# Entry Send Internet View
templateEntrySendInternet = require 'templates/entry_send_internet'

module.exports = class EntrySendInternetView extends Backbone.View

  tagName: 'div'
  className: 'entry_send_internet row'

  initialize: ->
    @model.bind 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateEntrySendInternet d

  render: =>
    console.log "render EntrySendInternet #{ @model.id } #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  #events: 

