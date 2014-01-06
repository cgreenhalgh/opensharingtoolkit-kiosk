# list of entry  
Entry = require('models/Entry')

module.exports = class EntryList extends Backbone.Collection

  model: Entry
