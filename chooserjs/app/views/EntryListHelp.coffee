# EntryListHelp View
# back is #back, choose device is #chooseDevicetype
templateEntryListHelp = require 'templates/EntryListHelp'

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
    'click': 'close'

  close: ->
    window.router.back()

  remove: =>
    console.log 'close/remove EntryListHelp'
    @$el.remove()
    $( '#back .help-below-left-align' ).remove()
    $( '#chooseDevicetype .help-below-right-align' ).remove()

