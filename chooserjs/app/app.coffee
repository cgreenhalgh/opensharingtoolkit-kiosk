class Router extends Backbone.Router
  routes: 
    "" : ""

  update_breadcrumbs: (bcs) ->
    bc = $ '.breadcrumbs' 
    bc.empty()
    for {title,path} in bcs 
      bc.append "<li><a href='#{path}'>#{title}</a></li>"

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

    #router.navigate("login", {trigger:true})


    # anchors
    $(document).on 'click','a', (ev) ->
      #alert "click"
      href = $(@).attr 'href'
      console.log "click #{href}"
      router.navigate(href,{trigger:true})
      ev.preventDefault()

module.exports = App
