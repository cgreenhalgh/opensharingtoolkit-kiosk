# Logging and monitoring the network on Android

Summary:

- iwevent (from Wireless Tools) will report MAC address of devices joining and leaving hotspot network.
- ip neigh (from iproute2) will return ARP table, including IP and MAC address, including recently joined devices. (ip monitor neigh won't reliably report joining devices)

In addition:

- dhcp leases can be checked in `/data/media/dhcp/dnsmasq.leases` (requires root to access)

## Network status logging

Let's see what we can do with standard Android stuff first...

```
ip monitor all
```

See iproute2. Typical versions are not the latest. See [Source](https://www.kernel.org/pub/linux/utils/net/iproute2/) and compare `ip -V` (3.12.0/2013-11-23).

WHen my phone joins or leaves the kiosks' hotspot I immediately get this (unhelpful) message:
```
[LINK]34: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> 
    link/ether 
```
Shortly after I get this
```
[NEIGH]192.168.43.37 dev wlan0 lladdr 78:d6:f0:41:1a:c2 STALE
```
I don't get to see the good ARP entries; this seems to be an optimisation referred to [in this post](https://www.mail-archive.com/linux-net@vger.rutgers.edu/msg09234.html). I tried step 2 but I don't know what step 1 means. Didn't seem to make a difference. CONFIG_ARPD may be obsolete according to [this](http://cateee.net/lkddb/web-lkddb/ARPD.html).

Occasionally I see 
```
[NEIGH]192.168.43.37 dev wlan0 lladdr 78:d6:f0:41:1a:c2 REACHABLE
```
But it doesn't seem to correlate with any particular action or be particularly timely.

However polling the ARP table gives more timely changes, initially to:
```
192.168.43.37 dev wlan0 lladdr 78:d6:f0:41:1a:c2 DELAY
```
and then to 
```
192.168.43.37 dev wlan0 lladdr 78:d6:f0:41:1a:c2 REACHABLE
```
Becomes STALE again after about 10s. 

I attempting to `ping` back to it then after ~5s this fails with `Destination Host Unreachable` and `ip neigh` gives:
```
192.168.43.37 dev wlan0  FAILED
```

NOte that this is using NETLINK / RTNETLINK - directly using this socket interface might be more useful for the minimal LINK message.

## Wireless logging

Let's try [Wireless Tools](http://www.hpl.hp.com/personal/Jean_Tourrilhes/Linux/Tools.html) care of [Haggle Wireless Tools for Android build notes](https://code.google.com/p/haggle/wiki/WirelessTools). See also [this issue](http://stackoverflow.com/questions/14785434/android-ndk-doesnt-support-header-files) => remove `iwlib.h` from `LOCAL_SRC_FILES` of `Android.mk`, copy `wireless.22.h` to `wireless.h` and add the following to the end of it
```
#undef IW_EV_LCP_PK_LEN
#undef IW_EV_POINT_PK_LEN
```
Now make... -> `iwconfig` and `iwlist`. Cloning the latter part and replacing `iwlist` with `iwspy` and `iwevent` will also compile those commands.

Initiallly i'll try platform-9 (= Android 2.3) as they it what the haggle page uses.

Copy to the device; access via `/data/media/0/` to be able to 
```
chmod 775 iwconfig iwlist
```

`iwconfig` gives limited information but complains
```
Warning: Driver for device wlan0 has been compiled with an ancient version
of Wireless Extension, while this program support version 11 and later.
Some things may be broken...

wlan0     �����5ھ�3��6ھ  ESSID:off/any  Nickname:""
          NWID:off/any  Mode:Unknown/bug  Frequency:2.437 GHz  Sensitivity=-1092996456 dBm  
          RTS thr=2347 B   Fragment thr=8000 B   
          Encryption key:<too big>
          Link Quality:0  Signal level:0  Noise level:0
          Rx invalid nwid:0  invalid crypt:0  invalid misc:0
```
on my 2013 nexus 7. 

If i turn off the hotspot I get:
```
wlan0     Qcom:802.11n  ESSID:"UoN-secure"  
          Mode:Managed  Frequency:5.22 GHz  Access Point: 88:75:56:AF:E4:CE   
          Bit Rate=60 Mb/s   Tx-Power=20 dBm   
          RTS thr=2347 B   Fragment thr=8000 B   
          Encryption key:E4C8-F68B-854D-FF01-0398-ADB2-360B-1061 [3]   Security mode:restricted
...
p2p0      Qcom:802.11n  ESSID:off/any  
          Mode:Managed  Channel:0  Access Point: Not-Associated   
          Bit Rate:0 kb/s   Tx-Power=0 dBm   
          RTS thr=2347 B   Fragment thr=8000 B   
          Encryption key:off
```

`iwspy` says
```
wlan0     Interface doesn't support wireless statistic collection
```

but `iwevent` seems useful; after the same initial compaint:
```
Waiting for Wireless Events from interfaces...
Warning: Driver for device wlan0 has been compiled with an ancient version
of Wireless Extension, while this program support version 11 and later.
Some things may be broken...
```
on client join to hotspot we see:
```
14:50:15.264943   wlan0    Registered node:78:D6:F0:41:1A:C2
```
and on leave:
```
14:51:25.663167   wlan0    Expired node:78:D6:F0:41:1A:C2
```
Switching from regular wifi client mode to hotspot generates:
```
14:53:51.830891   wlan0    New Access Point/Cell address:Not-Associated
14:53:53.359486   wlan0    Custom driver event:
```
While switching back gives (when joining a local network):
```
14:54:22.589894   wlan0    Custom driver event:
14:54:28.701344   wlan0    Custom driver event:BEACONIEs=
14:54:28.701405   wlan0    Custom driver event:BEACONIEs=
14:54:28.701436   wlan0    New Access Point/Cell address:88:75:56:AF:E4:CE
```
In regular and in hotspot mode `cat /proc/net/wireless` produces output but all counters are `0`.

## wpa_supplicant, etc.

See [readme](http://hostap.epitest.fi/cgit/hostap/plain/wpa_supplicant/README).

In regular network mode I see:
```
wifi      12640 12638 3444   2328  c01383b0 b6e346d8 S /system/bin/wpa_supplicant
dhcp      12667 1     1020   476   c01383b0 b6f5b7c4 S /system/bin/dhcpcd
```
In hotspot mode I see:
```
wifi      13345 181   2416   1004  c01383b0 b6e936d8 S /system/bin/hostapd
nobody    13347 181   1028   448   c01383b0 b6f266d8 S /system/bin/dnsmasq
```
My nexus 7 has `/etc/wifi/wpa_supplicant.conf`, but not much in it. There is also a `/etc/dhcpcd/dhcpcd.conf`.

But `/data/misc/wifi/` is more interesting - for wpa_supplicant and hostapd:
```
-rw------- system   wifi         6224 2014-01-23 09:05 WCNSS_qcom_cfg.ini
-rw------- system   wifi        29776 2014-01-23 09:05 WCNSS_qcom_wlan_nv.bin
-rw-rw---- system   wifi           21 2014-01-23 15:13 entropy.bin
-rw-rw---- system   wifi          141 2014-01-23 15:09 hostapd.conf
-rw-rw---- system   wifi          242 2014-01-23 15:13 p2p_supplicant.conf
drwxrwx--- wifi     wifi              2014-01-23 15:13 sockets
-rw------- system   system         18 2014-01-17 09:36 softap.conf
drwxrwx--- wifi     wifi              2014-01-13 09:35 wpa_supplicant
-rw-rw---- system   wifi          467 2014-01-13 09:37 wpa_supplicant.conf
```
`hostapd.conf` is generated when hotspot mode is turned on and includes ssid, etc. for hotspot.

`wpa_supplicant.conf` is generated/updated when client settings are changed. Includes saved networks, passwords, priorities.

There is also (on the 2013 tablet) some config apparently related to WiFi-Direct. iwconfig also see a p2p0 wireless interface.

`/data/misc/dhcp` is also interesting - for dhcpd and dnsmasq:
```
-r-------- dhcp     dhcp          362 2014-01-23 15:22 dhcpcd-wlan0.lease
-rw------- dhcp     dhcp            0 2014-01-22 09:40 dhcpcd-wlan0.pid
-rw-r--r-- root     root           70 2014-01-23 14:56 dnsmasq.leases
```
E.g. `dnsmasq.leases`:
```
1390492565 78:d6:f0:41:1a:c2 192.168.43.37 android-b5aa60320c090e90 *
```
Lease time updates then I re-join.

`dhcpd-wlan0.lease` is binary file.

Not sure where the dnsmasq configuration is at the moment; I have a vauge memory that it is transient/in-memory.

