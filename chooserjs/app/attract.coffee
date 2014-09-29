# attract logic
# test

AttractView = require 'views/Attract'
ExplainView = require 'views/Explain'
recorder = require 'recorder'

configShowAttract = false
currentAttract = null
currentExplain = null

DEFAULT_DELAY = 60000
# 60000

reset = () ->
  if configShowAttract
    console.log "!!!reset!!!"
    recorder.i 'app.reset'

    window.options.set devicetype: null
    # fix scrollTop
    if window.views.length>0
      window.views[0].scrollTop = 0
    window.router.navigate "entries", trigger:true

showAttract = () ->
  if currentExplain? and $(currentExplain.el).is ":visible"
    try
      currentExplain.remove()
      currentExplain = null
    catch error
      console.log "error removing explain on showAttract: #{error}"

  if currentAttract? and $(currentAttract.el).is ":visible"
    # no-op
  else
    if currentAttract? 
      try
        currentAttract.remove()
      catch error
        console.log "error re-showing attract: #{error}"

    recorder.i 'view.attract.show'
    currentAttract = new AttractView()
    $('#mainEntrylistHolder').after currentAttract.el
    $(currentAttract.el).trigger('isVisible')
    reset() 
   
ATTRACT_DELAY = DEFAULT_DELAY

if configShowAttract
  timer = setTimeout showAttract,ATTRACT_DELAY

active = () ->
  if timer?
    clearTimeout timer
  if configShowAttract
    timer = setTimeout showAttract,ATTRACT_DELAY
  else
    timer = null

$(window).on 'touchstart touchmove touchend mousedown mousemove mouseup', () ->
  active()
  true
  

$(window).on 'scroll', () ->
  active()
  true

module.exports.active = active
module.exports.show = showAttract
module.exports.showExplain = () ->
  #console.log "showExplain"
  if currentExplain? and $(currentExplain.el).is ":visible"
    # no-op
  else
    if currentExplain? 
      try
        currentExplain.remove()
      catch error
        console.log "error re-showing explain: #{error}"

    recorder.i 'view.explain.show'
    currentExplain = new ExplainView()
    $('#mainEntrylistHolder').after currentExplain.el
    $(currentExplain.el).trigger('isVisible')

module.exports.setShowAttract = (val) ->
  console.log "setShowAttract #{val}"
  configShowAttract = val
  active()
  if configShowAttract
    showAttract()

