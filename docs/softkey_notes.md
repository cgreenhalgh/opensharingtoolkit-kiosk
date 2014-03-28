# Soft key notes

Trying out an open source soft key option, that might be modified for kiosk use (e.g. flexible show/hide).

## Floating Soft Keys

Appears to implement the low-level key press event using a root-executed jar for which the source is not available. This seems not to work for me on Android 4.4.2. The build instructions are therefore here for historical interest only.

(Floating Soft Keys)[https://github.com/rhoadster91/FloatingSoftKeys].

Requires libraries (StandOut Window)[https://github.com/pingpongboss/StandOut] and (CircleLayout)[https://github.com/dmitry-zaitsev/CircleLayout]

### Building Circle Layout

```
git clone https://github.com/dmitry-zaitsev/CircleLayout.git
```

Eclipse, `Import...` > `Android` / `Existing Projects into workspace`; select `CircleLayout` as root and select `CircleLayout` as project.

Edit project properties:

- set Android target, e.g. API 16 (4.1.2)
- set `Is Library`

Clean/build.

### Building StandOut Window

```
git clone https://github.com/pingpongboss/StandOut.git
```

Eclipse, `Import...` > `Android` / `Existing Projects into workspace`; select `StandOut` as root and `StandOut` as project.

If necessary edit project properties Android target, or install suitable target support.

### Android support library

Set up an android v7 support library as per (the instructions for Adding libraries with resources.)[https://developer.android.com/tools/support-library/setup.html].  

### Building Floating Soft Keys


```
git clone https://github.com/rhoadster91/FloatingSoftKeys.git
```

Eclipse, `Import...` > `Android` / `Existing Android code into workspace`; select `FloatingSoftKeys` as root.

Add `lib\android-support-v4.jar` and `lib\android-support-v7-appcompat.jar` to the build path.

Edit project properties `Android`, remove/change the library paths to include the CircleLayout, StandOut and `android-support-v7-appcompat` library projects (above). 

