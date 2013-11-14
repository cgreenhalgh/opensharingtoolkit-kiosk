# OST Kiosk Test Data

There is some very simple content here:

- `thing1.pdf` - a small PDF document
- `thing1.png` - a logo for the above
- `placebook.png` - a placebook logo
- `adobe_reader.png` - a copy of the adobe reader logo for PDF

There are a couple of kiosk config files (atom files):

- `test2.xml` - current test file, using some of the above
- `placebooks.xml` - out of date test file, with a placebook in it

There is also a small web server for browser test/development, `tnws.coffee`. E.g. in the directory above this do `coffee test/tnws.coffee` and then browse to [http://localhost:8080/assets/kiosk.html?f=test%2Ftest2.xml](http://localhost:8080/assets/kiosk.html?f=test%2Ftest2.xml).

To actually run/deploy you need to generate `shorturls.json`, `cache.json` and `cache/`. These are built by the [cache builder script](https://githib.com/cgreenhalgh/ost-kiosk-manager/blob/master/cache_builder/cb.coffee). They should all be in the same directory as the (cached copy of) kiosk atom file.

To deploy to a device you currently need to:

- install the APK and run it, to create the app data directory (something like) `/storage/sdcard0/Android/data/org.opensharingtoolkit.kiosk/files/`
- copy the kiosk config file, and all of the generated files to that directory, e.g. tar them up, push them to the device using `adb push`, open a shell using `adb shell` and unpack them in the right place
- open the app settings (from `Kiosk Settings` on the Home screen) and edit the default feed filename (e.g. to `test2.xml` from `ost.xml`)

For a web-based deployment you need to:

- have the atom file in the right place on the right server to match its self link
- copy the files and sub-folders from `assets/` into that directory, i.e. (currently) `kiosk.html`, `get.html`, `chooser.js`, `chooser.css`, `jquery-1.10.2.min.js` and `icons/`

If the atom file is called `ost.xml` then you should just be able to open `kiosk.html` in a browser; otherwise you will need to provide a parameter `f` whole value is the (URI encoded) path of the atom/config file to show.


