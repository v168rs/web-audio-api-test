//Special system specifically for geotagged samples

function load_sample(sample, buffer_receiver) {
    var getSound = new XMLHttpRequest();
    getSound.open("GET", sample, true);
    getSound.responseType = "arraybuffer";
    getSound.onload = function () {
        context.decodeAudioData(getSound.response, function(buffer) {
            buffer_receiver(buffer);
        });
    };
    getSound.send();
} 

var geo_audio = [
    ["snd/usa.mp3", 38.907192, -77.036871], //http://www.music.army.mil/music/nationalanthem/
    ["snd/canada.mp3", 45.421530, -75.697193],
    ["snd/china.mp3", 39.904200, 116.407396],
    ["snd/japan.mp3", 35.689487, 139.691706],
    ["snd/cuba.mp3", 23.113592, -82.366596],
    ["snd/mexico.mp3", 19.432608, -99.133208],
    ["snd/italy.mp3", 41.902783, 12.496366],
    ["snd/russia.mp3", 55.755826, 37.617300],
    ["snd/uk.mp3", 51.507351, -0.127758],
    ["snd/australia.mp3", -35.280937, 149.130009],
    ["snd/spain.mp3", 40.416775, -3.703790],
    ["snd/germany.mp3", 52.520007, 13.404954],
    ["snd/france.mp3", 48.856614, 2.352222],
    ["snd/india.mp3", 28.613939, 77.209021],
    ["snd/philippines.mp3", 14.599512, 120.984219],
    ["snd/portugal.mp3", 38.722252, -9.139337]
    
    //US Navy Band
    //https://web-beta.archive.org/web/20030827154715/http://www.navyband.navy.mil:80/anthems/all_countries.htm
]

var geo_buses = [];
var listening_buses = [];
var context;
var convolver;

function init() {
    var impulse = "snd/impulse.wav";
    context = new AudioContext();
    
    var master_gain = context.createGain();
    master_gain.connect(context.destination);
    
    //convolution reverb
    convolver = context.createConvolver(); //dry/wet?
    var soundSource = context.createBufferSource();
    load_sample(impulse, function(b) {
        convolver.buffer = b;
        soundSource.buffer = b;
        soundSource.loop = true;
    });
    convolver.connect(master_gain);
    
    //Then create smaller "buses" with audio buffers and panners and hook them all up to the convolver[[sampler panner][sampler panner]]
    
}

function create_samples_with_loc(){
    geo_audio.forEach(function(arr){
        var geo_bus = [];
        var sampler = context.createBufferSource();
        load_sample(arr[0], function(b) {
            sampler.buffer = b;
            sampler.loop = true;
        });
        var panner = context.createPanner();
        panner.panningModel = "HRTF";
        //Positioning?
        //cesium.js
        
        sampler.connect(panner);
        sampler.start();
        panner.connect(convolver);
        //For access:
        geo_bus.push(sampler);
        geo_bus.push(panner);
        geo_buses.push(geo_bus);
    });
}



/*everything below this line hasn't been fixed and was just copypasted from app.js
//Very expensive. TODO: Find a way to pipe all the anthem buses into a convolver instead?

function update_geo_samples(listener_x, listener_y) {
    var i;
    for(i = 0; i < geo_buses.length; i++) {
        
        console.log("x" + (geo_audio[i][1] - listener_x));
        console.log("y" + (listener_y - geo_audio[i][2]));
        
        
        buses[geo_buses[i]][1][0].positionX.value = (geo_audio[i][3] - listener_x);
        buses[geo_buses[i]][1][0].positionY.value = (listener_y - geo_audio[i][4]);
        
        //Hard-coded panner index
    }
}
//sample from rmutt at freesound.org
*/
