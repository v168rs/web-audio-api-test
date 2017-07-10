"use strict";
//Use with mus.js
//Not compatible with geo.js
//Idea: Visual system for hooking nodes together?
//https://padenot.github.io/web-audio-perf/

//samples
var impulse_file = "snd/impulse.wav";

function map(val, min1, max1, min2, max2) {
    return (val - min1) / (max1 - min1) * (max2 - min2) + min2;
} //from p5.js

//TODO: Output in MIDI?

//App's audio system using WebAudioAPI
var context,
    buses = [],
    gains = [], //master gains for buses, post-fx
    mods = [],
    base_synth; //References to the base synth just for demo purposes.
/*[
    Bus [[osc sampler osc sampler], [effect dry wet], [effect dry wet], send]
    Gains SHOULD share the same index as buses
    Mods [ [[modulator ratio array index][modulator ratio array index][modulator ratio array index]] ]
]
*/
var bus_count = 0;
var editor = false;

//Feed in doMarkovSequence from mus.js for sequence
function playMarkovSequence(melody_bus = 0, melody_osc_num = 0, chord_bus = 1, sequence, note_length = 0.2, chord_length = 1.6) {
    playNoteSequence(melody_bus, melody_osc_num, sequence[0]);
    playProgression(chord_bus, sequence[1], chord_length);
}

function update_display() {
    var bus_str = "";
    buses.forEach(function(bus, index) {
        bus_str += "<h3>" + index + " contains:</h3> <br>"
        bus.forEach(function (obj, obj_ind) {
                    if(obj.constructor === Array) {
                        obj.forEach(function(item, item_ind) {
                            bus_str += item + " " + item_ind + "<br>"
                            if(item["positionX"]) {
                            bus_str += "x: " + item["positionX"]["value"] + "<br>";
                            bus_str += "y: " + item["positionY"]["value"] + "<br>";
                        }
                        });
                        bus_str += "<br>"
                    }
                    else {
                        bus_str += obj + " " + obj_ind + "<br>"
                    }
                    });
        bus_str += "<h4>and is modulated by:</h3> <br>"
        mods[index].forEach(function(mod){
            mod.forEach(function(item, item_ind) {
                if(isNaN(item)) {
                    bus_str += item + " " + item_ind + "<br>"
                }
                else if (item_ind === 2) {
                    bus_str += "Ratio:" + item + "<br>"
                }
                else if (item_ind === 3) {
                    bus_str += "Modulating:" + buses[index][mod[3]][mod[4]] + " (path) " + "buses [" + index + "][" + mod[3] + "][" + mod[4] + "]" + "<br>"
                }
            });
            bus_str += "<br>"
        });
    });
    document.getElementById("bus_display").innerHTML = bus_str;
}

function waa_init() {
    context = new AudioContext();
    var i;
    for (i = 0; i < bus_count; i++) {
        create_new_bus(context.destination);
    }
    if(editor) {
        setInterval(update_display, 100);
    }
}

//Takes a path/URL to the sample and a function that receives the arraybuffer data as a parameter.
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

function create_new_bus(dest, osc_put = true) {
    var bus_array_to_push = [];
    var osc_bank = [];
    var mod_bank = [];
    if(osc_put) {var osc = context.createOscillator();}
    var gain = context.createGain();
    if (dest) {
        if(osc_put) {osc_bank.push(osc);
        osc.connect(gain);}
        gain.connect(dest);
        gain.gain.setValueAtTime(0.05, context.currentTime); //To save my ears
    }
    bus_array_to_push.push(osc_bank);
    bus_array_to_push.push(dest);
    buses.push(bus_array_to_push);
    gains.push(gain);
    mods.push(mod_bank);
    return buses.indexOf(bus_array_to_push);
}

function start_bus(bus_num) {
    if(buses[bus_num]) {buses[bus_num][0].forEach(function(osc) {osc.start();});}
} 

function add_osc(bus_num) {
    var osc = context.createOscillator();
    osc.frequency.setValueAtTime(220, context.currentTime);
    osc.connect(gains[bus_num]);
    buses[bus_num][0].push(osc);
}

//Bus [[source_bank], [effect dry wet], [effect dry wet], send]

function add_panner(bus_num, x_pan = 0, loc = 1) {
    var fx = context.createPanner();
    var fx_array = [];
    var fx_dry_gain = context.createGain();
    var fx_wet_gain = context.createGain();
    fx.positionX.value = x_pan;
    
    fx_array.push(fx);
    fx_array.push(fx_dry_gain);
    fx_array.push(fx_wet_gain);
    
    buses[bus_num].splice(loc, 0, fx_array);
    update_bus(bus_num);
    return fx;
}

