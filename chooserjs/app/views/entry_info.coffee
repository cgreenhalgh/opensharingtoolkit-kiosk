# Entry Info View
templateEntryInfo = require 'templates/entry_info'

module.exports = class EntryInfoView extends Backbone.View

  tagName: 'div'
  className: 'entryinfo row'

  initialize: ->
    @model.bind 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateEntryInfo d

  render: =>
    data = _.clone @model.attributes
    # TODO visible options filter
    console.log "render EntryInfo #{ @model.id } #{ @model.attributes.title }"
    @$el.html @template data
    @

  events: 
    'click .option_view': 'option_view'
    'click .option_get': 'option_get'
    'click .option_send_internet': 'option_send_internet'
    'click .option_send_cache': 'option_send_cache' 

  option_view: =>
    console.log "option:view entry #{ @model.id }"
    window.router.navigate "preview/#{ encodeURIComponent @model.id }", trigger:true

  option_get: =>
    console.log "option:get entry #{ @model.id }"
    # TODO

  option_send_internet: =>
    console.log "option:send(internet) entry #{ @model.id }"
    window.router.navigate "send_internet/#{ encodeURIComponent @model.id }", trigger:true

  option_send_cache: =>
    console.log "option:send(cache) entry #{ @model.id }"
    window.router.navigate "send_cache/#{ encodeURIComponent @model.id }", trigger:true

