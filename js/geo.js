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

//add relative xyz values to this afterwards. samp/lat/long
var geo_audio = [
    ["snd/usa.mp3", 38.8977, -77.0365], //http://www.music.army.mil/music/nationalanthem/
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
var cur_pos = [0, 0];
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

function deg2rad(x) {
    return x/180 * Math.PI;
}

//A function used for calculating the reference values for audio position and orientation.
function set_samples_loc(arr){ 
    var loc_lat = deg2rad(arr[1]), //y
        loc_long = deg2rad(arr[2]); //x
        s_maj = 6378137,
        s_min = 6356752.314245,
        eccentricity = 0.0818191908426215,
        normal = 0;
        h = 0;
    var ret = [];
    normal = (s_maj/(Math.sqrt(1 - eccentricity*eccentricity*Math.sin(loc_lat)*Math.sin(loc_lat))));
    ret.push((normal + h) * Math.cos(loc_lat) * Math.cos(loc_long));
    ret.push((normal + h) * Math.cos(loc_lat) * Math.sin(loc_long));
    ret.push((normal + h) * (1 - eccentricity * eccentricity) * Math.sin(loc_lat));
    
    //Orientation
    //Cesium
    var nvec = {};
    Cesium.Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(new Cesium.Cartographic(loc_long, loc_lat, h), nvec);
    ret.push(nvec["x"]);
    ret.push(nvec["y"]);
    ret.push(nvec["z"]);
    return ret;
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
        var cartes = set_samples_loc(arr);
        panner.setPosition(cartes[0], cartes[1], cartes[2]);
        sampler.connect(panner);
        sampler.start();

        panner.refDistance = 300;
        panner.distanceModel = "exponential";
        panner.setOrientation(cartes[3], cartes[4], cartes[5]);
        panner.coneInnerAngle = 60;
        panner.coneOuterAngle = 100;
        panner.coneOuterGain = 0.1; 
        panner.connect(convolver);
        //For access:
        geo_bus.push(sampler);
        geo_bus.push(panner);
        geo_buses.push(geo_bus);
    });
}

function set_listener_loc(x, y, z, fx, fy, fz, ux, uy, uz) {
    context.listener.setPosition(x, y, z);
    context.listener.setOrientation(fx, fy, fz, ux, uy, uz);
}

//fine Cesium.js, you win
init();
create_samples_with_loc();
var viewer = new Cesium.Viewer('cesiumContainer');
var camera = viewer.camera;
camera.changed.addEventListener(function() {set_listener_loc(camera.position["x"], camera.position["y"], camera.position["z"], camera.direction["x"], camera.direction["y"], camera.direction["z"], camera.up["x"], camera.up["y"], camera.up["z"]);});