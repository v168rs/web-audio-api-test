(function () {"use strict";
//Special system specifically for geotagged samples
//Requires Cesium.js
//National anthems (soundfile, lat, long, flagicon) maybe volume too (do something cool like volume proportional to GDP)

//TODO: Use JSON instead of this giant array to store URLs, lat/lons, etc

			  
//Massive list of audio samples that should probably be moved somewhere else
var geo_audio_samples = [[
        ["snd/usa.mp3", 38.8977, -77.0365, "img/us.png"],     //http://www.music.army.mil/music/nationalanthem/
        ["snd/canada.mp3", 45.421530, -75.697193, "img/ca.png"],
        ["snd/china.mp3", 39.904200, 116.407396, "img/cn.png"],
        ["snd/japan.mp3", 35.689487, 139.691706, "img/jp.png"],
        ["snd/cuba.mp3", 23.113592, -82.366596, "img/cu.png"],
        ["snd/mexico.mp3", 19.432608, -99.133208, "img/mx.png"],
        ["snd/italy.mp3", 41.902783, 12.496366, "img/it.png"],
        ["snd/russia.mp3", 55.755826, 37.617300, "img/ru.png"],
        ["snd/uk.mp3", 51.507351, -0.127758, "img/gb.png"],
        ["snd/australia.mp3", -35.280937, 149.130009, "img/au.png"],
        ["snd/spain.mp3", 40.416775, -3.703790, "img/es.png"],
        ["snd/germany.mp3", 52.520007, 13.404954, "img/de.png"],
        ["snd/france.mp3", 48.856614, 2.352222, "img/fr.png"],
        ["snd/india.mp3", 28.613939, 77.209021, "img/in.png"],
        ["snd/philippines.mp3", 14.599512, 120.984219, "img/ph.png"],
        ["snd/portugal.mp3", 38.722252, -9.139337, "img/pt.png"],
        ["snd/afghanistan.mp3", 34.5553, 69.2075, "img/af.png"],
        ["snd/austria.mp3", 48.2082, 16.3738, "img/at.png"],
        ["snd/brazil.mp3", -15.7942, -47.8825, "img/br.png"],
        ["snd/chile.mp3", -33.4489, -70.6693, "img/cl.png"],
        ["snd/czech_republic.mp3", 50.0755, 14.4378, "img/cz.png"],
        ["snd/south_korea.mp3", 37.5665, 126.9780, "img/kr.png"],
        ["snd/vietnam.mp3", 21.0278, 105.8342, "img/vn.png"],
        ["snd/iran.mp3", 35.6892, 51.3890, "img/ir.png"],
        ["snd/israel.mp3", 31.7683, 35.2137, "img/il.png"],
        ["snd/algeria.mp3", 36.753889, 3.058889, "img/dz.png"],
        ["snd/tanzania.mp3", -6.1630, 35.7516, "img/tz.png"],
        ["snd/rwanda.mp3", -1.9706, 30.1044, "img/rw.png"],
        ["snd/nigeria.mp3", 9.0765, 7.3986, "img/ng.png"],
        ["snd/morocco.mp3", 34.03, -6.83, "img/ma.png"],
        ["snd/botswana.mp3", -24.6282, 25.9231, "img/bw.png"],
        ["snd/albania.mp3", 41.316667, 19.816667, "img/al.png"],
        ["snd/angola.mp3", 42.5, 1.517, "img/ao.png"],
        ["snd/antigua_and_barbuda.mp3", 17.117, -61.85, "img/ag.png"],
        ["snd/armenia.mp3", 40.17, 44.5, "img/am.png"],
        ["snd/aruba.mp3", 12.517, -70.03, "img/aw.png"],
        ["snd/azerbaijan.mp3", 40.383, 49.87, "img/az.png"],
        ["snd/bahamas.mp3", 25.083, -77.35, "img/bs.png"],
        ["snd/bahrain.mp3", 26.23, 50.57, "img/bh.png"],
        ["snd/bangladesh.mp3", 23.717, 90.4, "img/bd.png"],
        ["snd/barbados.mp3", 13.1, -59.617, "img/bb.png"],
        ["snd/belarus.mp3", 53.9, 27.57, "img/by.png"],
        ["snd/belgium.mp3", 50.83, 4.3, "img/be.png"],
        ["snd/belize.mp3", 17.25, -88.77, "img/bz.png"],
        ["snd/benin.mp3", -34.6037, -58.3816, "img/bj.png"],
        ["snd/bolivia.mp3", -16.5, -68.15, "img/bo.png"],
        ["snd/bosnia_and_herzegovina.mp3", 43.87, 18.417, "img/ba.png"],
        ["snd/brunei.mp3", 4.883, 114.93, "img/bn.png"],
        ["snd/burkina-faso.mp3", 12.37, -1.517, "img/bf.png"],
        ["snd/bulgaria.mp3", 42.683, 23.317, "img/bg.png"],
        ["snd/cambodia.mp3", 11.55, 104.917, "img/kh.png"],
        ["snd/cameroon.mp3", 3.87, 11.517, "img/cm.png"],
        ["snd/cape_verde.mp3", 14.917, -23.517, "img/cv.png"],
        ["snd/central_african_republic.mp3", 4.37, 18.583, "img/cf.png"],
        ["snd/colombia.mp3", 4.6, -74.083, "img/co.png"],
        ["snd/comoros.mp3", -11.7, 43.23, "img/km.png"],
        ["snd/congo.mp3", -4.317, 15.3, "img/cd.png"],
        ["snd/cook_islands.mp3", -21.2, -159.77, "img/km.png"],
        ["snd/cote_d'ivoire.mp3", 6.817, -5.27, "img/ci.png"],
        ["snd/costa_rica.mp3", -9.93, -84.083, "img/cr.png"],
        ["snd/croatia.mp3", 45.8, 16, "img/hr.png"],
        ["snd/djibouti.mp3", 11.583, 43.15, "img/dj.png"],
        ["snd/dominican_republic.mp3", 18.47, -69.9, "img/do.png"],
        ["snd/denmark.mp3", 55.7, 12.583, "img/dk.png"],
        ["snd/east_timor.mp3", -8.583, 125.6, "img/tl.png"],
        ["snd/ecuador.mp3", -0.217, -78.5, "img/ec.png"],
        ["snd/egypt.mp3", 30.05, 31.25, "img/eg.png"],
        ["snd/el_salvador.mp3", -34.6037, -58.3816, "img/ar.png"],
        ["snd/eritrea.mp3", 15.3, 38.93, "img/er.png"],
        ["snd/estonia.mp3", 59.43, 24.717, "img/ee.png"],
        ["snd/ethiopia.mp3", 9.03, 38.7, "img/et.png"],
        ["snd/fiji.mp3", -18.13, 178.417, "img/fj.png"],
        ["snd/finland.mp3", 60.17, 24.93, "img/fi.png"],
        ["snd/gabon.mp3", 0.38, 9.45, "img/ga.png"],
        ["snd/gambia.mp3", 13.45, -16.57, "img/gm.png"],
        ["snd/georgia.mp3", 41.683, 44.83, "img/ge.png"],
        ["snd/ghana.mp3", 5.55, -0.217, "img/gh.png"],
        ["snd/guatemala.mp3", 14.617, -90.517, "img/gt.png"],
        ["snd/guinea.mp3", 9.5, -13.7, "img/gn.png"],
        ["snd/guinea-bissau.mp3", 11.85, -15.583, "img/gw.png"],
        ["snd/guyana.mp3", -6.8, -58.15, "img/gy.png"],
        ["snd/haiti.mp3", 18.53, -72.3, "img/ht.png"],
        ["snd/honduras.mp3", 14.1, -87.217, "img/hn.png"],
        ["snd/hungary.mp3", 47.5, 19.083, "img/hu.png"],
        ["snd/iceland.mp3", 64.15, -21.95, "img/is.png"],
        ["snd/indonesia.mp3", -6.17, 106.817, "img/id.png"],
        ["snd/iraq.mp3", -33.3, 44.4, "img/iq.png"],
        ["snd/ireland.mp3", 53.317, -6.23, "img/ie.png"],
        ["snd/jamaica.mp3", 18, -76.8, "img/jm.png"],
        ["snd/jordan.mp3", 31.95, 35.93, "img/jo.png"],
        ["snd/kazakhstan.mp3", 51.17, 71.417, "img/kz.png"],
        ["snd/kenya.mp3", -1.283, 36.817, "img/ke.png"],
        ["snd/kosovo.mp3", 42.7, 21.17, "img/ko.png"],
        ["snd/kuwait.mp3", 29.37, 47.97, "img/kw.png"],
        ["snd/kyrgyzstan.mp3", 42.87, 74.6, "img/ar.png"],
        ["snd/laos.mp3", 17.97, 102.6, "img/la.png"],
        ["snd/latvia.mp3", 56.95, 24.1, "img/lv.png"],
        ["snd/lebanon.mp3", 33.87, 35.5, "img/lb.png"],
        ["snd/liberia.mp3", 6.3, -10.8, "img/lr.png"],
        ["snd/liechtenstein.mp3", 47.13, 9.517, "img/li.png"],
        ["snd/lithuania.mp3", 54.683, 25.317, "img/lt.png"],
        ["snd/luxembourg.mp3", 49.6, 6.117, "img/lu.png"],
        ["snd/libya.mp3", 32.883, 13.17, "img/ly.png"],
        ["snd/macedonia.mp3", 42, 21.43, "img/mk.png"],
        ["snd/madagascar.mp3", -18.917, 47.517, "img/mg.png"],
        ["snd/malawi.mp3", -13.97, 33.783, "img/mw.png"],
        ["snd/maldives.mp3", 4.17, 73.5, "img/mv.png"],
        ["snd/malta.mp3", 35.883, 14.5, "img/mt.png"],
        ["snd/marshall_islands.mp3", 7.1, 171.383, "img/mh.png"],
        ["snd/mauritania.mp3", 18.1, -15.95, "img/mr.png"],
        ["snd/mauritius.mp3", -20.15, 57.483, "img/mu.png"],
        ["snd/micronesia.mp3", 6.917, 158.15, "img/fm.png"],
        ["snd/moldova.mp3", 47, 28.85, "img/md.png"],
        ["snd/monaco.mp3", 43.73, 7.417, "img/mc.png"],
        ["snd/montenegro.mp3", 42.43, 19.27, "img/me.png"],
        ["snd/mozambique.mp3", -25.95, 32.583, "img/mz.png"],
        ["snd/myanmar.mp3", 16.8, 96.15, "img/mm.png"],
        ["snd/namibia.mp3", -22.57, 17.083, "img/na.png"],
        ["snd/nepal.mp3", 27.717, 85.317, "img/np.png"],
        ["snd/netherlands.mp3", 52.35, 4.917, "img/nl.png"],
        ["snd/malaysia.mp3", 3.17, 101.7, "img/my.png"],
        ["snd/new_zealand.mp3", -41.3, 174.783, "img/nz.png"],
        ["snd/nicaragua.mp3", 12.13, -86.25, "img/ni.png"],
        ["snd/norway.mp3", 59.917, 10.75, "img/no.png"],
        ["snd/oman.mp3", 23.617, 58.583, "img/om.png"],
        ["snd/pakistan.mp3", 33.683, 73.05, "img/pk.png"],
        ["snd/panama.mp3", 8.97, -79.53, "img/pa.png"],
        ["snd/papua_new_guinea.mp3", -9.45, 147.183, "img/pg.png"],
        ["snd/peru.mp3", -12.05, -77.05, "img/pe.png"],
        ["snd/philippines.mp3", 14.6, 120.97, "img/ph.png"],
        ["snd/poland.mp3", 52.25, 21, "img/pl.png"],
        ["snd/qatar.mp3", 25.283, 51.53, "img/qa.png"],
        ["snd/romania.mp3", 44.43, 26.1, "img/ro.png"],
        ["snd/sao_tome_and_principe.mp3", 0.3, 6.73, "img/st.png"],
        ["snd/saudi_arabia.mp3", 24.65, 46.7, "img/sa.png"],
        ["snd/senegal.mp3", -14.73, -17.63, "img/sn.png"],
        ["snd/serbia.mp3", 44.83, 20.5, "img/rs.png"],
        ["snd/seychelles.mp3", -4.617, -55.45, "img/sc.png"],
        ["snd/sierra_leone.mp3", 8.483, -13.23, "img/sl.png"],
        ["snd/singapore.mp3", 1.283, 103.85, "img/sg.png"],
        ["snd/slovak_republic.mp3", 48.15, 17.117, "img/sk.png"],
        ["snd/slovenia.mp3", 46.05, 14.5117, "img/si.png"],
        ["snd/south_sudan.mp3", 4.85, 31.617, "img/ss.png"],
        ["snd/south_africa.mp3", -25.7, 28.217, "img/za.png"],
        ["snd/sri_lanka.mp3", 6.917, 79.83, "img/lk.png"],
        ["snd/st_kitts_and_nevis.mp3", 17.3, -62.717, "img/kn.png"],
        ["snd/sudan.mp3", 15.6, 32.53, "img/sd.png"],
        ["snd/swaziland.mp3", -26.317, 31.13, "img/sz.png"],
        ["snd/sweden.mp3", 59.3, 18.05, "img/se.png"],
        ["snd/syria.mp3", 33.5, 36.3, "img/sy.png"],
        ["snd/togo.mp3", 6.117, 1.217, "img/tg.png"],
        ["snd/trinidad_and_tobago.mp3", 10.65, -61.517, "img/tt.png"],
        ["snd/thailand.mp3", 13.75, 100.517, "img/th.png"],
        ["snd/tunisia.mp3", 36.8, 10.183, "img/tn.png"],
        ["snd/turkey.mp3", 39.93, 32.87, "img/tr.png"],
        ["snd/turkmenistan.mp3", 37.95, 58.383, "img/tm.png"],
        ["snd/ukraine.mp3", 50.43, 30.517, "img/ua.png"],
        ["snd/united_arab_emirates.mp3", 24.47, 54.37, "img/ae.png"],
        ["snd/uzbekistan.mp3", 41.317, 69.25, "img/uz.png"],
        ["snd/vanuatu.mp3", -17.73, 168.317, "img/vu.png"],
        ["snd/vatican.mp3", 41.9, 12.45, "img/va.png"],
        ["snd/venezuela.mp3", 10.483, -66.8667, "img/ve.png"],
        ["snd/virgin_islands.mp3", 18.35, -64.93, "img/vi.png"],
        ["snd/uruguay.mp3", -34.85, -56.17, "img/uy.png"],
        ["snd/yemen.mp3", 15.35, 44.2, "img/ye.png"]
    //US Navy Band
    //https://web-beta.archive.org/web/20030827154715/http://www.navyband.navy.mil:80/anthems/all_countries.htm
    //MP3s are kept at https://drive.google.com/open?id=0B6_a4sq0zv4FRnFhajFJNkdRREU
    ],[
        ["snd/env/jfny.ogg", 41.7909607694, -74.9167156219], //Outside a barn in Jefferson, NY
        ["snd/env/sfca1.ogg", 37.718873622, -122.473933697], //Traffic on 19th Avenue
        ["snd/env/sfca2.ogg", 37.7864449554, -122.408093512], //Traffic on Powell
        ["snd/env/sfca3.ogg", 37.784780933, -122.407699227], //Cable car
        ["snd/env/kbca.ogg", 39.2351617333, -120.023671389], //Kings Beach, Lake Tahoe (CA)
        ["snd/env/gvca.ogg", 38.9551372254, -120.602416992], //Pond in Grass Valley, Nevada County, CA
        ["snd/env/cdco.ogg", 39.5564712836, -107.298660278], //Roaring Fork River in Carbondale, CO
        ["snd/env/ny1.ogg", 40.7359741672, -73.9904308319] //Union Square, New York
    ]
    //Freesound.org
    //These ogg files are kept at https://drive.google.com/open?id=0B6_a4sq0zv4FVnFWc1dFMlhOTWM
];
//Flags are kept at https://drive.google.com/open?id=0B6_a4sq0zv4FT0N2TUNwb3ZqNnc

//Audio attributes that vary depending on sound set: reverb impulse, inner cone (no volume reduction), outer cone
var geo_audio_attributes = [["snd/imp/impulse.wav", 10, 140], ["snd/imp/impulse3.wav", 90, 180]];

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
        else if(geo_buses[index] && (geo_buses[index][0] instanceof MediaElementAudioSourceNode)) { //Look for nodes that are playing outside of range...
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
    ind_arr = ind_arr.slice(0, max_nodes-listening_nodes);
    
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
			  
geo_init();

//Cesium stuff
var viewer = new Cesium.Viewer('cesiumContainer', {"sceneModePicker" : false, "timeline" : false}); //Scenemodepicker makes the camera position weird in some modes so we got rid of it
var camera = viewer.camera;
camera.changed.addEventListener(function() {
    set_listener_loc(camera.position["x"], camera.position["y"], camera.position["z"], camera.direction["x"], camera.direction["y"], camera.direction["z"], camera.up["x"], camera.up["y"], camera.up["z"]);
    find_prox_nodes(1000000, cur_audio_selector, camera.positionCartographic["latitude"], camera.positionCartographic["longitude"]);
	//filter.frequency.linearRampToValueAtTime(map(cur_stat, 0, 1, 100, 6000), context.currentTime+1);
                                           });

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
function create_samples_with_loc(audio_selector = 0, cone_inner = 10, cone_outer = 140){
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

create_samples_with_loc(0);
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
    create_samples_with_loc(audio_selector, geo_audio_attributes[audio_selector][1], geo_audio_attributes[audio_selector][2]);
    if(geo_audio_attributes[audio_selector]) {
        change_impulse(geo_audio_attributes[audio_selector][0]);
    }
    else {
        change_impulse("snd/imp/impulse2.wav");
    }
}

			  /*
var slider = document.getElementById("data_pic_slider");
slider.oninput = function() {

	var v = parseInt(slider.value) + 1; //super hacky
	change_imagery_layer("img/data/lstd_0" + v + "_c.PNG");
	img_update("img/data/lstd_0" + v + "_gs.PNG");
	
}
*/
var selector = document.getElementById("selector")
selector.addEventListener("change", function() {
    change_sample_bank(selector.value);
});

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
					//geo_audio_samples[3].push(f)
				}
			}
			else {
				dt.items[i].getAsString(function(str) {
					console.log(str);
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
			  
			 }());

