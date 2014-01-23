# OpenSharingToolkit kiosk HotSpot application

Optional application, requiring root access, which facilitates the device's use as a hotspot, e.g. enabling hotspot mode programmatically, setting up port forwarding, allowing the kiosk application to detect devices connecting.

Status: attempts port 80 redirect

## Port 80 redirect

Current version relies on the installed copy of iptables. Lots of older copies don't support specifying a redirect. Also if your version has a different output format then the app will assume the redirect doesn't work.

Tested OK on android 4.4.2.

Todo: bundle a copy of iptables with the app for increased portability.


