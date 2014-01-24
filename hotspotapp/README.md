# OpenSharingToolkit kiosk HotSpot application

Optional application, requiring root access, which facilitates the device's use as a hotspot, e.g. enabling hotspot mode programmatically, setting up port forwarding, allowing the kiosk application to detect devices connecting.

Status: attempts port 80 redirect; monitors and logs ARP tables; monitors and logs Wifi events (if iwevent installed)

## Port 80 redirect

Current version relies on the installed copy of `iptables`. Lots of older copies don't support specifying a redirect. Also if your version has a different output format then the app will assume the redirect doesn't work.

Tested OK on android 4.4.2, but known to fail on some (older?!) versions due to clib get protocol unimplemented error.

Todo: bundle a copy of `iptables` with the app for increased portability.

## ARP monitor

Current version relies on the instaled copy of `ip` (iproute2), in particular `ip neigh`.

Todo: bundle a copy of `ip` with the app for increased portability.

## Wifi Events

Current version relies on a copy of `iwevent` (from the Wireless Toolkit) being installed in `/system/bin`; there is a build version in assets. You will need a rooted phone to do this.

Todo: use the bundled copy without needing it to be installed.

