//Use with mus.js and index-web-audio.js
//Pre-programmed synth presets begin here
//Eventually there should be a way to save and load these as a JSON or something
function create_temperature_synth(){
    var bus_num = create_new_bus(context.destination);
    var convolver = add_convolution(bus_num);
    dry_wet(bus_num, 1, 5);
    var filter = add_filter(bus_num, "lowpass", 3000, 30);
    var mod1 = add_osc_modulator(bus_num, 0, 0, "frequency", 440, 5, 25)
    var mod2 = add_osc_modulator(bus_num, 0, 0, "frequency", 440, 3, 50)
    //add_osc_modulator(bus_num, 2, 0, "frequency", 1, 0.1, 75)
    set_bus_gain(bus_num, 0.1);
    return [buses[bus_num][0][0], convolver, filter, mod1, mod2]
}
function create_polyphonic_synth(){
    var bus_num = create_new_bus(context.destination);
    add_osc(bus_num);
    add_osc(bus_num);
    //add_convolution(bus_num);
    add_osc_modulator(bus_num, 0, 0, "frequency", 440, 5, 80)
    add_osc_modulator(bus_num, 0, 1, "frequency", 440, 5, 80)
    add_osc_modulator(bus_num, 0, 2, "frequency", 440, 5, 80)
    set_bus_gain(bus_num, 0.02);
    return bus_num
}
function create_ocean_waves() {
    var bus_num = create_new_bus(context.destination, false);
    add_sampler(bus_num);
    add_panner(bus_num);
    return bus_num;
}

function synths_init() {
    base_synth = create_temperature_synth();
    create_polyphonic_synth();
    //create_ocean_waves();
}

/* very obsolete

//sample, lat, long
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
var geo_buses = []

function create_samples_with_loc(){
    geo_audio.forEach(function(arr){
        var x = (arr[2] + 180) * 10;
        var y = (90 - arr[1]) * 10;
       
        var bus_num = create_new_bus(context.destination, false);
        add_sampler(bus_num, arr[0]);
        
        var pan = add_panner(bus_num);
        pan.distanceMode = "exponential";
        pan.refDistance = 10;
        pan.setPosition(x, y, 9);
        arr[3] = x;
        arr[4] = y;
        
        geo_buses.push(bus_num);
        set_bus_gain(bus_num, 0.5);
        dry_wet(bus_num, 1, 100);
    });
}
*/

waa_init();
synths_init();

/*
function update_geo_samples(listener_x, listener_y) {
    var i;
    for(i = 0; i < geo_buses.length; i++) {
        buses[geo_buses[i]][1][0].positionX.value = (geo_audio[i][3] - listener_x);
        buses[geo_buses[i]][1][0].positionY.value = (listener_y - geo_audio[i][4]);
        //Hard-coded panner index
    }
}
*/

function swapImages(new_img_src, new_data_img_src) {
    var display_canvas_context = document.getElementById("display_canvas").getContext("2d"),
        data_canvas_context = document.getElementById("data_canvas").getContext("2d"),
        new_img = new Image(),
        new_data_img = new Image();
    new_img.src = new_img_src;
    new_data_img.src = new_data_img_src;
    display_canvas_context.clearRect(0, 0, display_canvas.width, display_canvas.height);
    data_canvas_context.clearRect(0, 0, data_canvas.width, data_canvas.height);
    display_canvas_context.drawImage(new_img, 0, 0);
    data_canvas_context.drawImage(new_data_img, 0, 0);
}

//BUTTONS

document.getElementById("unmute_btn").disabled = true;
document.getElementById("start_btn").onclick = function() {
    /*var b;
    for (b = 0; b < buses.length; b++) {
        start_bus(b);
        }
    */
    start_bus(0);
    start_bus(1);
    document.getElementById("start_btn").disabled = true;}
/*
document.getElementById("start_a_btn").onclick = function() {
    var b;
    for (b = 2; b < buses.length; b++) {
        start_bus(b);
        }
    document.getElementById("start_a_btn").disabled = true;}
*/
document.getElementById("mute_btn").onclick = function() {
    mute_bus(0);
    mute_bus(1);
    document.getElementById("unmute_btn").disabled = false;
    document.getElementById("mute_btn").disabled = true;
}
/*
document.getElementById("mute_a_btn").onclick = function() {
    var b;
    for (b = 2; b < buses.length; b++) {
        mute_bus(b);
        }
    document.getElementById("unmute_a_btn").disabled = false;
    document.getElementById("mute_a_btn").disabled = true;
                                                        }
document.getElementById("unmute_a_btn").onclick = function() {
    var b;
    for (b = 2; b < buses.length; b++) {
        set_bus_gain(b, 0.5);
        }
    document.getElementById("unmute_a_btn").disabled = true;
    document.getElementById("mute_a_btn").disabled = false;
                                                         }*/
