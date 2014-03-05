# Content Definition

Defining and managing content for the OpenSharingToolkit kiosk...

## Use cases

It is important to bear in mind the variation in deployment possibilities when trying to understand why the following (kind of) makes sense:

- Kiosk UI running in the browser of an end-user's mobile device, where they are typically downloading content onto that device;
- Kiosk UI running in the browser of an end-user's fixed device, where they are typically browsing content on that device and downloading it onto a proximate mobile device;
- Kiosk UI running within Kiosk app on a dedicated device, where a walk-up user is typically browsing content on the kiosk and downloading it onto their own mobile device;
- Kiosk UI running within Sharing app on an end-user's device, where they are typically sharing content with other proximate mobile devices.

The main interacting components are therefore (a subset of):

- Internet kiosk server: serving kiosk UI to end-user mobile or fixed device when on the Internet
- Internet URL shortener and QRCode generator: facilitating access to Internet-hosted content (Internet kiosk server, App Store or External web server) 
- App Store: device-specific app store, on Internet, required to install (trusted) apps
- External web server: other Internet server of third-party content
- Embedded kiosk server: part of Kiosk and Sharing apps, providing on-device services including cacheing, url shortening, QRCode generation
- Kiosk UI: allowing browsing and preview of content
- End device: performing download and viewing of content (and apps), including browser & QRCode scanner

Variations include:

- Kiosk UI may be served from Embedded kiosk server (over local network) or Internet kiosk server (over Internet)
- Kiosk UI may be on end device or on another device
- End device may be served from Embedded kiosk server (cached content over local network) or Internet kiosk server (cached or external content over Internet) or a combination (cached content and external content via kiosk local network plus kiosk Internet connection)

Note that the end device has to install apps from App Store (over Internet) unless, on supported platforms (i.e. most Android, not iOS), the user installs untrusted apps with associated practical and ethical complications).

## Current status

As of 2013-10-15...

### Bootstrap

The app web view loads `file:///android_asset/index.html` as specified in `res/values/stings.xml` key `default_url`, i.e. app internal file `assets/index.html` which is bundled in the APK file.

`index.html` reads `application.js` (relative URL, hence also from assets). 

`application.js` reads the atom file specified in app preference `pref_atomfile` (`ost.xml` by default) and adds its entries. 

### Cache configuration

