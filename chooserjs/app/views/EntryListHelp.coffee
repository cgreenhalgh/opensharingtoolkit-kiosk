# EntryListHelp View
# back is #back, choose device is #chooseDevicetype
templateEntryListHelp = require 'templates/EntryListHelp'

recorder = require 'recorder'
attract = require 'attract'

module.exports = class EntryListView extends Backbone.View

  tagName: 'div'
  className: 'entry-list-help'

  initialize: ->
    @render()

  render: =>
    data = {}
    @$el.html @template data
    @extraEls = []
    backHelp = $( '<p class="help-below-left-align"><img src="icons/label-below-right.png" class="help-label"><span>Touch to go back</span></p>' )
    $( '#back' ).append backHelp
    @extraEls.push backHelp
    deviceHelp = $( '<p class="help-below-right-align"><span>Identify your phone</span><img src="icons/label-below-left.png" class="help-label"></p>' )
    $( '#chooseDevicetype' ).append deviceHelp
    @extraEls.push deviceHelp
    @

  template: (d) =>
    templateEntryListHelp d

  events: 
    'click .entry-list-help-info': 'showExplain'
    'click': 'close'

  showExplain: () ->
    if window.clickFeedback?
      window.clickFeedback()
    recorder.i 'user.requestHelp.info'
    attract.showExplain()

  close: (ev)->
    if window.clickFeedback?
      window.clickFeedback()
    ev.preventDefault()
    window.router.back()
    false

  remove: =>
    console.log 'close/remove EntryListHelp'
    Backbone.View.prototype.remove.apply this
    @$el.remove()
    $( '#back .help-below-left-align' ).remove()
    $( '#chooseDevicetype .help-below-right-align' ).remove()

