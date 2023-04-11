# Todo.

## BUGS to fix

-
-

## Prio 1.

- accounts / profiles
- Rewrite all backends in Rust and merge.
- store seen / favorites on the backend.

## Prio 2.

- Hover over poster on thumbwall: show details
- move stuff from top bar to menu on mobile
- move stuff from top bar to side menu on tv

## Prio 3.

- choose poster size
- choose view (thumbwall or list)
- 'loading' or 'waiting' spinners
- bubble up errors from Chromecast and Html5Video
  * add some sort of 'reset and restart video' ?

## Prio 4.

- Config / Settings
  - use plain mp4 or hls
- Html5Video: support for thumbs on time bar.

## Other.

- fix chromecast subtitles on sender side instead of receiver hack

- Other renderers:
  - simple HTML renderer, remote control via websockets-over-local-net
  - HbbTv 2.0 ?

## Done.

- Send details (title, year, etc) to Html5Video and Chromecast.
- selection (order, year, genre)
- Search.
- Favorites, and remember seen / last episode.
  - initially, using localStorage.
- show favorites in 'Notflix' tab (which will be '/')
- selection: continue viewing / new episodes
- Config / Settings
  - chromecast: use shaka, prefer 6 channel audio
  - apple: use native hls
- Replace Thumb with our own version that is more performant during scrolling.
- Chromecast: shaka subtitle hack
  - intercept master.hls through shaka, smuggle data in track language
  - use `playerManager.setMessageInterceptor(cast.framework.messages.MessageType.MEDIA_STATUS`
    to intercept responses to client, rewrite media.tracks
  - shaka dash / 5.1 hack: do serverside.
  - HLS fix for MPL: clientside (so default media receiver keeps working)

