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
    cur_audio_selector = "National_Anthems", //Determines the set of sounds being played ie Anthems, Ambient
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
	/*
	filter = context.createBiquadFilter(); //Modulation test
	filter.type = "lowpass";
	filter.frequency.value = 100;
	filter.gain.value = 25;
    convolver.connect(filter);
	filter.connect(master_gain);
	*/
	convolver.connect(master_gain);
    
}

/* 
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
function find_prox_nodes(range = 2000000, lat, long, max_nodes = 7) {
	var geo6c = set_samples_loc(null, lat, long);
    ind_arr = []; //Array containing indices of sounds within range (as within geo_audio_samples)
    dist_arr = []; //Array containing distances of sounds so we can sort them
    rej_arr = []; //Array containing sounds current playing that we will shut off because they are outside of range.
    geo_audio_samples.forEach(function(arr, index){
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
        if(!geo_buses[index][0].paused) {geo_buses[index][0].mediaElement.pause();}
        geo_buses[index][0] = null;
        listening_nodes -= 1;
        viewer.entities.getById(String(index)).billboard.scale = 1;
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
                var html5_audio = new Audio(geo_audio_samples[index][0]);
                //How do catch DOMException ? ? ?
                html5_audio.crossOrigin = "anonymous";
                var audio_source = context.createMediaElementSource(html5_audio); //Creates an HTML5 audio element that points to a specific URL.
                audio_source.mediaElement.loop = true; //Why not a regular WebAudioAPI AudioBufferSourceNode? Because for some reason those leak memory like crazy.
                audio_source.mediaElement.play(); //It has something to do with array buffers.
                //How do catch DOMException ? ? ?
                //Update billboard
                geo_buses[index][0] = audio_source;
                audio_source.connect(geo_buses[index][1]);
                viewer.entities.getById(String(index)).billboard.scale = 1.5;
            }
        });
        //99999 is a null value. lat/lon is lat. but can also be expressed by polar to equirectangular:
    }
	/*
	var y = Math.round((90 - rad2deg(lat)) * 10)  - data_canvas_context.canvas.offsetLeft; //1800
	var x = Math.round((rad2deg(long) + 180) * 10)  - data_canvas_context.canvas.offsetTop;
	var color = data_canvas_context.getImageData(x, y, 1, 1).data;
	if(color) {
		cur_stat = Math.max(color[0]/255, color[1]/255, color[2]/255);
	} */
} //0 to 1

//Visual representation of which sound is playing or not

//Doesn't set any sample loc.
//A function used for calculating the position and orientation of panners. Returns array of 6 numbers with cartesian position and surface normal - I don't know how the math works
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
    find_prox_nodes(1000000, camera.positionCartographic["latitude"], camera.positionCartographic["longitude"]);
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
function place_billboard(bx, by, bz, b_img, id = 0) {
	var csnfs = new Cesium.NearFarScalar(1e7, 1.0, 5.0e7, 0.0);
    viewer.entities.add({
        position : new Cesium.Cartesian3(bx, by, bz),
        id : id,
        billboard : {
        image : b_img,
		translucencyByDistance : csnfs,
    }
    });
}

