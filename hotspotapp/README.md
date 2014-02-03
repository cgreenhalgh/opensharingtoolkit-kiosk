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

## DNS-based captive portal

Android networking is very convoluted. The OS interface seems to be the `netd` daemon in the source `system/netd`. This is controlled over a message interface from `services/java/com/android/server/NetworkManagementService.java`. It has two build variants, one of which includes functions that will fork/exec `hostapd` to run the soft AP, and one variant (configured by `USES_TI_MAC80211`) uses a system property interface to start/stop service `hostapd_bin`. Both seem to use config file `/data/misc/wifi/hostapd.conf` (based on template `/system/etc/wifi/hostapd.conf`). `netd` also has functions to form/exec `dnsmasq` to provide a DHCP server when tethering, and `dnsmasq` is run with no external config file, just command-line parameters. It may be possible to just kill the standard `dnsmasq` process and start a new one! (as root, of course). 

Standard `dnsmasq` options (`/system/bin/dnsmasq`) are `--keep-in-foreground --no-resolv --no-poll --dhcp-option-force=43,ANDROID_METERED --pid-file "" --dhcp-range=%s,%s,%d` (from IP, to IP, lease)

E.g. try `--address=/#/LOCALIP`

Yes, simple as that (on my 2012 nexus 7, anyway).
