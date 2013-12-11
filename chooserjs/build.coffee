# from http://arcturo.github.io/library/coffeescript/06_applications.html

require("coffee-script")
stitch  = require("stitch")
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
        console.log('Compiled public/application.js')
    )
)