//Initializes panners at preset locations with orientation away from the Earth's surface. Doesn't actually create samples.
function create_samples_with_loc(cone_inner = 30, cone_outer = 150){
    geo_buses = [];
    geo_audio_samples.forEach(function(arr, index){
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
            place_billboard(geo6[0], geo6[1], geo6[2], arr[3], index);
        }
        else { //Defaults to a picture of a green circle
            place_billboard(geo6[0], geo6[1], geo6[2], "img/xph.png", index);
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

var sample_xhr = new XMLHttpRequest();
var attribute_xhr = new XMLHttpRequest();
			  
//Function to switch which set of samples you're using
function change_sample_bank(audio_selector = "National_Anthems") {
    ready = false; //I'M BUSY
    cur_audio_selector = audio_selector;
    document.getElementById("set_name").value = audio_selector;
    //clear geo_buses
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
    
    //make xhr requests for the relevant sample and attribute sets
    if(audio_selector != "custom") {
        attribute_xhr.open("GET", "/json/geo_audio_attributes_" + cur_audio_selector + ".json");
        attribute_xhr.responseType = "json";
        attribute_xhr.onload = function() {geo_audio_attributes = attribute_xhr.response;};
        attribute_xhr.send();

        sample_xhr.open("GET", "/json/geo_audio_samples_" + cur_audio_selector + ".json");
        sample_xhr.responseType = "json";
        sample_xhr.onload = function() {
            geo_audio_samples = sample_xhr.response;
            if(geo_audio_attributes) {
            change_impulse(geo_audio_attributes[0]);
            create_samples_with_loc(geo_audio_attributes[1], geo_audio_attributes[2]);
            }
            else {
                change_impulse("snd/imp/impulse.wav");
                create_samples_with_loc();
            }
            find_prox_nodes(1000000, camera.positionCartographic["latitude"], camera.positionCartographic["longitude"]);
            ready = true;
            };
        sample_xhr.send(); //This should take the longest so everything setup will go after this
    }
    else {
        ready = true;
    }
}

function load_audio_urls() {
    var geo_audio_sample_urls = [];
    var getMeta = new XMLHttpRequest();
    getMeta.open("GET", "/json/meta.json", true)
    getMeta.onload = function() {
        geo_audio_sample_urls = JSON.parse(getMeta.responseText);
        var selector = document.getElementById("selector");
        geo_audio_sample_urls.forEach(function(b) {
            var option = document.createElement("option");
            option.value = b;
            option.innerText = b;
            selector.appendChild(option); //wew lad
        });
        selector.addEventListener("change", function() {
            change_sample_bank(selector.value);
        });
    }
    getMeta.send();
}

geo_init();
load_audio_urls();
change_sample_bank(); //initializes the sounds to default value ("National_Anthems")

/*
var slider = document.getElementById("data_pic_slider");
slider.oninput = function() {

	var v = parseInt(slider.value) + 1; //super hacky
	change_imagery_layer("img/data/lstd_0" + v + "_c.PNG");
	img_update("img/data/lstd_0" + v + "_gs.PNG");
	
}
*/

//

//takes a URL and Cesium cartesian object as input
//takes a URL and Cesium cartesian object as input
function new_sound(src, loc) {
    var latlon = Cesium.Ellipsoid.WGS84.cartesianToCartographic(loc);
    geo_audio_samples.push([src, rad2deg(latlon.latitude), rad2deg(latlon.longitude)]);
    viewer.entities.removeAll();
    create_samples_with_loc(geo_audio_attributes[1], geo_audio_attributes[2]); //disgusting
    find_prox_nodes(1000000, camera.positionCartographic["latitude"], camera.positionCartographic["longitude"]);
}

//deletes sound of selected entity
function del_sound() {
    if(!viewer.selectedEntity) {
        return;
    }
    var id = viewer.selectedEntity._index;
    var bus = geo_buses[id];
    if(bus) {
        if(bus[0] instanceof MediaElementAudioSourceNode) {
            bus[0].loop = false;
            bus[0].disconnect();
            bus[0] = null;
        }
        bus[1].disconnect();
    }
    viewer.entities.removeById(id);
}

//delete_sound
//move_sound
//copy, paste, undo?

//Function to create new sound set
function new_sound_set() {
    geo_audio_samples = [];
    geo_audio_attributes = ["snd/imp/impulse.wav", 30, 150];
    change_sample_bank("custom");
    //probably more complicated than this but we'll figure it out later
}

//Posts the current set to server (it could be an unaltered verison of one of the stock sets but preferably you wouldn't do that)
function post_set() {
    var name = document.getElementById("set_name").value,
        password = document.getElementById("password").value, //SHA256 that and then encrypt it further serverside
        geo_note = document.getElementById("geo-note")
    var check_xhr = new XMLHttpRequest(),
    json_request = {
        sample_set : geo_audio_samples,
        attributes : geo_audio_attributes ? geo_audio_attributes : ["snd/imp/impulse.wav", 30, 150]
    };
    check_xhr.open("POST", "", true); //the set name becomes a user name
    check_xhr.setRequestHeader("Authorization", "Basic" + btoa(name + ":" + password));
    check_xhr.send(JSON.stringify(json_request));
    check_xhr.onload = function() {
        if(check_xhr.status == 401) {
            //Tell the user that the password isn't correct
            geo_note.innerHTML = "Failed to post: " + check_xhr.response;
        }
        else {
            geo_note.innerHTML = "Posted!";
        }
    }
//Sound sets with no password may be freely edited by the public (and should probably be designated as such)
//Change password?
}

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

document.getElementById("post_btn").addEventListener("click", function() {
	post_set();
});

document.getElementById("cesiumContainer").ondrop = function(event) {
    var c2 = new Cesium.Cartesian2(event.clientX  - document.getElementById("cesiumContainer").offsetLeft, event.clientY  - document.getElementById("cesiumContainer").offsetTop),
        result = {};
    viewer.camera.pickEllipsoid(c2, viewer.scene.globe.ellipsoid, result);
    this.style.opacity = 1;
	event.stopPropagation();
	event.preventDefault();
	var dt = event.dataTransfer;
	if(dt.items) {
		var i = 0;
		for (i = 0; i <= dt.items.length - 1; i++) {
			if(dt.items[i] && dt.items[i].kind == "file") {
				var f = dt.items[i].getAsFile();
				if(f.type == "audio/mp3" || f.type == "audio/ogg" || f.type == "audio/wav" || f.type == "audio/flac") {
					var fr = new FileReader();
					fr.readAsArrayBuffer(f);
					fr.onload = function() {
                        var frq = new XMLHttpRequest();
                        frq.open("PUT", "", true);
                        check_xhr.setRequestHeader("Content-Type", f.type);
                        //Security?!?!
                        //Content-Type header
                        //reject 406 if content doesn't match header
                        frq.send(fr.response);
                        //new_sound(fr.result, result); //Uh no let's NOT store this thing as a data URL
                        //new_sound(fr.result, result); //Uh no let's NOT store this thing as a data URL
                        //PUT
                        //Maybe send it to node and have it send us back a mini-URL
						//audio is stored in fr.result but this may not be the best way to go about it
					}
				}
			}
			else {
				dt.items[0].getAsString(function(str) {
                    new_sound(str, result);
				});
			}
		}
		
	}
}

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

