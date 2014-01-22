# consent view

templateConsent = require 'templates/Consent'
recorder = require 'recorder'
attract = require 'attract'

module.exports = class ConsentView extends Backbone.View

  tagName: 'div'
  className: 'consent-modal'

  initialize: ->
    @render()

  render: () ->
    data = {}
    @$el.html @template data
    @

  template: (d) =>
    templateConsent d

  events: 
    #'click': 'close'
    'click [href=-consent-yes]' : 'consentYes'
    'click [href=-consent-no]' : 'consentNo'

  close: (ev)->
    window.router.back()
    false

  consentYes: ->
    recorder.i 'user.consent.yes'
    @close()

  consentNo: ->
    recorder.i 'user.consent.no'
    attract.show()
    
