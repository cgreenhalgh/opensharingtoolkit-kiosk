# OST Kiosk Cache Builder

The cache builder is intended to be a command line tool to build/update a local filestore cache for use in an OST Kiosk. It will need to be fed the feed.xml configuration (atom) file for the kiosk. It will generate/update shorturls.json, download/cache icon and enclosure files, generate/update cache.json and generate mimtypes.json (with general compatibility information). See (content definition)[../docs/contentdefinition.md]. 

It is build in coffee-script and Node.js. (One day I might write a Mirage version.)

## Install

Set-up/install node:
```
sudo apt-get install npm
sudo apt-get install nodejs-legacy

sudo npm install -g coffee-script
```
Node/coffee-script dependencies:
```
npm install coffee-script xml2js
```

If google block my shortener API key then get one yourself and paste it into `cb.coffee` where is says:
```
# your google shortener API key?!
API_KEY = '...'
```

## Usage 

Normally you should run it in the same directory as the feed XML file (e.g. `../test/jubilee.xml`) and also (`mimetypes-in.json`)[../etc/mimetypes-in.json] and (`devices.json`)[../etc/devices.json] from `../etc/`. E.g.
```
cd ../test
cp ../etc/devices.json .
cp ../etc/mimetypes-in.json .
coffee ../cache_builder/cb.coffee jubilee.xml
```

Normally it should update the cache and shorturls only as required. Occasionally it may get confused, in which case if you delete `cache.json` and `shorturls.json` then it will rebuild them from scratch, including downloading all files and (re)generating all shorturls. If you delete the `cache` directory then you should probably also delete `cache.json` to avoid things getting confused.

