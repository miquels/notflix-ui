
Android TV Keycodes.
====================

See https://developer.android.com/training/tv/start/controllers
for the recommended key/action mapping on Android.

Then there is the Android keycode to javascript keycode mapping.
This can be tested with:

```
adb -t <device-id> shell input keyevent <key-id>
```

For example, `<key-id> KEYCODE_MEDIA_STOP` results in a javascript event with `key: "MediaStop`

W3C has a list of multimedia keys at
https://www.w3.org/TR/uievents-key/#keys-multimedia

List created with:
```
let x = (ev) => console.log(ev); document.body.addEventListener('keydown', x);
```


```
Android                     Javascript

KEYCODE_DPAD_DOWN           ArrowDown
KEYCODE_DPAD_LEFT           ArrowLeft
KEYCODE_DPAD_RIGHT          ArrowRight
KEYCODE_DPAD_UP             ArrowUp
KEYCODE_DPAD_CENTER         Enter
KEYCODE_NUMPAD_ENTER        Enter

KEYCODE_PROG_RED            ColorF0Red
KEYCODE_PROG_GREEN          ColorF1Green
KEYCODE_PROG_YELLOW         ColorF2Yellow
KEYCODE_PROG_BLUE           ColorF3Blue

KEYCODE_MEDIA_CLOSE         Close
KEYCODE_MEDIA_EJECT         Eject
KEYCODE_MEDIA_FAST_FORWARD  MediaFastForward
KEYCODE_MEDIA_NEXT          MediaTrackNext
KEYCODE_MEDIA_PAUSE         Pause
KEYCODE_MEDIA_PLAY          MediaPlay
KEYCODE_MEDIA_PLAY_PAUSE    MediaPlayPause
KEYCODE_MEDIA_PREVIOUS      MediaTrackPrevious
KEYCODE_MEDIA_REWIND        MediaRewind
KEYCODE_MEDIA_SKIP_BACKWARD MediaSkipBackward
KEYCODE_MEDIA_SKIP_FORWARD  MediaSkipForward
KEYCODE_MEDIA_STEP_BACKWARD MediaStepBackward
KEYCODE_MEDIA_STEP_FORWARD  MediaStepForward
KEYCODE_MEDIA_STOP          MediaStop
KEYCODE_MEDIA_TOP_MENU      MediaTopMenu
```
