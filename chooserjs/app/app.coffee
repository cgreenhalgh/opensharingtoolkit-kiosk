Mimetype = require 'models/mimetype'
MimetypeList = require 'models/mimetypelist' 
Devicetype = require 'models/devicetype'
DevicetypeList = require 'models/devicetypelist'
Options = require 'models/options'
Entry = require 'models/entry'
EntryList = require 'models/entrylist'

class Router extends Backbone.Router
  routes: 
    "entries" : "entries"

  update_breadcrumbs: (bcs) ->
    bc = $ '.breadcrumbs' 
    bc.empty()
    for {title,path} in bcs 
      bc.append "<li><a href='#{path}'>#{title}</a></li>"

  entries: ->
    @update_breadcrumbs [ {title: "All", path: "entries"} ]
    # TODO update view...?!

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

    # top level entries list view
    
    # TODO load entries...

    router.navigate("entries", {trigger:true})


    # anchors
    $(document).on 'click','a', (ev) ->
      #alert "click"
      href = $(@).attr 'href'
      console.log "click #{href}"
      router.navigate(href,{trigger:true})
      ev.preventDefault()

module.exports = App
