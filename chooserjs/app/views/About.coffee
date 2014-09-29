# about view

templateAbout = require 'templates/About'
recorder = require 'recorder'
attract = require 'attract'

module.exports = class AboutView extends Backbone.View

  tagName: 'div'
  className: 'about-modal'

  initialize: ->
    @render()

  render: () ->
    # TODO custom aboutHtml
    console.log "render About..."
    data = aboutHtml: '<p>Get free digital leaflets and other downloads here.</p>'+
      '<p>Download straight to your smart phone or tablet using WiFi or 3G.</p>'+
      '<p>Choose what you want to download, how you want to download it, and then follow the instructions.</p>'
    @$el.html @template data
    @

  template: (d) =>
    templateAbout d

  events: 
    'click .ok-button': 'close'
    'click': 'ignore'

  close: (ev)->
    if window.clickFeedback?
      window.clickFeedback()
    console.log "about: close"
    ev.preventDefault()
    window.router.back()
    false

  ignore: (ev) ->
    if window.clickFeedback?
      window.clickFeedback()
    ev.preventDefault()
    ev.stopPropagation()
    console.log "about: ignore click"