The cache should normally be built using the coffeescript command-line application `cache_builder/cb.coffee` from the [OST Kiosk Manager](https://github.com/cgreenhalgh/ost-kiosk-manager/) repo. This will read `devices.json` and generate `shorturls.json`, `cache.json` and `mimetypes.json`.

When loading an atom file, `application.js` also attempts first to read `devices.json`, `mimetypes.json`, `cache.json` and `shorturls.json` as relative to the atom file URL.

The `devices.json` file defines supported device types and gives basic information about each, esp. supported mime types. It is a map of device records such as:
```
{
  "android": {
    "label": "Android",
    "userAgentPattern": "Android",
    "supportsMime": [ "text/html", "application/vnd.android.package-archive" ],
    "optionalSupportsMime": [ ],
    "helpHtml": "There are many different Android phones and tablets, including devices made by Google, Samsung, Motorola, HTC, Sony Ericsson and Asus (some Nexus)."
  }
}
```

The `mimetypes.json` file defines known mimetypes (including which devices support them and which supporting apps are required). It combines standard information with app-specific information typically obtained from the cache builder pre-processing the kiosk atom file. It is a map of mimetype records such as:
```
{
  "text/html": {
    "label": "HTML"
    "exts": [ "html" ],
    "icon": "icons/html.png",
    "compat": {
      "android": {
        "builtin": false, // could be true or undefined=unknown
        "apps": [ { "name":APPNAME, "url":APPURL }, ... ],
        "appsComplete": false // are these the only apps that support this mime type?
      }
    }
  }
}
```

The `cache.json` file, if present, should be a object with a `baseurl` property the value of which is the Internet-accessible URL of the directory holding the original/definitive copy of the atom file and other local assets. E.g.

'''
{ "baseurl": "http://www.cs.nott.ac.uk/~cmg/AppropriateICT/opensharingtoolkit-kiosk/assets/test/" }
'''

This is used by the kiosk in Internet mode to generate Internet-accessible URLs for Phones to download files from (rather than the on-kiosk cache files). However it is probably safer to use the atom file feed self link (which should be present) to determine the original home/reference location of the atom file (the cache builder uses this to determine the value for baseurl).

`cache.json` if built by the ost-kiosk-manager cache_builder application will include a `"files"` property the value of which is an array of file info records. Each has the following properties:

- `url`: the URL of an enclosure or icon in the atom file
- `needed`: (boolean) whether this file is actually used by the most recently processed atom file
- `path`: relative path of a copy of the file in the local cache (if cached)
- `lastmod`: last modified time of the file as returned by the origin server when last downloaded/cached
- `length`: size of the cached file (bytes)

In general files from the cache should be used when possible. 

The `shorturls.json` file, if present, should be an array of objects, each with a `url` property which is an Internet-accessible URL and a `shorturl` property which is an Internet-accessible (e.g. goo.gl) short URL which redirects to that url. Typically the URLs should be for the get.html helper application with parameter values for helping to download a particular file. E.g.

'''
[{"url":"http://www.cs.nott.ac.uk/~cmg/AppropriateICT/opensharingtoolkit-kiosk/assets/get.html?u=http%3A%2F%2Fwww.cs.nott.ac.uk%2F~cmg%2FAppropriateICT%2Fopensharingtoolkit-kiosk%2Fassets%2Ftest%2Fthing1.pdf&t=First%20thing&a=http%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.adobe.reader", "shorturl":"http://goo.gl/y8Udxb"},{"url":"http://www.cs.nott.ac.uk/~cmg/AppropriateICT/opensharingtoolkit-kiosk/assets/get.html?u=http%3A%2F%2Fwww.cs.nott.ac.uk%2F~cmg%2FAppropriateICT%2Fopensharingtoolkit-kiosk%2Fassets%2Ftest%2Fthing1.pdf&t=First%20thing&a=https%3A%2F%2Fitunes.apple.com%2Fgb%2Fapp%2Fadobe-reader%2Fid469337564%3Fmt%3D8%26uo%3D4","shorturl":"http://goo.gl/5CA4Xn"}]
'''

This is used by the kiosk in Internet mode when providing URL and QRCode for the user to get a file on their phone. If no short URL is found then the long URL is given to the user. Note that off-internet mode does NOT require or use short URLs as it uses its own built-in URL shortener.

### Atom Usage

Atom Syndication Format is used to provide the content index. This is defined in [RFC4287](http://tools.ietf.org/html/rfc4287). There are some ideosyncracies to this usage.  

The atom file is (currently) assumed to be a feed, i.e. have a `feed` (namespace `http://www.w3.org/2005/Atom`) root element. The mandatory feed elements are not currently used (`id`, `title`, `updated`). For example:

'''
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
 
        <title>Example Feed</title>
        <link rel="self" href="file:///android_asset/test.xml" />
        <id>tag:cmg@cs.nott.ac.uk,2013-09-26:atom/test/1</id>
        <updated>2013-09-26T12:32:00Z</updated>
        <category scheme="campaign" term="test" label="Example campaign called test"/>

	<!-- entries go here... -->
</feed>
'''
Optionally, the feed may include `category` elements with attribute `scheme`=`campaign` where the required attribute `term` is a campaign ID and the optional attribute `label` is a human-readable name for the campaign. Campaign IDs may be included in entry request URLs in order to distinguish different triggers for downloads (e.g. poster, different kiosk(s)).

Each content item is specified by a single Atom `entry`. Currently of the mandatory entry elements only `title` is used (`id` and `updated` are not; `author` is also mandatory if not provided by feed, but unused at present). The self link is used to determine the baseurl when using a cache (e.g. by the cache builder).

Entry elements that are used are as follows:

- `title`: the displayed title of the content item.
- `content`: (was summary) textual (HTML) description of item, shown on detail page.
- `link` with attributes `rel`=`alternate` and `type`=`image/`*: icon for the item (attribute `href` is URL). (possibly Media-RSS media:thumbnail should be used instead, in which case the first thumbnail would be used, but this might conflict with use for preview noted below)
- `link` with attribute `rel`=`enclosure`: content file for the item, attribute `href` is URL and attribute `type` is MIME type. (possibly Media-RSS media:content optionally in media:group should be used instead, e.g. to provide `expression`=`sample` versions of audio/video)
- `category` with attribute `scheme`=`requires-device`: device with which content is compatible (attribute `term` is device type ID, currently one of `android`, `ios`, `windowsphone` or `other`)
- `category` with attribute `scheme`=`supports-mime-type`: item is an application which provides support for the MIME type specified by attribute `term` (readable name of MIME type given by attribute `label`)
- `category` with attribute `scheme`=`visibility`: specifies whether item is visible to user in browser interface (hidden if attribute `term`=`hidden`) - used to hide helper applications
- `category` with attribute `scheme`=`supports-mime-type-exclusive`, `term`=`true`: hint for an application which supports a MIME type that no other application will support that MIME type

In addition media-rss media:thumbnail elements with attribute `url` should be used to provide 'preview' images (in order). This might be for documents and/or videos. Note: most recent [media-rss specification](http://www.rssboard.org/media-rss) and current namespace `media`=`http://search.yahoo.com/mrss/`. It would probably be safest if all thumbnails for a single entry were the same size (e.g. I may use the zurb orbit image viewer).

For example, a PDF document `thing1.pdf` (MIME type `application/pdf`) with icon `thing1.png` entitled `First thing`:

'''
       <entry>
                <title>First thing</title>
                <link rel="alternate" type="image/png" href="thing1.png" />
                <link rel="enclosure" type="application/pdf" href="thing1.pdf" />
                <id>tag:cmg@cs.nott.ac.uk,2013-09-26:atom/test/1/1</id>
                <updated>2013-09-26T12:32:01Z</updated>
                <content>A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. A PDF document about the first thing. </content>
                <author>
                      <name>Chris Greenhalgh</name>
                      <email>cmg@cs.nott.ac.uk</email>
                </author>
        </entry>
'''

For example, the Adobe reader application for Android, which provides support for PDF files (MIME type `application/pdf`):

'''
       <entry>
                <title>Adobe Reader</title>
                <!-- it's an app that supports a mime type -->
                <category scheme="supports-mime-type" term="application/pdf" label="View PDF"/>
                <!-- it's for a particular os -->
                <category scheme="requires-device" term="android"/>
                <category scheme="visibility" term="hidden"/>
                <link rel="alternate" type="image/png" href="adobe_reader.png" />
                <link rel="enclosure" type="application/vnd.android.package-archive" href="http://play.google.com/store/apps/details?id=com.adobe.reader" />
                <id>tag:cmg@cs.nott.ac.uk,2013-09-26:app/adobe_reader_for_android</id>
                <updated>2013-09-30T20:30:01Z</updated>
                <content>One of the most popular PDF file viewers, from Adobe, available on Google Play.</content>
                <author>
                      <name>Adobe</name>
                </author>
        </entry>
'''

Note that the app is hidden. The MIME type for an Android app is `application/vnd.android.package-archive` and the URL for the app is the corresponding Google Play URL. The iPhone version of the app is described by:

'''
        <entry>
                <title>Adobe Reader</title>
                <!-- it's an app that supports a mime type -->
                <category scheme="supports-mime-type" term="application/pdf" label="View PDF"/>
                <!-- it's for a particular os -->
                <category scheme="requires-device" term="ios"/>
                <category scheme="visibility" term="hidden"/>
                <link rel="alternate" type="image/png" href="adobe_reader.png" />
                <link rel="enclosure" type="application/x-itunes-app" href="https://itunes.apple.com/gb/app/adobe-reader/id469337564?mt=8&amp;uo=4" />
                <id>tag:cmg@cs.nott.ac.uk,2013-09-26:app/adobe_reader_for_android</id>
                <updated>2013-09-30T20:30:01Z</updated>
                <content>One of the most popular PDF file viewers, from Adobe, available on iTunes.</content>
                <author>
                      <name>Adobe</name>
                </author>
        </entry>
'''

Note that there is no official MIME type for iPhone applications; the placeholder `application/x-itunes-app` is used internally. The URL is for the app on itunes.

### Multi-file support

Currently only a single Atom file is read. This will soon change, e.g. so that one Atom file can "include" another by including an `entry` with a `link` `rel`=`alternate` `type`=`application/atom+xml` element where `href` is the URL of the included Atom file, or `content` `type`=`application/atom+xml` element where `src` is the URL of the included Atom file. (For a `link` with `rel`=`enclosure` it might instead offer this as a content file.)

### Default media types

The kiosk assumes that some file types have built-in support. Currently these are:

- `text/html` - HTML files, on all devices
- `application/vnd.android.package-archive` - Android APK files, on Android devices
- `application/x-itunes-app` - iOS applications (unofficial internal identifier), on iOS devices

For other MIME types it will look for entries which declare that they support that MIME type (using category scheme supports-mime-type) and will guide the user to install that application as well as downloading the content file.

## Authoring

### Vision

How should it work??

A web-based authoring/editing interface for creating and maintaining Atom files. And to help generate short urls. And maybe even to generate icons/thumbnails? And maybe to create and maintain a file cache?

A facility in the Kiosk app to cache an online atom file and associated files.

Part of the Kiosk management framework?

