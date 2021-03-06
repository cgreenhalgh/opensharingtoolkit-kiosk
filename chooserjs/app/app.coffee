Mimetype = require 'models/Mimetype'
MimetypeList = require 'models/MimetypeList' 
Devicetype = require 'models/Devicetype'
DevicetypeList = require 'models/DevicetypeList'
Options = require 'models/Options'
Entry = require 'models/Entry'
EntryList = require 'models/EntryList'

EntryListView = require 'views/EntryList'
EntryInfoView = require 'views/EntryInfo'
EntryPreviewView = require 'views/EntryPreview'
EntrySendInternetView = require 'views/EntrySendInternet'
EntrySendCacheView = require 'views/EntrySendCache'
DevicetypeChoiceView = require 'views/DevicetypeChoice'
OptionsDevicetypeLabelView = require 'views/OptionsDevicetypeLabel'
EntryListHelpView = require 'views/EntryListHelp'
AboutView = require 'views/About'
ConsentView = require 'views/Consent'
ExplainView = require 'views/Explain'

# atom/entry file loader
loader = require 'loader'
kiosk = require 'kiosk'
attract = require 'attract'
recorder = require 'recorder'

# view stack?!
window.views = []

aboutModel = new Backbone.Model()

# addView to stack utility
addView = (view,title,path) ->
  path = '#'+path
  bc = $ '.breadcrumbs' 
  # TODO check if view already present, in which case expose
  #bcpaths = $('a',bc).attr('href') ? []
  bcas = $('a',bc)
  for bcpath,bcix in bcas
    if ($(bcpath).attr 'href') == path
      while bcix+1<bcas.length
        popView()
        bcix++
      # done
      console.log "Re-show existing view"
      view.remove()
      recorder.i 'view.add.existing', {title:title,path:path,level:window.views.length}
      return

  if window.views.length>0 
    # preserve old scroll 
    v =window.views[window.views.length-1]
    v.scrollTop = $(window).scrollTop()
    v.$el.hide()
    $('#topbar-menu').addClass 'hide'
    $('#topbar-back').removeClass 'hide'
    
  window.views.push view
  $('#mainEntrylistHolder').after view.el
  bc.append "<li><a href='#{path}'>#{title}</a></li>"
  recorder.d 'app.scroll',{scrollTop:0,scrollLeft:0}
  window.scrollTo 0,0

  recorder.i 'view.page.add', {title:title,path:path,level:window.views.length}

popView = ->
  if window.views.length>0
    view = window.views.pop()
    view.remove()
    # TODO restore old scroll, at least on entries
  $('.breadcrumbs li:last-child').remove()
  if window.views.length>0
    v = window.views[window.views.length-1]
    v.$el.show()
    if v.scrollTop?
      console.log "scroll to #{v.scrollTop}"
      recorder.d 'app.scroll',{scrollTop:v.scrollTop,scrollLeft:0}
      window.scrollTo 0,v.scrollTop

    bc = $ '.breadcrumbs' 
    bcas = $('a',bc)
    path = if bcas.length>0 then $(bcas[bcas.length-1]).attr 'href' else undefined
    recorder.i 'view.page.reveal', {path:path,level:window.views.length}
  else
    console.log "no scrollTop found"
    recorder.i 'view.page.reveal.empty', {level:window.views.length}

  if window.views.length<=1
    $('#topbar-menu').removeClass 'hide'
    $('#topbar-back').addClass 'hide'



