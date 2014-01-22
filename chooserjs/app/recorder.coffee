# study logging = recorder

log = (level,event,info) ->
  jsoninfo = null
  if info?
    try 
      jsoninfo = JSON.stringify info
    catch error
      console.log "error stringifying log info #{info}: #{error.message}"
  if window.kiosk?
    window.kiosk.record level,event,jsoninfo
  else
    console.log "record: #{level} #{event} #{jsoninfo}"

module.exports.d = (event,info) ->
  log 2,event,info

module.exports.i = (event,info) ->
  log 4,event,info

module.exports.w = (event,info) ->
  log 6,event,info

module.exports.e = (event,info) ->
  log 8,event,info

$(window).on 'touchstart', (ev) ->
  log 2,'user.window.touchstart',{pageX:ev.pageX,pageY:ev.pageY}
  true

$(window).on 'touchend', (ev) ->
  log 2,'user.window.touchend',{pageX:ev.pageX,pageY:ev.pageY}
  true

$(window).on 'mousedown', (ev) ->
  log 2,'user.window.mousedown',{pageX:ev.pageX,pageY:ev.pageY}
  true

$(window).on 'mouseup', (ev) ->
  log 2,'user.window.mouseup',{pageX:ev.pageX,pageY:ev.pageY}
  true

$(window).on 'scroll', () ->
  log 2,'user.window.scroll',{scrollTop:$(window).scrollTop(),scrollLeft:$(window).scrollLeft()}
  true


