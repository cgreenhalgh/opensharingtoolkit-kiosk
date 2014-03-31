# OpenSharingToolkit kiosk Kiosking application

Optional application which is responsible for the actual kiosking of the device, i.e. preventing access to other applications or settings from the normal screen. This includes the launcher functionality.

Status: relatively complete - launcher, accessibility service interceptor, soft home/back keys. 
(ideally needs replacement Status bar but that requires  signed system app which implies custom OS)

## Setting up

Once the app is installed you should press `home` and then select this app as the launcher `always`.

You should then open Settings > Accessibility > OST Kiosk Lockdown and turn this on. 

You should now be able to access the settings to enable/disable kiosk mode by pressing Home five times in quick succession (i.e. within 5 seconds).

When enabled it will try rather hard to stop you accessing anything other than the chooser app. (Make sure you have made it the default launcher before enabling kiosk mode or you may be unable to access the settings to turn it off again!)


## Additional instructions

Some aspects of kiosking requires a number of additional steps. Much of this is based on (VAUGHNTEEGARDEN's post)[http://thebitplague.wordpress.com/2013/04/05/kiosk-mode-on-the-nexus-7/]

### Screen lock settings

In settings > Lock screen > Screen security (or equivalent) change the Screen lock to `none`.

You could also change the Display > Sleep setting so that it will normally turn off the screen more slowly, but the chooser application should actually keep the screen on all the time it is running anyway. 

### Boot when powered

Note: if you run the battery flat this might make it impossible to start/charge the device, so maybe not.

To ensure it will boot on power, boot into the bootloader (i.e. fastboot mode), and do
```
fastboot oem off-mode-charge 0
```

### Install a custom soft key application

For your own sanity, before hiding the standard soft keys, you might want to install a different one that you can at least turn on/off. 

Kiosk app now includes its own based softkeys for home/back, although they are barely visible when enabled (deliberately) at the top-left and bottom-right of the screen.

### Hide soft keys

This is really important for kiosking functionality - otherwise back, home, processes will still be available, and the last especially will give people access to the system. But this will only be useful if your device does NOT have hardware keys for home, etc.

To hide soft keys, enable USB debugging, give permission to your dev machine, root the device, then get `build.prop` off the device
```
adb pull /system/build.prop
```
Add the following entry to it:
```
# disable soft keys
qemu.hw.mainkeys=1
```
Re-mount the system filesystem read-write - first check its type and path:
```
adb shell
mount
```
Look for the `system` entry, e.g. 
```
/dev/block/platform/sdhci-tegra.3/by-name/APP /system ext4 ro,relatime,user_xattr,acl,barrier=1,data=ordered 0 0
```
Now remount using something like: 
```
mount -o remount,rw -t TYPE PATH
``` 
where `PATH` is the first path you see and `TYPE` is the filesystem type, e.g. `ext4` i the above example.

Finally you can push back the changed file:
```
adb push build.prop /system/build.prop
```
Of course, if you have (e.g.) `vi` or another editor installed on the device then you can (with root permission) edit `build.prop` directly after `system` has been remounted `rw`.

Now reboot.

TO go back to normal do essentially the same but comment out or remove the line `qemu.hw.mainkeys=1`. 

## Additional lockdown notes

Only signature&system applications can be given the `STATUS_BAR` permission in order to disable (for example) pull down of the status bar (at least this is the case in android 4.4.2). Consequently it isn't enough just to copy the apk from `/data/app` to `/system/app`, but it will also need to be signed with the system key and hence will generally need to be part of a custom ROM build. (A status bar service needs `STATUS_BAR_SERVICE` permission which is signature, so not much better.)