# main internal url router
class Router extends Backbone.Router
  routes: 
    #"home" : "entries"
    "": "entries"
    "entries" : "entries"
    "help" : "help"
    "about" : "about"
    "entry/:eid" : "entry"
    "preview/:eid" : "preview"
    "sendInternet/:eid" : "sendInternet"
    "sendCache/:eid" : "sendCache"
    #"consent" : "consent"

  back: ->
    attract.active()
    bcas = $('.breadcrumbs a')
    if bcas.length >= 2
      href = $(bcas[bcas.length-2]).attr 'href'
      console.log "back to #{href}"
      router.navigate(href,{trigger:true})
    else
      console.log "back with nothing to go back to"

  entries: ->
    attract.active()
    # all entries - top-level view
    while window.views.length>1
      popView()

  help: ->
    attract.active()
    #@entries()
    if window.views.length==0
      console.log "cannot show help - no initial view"
    else
      v = window.views[window.views.length-1]
      view = new EntryListHelpView()
      addView view, "Help", "help"
      # special case - overlay show entries
      v.scrollTop = 0
      v.$el.show()

  about: ->
    attract.active()
    #@entries()
    if window.views.length==0
      console.log "cannot show about - no initial view"
    else
      attract.active()
      view = new AboutView model: aboutModel
      addView view, "About", "about"

  consent: ->
    if window.views.length==0
      console.log "cannot show consent - no initial view"
    else
      attract.active()
      view = new ConsentView()
      addView view, "Consent", "consent"

  getEntry: (id) ->
    attract.active()
    # id is already URI-decoded
    entry = window.entries?.get id
    if not entry? 
      #alert "Could not find that entry (#{id})"
      console.log "Could not find entry #{id}"
      $('#entryNotFoundModal').foundation 'reveal','open'
      recorder.w 'view.error.entryNotFound',{id:id}
      null
    else
      entry

  entry: (id) ->
    attract.active()
    entry = @getEntry id
    if not entry? 
      return false
    console.log "show entry #{id} #{entry.attributes.title}"
    view = new EntryInfoView model: entry
    addView view, entry.attributes.title, "entry/#{encodeURIComponent id}"

  preview: (id) ->
    attract.active()
    entry = @getEntry id
    if not entry? 
      return false
    console.log "preview entry #{id}"
    if window.views.length<2
      console.log "preview adding missing entry view #{id}"
      @entry id
    view = new EntryPreviewView model: entry
    addView view, "Preview", "preview/#{encodeURIComponent id}"
  
  sendInternet: (id) ->
    attract.active()
    entry = @getEntry id
    if not entry? 
      return false
    console.log "send(internet) entry #{id}"
    if window.views.length<2
      console.log "sendInternet adding missing entry view #{id}"
      @entry id
    view = new EntrySendInternetView model: entry
    addView view, "Send over Internet", "sendInternet/#{encodeURIComponent id}"
  
  sendCache: (id) ->
    attract.active()
    entry = @getEntry id
    if not entry? 
      return false
    console.log "send(cache) entry #{id}"
    if window.views.length<2
      console.log "sendCache adding missing entry view #{id}"
      @entry id
    view = new EntrySendCacheView model: entry
    addView view, "Send locally", "sendCache/#{encodeURIComponent id}"


testentry1 = new Entry 
        title: 'Test entry 1'
        summary: 'test entry 1...'
        iconurl: 'icons/_blank.png'

chooseDevicetype = ->
  console.log "chooseDevicetype"
  $('#chooseDeviceModal').foundation 'reveal','open'
  recorder.w 'view.modal.chooseDevice.show'
  return false


