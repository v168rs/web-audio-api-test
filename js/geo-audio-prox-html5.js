//http://www.music.army.mil/music/nationalanthem/
//US Navy Band
//https://web-beta.archive.org/web/20030827154715/http://www.navyband.navy.mil:80/anthems/all_countries.htm
//MP3s are kept at https://drive.google.com/open?id=0B6_a4sq0zv4FRnFhajFJNkdRREU
//Freesound.org
//Ogg files are kept at https://drive.google.com/open?id=0B6_a4sq0zv4FVnFWc1dFMlhOTWM
//Flags are kept at https://drive.google.com/open?id=0B6_a4sq0zv4FT0N2TUNwb3ZqNnc
//Kosovo and South Sudan are special because they have no flag here
/*(function () {*/
"use strict";
//Special system specifically for geotagged samples
//Requires Cesium.js
//National anthems (soundfile, lat, long, flagicon) maybe volume too (do something cool like volume proportional to GDP)

//Stored in JSON
var geo_audio_samples = [],
    ready = false;

//Audio attributes that vary depending on sound set: reverb impulse, inner cone (no volume reduction), outer cone
var geo_audio_attributes = [];

//Takes a path/URL to the sample and a callback that receives the arraybuffer data as a parameter. MOSTLY DEPRECATED AND ONLY USED FOR CONVOLUTION REVERB.
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

var geo_buses = [], //Array [] which holds arrays of [panners and AudioBufferSourceNodes]. Panners are initialized in create_samples_with_loc.
    cur_audio_selector = 0, //Determines the set of sounds being played ie Anthems, Ambient
    context, //AudioContext for the page
    convolver, //Fancy reverb for sense of space (initialized in geo_init)
	filter, //Doesn't exist anymore
    master_gain, //Master volume
    listening_nodes = 0; //Number of nodes being listened to help cap the number of nodes that can be activated, updated by find_prox_nodes

var data_canvas_context; //Doesn't do anything anymore

function map(val, min1, max1, min2, max2) {
    return (val - min1) / (max1 - min1) * (max2 - min2) + min2;
} //from p5js. Maps a value within one range to another.

//Initializes audio context, master gain, convolution reverb.
function geo_init(impulse = "snd/imp/impulse.wav") {
    context = new AudioContext();
    master_gain = context.createGain();
    master_gain.connect(context.destination);
    
    convolver = context.createConvolver(); //dry/wet?
    load_sample(impulse, function(b) {
        convolver.buffer = b;
    });
	/* //Deprecated
	filter = context.createBiquadFilter(); //Modulation test
	filter.type = "lowpass";
	filter.frequency.value = 100;
	filter.gain.value = 25;
    convolver.connect(filter);
	filter.connect(master_gain);
	*/
	convolver.connect(master_gain);
    
}

/* //Deprecated
function img_update(img_src="img/data/lstd_01_gs.PNG") {
	var data_img = new Image();
	if(!data_canvas_context) {
		data_canvas_context = document.createElement('canvas').getContext("2d")
	}
	data_canvas_context.canvas.width = 3600;
	data_canvas_context.canvas.height = 1800;
	data_img.src = img_src;
	data_img.onload = function() {
		data_canvas_context.clearRect(0, 0, data_canvas_context.canvas.width, data_canvas_context.canvas.height);
		data_canvas_context.drawImage(data_img, 0, 0, 3600, 1800);
	}   
}

img_update();
*/

//Changes reverb
function change_impulse(impulse = "snd/imp/impulse.wav") {
    load_sample(impulse, function(b) {
        convolver.buffer = b;
    });
}

// Math helpers
function deg2rad(x) {
    return x/180 * Math.PI;
}

function rad2deg(x) {
	return (x/Math.PI * 180) % 360;
}

//cached variables explained below
var ind_arr = [],
    dist_arr = [],
    rej_arr = [],
	cur_stat = 0; //Deprecated
			  
