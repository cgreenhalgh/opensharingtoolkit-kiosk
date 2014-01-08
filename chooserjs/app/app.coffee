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
    window.views[window.views.length-1].$el.hide()
  window.views.push view
  $('#mainEntrylistHolder').after view.el
  bc.append "<li><a href='#{path}'>#{title}</a></li>"

popView = ->
  if window.views.length>0
    view = window.views.pop()
    view.remove()
  $('.breadcrumbs li:last-child').remove()
  if window.views.length>0
    window.views[window.views.length-1].$el.show()

# main internal url router
class Router extends Backbone.Router
  routes: 
    "home" : "entries"
    "entries" : "entries"
    "entry/:eid" : "entry"
    "preview/:eid" : "preview"
    "sendInternet/:eid" : "sendInternet"
    "sendCache/:eid" : "sendCache"

  entries: ->
    # all entries - top-level view
    while window.views.length>1
      popView()

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
      term: "android"
      label: "Android"
      userAgentPattern: 'Android'
      supportsMime: [ "text/html", "application/vnd.android.package-archive" ]
    devicetypes.add new Devicetype
      term: "ios"
      label: "iPhone"
      userAgentPattern: '(iPhone)|(iPod)|(iPad)'
      supportsMime: [ "text/html", "application/x-itunes-app" ]
    devicetypes.add new Devicetype
      term: "windowsphone"
      label: "Windows Phone"
      supportsMime: [ "text/html" ]
    # there MUST be a devicetype 'other' to use as default
    devicetypes.add new Devicetype
      term: "other"
      label: "Other Device"
      supportsMime: [ "text/html" ]

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
    
    # TODO load entries...

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
          else
            console.log "ignore click #{href}"
        else
          router.navigate(href,{trigger:true})
      return false

module.exports = App
