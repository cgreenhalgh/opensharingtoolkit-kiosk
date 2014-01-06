# a device (type)
# was { term: "android", label: "Android", userAgentPattern: 'Android', supportsMime: [ "text/html", "application/vnd.android.package-archive" ] }
module.exports = class Devicetype extends Backbone.Model
  defaults:
    label: 'Default device type' 
    supportsMime: []
    # term: 
    # userAgentPattern:

