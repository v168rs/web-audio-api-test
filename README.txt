This project consists of two pages and probably only works on Chrome:

GEO-AUDIO

Users can drag-and-drop sound files (supports mp3, wav, flac, ogg) on a digital Earth (Cesium.js) and navigate around Earth, listening to sounds positioned at various locations. Sound sets (accessible via drop down menu) can be uploaded to and retrieved from a server, with a rudimentary (not at all secure) password/username system (only for uploading, not for retrieving). Stock sets include national anthems and ambient environmental sounds recorded around USA.

One may need to zoom in to hear sounds.

It is also common for all sounds to cease loading. I do not know why this occurs.

This is the current (8/15/17) unencrypted password for the stock sets: $2a$10$HtOaLls7TndzTBUlzgcuB.QX4X94W7ksPWj/FaUGsQhpwBQHHe3rK

Additional features that have since been removed included morphing the timbre of the sounds based on data and uploading sounds via URL (Retrieving the audio data for processing requires a cross-origin request, which many URLs will not allow).

Midi.html
Generation of melodies based on MIDI training data provided by the user via a MIDI controller. Generation is performed via the use of nth-order Markov chains (the next note is determined by the last n notes). 
WIP feature: continuous generation of melodies based on pre-provided sets of MIDI training data that have been given specific “locations”. Based on the location of the user’s cursor, the resulting melody will tend towards generation from different sets of MIDI training data. Currently not very convincing.