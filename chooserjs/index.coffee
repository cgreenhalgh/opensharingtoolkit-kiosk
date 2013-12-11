# from http://arcturo.github.io/library/coffeescript/06_applications.html

require("coffee-script")
stitch  = require("stitch")
# for web server only
express = require("express")
# for compile only
fs = require('fs')
argv    = process.argv.slice(2)

pckg = stitch.createPackage(
  # Specify the paths you want Stitch to automatically bundle up
  paths: [ __dirname + "/app" ]

  # Specify your base libraries
  dependencies: [
    # __dirname + '/lib/jquery.js'
  ]
)

# the file export...
pckg.compile(
  (err, source) ->
    if (err) then throw err
    fs.writeFile('public/application.js', source, 
      (err) ->
        if (err) then throw err
        console.log('Compiled public/application.js')
    )
)

# the web-server...

app = express.createServer()

app.configure ->
  app.set "views", __dirname + "/views"
  app.use app.router
  app.use express.static(__dirname + "/public")
#  app.get "/application.js", pckg.createServer()

port = argv[0] or process.env.PORT or 9294
console.log "Starting server on port: #{port}"
app.listen port

