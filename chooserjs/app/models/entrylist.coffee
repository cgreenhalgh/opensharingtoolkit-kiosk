# list of entry  
Entry = require('models/entry')

module.exports = class EntryList extends Backbone.Collection

  model: Entry
