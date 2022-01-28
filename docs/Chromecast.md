# Chromecast idiotics

The chromecast documentation is reasonably extensive, but impossible
to navigate. There's not much in examples, and it is clear that the
API has grown and there is no API versioning.

Also, it seems that the API behaves differently on different platforms.
Which is weird, since it's just an API to control a _remote_ device.

- Apple MacBook:
  - on Chrome reload, rejoins the session (but currentTime is lost)
  - will not automatically join an existing session initiated by a different device.
  - if rejoin initiated by user by clicking on the crome icon,
    resets the existing session instead of joining.

- Windows:
  - on Chrome reload, rejoins the session
    - currentTime is sometimes off or lost?
  - will not automatically join an existing session initiated by a different device.
  - if initiated by user by clicking on the crome icon, resets the playing session

- Android:
  - does not automatically join an existing session
  - when connecting by clicking on the Chrome icon, automatically joins existing session.
    - currentTime seems to be correct
  - on reload:
    - when session is initiated by this device: automatically reconnects
      - currentTime? TODO
    - when session was initiated by other device: no auto reconnect
      - but: getSessionObj has a sessionId
      - so possible to reconnect using chrome.cast.requestSessionById(sessionId) ?
      - also, when leaving session (chromecast button: leave) session is
        reset on all players
  - play request:
    - when session was initiated by this device: play
    - when session was initiated by other device: connection lost?

BUGS:

- sometimes app thinks chromecast is still connected and tries to play on cc