App =
  init: ->

    # backbonetest - based on 
    # http://adamjspooner.github.io/coffeescript-meet-backbonejs/05/docs/script.html
    Backbone.sync = (method, model, success, error) ->
      success()

    # in-app virtual pages
    router = new Router
    window.router = router

    # default mime types
    mimetypes = new MimetypeList()
    # should be loaded by loader from mimetypes.json
    window.mimetypes = mimetypes

    # default device types
    devicetypes = new DevicetypeList()

    # should be loaded by loader from devices.json
    # there MUST be a devicetype 'other' to use as default
    devicetypes.add new Devicetype
      id: "other"
      term: "other"
      label: "Other Device"
      supportsMime: [ ]
      optionalSupportsMime: [ "text/html" ]
      helpHtml: '<p>If you have another sort of smart phone or tablet to the ones listed then some of the content here may work, but unfortunately we can\'t make any guarantees. If you just aren\'t sure what sort of phone it is then make guess!</p>'

    # general options
    options = new Options devicetypes: devicetypes
    # best way to find options?? (NB needed before Entry view(s))
    window.options = options

    # defer device determination until devices.json is loaded

    # device options view/change
    devicetypeChooser = new DevicetypeChoiceView model: options
    $('#chooseDeviceModal').append devicetypeChooser.$el

    devicetypeLabelView = new OptionsDevicetypeLabelView model: options
    devicetypeLabelView.setElement $('#chooseDevicetype a')
    devicetypeLabelView.render()

    # TODO check user agent (if not kiosk)

    # entries
    entries = new EntryList()
    # best way to find model(s)??
    window.entries = entries

    # top level entries list view
    entryview = new EntryListView model: entries
    addView entryview,'All','entries'
    
    # load entries...
    #entries.add testentry1
    atomfile = kiosk.getAtomFile()
    loader.load entries, aboutModel, atomfile, ()->
      Backbone.history.start()
    #router.navigate("entries", {trigger:true})


    # anchors
    $(document).on 'click','a', (ev) ->
      $(this).removeClass("touch-active") 
      clickFeedback()
      attract.active()
      #alert "click"
      ev.preventDefault()
      href = $(@).attr 'href'
      console.log "click #{href}"
      recorder.i 'user.click',{href:href}
      if href?
        if href.substring(0,1)=='-'
          # special case
          if href=='-chooseDevicetype'
            chooseDevicetype()
          else if href=='-back'
            router.back()
          else if href=='-menu'
            console.log 'pass -menu for zurb?'
            return true
          else
            console.log "ignore click #{href}"
        else
          router.navigate(href,{trigger:true})
      return false

    # reset/reload
    $('.title-area .name').on 'mousedown touchstart', ()->
      attract.active()
      start = new Date().getTime()
      armed = [false]
      reload = () -> location.reload()
      arm = () ->
        recorder.i 'user.reload'
        $('#reloadModal').foundation 'reveal','open'
        armed[0] = true
        setInterval reload,5000

      timer = setInterval arm,5000
      $(document).one 'mouseup touchend',() ->
        clearInterval timer
        if armed[0]
          recorder.w 'reload'
          reload()

    # navigation delayed by device choice
    window.delayedNavigate = null
    $(document).on 'closed', '[data-reveal]', ()->
      modal = $(@).attr 'id'
      console.log "closed #{modal}"
      recorder.i 'view.modal.closed',{id:modal}
      attract.active()
      if modal == 'chooseDeviceModal' and window.delayedNavigate?
        url = window.delayedNavigate
        window.delayedNavigate = null
        if window.options.attributes.devicetype?
          console.log "delayed navigate to #{url}"
          router.navigate(url,{trigger:true})
        else
          console.log "chooseDeviceModal closed cancels delayed navigate to #{url}"

    # http://lfhck.com/question/388518/how-to-simulate-active-css-pseudo-class-in-android-on-non-link-elements
    #if (navigator.userAgent.toLowerCase().indexOf("android") > -1) 
    #.button, .entry-option-step-help-button, .entry-option-help-button, 
    $(document).on "touchstart mousedown", ".clickable, .button, .entry-option, .entry-option-step-help-button, .entry-option-help-button", (ev) -> 
           #$(".touch-active", ).removeClass()
           touchFeedback()
           el = $(ev.currentTarget)
           el.addClass "touch-active"
           clear = ()->
             try 
               el.removeClass 'touch-active'
               console.log "clear touch-active"
             catch err
               console.log "error clearing touch-active #{err}"
           setTimeout clear,500
           true
    #$(document).on "touchend", (ev) -> 
    #  $(".touch-active").removeClass("touch-active")
    #  true
    #$(document).on "touchcancel", (ev) -> 
    #  $(".touch-active").removeClass("touch-active")
    #  true
    $(document).on "click", ".clickable, .button, .entry-option, .entry-option-step-help-button, .entry-option-help-button", (ev) -> 
           #$(this).removeClass("touch-active") 
           clickFeedback()
           true

SHORT_VIBRATE = 50

# ogg first?? mp3 first (android)
touchsound=kiosk.audioLoad "audio/click1.ogg","audio/click1.mp3"
#clicksound=kiosk.audioLoad "audio/click2.ogg","audio/click2.mp3"

canVibrate = true

touchFeedback = () ->
  #console.log "touch..."
  if not kiosk.vibrate SHORT_VIBRATE
    canVibrate = false
    touchsound.playclip()

clickFeedback = () ->
  #console.log "click..."
  if canVibrate  
    touchsound.playclip()

window.clickFeedback = clickFeedback

module.exports = App
