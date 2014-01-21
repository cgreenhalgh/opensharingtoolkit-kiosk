# attract logic
# test

AttractView = require 'views/Attract'

currentAttract = null

showAttract = () ->
  if currentAttract? and $(currentAttract.el).is ":visible"
    # no-op
  else
    if currentAttract? 
      try
        currentAttract.remove()
      catch error
        console.log "error re-showing attract: #{error}"

    currentAttract = new AttractView()
    $('#mainEntrylistHolder').after currentAttract.el
    $(currentAttract.el).trigger('isVisible')

ATTRACT_DELAY = 20000

timer = setTimeout showAttract,1000

$(window).on 'touchstart touchmove touchend mousedown mousemove mouseup', () ->
  clearTimeout timer
  timer = setTimeout showAttract,ATTRACT_DELAY