//Finds nodes within proximity of the viewer based on their latitude and longitude. Range is in m, audio_selector determines the sound set, max_nodes determines the maximum number of nodes.
function find_prox_nodes(range = 2000000, audio_selector = 0, lat, long, max_nodes = 7) {
	var geo6c = set_samples_loc(null, lat, long);
    ind_arr = []; //Array containing indices of sounds within range (as within geo_audio_samples[audio_selector])
    dist_arr = []; //Array containing distances of sounds so we can sort them
    rej_arr = []; //Array containing sounds current playing that we will shut off because they are outside of range.
    geo_audio_samples[audio_selector].forEach(function(arr, index){
        var geo6 = set_samples_loc(arr);
        var dist = Math.sqrt(Math.pow((geo6[0] - geo6c[0]), 2) + Math.pow((geo6[1] - geo6c[1]), 2) + Math.pow((geo6[2] - geo6c[2]), 2));
        if(dist < range) {
            ind_arr.push(index);
            dist_arr.push(dist);
        }
        else if(geo_buses[index][0] && (geo_buses[index][0] instanceof MediaElementAudioSourceNode)) { //Look for nodes that are playing outside of range...
            rej_arr.push(index);
        }
    });
    rej_arr.forEach(function(index) { //Pause and delete nodes out of range.
        geo_buses[index][0].disconnect();
        if(!geo_buses[index][0].paused) {try {geo_buses[index][0].mediaElement.pause(); } catch(e) {} }
        geo_buses[index][0] = null;
        listening_nodes -= 1;
    });
    //Sort by proximity (closest first) - Should prevent zooming on a country only to discover you can't hear it
    var arr_keys = Object.keys(dist_arr);
    arr_keys.sort(function(a, b){return dist_arr[a] < dist_arr[b]});
    ind_arr = arr_keys.map(function(index){
       return ind_arr[index];
    });
    //Then slice to fit
    ind_arr = ind_arr.slice(0, max_nodes);
    if(ind_arr[0] && (listening_nodes < max_nodes)) {
        ind_arr.forEach(function(index){
            if((geo_buses[index][0] === undefined) || (geo_buses[index][0] === null)) { //If there isn't already a sound there
                var audio_source = context.createMediaElementSource(new Audio(geo_audio_samples[audio_selector][index][0])); //Creates an HTML5 audio element that points to a specific URL.
                audio_source.mediaElement.loop = true; //Why not a regular WebAudioAPI AudioBufferSourceNode? Because for some reason those leak memory like crazy.
                audio_source.mediaElement.play(); //It has something to do with array buffers.
                geo_buses[index][0] = audio_source;
                audio_source.connect(geo_buses[index][1]);
            }
        });
        //99999 is a null value. lat/lon is lat. but can also be expressed by polar to equirectangular:
    }
	/* //Deprecated
	var y = Math.round((90 - rad2deg(lat)) * 10)  - data_canvas_context.canvas.offsetLeft; //1800
	var x = Math.round((rad2deg(long) + 180) * 10)  - data_canvas_context.canvas.offsetTop;
	var color = data_canvas_context.getImageData(x, y, 1, 1).data;
	if(color) {
		cur_stat = Math.max(color[0]/255, color[1]/255, color[2]/255);
	} */
} //0 to 1

//A function used for calculating the reference values for audio position and orientation. Returns array of 6 numbers with cartesian position and surface normal - I don't know how the math works
function set_samples_loc(arr = null, lat = 0, long = 0){ 
    var loc_lat = lat, //y
        loc_long = long, //x
        s_maj = 6378137,
        s_min = 6356752.314245,
        eccentricity = 0.0818191908426215,
        normal = 0,
        h = 0;
    if(arr instanceof Array) {
        loc_lat = deg2rad(arr[1]);
        loc_long = deg2rad(arr[2]);
    }
    var ret = [];
    normal = (s_maj/(Math.sqrt(1 - eccentricity*eccentricity*Math.sin(loc_lat)*Math.sin(loc_lat))));
    ret.push((normal + h) * Math.cos(loc_lat) * Math.cos(loc_long));
    ret.push((normal + h) * Math.cos(loc_lat) * Math.sin(loc_long));
    ret.push((normal + h) * (1 - eccentricity * eccentricity) * Math.sin(loc_lat));
    ret.push(Math.cos(loc_lat) * Math.cos(loc_long));
    ret.push(Math.cos(loc_lat) * Math.sin(loc_long));
    ret.push(Math.sin(loc_lat));
    return ret;
}

//Unified function for setting position and orientation of the AudioContext's listener
function set_listener_loc(x, y, z, fx, fy, fz, ux, uy, uz) {
    context.listener.setPosition(x, y, z);
    context.listener.setOrientation(fx, fy, fz, ux, uy, uz);
}

