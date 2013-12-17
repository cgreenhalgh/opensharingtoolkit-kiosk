Mimetype = require 'models/mimetype'
MimetypeList = require 'models/mimetypelist' 
Devicetype = require 'models/devicetype'
DevicetypeList = require 'models/devicetypelist'
Options = require 'models/options'
Entry = require 'models/entry'
EntryList = require 'models/entrylist'

EntryListView = require 'views/entrylist'
EntryInfoView = require 'views/entry_info'
EntryPreviewView = require 'views/entry_preview'
EntrySendInternetView = require 'views/entry_send_internet'
EntrySendCacheView = require 'views/entry_send_cache'

loader = require 'loader'

# view stack?!
window.views = []

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
  $('#main_entrylist_holder').append view.el
  bc.append "<li><a href='#{path}'>#{title}</a></li>"

popView = ->
  if window.views.length>0
    view = window.views.pop()
    view.remove()
  $('.breadcrumbs li:last-child').remove()
  if window.views.length>0
    window.views[window.views.length-1].$el.show()

class Router extends Backbone.Router
  routes: 
    "entries" : "entries"
    "entry/:eid" : "entry"
    "preview/:eid" : "preview"
    "send_internet/:eid" : "send_internet"
    "send_cache/:eid" : "send_cache"

  entries: ->
    while window.views.length>1
      popView()

  get_entry: (id) ->
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
    entry = @get_entry id
    if not entry? 
      return false
    console.log "show entry #{id} #{entry.attributes.title}"
    view = new EntryInfoView model: entry
    addView view, entry.attributes.title, "entry/#{encodeURIComponent id}"

  preview: (id) ->
    entry = @get_entry id
    if not entry? 
      return false
    console.log "preview entry #{id}"
    view = new EntryPreviewView model: entry
    addView view, "Preview", "preview/#{encodeURIComponent id}"
  
  send_internet: (id) ->
    entry = @get_entry id
    if not entry? 
      return false
    console.log "send(internet) entry #{id}"
    view = new EntrySendInternetView model: entry
    addView view, "Send over Internet", "send_internet/#{encodeURIComponent id}"
  
  send_cache: (id) ->
    entry = @get_entry id
    if not entry? 
      return false
    console.log "send(cache) entry #{id}"
    view = new EntrySendCacheView model: entry
    addView view, "Send locally", "send_cache/#{encodeURIComponent id}"

testentry1 = new Entry 
        title: 'Test entry 1'
        summary: 'test entry 1...'
        iconurl: 'icons/_blank.png'


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
      term: "other"
      label: "Other Devices"
      supportsMime: [ "text/html" ]

    # general options
    options = new Options()

    # entries
    entries = new EntryList()
    # best way to find model(s)??
    window.entries = entries

    # top level entries list view
    entryview = new EntryListView model: entries
    addView entryview,'All','entries'
    
    # TODO load entries...

    #entries.add testentry1
    loader.load entries,'test/jubilee.xml'

    router.navigate("entries", {trigger:true})


    # anchors
    $(document).on 'click','a', (ev) ->
      #alert "click"
      href = $(@).attr 'href'
      console.log "click #{href}"
      router.navigate(href,{trigger:true})
      ev.preventDefault()

module.exports = App
