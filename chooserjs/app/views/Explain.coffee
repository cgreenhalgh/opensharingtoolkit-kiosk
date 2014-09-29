# explain animation - effectively modal
templateExplain = require 'templates/Explain'
recorder = require 'recorder'

# requestAnimationFrame-based (if possible)
createjs.Ticker.timingMode = createjs.Ticker.RAF
createjs.Ticker.setFPS(40)

slides = [
  [
    { text: "Get free digital\nleaflets and other\ndownloads here", x: 50, y: 20, font: "100px Arial,sans-serif" }
    { bitmap: "icons/example_android.png", height: 700, x:625, y:300 }
    { text: "Download straight\nto your smart\nphone or tablet\nusing WiFi or 3G", x: 50, y: 450, font: "70px Arial,sans-serif" }
  ]
  #[
  #  { text: "Get free digital\nleaflets and other\ndownloads here", x: 50, y: 350, font: "100px Arial,sans-serif" }
  #] 
  #[
  #  { text: "Download straight\nto your phone\nusing WiFi or 3G", x: 50, y: 650, font: "100px Arial,sans-serif" }
  #] 
  #[
  #  { text: "View downloads,\nand take them away\nwith you", x: 50, y: 350, font: "100px Arial,sans-serif" }
  #] 
  #  [
  #    { text: "Downloads have been\ncarefully selected\nfor you", x: 30, y: 650, font: "90px Arial,sans-serif" }
  #  ] 
]

# asset load queue
queue = new createjs.LoadQueue(true)

images = for slide in slides
  for data in slide when data.bitmap?
    { src: data.bitmap } 

console.log "explain images to load: #{JSON.stringify(images)}" 

queue.loadManifest _.flatten images

TRANSITION_DURATION = 300
SLIDE_INTERVAL = 20000

module.exports = class ExplainView extends Backbone.View

  tagName: 'div'
  className: 'attract-modal'

  initialize: ->
    @render()
    if queue.loaded
      console.log 'queue already loaded on create explain'
      @initStage()
    else
      queue.on 'complete', @initStage, @

  initStage: () ->
    console.log 'initStage'
    @stage = new createjs.Stage $( 'canvas', @$el ).get(0)
    createjs.Ticker.addEventListener("tick", @stage)
    # animations
    
    for slide in slides
      slide.show = new createjs.Timeline()
      slide.show.loop = false
      slide.show.setPaused true
      slide.hide = new createjs.Timeline()
      slide.hide.loop = false
      slide.hide.setPaused true

      for data in slide 
        obj = 
          if data.text?
            o = new createjs.Text(data.text)
            o.font = data.font ?= '100px sans-serif'
            o
          else if data.bitmap
            qi = queue.getResult data.bitmap
            console.log "queue item #{data.bitmap} = #{qi}"
            o = new createjs.Bitmap(qi)
            # scale by default
            bounds = o.getBounds()
            if data.width? and data.height?
              o.scaleX = o.scaleY = Math.min data.width/bounds.width, data.height/bounds.height
            else if data.width?
              o.scaleX = o.scaleY = data.width/bounds.width
            else if data.height?
              o.scaleX = o.scaleY = data.height/bounds.height
            # TODO? offset x/y   
            o
          else
            console.log 'Unknown explain item '+JSON.stringify(data)
            null
        if obj?
          obj.color = data.font ?= '#000'
          obj.x = data.x ?= 500
          obj.y = data.y ?= 500
          obj.visible = false
          @stage.addChild obj
          data.obj = obj

          slide.show.addTween createjs.Tween.get(obj).
            to({visible:true, alpha:0, x:if data.text? then obj.x-1000 else obj.x+1000}).
            to({visible:true, alpha:1, x:obj.x},TRANSITION_DURATION, createjs.Ease.quadOut)
          slide.hide.addTween createjs.Tween.get(obj).
            to({alpha:1,visible:true}).
            to({alpha:0,visible:false},TRANSITION_DURATION)
    
    slides[0].show.setPosition 0
    slides[0].show.setPaused false
    @slideIx = 0
    
    if slides.length>1
      @setTimer()
    else
      $(".explain-more", @$el).hide()

    @stage.update()

  clearTimer: =>
    try
      if @timer?
        clearTimeout @timer
    catch err
      log "nextSlide client timeout error #{err.message}" 

  setTimer: => 
    @clearTimer()
    @timer = setTimeout @nextSlide, SLIDE_INTERVAL

  nextSlide: =>
    @setTimer()

    slides[@slideIx].show.setPaused true
    slides[@slideIx].hide.setPosition 0
    slides[@slideIx].hide.setPaused false
    @slideIx = if @slideIx+1 >= slides.length then 0 else @slideIx+1
    slides[@slideIx].hide.setPaused true
    slides[@slideIx].show.setPosition 0
    slides[@slideIx].show.setPaused false


  render: =>
    data = {}
    @$el.html @template data
    $(window).on 'resize', @resize
    @

  template: (d) =>
    templateExplain d

  events: 
    'click [href=-explain-more]' : 'explainMore'
    'click [href=-explain-ok]' : 'explainOk'
    #'click': 'explainMore'
    'isVisible': 'resize'

  resize: () =>
    # maybe there is a better way to keep the canvas square and centred but i don't know it...
    console.log 'explain resize...'
    pw = @$el.width()
    ph = @$el.height()
    size = if pw>ph then ph else pw
    console.log "keepMaxSquare: size=#{size}"
    $canvasel = $( 'canvas', @$el )
    $canvasel.css 'height', size + 'px'
    $canvasel.css 'width', size + 'px'
    $canvasel.css 'top', (ph-size)/2 + 'px'
    $canvasel.css 'left', (pw-size)/2 + 'px'
    @stage.scaleX = size/1000
    @stage.scaleY = size/1000
    @stage.canvas.height = size
    @stage.canvas.width = size

    @stage.update()

  close: (ev)->
    console.log "Explain close"
    @remove()
    false

  remove: =>
    if window.clickFeedback?
      window.clickFeedback()
    recorder.i 'view.explain.hide'
    console.log 'close/remove Explain'
    @$el.remove()
    $(window).off 'resize', @resize
    queue.off 'complete', @initStage, @
    createjs.Ticker.removeEventListener("tick", @stage)
    clearInterval @timer


  explainOk: ->
    if window.clickFeedback?
      window.clickFeedback()
    recorder.i 'user.explain.ok'
    @close()

  explainMore: ->
    if window.clickFeedback?
      window.clickFeedback()
    recorder.i 'user.explain.more'
    @nextSlide()
    