//Cesium stuff
var viewer = new Cesium.Viewer('cesiumContainer', {"sceneModePicker" : false, "timeline" : false}); //Scenemodepicker makes the camera position weird in some modes so we got rid of it
var camera = viewer.camera;
camera.changed.addEventListener(function() { if(ready) {
    set_listener_loc(camera.position["x"], camera.position["y"], camera.position["z"], camera.direction["x"], camera.direction["y"], camera.direction["z"], camera.up["x"], camera.up["y"], camera.up["z"]);
    find_prox_nodes(1000000, cur_audio_selector, camera.positionCartographic["latitude"], camera.positionCartographic["longitude"]);
	//filter.frequency.linearRampToValueAtTime(map(cur_stat, 0, 1, 100, 6000), context.currentTime+1);
                                           }});

//Stress testing function
function repeat_listener_rand_loc(rep = 100) {
    var i,
        rand = Math.random(),
        rand2 = Math.random();
    for (i = 0; i < rep; i++) {
        find_prox_nodes(2000000, 0, rand, rand2, 7);
    }
}

//Placing icons in Cesium
function place_billboard(bx, by, bz, b_img) {
	var csnfs = new Cesium.NearFarScalar(1e7, 1.0, 5.0e7, 0.0);
    viewer.entities.add({
        position : new Cesium.Cartesian3(bx, by, bz),
        billboard : {
        image : b_img,
		translucencyByDistance : csnfs
    }
    });
}

//Initializes panners at preset locations with orientation away from the Earth's surface. Doesn't actually create samples.
function create_samples_with_loc(audio_selector = 0, cone_inner = 30, cone_outer = 150){
    geo_audio_samples[audio_selector].forEach(function(arr){
        var geo_bus = [];
        var panner = context.createPanner();
        panner.panningModel = "HRTF"; //More realistic and supports 3D panning but computationally costly. Cheaper option is "equalpower" which is just L/R.
        
		//Positioning
        var geo6 = set_samples_loc(arr);
        panner.setPosition(geo6[0], geo6[1], geo6[2]);
        panner.refDistance = 700; //Base distance unit for panner calculations
        
        //Orientation
        panner.setOrientation(geo6[3], geo6[4], geo6[5]);
        panner.coneInnerAngle = cone_inner;
        panner.coneOuterAngle = cone_outer;
        panner.coneOuterGain = 0;
        panner.connect(convolver);
        
        //For access:
        geo_bus[1] = panner;
        geo_buses.push(geo_bus);
        
        //Icons
        if (arr[3]) {
            place_billboard(geo6[0], geo6[1], geo6[2], arr[3]);
        }
        else { //Defaults to a picture of a green circle
            place_billboard(geo6[0], geo6[1], geo6[2], "img/xph.png");
        }
    });
}

//Test of imagery layers
/* viewer.scene.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({url: "img/data/lstd_01_c.PNG"}));

function change_imagery_layer(iurl = "img/data/lstd_01_c.PNG") {
	if(viewer.scene.imageryLayers[1]) {
		//Assuming we're not using more than one imageryLayer which may be incorrect
		viewer.scene.imageryLayers.remove(viewer.scene.imageryLayers[1]);
	}
	viewer.scene.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({url: iurl}));
}
*/
			  
//Function to switch which set of samples you're using
function change_sample_bank(audio_selector = 0) {
    //clear geo_buses
    cur_audio_selector = audio_selector;
    geo_buses.forEach(function(bus) {
        if(bus[0] instanceof MediaElementAudioSourceNode) {
            bus[0].loop = false;
            bus[0].disconnect();
            bus[0] = null;
        }
        bus[1].disconnect();
    });
    geo_buses = [];
    //clear icons
    viewer.entities.removeAll();
    console.log(geo_audio_attributes);
    if(geo_audio_attributes[audio_selector]) {
        change_impulse(geo_audio_attributes[audio_selector][0]);
        create_samples_with_loc(audio_selector, geo_audio_attributes[audio_selector][1], geo_audio_attributes[audio_selector][2]);
    }
    else {
        change_impulse("snd/imp/impulse.wav");
        create_samples_with_loc(audio_selector);
    }
}
    