function add_convolution(bus_num, impulse = "snd/impulse.wav", loc = 1) {
    var fx = context.createConvolver();
    var fx_array = [];
    var fx_dry_gain = context.createGain();
    var fx_wet_gain = context.createGain();
    var soundSource;
    soundSource = context.createBufferSource();
    
    load_sample(impulse, function(b) {
            fx.buffer = b;
            soundSource.buffer = b;
            soundSource.loop = true;
            });
    
    fx_array.push(fx);
    fx_array.push(fx_dry_gain);
    fx_array.push(fx_wet_gain);
    
    buses[bus_num].splice(loc, 0, fx_array);
    update_bus(bus_num);
    return fx;
}
//Very expensive. TODO: Find a way to pipe all the anthem buses into a convolver instead?

//sample from rmutt at freesound.org
function add_sampler(bus_num, sample="snd/ocean_waves.wav", loc = 1) {
    var sampler = context.createBufferSource();
    load_sample(sample, function(b) {
        sampler.buffer = b;
        sampler.loop = true;
    });
    buses[bus_num][0].push(sampler);
    update_bus(bus_num);
}

function add_filter(bus_num, type = "lowpass", frequency = "3000", Q="20", loc = 1) {
    var fx = context.createBiquadFilter();
    var fx_array = [];
    var fx_dry_gain = context.createGain();
    var fx_wet_gain = context.createGain();
    
    fx.frequency.value = frequency
    fx.Q.value = Q
    fx.type = type
    
    fx_array.push(fx);
    fx_array.push(fx_dry_gain);
    fx_array.push(fx_wet_gain);
    
    buses[bus_num].splice(loc, 0, fx_array);
    update_bus(bus_num);
    return fx;
}

function add_ADSR_env(bus_num, attack, decay, sustain, release, loc = 1) {
    var fx = context.createGain();
    var fx_array = [];
    var fx_dry_gain = context.createGain();
    var fx_wet_gain = context.createGain();
    var ADSR_array = [attack, decay, sustain, release];
    
    fx_array.push(fx);
    fx_array.push(fx_dry_gain);
    fx_array.push(fx_wait_gain);
    fx_array.push(ADSR_array);
    
    buses[bus_num].splice(loc, 0, fx_array);
    update_bus(bus_num);
    return fx;
}//3 gains just to keep with the effect architecture. Pretty low-cost. Then an array containing the ADSR info.

//TODO: waveshaper distortion?

function change_osc(bus_num, osc_num, type) {
    buses[bus_num][0][osc_num].type = type;
    return type;
}

//FM modulator, unsynced
//Track oscillators by index
//Give parameter as string
function add_osc_modulator(bus_num, array_index, target_index, parameter, base_freq, ratio, amp) {
    var om = context.createOscillator();
    var gm = context.createGain();
    var fm_ar = [];
    gm.gain.value = amp;
    om.start();
    om.frequency.value = ratio*base_freq;
    om.connect(gm);
    gm.connect(buses[bus_num][array_index][target_index][parameter]);

    if (mods[bus_num] === null) //This shouldn't happen if you're modulating something on an existing bus!
    {
        mods[bus_num] = [];
    }
    fm_ar.push(om);
    fm_ar.push(gm);
    fm_ar.push(ratio);
    fm_ar.push(array_index);
    fm_ar.push(target_index);
    mods[bus_num].push(fm_ar);
    return om;
}

function set_bus_gain(bus_num, value) {
    gains[bus_num].gain.linearRampToValueAtTime(value, context.currentTime + 0.01);
}

function mute_bus(bus_num) {
    set_bus_gain(bus_num, 0)
}

