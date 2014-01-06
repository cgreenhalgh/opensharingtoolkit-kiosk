# Options devicetype text label view
module.exports = class OptionsDevicetypeLabelView extends Backbone.View

  initialize: ->
    @model.bind 'change', @render
    @render() 

  render: =>
    if @model.attributes.devicetype?
      @$el.text 'For '+@model.attributes.devicetype.attributes.label+' (change...)'
    else
      @$el.text 'Unspecified device (change...)'

