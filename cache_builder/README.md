# OST Kiosk Cache Builder

The cache builder is intended to be a command line tool to build/update a local filestore cache for use in an OST Kiosk. It will need to be fed the feed.xml configuration (atom) file for the kiosk. Ideally it will generate/update shorturls.json, download/cache icon and enclosure files and generate/update cache.json. 

At the moment (2013-11-12) mirage doesn't have a HTTP client so I'll make an initial version with Node.js.