function update_bus(bus_num) {
    //console.log("updating bus");
    var i = 0;
    var osc_bank;
    gains[bus_num].disconnect();
    //console.log("disconnecting master gain for bus" + bus_num);
    for (i = 0; i < buses[bus_num].length - 1; i++) {
        //console.log("index " + i);
        if (i === 0) {
            //console.log("checking oscillators/samplers");
            //Synth/sample bank
            var k;
            for (k = 0; k < buses[bus_num][i].length; k++) {
                //console.log("oscillator" + k);
                buses[bus_num][i][k].disconnect();
                //console.log("disconnecting oscillator/sampler" + k + " in index" + i);
                if (buses[bus_num].length > 1) {
                    //console.log("connecting oscillator/sampler" + k + " in index" + i + " to " + buses[bus_num][i+1][0]);
                    
                    //Handle the case where it's just the destination
                    if(buses[bus_num][i+1] === context.destination) {
                        buses[bus_num][i][k].connect(gains[bus_num]);
                        //console.log("connecting " + buses[bus_num][i] + " to master gain");
                        gains[bus_num].connect(context.destination);
                        //console.log("reconnecting master gain for bus " + bus_num + " to destination");
                    } 
                    //If the next item is an effect array
                    else {
                        //console.log("connecting " + buses[bus_num][i][k] + " to effect");
                        buses[bus_num][i][k].connect(buses[bus_num][i+1][0]); //connect it to the effect
                        //console.log("connecting " + buses[bus_num][i][k] + " to dry gain" + buses[bus_num][i+1][2]);
                        buses[bus_num][i][k].connect(buses[bus_num][i+1][1]); //connect it to the dry gain
                        //console.log("connecting " + buses[bus_num][i+1][0] + " to wet gain" + buses[bus_num][i+1][1]);
                        buses[bus_num][i+1][0].connect(buses[bus_num][i+1][2]); //connect the effect to the wet gain
                    }
                    
                }
            }
        }
        else {
            //From effects to effects [[source_bank], [effect dry wet], [effect dry wet], send]
            //Send dry and wet from previous effects to next effect
            //console.log("Second case");
            //Again handle the case where it's just the destination. We know this is an effect array because there was a check while we were looking over the synths
            if (buses[bus_num][i+1] === context.destination) {
                //wat
                //console.log("connecting " + buses[bus_num][i][0] + " to master gain");
                //console.log("connecting dry" + buses[bus_num][i][1] + " to master gain");
                buses[bus_num][i][1].connect(gains[bus_num]);
                //console.log("connecting wet" + buses[bus_num][i][2] + " to master gain");
                buses[bus_num][i][2].connect(gains[bus_num]);
                gains[bus_num].connect(context.destination);
                //console.log("reconnecting master gain for bus " + bus_num + " to destination");
            }
            else {
                //console.log("connecting " + buses[bus_num][i] + " to " + buses[bus_num][i+1]);
                buses[bus_num][i][1].connect(buses[bus_num][i+1][0]);
                buses[bus_num][i][2].connect(buses[bus_num][i+1][0]);
            }
        }
    }
}

//% wet.
function dry_wet(bus_num, fx_num, cent) {
    console.log(cent);
    buses[bus_num][fx_num][1].gain.setValueAtTime(1-(cent/100),context.currentTime); //dry
    buses[bus_num][fx_num][2].gain.setValueAtTime(cent/100,context.currentTime); //wet
}

//<--Functions for use with mus.js to play notes using the given synthesizers.-->

//[[midi pitch, note length], [midi pitch, note length]]. Purely monophonic.
function playNoteSequence(bus_num, osc_num, sequence) {
    var total_length = 0;
    sequence.forEach(function(note, index)
        {
            playMidiNote(bus_num, osc_num, note[0], note[1] + total_length, true);
            total_length += note[1];
        });
    console.log("Playing a sequence " + total_length + "seconds long.");
}

//Current problem: Not very realtime! May need to make use of SetTimeout() or SetInterval().

function sequenceEnded(){
    console.log("Sequence ended!");
}

//MIDI functionality for plugins later?

//takes midi numbers and delay time from NOW
//ADSR?
function playMidiNote(bus_num, osc_num, note, time, sync) {
    buses[bus_num][0][osc_num].frequency.setValueAtTime(midiToFreq(note), context.currentTime+time);
    //Looks for frequency modulators and adjusts them if sync is on.
    if ((sync === true) && (mods[bus_num] != null)) {
        mods[bus_num].forEach(function(fm_ar) {
            if((fm_ar[3] === 0) && (fm_ar[4] === osc_num)) {
                fm_ar[0].frequency.setValueAtTime(midiToFreq(note)*fm_ar[2], context.currentTime+time);
            }
        });
    }
} 

function playProgression(bus_num, sequence, note_length) {
    var total_length = 0;
    sequence.forEach(function(chord, index)
        {
            playChord(bus_num, chord, note_length*index, true);
            total_length += note_length;
        });
    console.log("Playing a progression " + total_length + "seconds long.")
}

//takes a chord array and tries to play it on all available oscs on a bus (obviously you won't get any polyphony if you're only using one synth)
//Also you can play regular notes and dyads if you really want
//Now works with multiple frequency modulators!
function playChord(bus_num, chord, time, sync = true) {
    chord.forEach(function(note, index) {
        if(index < buses[bus_num][0].length) {
            playMidiNote(bus_num, index, note, time, sync);
        }
        else {
            console.log("Ran out of oscillators");
        }
    });
}

//Data-related stuff
function soundMorph(input, param, time) {
    if(input === 0) {
        //If you make things go to 0 apparently they create ear-destroying noises
    }
    else{
        param.linearRampToValueAtTime(input+0.001, context.currentTime+time);
    }
}