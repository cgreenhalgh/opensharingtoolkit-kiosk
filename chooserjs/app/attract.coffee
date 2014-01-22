# attract logic
# test

AttractView = require 'views/Attract'
recorder = require 'recorder'

currentAttract = null

resetTimer = null

RESET_DELAY = 60000

reset = () ->
  resetTimer = null
  console.log "!!!reset!!!"
  recorder.i 'app.reset'
  window.router.navigate "entries", trigger:true

showAttract = () ->
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
    
    if resetTimer?
      clearTimeout resetTimer
    resetTimer = setTimeout reset,RESET_DELAY

ATTRACT_DELAY = 60000

timer = setTimeout showAttract,1000

active = () ->
  clearTimeout timer
  timer = setTimeout showAttract,ATTRACT_DELAY
  if resetTimer?
    clearTimeout resetTimer
    resetTimer = null

$(window).on 'touchstart touchmove touchend mousedown mousemove mouseup', () ->
  active()
  true
  

$(window).on 'scroll', () ->
  active()
  true

module.exports.active = active
module.exports.show = showAttract


