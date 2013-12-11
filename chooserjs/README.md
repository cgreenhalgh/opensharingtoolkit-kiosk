# Chooser browser client

The main chooser UI is implemented as a browser-based javascript application. This is incorporated into the chooser app as assets. 

This directory is a re-implementation of the chooser browser app.

Status: initial skeleton (scss/coffeescript/zurb-foundation)

## Building the client

Trying out lots of new JS technologies here - coffee script, sass, stitch,
backbone, zurb foundation...

For initial project set-up I'm following [The Little Book on Coffee Script, chapter 6](http://arcturo.github.io/library/coffeescript/06_applications.html) and [Zurb's getting started with sass](http://foundation.zurb.com/docs/sass.html).

You'll need npm, node, coffescript, zurb foundation tool(s), e.g. (ubuntu 10.x)
```
sudo apt-get install npm
sudo apt-get install nodejs-legacy

sudo npm install -g coffee-script

sudo apt-get install ruby1.9.1

sudo gem install compass
```

If you are going to try updating the version of foundation used you might need:
```
sudo npm install -g bower 
sudo gem install foundation
```

Get dependencies:
```
npm install coffee-script stitch express eco
```

Re-generate the CSS from SCSS (if changed, only):
```
compass compile
```

Export the assembled application.js:
```
coffee build.coffee
```

Runs as server on [port 9294](http://127.0.0.1:9294) by default:
```
coffee index.coffee
```

