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

# atom/entry file loader
loader = require 'loader'
kiosk = require 'kiosk'

# view stack?!
window.views = []

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
  window.scrollTo 0,0

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
      window.scrollTo 0,v.scrollTop
  else
    console.log "no scrollTop found"
  if window.views.length<=1
    $('#topbar-menu').removeClass 'hide'
    $('#topbar-back').addClass 'hide'


# main internal url router
class Router extends Backbone.Router
  routes: 
    #"home" : "entries"
    "entries" : "entries"
    "help" : "help"
    "entry/:eid" : "entry"
    "preview/:eid" : "preview"
    "sendInternet/:eid" : "sendInternet"
    "sendCache/:eid" : "sendCache"

  back: ->
    bcas = $('.breadcrumbs a')
    if bcas.length >= 2
      href = $(bcas[bcas.length-2]).attr 'href'
      console.log "back to #{href}"
      router.navigate(href,{trigger:true})
    else
      console.log "back with nothing to go back to"

  entries: ->
    # all entries - top-level view
    while window.views.length>1
      popView()

  help: ->
    #@entries()
    if window.views.length==0
      console.log "cannot show help - no initial view"
    else
      v = window.views[window.views.length-1]
      view = new EntryListHelpView()
      addView view, "Help", "entries/help"
      # special case - overlay show entries
      v.scrollTop = 0
      v.$el.show()


  getEntry: (id) ->
    # id is already URI-decoded
    entry = window.entries?.get id
    if not entry? 
      #alert "Could not find that entry (#{id})"
      console.log "Could not find entry #{id}"
      $('#entryNotFoundModal').foundation 'reveal','open'
      null
    else
      entry

  entry: (id) ->
    entry = @getEntry id
    if not entry? 
      return false
    console.log "show entry #{id} #{entry.attributes.title}"
    view = new EntryInfoView model: entry
    addView view, entry.attributes.title, "entry/#{encodeURIComponent id}"

  preview: (id) ->
    entry = @getEntry id
    if not entry? 
      return false
    console.log "preview entry #{id}"
    view = new EntryPreviewView model: entry
    addView view, "Preview", "preview/#{encodeURIComponent id}"
  
  sendInternet: (id) ->
    entry = @getEntry id
    if not entry? 
      return false
    console.log "send(internet) entry #{id}"
    view = new EntrySendInternetView model: entry
    addView view, "Send over Internet", "send_internet/#{encodeURIComponent id}"
  
  sendCache: (id) ->
    entry = @getEntry id
    if not entry? 
      return false
    console.log "send(cache) entry #{id}"
    view = new EntrySendCacheView model: entry
    addView view, "Send locally", "send_cache/#{encodeURIComponent id}"


testentry1 = new Entry 
        title: 'Test entry 1'
        summary: 'test entry 1...'
        iconurl: 'icons/_blank.png'

chooseDevicetype = ->
  console.log "chooseDevicetype"
  $('#chooseDeviceModal').foundation 'reveal','open'
  return false


