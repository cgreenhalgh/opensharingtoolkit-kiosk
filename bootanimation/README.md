To install a custom boot animation on most devices, copy the bootanimation.zip
file to /data/local/. You may need to first copy the file to the sdcard and
then use the device shell as root to copy it to /data/local/.

If that doesn't work then search the web for device-
specific information. 

Note that the bootanimation.zip file MUST be
uncompressed; e.g. create it using 
"zip -0 bootanimation.zip desc.txt part0/* ..."

