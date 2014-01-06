# EntryList View
templateEntryInList = require 'templates/EntryInList'

module.exports = class EntryInListView extends Backbone.View

  tagName: 'div'
  className: 'entry-in-list'

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

  view: (ev) =>
    console.log 'view '+@model.id
    window.router.navigate 'entry/'+encodeURIComponent(@model.id), trigger:true
    # done
    ev.preventDefault()
    false

  events: 
    'click': 'view'