function general_audio_load(arr) { //helper function don't call this
    return new Promise(function(resolve) {
        var i;
        for(i = 0; i < arr.length - 1; i++) {
            var getText1 = new XMLHttpRequest();
            getText1.open("GET", "json/geo_audio_attributes_" + arr[i] + ".json", true);
            getText1.responseType = "json";
            getText1.onload = function() {
                geo_audio_attributes.push(getText1.response);
            }
            getText1.send();
        }
        for(i = 0; i < arr.length - 1; i++) {
            var getText = new XMLHttpRequest();
            getText.open("GET", "json/geo_audio_samples_" + arr[i] + ".json", true);
            getText.responseType = "json";
            console.log(i);
            if (!((i + 1) < arr.length - 1)) {
                getText.onload = function() {
                geo_audio_samples.push(getText.response);
                resolve("Completed request");
            }
            }
            else {
                getText.onload = function() {
                geo_audio_samples.push(getText.response);
            }
            }
            getText.send();
        }
            });
}
              
function load_audio_urls() { //actually initializes everything
    var geo_audio_sample_urls = [];
    var getMeta = new XMLHttpRequest();
    getMeta.open("GET", "json/meta.json", true)
    getMeta.onload = function() {
        geo_audio_sample_urls = JSON.parse(getMeta.responseText);
        general_audio_load(geo_audio_sample_urls).then(function() {
            var getText = new XMLHttpRequest();
            getText.open("GET", "json/geo_audio_samples_" + geo_audio_sample_urls[geo_audio_sample_urls.length - 1] + ".json", true);
            getText.onload = function() {
                geo_audio_samples.push(JSON.parse(getText.responseText));
                console.log(geo_audio_samples);
                getText.open("GET", "json/geo_audio_attributes_" + geo_audio_sample_urls[geo_audio_sample_urls.length - 1] + ".json", true);
                getText.responseType = "json";
                getText.onload = function() {
                    geo_audio_attributes.push(getText.response);
                    geo_init();
                    create_samples_with_loc(0);
                    ready = true;
                }
                getText.send();
            }
            getText.send();
        });
        var selector = document.getElementById("selector")
        geo_audio_sample_urls.forEach(function(b, i) {
            selector.innerHTML += "<option value=\"" + i + "\">" + b + "</option>"
        });
        selector.addEventListener("change", function() {
            change_sample_bank(selector.value);
        });
    }
    getMeta.send();
}

load_audio_urls();

function reload_audio_urls() {
    ready = false;
    load_audio_urls();
}

			  /*
var slider = document.getElementById("data_pic_slider");
slider.oninput = function() {

	var v = parseInt(slider.value) + 1; //super hacky
	change_imagery_layer("img/data/lstd_0" + v + "_c.PNG");
	img_update("img/data/lstd_0" + v + "_gs.PNG");
	
}
*/

document.getElementById("mute_btn").addEventListener("click", function() {
	master_gain.gain.setValueAtTime(0, context.currentTime);
	document.getElementById("mute_btn").disabled = true;
	document.getElementById("unmute_btn").disabled = false;
});

document.getElementById("unmute_btn").addEventListener("click", function() {
	master_gain.gain.setValueAtTime(1, context.currentTime);
	document.getElementById("unmute_btn").disabled = true;
	document.getElementById("mute_btn").disabled = false;
});

document.getElementById("cesiumContainer").ondrop = function(event) {
    console.log(event.clientX);
	this.style.opacity = 1;
	event.stopPropagation();
	event.preventDefault();
	var dt = event.dataTransfer;
	if(dt.items) {
		var i = 0;
		for (i = 0; i <= dt.items.length - 1; i++) {
			if(dt.items[i] && dt.items[i].kind == "file") {
				var f = dt.items[i].getAsFile();
				if(f.type == "audio/mp3") {
					var fr = new FileReader();
					fr.readAsDataURL(f);
					fr.onload = function(file) {
						//audio is stored in fr.result but this may not be the best way to go about it
					}
				}
			}
			else {
				dt.items[i].getAsString(function(str) {
                    var url_push = new XMLHttpRequest();
                    url_push.open("POST", "", true);
                    url_push.send(str);
				});
			}
		}
		
	}
}

//Function to create new sound set
//Draggable only on new sound sets
//Password system for sound sets?
//Keep track of all urls and icons added
//Have an append queue for the JSON on the server

document.getElementById("cesiumContainer").ondragenter = function(event) {
	this.style.opacity = 0.4;
}

document.getElementById("cesiumContainer").ondragleave = function(event) {
	this.style.opacity = 1;
}

document.getElementById("cesiumContainer").ondragover = function(event) {
	event.preventDefault();
	event.dataTransfer.effectAllowed = "move";
	event.dataTransfer.dropEffect = "move";
	}
			  
/*			 }());*/

