# iPhone notes

A few notes on using iPhones with the Kiosk.

The Kiosk apps won't run on iOS, of course. The kiosk browser interface (javascript) will, though. Either in Safari or within a standard embedded browser view.

## QR Scanners

There is no pre-installed QR code scanner. Most free scanners seem to have quite a lot of ads. Every scanner I have tried so far defaults to opening a URL in an embedded web view, usually with an option from that web view of opening it in safari. 

"QR Code Scanner" by "iHandy Inc." has ads on the main app pages but not on the web view pages. Works on Internet and Kiosk. Compatible with iOS 5 (and later). Has embedded browser plus "open in safari" option.

The free version of "QR Reader for iPhone" by "TapMedia Ltd" has particularly intrusive ads on the embedded web view pages.
"AT&T Code Scanner" is clean, with no ads, but gives an error if you try to open a link on the Kiosk network.
"NeoReader" won't open a page on the Kiosk network (uses an internet site redirect).
Several popular scanners require newer versions of iOS (the iPhone 3GS test phone is iOS 5.1.1, although it is offering an upate to 6.1.3; the iPhone 5 is running iOS 7.0.4).

## Web view

There seems to be a plugin framework for web views (embedded and safari) to render different media types in situ. This appears to include PDF (which doesn't need adobe reader installed) and MP3 (although there seem to be errors playing my test Qfile).

There doesn't seem to be a standard way to force download. 

## PDF handling

As noted, there seems to be a web view plugin to render PDF, which works in embedded web view and safari.

If adobe reader is installed then safari (but NOT embedded web views) give the option to then open the file in adobe reader.

## App Store

The test App store link opens the correct page on an iPhone 5 but not an iPhone 3 GS. 

## File manager

There is no standard file manager installed. "iDownloader" by "App4Stars" is perhaps most popular; free version is ad-supported. This can be opened from Safari's "open with...", even for file types unknown on the phone (e.g. Placebooks). But "QR Code Scanner" won't open it directly.