App =
  init: ->

    # backbonetest - based on 
    # http://adamjspooner.github.io/coffeescript-meet-backbonejs/05/docs/script.html
    Backbone.sync = (method, model, success, error) ->
      success()

    # in-app virtual pages
    router = new Router
    Backbone.history.start()
    window.router = router

    # default mime types
    mimetypes = new MimetypeList()
    mimetypes.add new Mimetype
      mime: "application/pdf"
      ext: "pdf"
      icon: "icons/pdf.png"
      label: "PDF"
    mimetypes.add new Mimetype
      mime: "text/html"
      ext: "html"
      icon: "icons/html.png"
      label: "HTML"
    mimetypes.add new Mimetype
      mime: "application/vnd.android.package-archive"
      ext: "apk",
      icon: "icons/get_it_on_google_play.png"
      label: "Android app"
    # not a real mime type (or indeed a file as such), but we can pretend...
    mimetypes.add new Mimetype
      mime: "application/x-itunes-app"
      icon: "icons/available_on_the_app_store.png"
      label: "iPhone app"

    # default device types
    devicetypes = new DevicetypeList()

    devicetypes.add new Devicetype
      term: "ios"
      label: "iPhone"
      userAgentPattern: '(iPhone)|(iPod)|(iPad)'
      supportsMime: [ "text/html", "application/x-itunes-app" ]
      helpHtml: '<p><img class="devicetype-help-image" src="icons/example_ios.png">There are several different models of iPhone, all sold by Apple, but they are all broadly compatible. You should also use this option if you have an iPad, iPad mini or iPod Touch.</p>'
    devicetypes.add new Devicetype
      term: "windowsphone"
      label: "Windows Phone"
      supportsMime: [ "text/html" ]
      helpHtml: '<p><img class="devicetype-help-image" src="icons/example_windowsphone.png">Windows phones include newer Nokia smart phones, and also specific phones made by HTC, Samsung and others. Windows Phones have a distinctive square tile-based interface.</p>'
    devicetypes.add new Devicetype
      term: "android"
      label: "Android"
      userAgentPattern: 'Android'
      supportsMime: [ "text/html", "application/vnd.android.package-archive" ]
      helpHtml: '<p><img class="devicetype-help-image" src="icons/example_android.png">There are many different Android phones and tablets, including devices made by Google, Samsung, Motorola, HTC, Sony Ericsson and Asus (some Nexus).</p>'
    # there MUST be a devicetype 'other' to use as default
    devicetypes.add new Devicetype
      term: "other"
      label: "Other Device"
      supportsMime: [ "text/html" ]
      helpHtml: '<p>If you have another sort of smart phone or tablet to the ones listed then some of the content here may work, but unfortunately we can\'t make any guarantees. If you just aren\'t sure what sort of phone it is then make guess!</p>'

    # general options
    options = new Options devicetypes: devicetypes
    # best way to find options?? (NB needed before Entry view(s))
    window.options = options

    # device options view/change
    devicetypeChooser = new DevicetypeChoiceView model: options
    $('#chooseDeviceModal').append devicetypeChooser.$el

    devicetypeLabelView = new OptionsDevicetypeLabelView model: options
    devicetypeLabelView.setElement $('#chooseDevicetype a')

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
    loader.load entries, atomfile

    router.navigate("entries", {trigger:true})


    # anchors
    $(document).on 'click','a', (ev) ->
      #alert "click"
      ev.preventDefault()
      href = $(@).attr 'href'
      console.log "click #{href}"
      if href?
        if href.substring(0,1)=='-'
          # special case
          if href=='-chooseDevicetype'
            chooseDevicetype()
          else if href=='-back'
            router.back()
          else
            console.log "ignore click #{href}"
        else
          router.navigate(href,{trigger:true})
      return false

    # reset/reload
    $('.title-area .name').on 'mousedown touchstart', ()->
      start = new Date().getTime()
      armed = [false]
      reload = () -> location.reload()
      arm = () ->
        $('#reloadModal').foundation 'reveal','open'
        armed[0] = true
        setInterval reload,5000

      timer = setInterval arm,5000
      $(document).one 'mouseup touchend',() ->
        clearInterval timer
        if armed[0]
          reload()

    # navigation delayed by device choice
    window.delayedNavigate = null
    $(document).on 'closed', '[data-reveal]', ()->
      modal = $(@).attr 'id'
      console.log "closed #{modal}"
      if modal == 'chooseDeviceModal' and window.delayedNavigate?
        url = window.delayedNavigate
        window.delayedNavigate = null
        if window.options.attributes.devicetype?
          console.log "delayed navigate to #{url}"
          router.navigate(url,{trigger:true})
        else
          console.log "chooseDeviceModal closed cancels delayed navigate to #{url}"

module.exports = App