document.getElementById("unmute_btn").onclick = function() {
    set_bus_gain(0, 0.03);
    set_bus_gain(1, 0.02);
    document.getElementById("unmute_btn").disabled = true;
    document.getElementById("mute_btn").disabled = false;}
/*
document.getElementById("convolve_btn").onclick = function() {
    add_convolution(0);
    document.getElementById("convolve_btn").disabled = true;}
*/

document.getElementById("sin_btn").onclick = function() {
    change_osc(0, 0, 'sine');}
document.getElementById("sqr_btn").onclick = function() {
    change_osc(0, 0, 'square');}
document.getElementById("saw_btn").onclick = function() {
    change_osc(0, 0, 'sawtooth');}
document.getElementById("tri_btn").onclick = function() {
    change_osc(0, 0, 'triangle');}

var cur_img = "dec_01";

//CANVAS
function screen_init() {
    var display_canvas = document.getElementById("display_canvas"),
        display_canvas_context = display_canvas.getContext("2d"),
        data_canvas = document.getElementById("data_canvas"),
        data_canvas_context = data_canvas.getContext("2d"),
        img = new Image(),
        data_img = new Image(),
        body = document.getElementById("body");
    img.src = "dec_01.png"
    data_img.src = "dec_01_gs.png"
    display_canvas_context.drawImage(img, 0, 0);
    data_canvas_context.drawImage(data_img, 0, 0);
}
    
body.onmousemove = function(e) {
    var data_canvas = document.getElementById("data_canvas"),
        data_canvas_context = data_canvas.getContext("2d"),
        cursorX = e.pageX - data_canvas.offsetLeft,
        cursorY = e.pageY - data_canvas.offsetTop,
        color = data_canvas_context.getImageData(cursorX, cursorY, 1, 1).data,
        color_V = Math.max(color[0]/255, color[1]/255, color[2]/255);
    /*How the temperature data is being mapped right now:
        -Grayscale: Black is -25, 99 is 45
        -Default to 0 if value is 1
        */
    
    //console.log("Approximate surface temperature (°C): " + ((color_V == 1) ? "No data" : Math.round(map(color_V, 0, 1, -25, 45))));
        
    soundMorph((color_V === 1) ? 0 : map(color_V, 0, 1, 400, 8000), base_synth[2].frequency, 0.1);
    //The more you sanitize this the less useful/accurate it becomes

    dissonance = (color_V === 1) ? dissonance : Math.round(map(color_V, 0, 1, 0, 2));
    //update_geo_samples(cursorX, cursorY);
    //console.log(cursorX, cursorY);
    //context.listener.setPosition(cursorX, cursorY, 295);
    /*
    soundMorph(map(cursorX, 0, 3600, -1, 1), buses[2][1][0].positionX, 0.1);
    soundMorph(map(cursorY, 0, 1800, -1, 1), buses[2][1][0].positionY, 0.1);
    */
    }

//doMarkovSequence(root, scale, octaves, phrase_length, clean, tone_anchor, starting_chord, num_phrases, duration)
body.onkeydown = function(e) {
    if(e["key"] == "`") {
        
    playMarkovSequence(0, 0, 1, doMarkovSequence(parseFloat(document.getElementById("gen_root").value), document.getElementById("scale_selector").value, 2, document.getElementById("gen_n_phr").value, true, 2, document.getElementById("start_selector").value, document.getElementById("gen_phr").value, document.getElementById("gen_dur").value));
    console.log(dissonance);
    }
}

//1022 514
//https://drive.google.com/open?id=0B6_a4sq0zv4FSlBuc2JRN0Uzc28
//Does NOT go in the img folder; goes in the root folder
document.getElementById("data_pic_btn").onclick = function() {
    if(cur_img === "dec_01") {
        swapImages("jul_01.png", "jul_01_gs.png");
        cur_img = "jul_01";
    }
    else {
        swapImages("dec_01.png", "dec_01_gs.png");
        cur_img = "dec_01";
    }
    }