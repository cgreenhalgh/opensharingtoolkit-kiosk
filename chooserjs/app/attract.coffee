# attract logic
# test

AttractView = require 'views/Attract'
recorder = require 'recorder'
kiosk = require 'kiosk'

currentAttract = null

resetTimer = null

RESET_DELAY = 60000

reset = () ->
  resetTimer = null
  if kiosk.isKiosk()
    console.log "!!!reset!!!"
    recorder.i 'app.reset'
    window.options.set devicetype: null
    # fix scrollTop
    if window.views.length>0
      window.views[0].scrollTop = 0
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

if not kiosk.isKiosk()
  timer = setTimeout showAttract,ATTRACT_DELAY

active = () ->
  if timer?
    clearTimeout timer
  if not kiosk.isKiosk()
    timer = setTimeout showAttract,ATTRACT_DELAY
  else
    timer = null
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


