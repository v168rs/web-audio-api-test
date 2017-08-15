This project consists of five pages and probably only works on Chrome:

==geo_prox_html5.html==

Users can drag-and-drop sound files (supports mp3, wav, flac, ogg) on a digital Earth (Cesium.js) and navigate around Earth, listening to sounds positioned at various locations. Sound sets (accessible via drop down menu) can be uploaded to and retrieved from a server, with a rudimentary (not at all secure) password/username system (only for uploading, not for retrieving). Stock sets include national anthems and ambient environmental sounds recorded around USA.

One may need to zoom in to hear sounds.

It is also common for all sounds to cease loading. I do not know why this occurs.

This is the current (8/15/17) unencrypted password for the stock sets: $2a$10$HtOaLls7TndzTBUlzgcuB.QX4X94W7ksPWj/FaUGsQhpwBQHHe3rK

Additional features that have since been removed included morphing the timbre of the sounds based on data and uploading sounds via URL (Retrieving the audio data for processing requires a cross-origin request, which many URLs will not allow).

==geo.html==

A demo version of geo_prox_html5.html that uses the Web Audio API's AudioBufferSourceNode. Has fewer sounds and features (no sets or editing). AudioBufferSourceNode (despite being described as "lightweight" somewhere in the specification/documentation) likes to leak memory in Chrome so it was removed and replaced with the HTML5 Audio element.

==midi.html==
Generation of melodies based on MIDI training data provided by the user via a MIDI controller. Generation is performed via the use of nth-order Markov chains (the next note is determined by the last n notes). The order is currently determined by data from the map (higher order correlates with higher temperatures based on mouse location).
WIP feature: continuous generation of melodies based on pre-provided sets of MIDI training data that have been given specific “locations”. Based on the location of the user’s cursor, the resulting melody will tend towards generation from different sets of MIDI training data. Currently not very convincing. 

==index.html==
Sonification of climate data by mapping data (in this case, average land surface temperature, indicated by the color of the map beneath the mouse) to various variables: 

-Timbre (through use of a frequency filter or the frequency of an oscillator that is, in turn, modulating the frequency of an audible amplitude-modulating oscillator)
-“Dissonance”. 

When a melody is requested by pressing ` (grave), notes are generated through a simple hardcoded first-order markov model in which the probability for the next note’s pitch is determined by the current note. A similar model is used for harmony. The “dissonance” variable (correlates with higher temperatures) increases the probability of picking notes which are not within the accepted scale.

==loop.html==
Maps data to various layers of musical loops. Not very exciting.
