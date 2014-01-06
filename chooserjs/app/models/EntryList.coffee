# list of entry  
Entry = require('models/Entry')

module.exports = class EntryList extends Backbone.Collection

  model: Entry

  shorturls: {}

  getAppUrls: (mimetype) ->
    # get urls for helper apps for current device for given mime type

