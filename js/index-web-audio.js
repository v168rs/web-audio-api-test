"use strict";
//Use with mus.js
//Not compatible with geo.js
//Idea: Visual system for hooking nodes together?
//https://padenot.github.io/web-audio-perf/

//samples
var impulse_file = "snd/imp/impulse3.wav";

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
function playMarkovSequence(melody_bus = 0, melody_osc_num = 0, chord_bus = 1, sequence) {
    playNoteSequence(melody_bus, melody_osc_num, sequence[0]);
    playProgression(chord_bus, sequence[1]);
}

function update_display() {
    var bus_str = "";
    buses.forEach(function(bus, index) {
        bus_str += "<h3>" + index + " contains:</h3> <br>"
        bus.forEach(function (obj, obj_ind) {
                    if(obj.constructor === Array) {
                        obj.forEach(function(item, item_ind) {
                            bus_str += item + " " + item_ind + "<br>"
                            if(item["gain"]) {
                                bus_str += "gain:" + item["gain"]["value"] + "<br>";
                            }
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
        setInterval(update_display, 30);
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

function add_osc(bus_num, type = "sine") {
    var osc = context.createOscillator();
    osc.frequency.setValueAtTime(220, context.currentTime);
    osc.type = type;
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

function add_convolution(bus_num, impulse = "snd/imp/impulse.wav", loc = 1) {
    var fx = context.createConvolver();
    var fx_array = [];
    var fx_dry_gain = context.createGain();
    var fx_wet_gain = context.createGain();

    load_sample(impulse, function(b) {
            fx.buffer = b;
            });
    
    fx_array.push(fx);
    fx_array.push(fx_dry_gain);
    fx_array.push(fx_wet_gain);
    
    buses[bus_num].splice(loc, 0, fx_array);
    update_bus(bus_num);
    return fx;
}

//sample from rmutt at freesound.org
//HTML5
function add_sampler(bus_num, sample="snd/ocean_waves.wav") {
    var sampler = context.createMediaElementSource(new Audio(sample));
	sampler.mediaElement.loop=true;
	sampler.mediaElement.play();
    buses[bus_num][0].push(sampler);
    update_bus(bus_num);
	return sampler;
}

function add_queuer_sampler(bus_num, sample, temp=false, samples_to_spawn) {
	var sampler = add_sampler(bus_num, sample);
	sampler.mediaElement.addEventListener("seeked", function() {
		if(!temp && (param1 != null) && (samples_to_spawn instanceof Array)) {
			console.log("adding queuer sampler");
			var tsamp = add_queuer_sampler(bus_num, samples_to_spawn[param1], true);
			tsamp.mediaElement.loop = false;
		}
		else {
			sampler.mediaElement.pause();
			sampler.disconnect();
			console.log("deleting queuer sampler");
			sampler = null;
		}
	});
	return sampler;
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

//ADHSR in seconds/levels
function add_ADHSR_env(bus_num, attack = 0.2, decay = 0.4, hold = 2, sustain = 0.8, release = 0.5, loc = 1) {
    var fx = context.createGain();
    var fx_array = [];
    var fx_dry_gain = context.createGain();
    var fx_wet_gain = context.createGain();
    var ADHSR_array = [attack, decay, hold, sustain, release];
    
    fx_array.push(fx);
    fx_array.push(fx_dry_gain);
    fx_array.push(fx_wet_gain);
    fx_array.push(ADHSR_array);
    
    buses[bus_num].splice(loc, 0, fx_array);
    update_bus(bus_num);
    return fx;
}//3 gains just to keep with the effect architecture. Pretty low-cost. Then an array containing the ADHSR info.

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
            playMidiNote(bus_num, osc_num, note[0], total_length, true);
            total_length += note[1];
        });
    console.log("Playing a sequence " + total_length + "seconds long.");
}

//Current problem: Not very realtime! May need to make use of SetTimeout() or SetInterval().

function sequenceEnded(){
    console.log("Sequence ended!");
}

//MIDI functionality for plugins later?

//Looks for ADHSR and triggers it if it is found
function triggerADHSR(bus_num, time) {
    buses[bus_num].forEach(function(effect){
        if((effect[0] instanceof GainNode) && (effect[3]) instanceof Array) {
            var time_rel = context.currentTime + time;
			effect[0].gain.cancelScheduledValues(time_rel);
			effect[0].gain.setValueAtTime(effect[0].gain.value, time_rel);
            //Attack
            time_rel += effect[3][0]+0.001;
            effect[0].gain.linearRampToValueAtTime(1.0, time_rel);
            //Decay to sustain level
            time_rel += effect[3][1]
            effect[0].gain.linearRampToValueAtTime(effect[3][3], time_rel);
            //Hold then ramp to 0 at release time
            time_rel += effect[3][2];
			effect[0].gain.setValueAtTime(effect[3][3], time_rel);
            time_rel += effect[3][4];
            effect[0].gain.linearRampToValueAtTime(0.01, time_rel+0.01);
			effect[0].gain.cancelScheduledValues(time_rel+0.01);
        }
    });
}

//Samples?
//takes midi numbers and delay time from NOW
function playMidiNote(bus_num, osc_num, note, time, sync, ch=false) {
    buses[bus_num][0][osc_num].frequency.setValueAtTime(midiToFreq(note), context.currentTime+time);
	if(ch == false) {
		buses[bus_num][0].forEach(function(osc){
			osc.frequency.setValueAtTime(midiToFreq(note), context.currentTime+time);
		});
	}
    //ADHSR envelopes
    triggerADHSR(bus_num, time);
    //Looks for frequency modulators and adjusts them if sync is on.
    if ((sync === true) && (mods[bus_num] != null)) {
        mods[bus_num].forEach(function(fm_ar) {
            if((fm_ar[3] === 0) && (fm_ar[4] === osc_num)) {
                fm_ar[0].frequency.setValueAtTime(midiToFreq(note)*fm_ar[2], context.currentTime+time);
            }
        });
    }
} 

function playProgression(bus_num, sequence) {
    var total_length = 0;
    sequence.forEach(function(chord_arr, index)
        {
            playChord(bus_num, chord_arr[0], total_length, true);
            total_length += chord_arr[1];
        });
    console.log("Playing a progression " + total_length + "seconds long.")
}

//takes a chord array and tries to play it on all available oscs on a bus (obviously you won't get any polyphony if you're only using one synth)
//Also you can play regular notes and dyads if you really want
//Now works with multiple frequency modulators!
function playChord(bus_num, chord, time, sync = true) {
	buses[bus_num][0].forEach(function(osc, index){
		playMidiNote(bus_num, index, chord[Math.floor((chord.length - 1)/(buses[bus_num][0].length - 1)*index)], time, sync, (chord.length > 1) ? true : false);
	});

	//What if there are more oscs than we need?
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