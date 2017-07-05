"use strict";
//This is mostly for demo and testing
//Idea: Visual system for hooking nodes together?

//https://padenot.github.io/web-audio-perf/

//parameters that will later be manipulated by the data
var dissonance = 0;

//samples
var impulse_file = "snd/impulse.wav";

function map(val, min1, max1, min2, max2) {
    return (val - min1) / (max1 - min1) * (max2 - min2) + min2;
} //from p5js

var note_names = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function midiToFreq(a = 69) {
    return 440 * Math.pow(2, (a - 69) / 12); //Where 440 hz is A4 fundamental
}

function midiToNote(a = 69) {
    
    return note_names[a % 12] + Math.floor(a / 12);
}

function midiArrayToNote(a = []) {
    var return_note_arr = [];
    a.forEach(function(note) {
        return_note_arr.push(midiToNote(note));
    })
    return return_note_arr;
}

function noteToMidi(a = "") {
    var note = /\D(?!-)\D|\D/.exec(a);
    console.log(note);
    var octave = /-\d|\d/.exec(a);
    console.log(octave);
    return (parseInt(octave[0]) + 1)*12 + note_names.indexOf(note[0]);
}

var chromatic = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    maj_scale = [0, 2, 2, 1, 2, 2, 2],
    min_scale = [0, 2, 1, 2, 2, 1, 2],
    maj_pentatonic = [0, 2, 2, 3, 2],
    min_pentatonic = [0, 3, 2, 2, 3],
    min_blues = [0, 3, 2, 1, 1, 3],
    maj_blues = [0, 2, 1, 1, 3, 2],
    mixolydian = [0, 2, 2, 1, 2, 2, 1];

function getScaleFromRoot(scale, midi_root, octaves) {
    var scale_return = [],
        last_note = 0;
    var k;
    for (k = 0; k < octaves; k++) {
        last_note = midi_root + 12 * k;
        scale.forEach(
            function(note) {
                last_note += note;
                scale_return.push(last_note);
            }
        );        
    }
    scale_return.push(midi_root + 12*k); //add the last note
    return scale_return;
}

//Simple chords and inversions - Listed here in the key of C for simplicity. Inversions don't skip keys; they're all in order (for now).
//The first number is not a tone. It is the number of semitones by which you would have to move down to get a chord equivalent to a root position chord based on the midi root. To get the number of semitones to move up, subtract from 12.
var chords = {
    major: [
        [0, 0, 4, 3], //C (root position)
        [8, 0, 3, 5], //Ab (1st inversion)
        [5, 0, 5, 4] //F (2nd inversion)
    ],
    minor: [
        [0, 0, 3, 4], //Cm (root position)
        [9, 0, 4, 5], //Am (1st inversion)
        [5, 0, 5, 3] //Fm (2nd inversion)
        
    ],
    major_seven: [ 
        [0, 0, 4, 3, 4], //CM7
        [8, 0, 3, 4, 1], //AbM7 (1st inversion)
        [5, 0, 4, 1, 4], //FM7 (2nd inversion)
        [1, 0, 1, 4, 3] //DbM7 (3rd inversion)
    ],
    diminished_seven:[
        [0, 0, 3, 3, 4], //Cdim7
        [9, 0, 3, 4, 2], //Adim7 (1st inversion)
        [6, 0, 4, 2, 3], //Gbdim7 (2nd inversion)
        [2, 0, 2, 3, 3] //Ddim7 (3rd inversion)
    
    ]
}

//Get a simple triad corresponding to any of the above inversion shapes.
function getTriad(midi_root, chord_arr, inversion = 0) {
    //Chord array MUST be notated as chords.major etc. Give the root as a midi number.
    var cur_n = midi_root;
    var chord = [];
    chord_arr[inversion].forEach(function(note, index){
        if (index === 0) {
            cur_n -= note;
        }
        else {
            cur_n += note;
            chord.push(cur_n);
        }
    });
    return chord;
}

//Maybe have a fun function that spreads out those chords
//Have a function that squeezes/truncates an array to a certain pitch range

function getTriadFromDegree(midi_tonic, degree, inversion = 0) {
    return getTriad(midi_tonic + degree[0], degree[1], inversion);
}



//[degrees.I, degrees.I, degrees.I, degrees.I, degrees.iii, degrees.vi, degrees.ii, degrees.ii, degrees.IV, degrees.IV, degrees.V, degrees.V, degrees.V, degrees.viidim];
/*
var standard_chord_preference = [degrees.I, 
                                 degrees.I, 
                                 degrees.I, 
                                 degrees.I, 
                                 degrees.IV, 
                                 degrees.ii, 
                                 degrees.ii, 
                                 degrees.IV, 
                                 degrees.IV, 
                                 degrees.v, 
                                 degrees.v, 
                                 degrees.bVII, 
                                 degrees.bVII];
*/

//GENERATORS
/*
 var standard_melody_obj = {
    0: [-2, -2, 0, 0, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 7, 7, 8, 8, 9, 9, 10, 10, 11, 12], //C - leaps outside of an octave no -1
    1: [0, 2], //Db - passing tones
    2: [-1, -2, -2, 0, 0, 0, 0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 7, 8, 9, 9, 10, 10, 11, 12, 14], //D
    3: [-1, -1, -2, -2, 0, 0, 2, 2, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 7, 7, 8, 9, 10, 10, 11, 11, 12, 14, 15], //Eb
    4: [-1, -1, -2, 0, 0, 2, 2, 2, 2, 3, 4, 4, 5, 5, 5, 5, 5, 7, 7, 8, 9, 10, 11, 11, 12, 14, 16], //E 
    5: [-1, -2, -2, 0, 0, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 7, 7, 7, 7, 8, 8, 9, 9, 10, 11, 12, 14, 15, 16, 17], //F
    6: [5, 7], //Gb - another passing tone
    7: [-1, -1, -2, -2, 0, 2, 3, 3, 4, 4, 5, 5, 5, 5, 6, 6, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 11, 11, 12, 14, 15, 16, 17, 19], //G
    8: [-1, -1, -2, -2, 0, 0, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 11, 11, 12, 15, 16, 17, 19], //Ab
    9: [-1, -2, 0, 0, 2, 3, 3, 4, 4, 5, 5, 7, 7, 7, 7, 8, 9, 9, 10, 10, 10, 10, 11, 11, 11, 11, 12, 12, 14, 16, 17, 19], //A
    10: [-1, -2, -2, 0, 0, 2, 2, 3, 4, 5, 5, 7, 7, 7, 8, 9, 9, 9, 9, 10, 10, 11, 12, 12, 12, 14, 17, 19], //Bb
    11: [-1, 0, 0, 0, 0, 2, 2, 3, 3, 4, 5, 7, 7, 8, 9, 9, 9, 9, 10, 11, 11, 12, 12, 12, 12, 14, 16, 19] //B
};
*/

//Capped so it can't jump outside of the octave. "Twinkle Twinkle" doesn't go outside of that range anyways.

/*
var dissonance_chord_obj = {
    I: ["i"]
    i: ["I", "II"]
}
*/
var cur_note = 69;
var cur_chord = "I";

//Probably isn't an actual Markov chain
//Generates a phrase of a given length based off our arrays; Give scale as maj_scale, min_scale, etc. Note_unit is the minimum length of a note; all other note lengths will be multiples of that unit.
function generateMarkovPhrase(root, scale, octaves = 2, length, clean = true, tone_anchor = 2, note_unit = 0.2) {
    var cur_scale = getScaleFromRoot(scale, root, 2),
        ref_scale = getScaleFromRoot(scale, 0, 2), //Just for setting tonality.
        melody = [],
        last_note_time,
        i = 0,
        ref_melody_obj = {
    0: [-2, -2, 0, 0, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 7, 7, 8, 8, 9, 9, 10, 10, 11, 12], //C - leaps outside of an octave no -1
    1: [0, 2], //Db - passing tones
    2: [-1, -2, -2, 0, 0, 0, 0, 0, 1, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 7, 8, 9, 9, 10, 10, 11, 12], //D
    3: [-1, -1, -2, -2, 0, 0, 2, 2, 2, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 7, 7, 8, 9, 10, 10, 11, 11, 12], //Eb
    4: [-1, -1, -2, 0, 0, 2, 2, 2, 2, 2, 3, 4, 4, 5, 5, 5, 5, 5, 7, 7, 8, 9, 10, 11, 11, 12, 14, 16], //E 
    5: [-1, -2, -2, 0, 0, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 7, 7, 7, 7, 8, 8, 9, 9, 10, 11, 12], //F
    6: [5, 7], //Gb - another passing tone
    7: [-1, -1, -2, -2, 0, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 6, 6, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 10, 10, 11, 11, 12], //G
    8: [-1, -1, -2, -2, 0, 0, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 7, 7, 7, 7, 7, 8, 8, 9, 9, 9, 9,  10, 10, 10, 10, 10, 11, 11, 12], //Ab
    9: [-1, -2, 0, 0, 2, 3, 3, 4, 4, 5, 5, 7, 7, 7, 7, 7, 8, 9, 9, 10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 12, 12], //A
    10: [-1, -2, -2, 0, 0, 2, 2, 3, 4, 5, 5, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 9, 10, 10, 11, 12, 12, 12, 12, 12], //Bb
    11: [-1, 0, 0, 0, 0, 0, 2, 2, 3, 3, 4, 5, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 10, 11, 11, 12, 12, 12, 12, 12] //B
},
        dissonance_melody_obj = {
    0: [1],
    1: [4],
    2: [11],
    3: [6],
    4: [6],
    5: [11],
    6: [8],
    7: [6, 10],
    8: [11],
    9: [10],
    10: [6],
    11: [8]
},
        cur_melody_obj = Object.create(ref_melody_obj),
        new_note,
        degrees = {
    I: [0, chords.major],
    i: [0, chords.minor],
    ii: [2, chords.minor],
    iidim: [2, chords.diminished_seven],
    II: [2, chords.major],
    bIII: [3, chords.major],
    iii: [4, chords.minor],
    IV: [5, chords.major],
    iv: [5, chords.minor],
    V: [7, chords.major],
    v: [7, chords.minor],
    v: [7, chords.minor],
    bVI: [8, chords.major],
    vi: [9, chords.minor],
    bVII: [10, chords.major],
    viidim: [11, chords.diminished_seven]
};
    if(!cur_note) {
        cur_note = root;
    }
    for(i = 0; i < 12; i++) {
        if(cur_chord) {
            var t;
            //Interpret the chords here and modify cur_melody_obj
            for (t = 0; t < tone_anchor; t++) {
                cur_melody_obj[i].push(...getTriadFromDegree(0, degrees[cur_chord], 0).map(function(x) {
                    return (12 + x) % 12;
                }));
            }
        }
        if(clean && (dissonance === 0)) {
            cur_melody_obj[i] = ref_melody_obj[i].filter(function(note, index) {
                return (ref_scale.includes(Math.abs(12 + note) % 12));
            });
        }
    }
    if(dissonance > 1) {
       for(i = 0; i < 12; i++) {
            cur_melody_obj[i].push(...dissonance_melody_obj[i]);
        }
    }
//Add more note choices according to parameter "dissonance"
    var j = 0;
    for (j = 0; j < length; j++) {
        var rand1 = Math.random();
        var rand2 = Math.random();
        var expr1 = Math.abs(12 + cur_note - root) % 12
        var note_array = [];
        note_array.push(root + cur_melody_obj[expr1][Math.floor(map(rand1, 0, 1, 0, cur_melody_obj[expr1].length))]);
        //4 is the current maximum note length multiple
        console.log(note_unit*Math.round(map(rand2, 0, 1, 1, 4)));
        note_array.push(note_unit*Math.round(map(rand2, 0, 1, 1, 4)));
        melody.push(note_array);
        cur_note = root + cur_melody_obj[expr1][Math.floor(map(rand1, 0, 1, 0, cur_melody_obj[expr1].length))];
    }
    return melody;
}

//Rolls for a new chord (notated by degree) based off current chord.
function generateMarkovChord() {
    var standard_chord_obj = {
    I: ["I", "ii", "iii", "vi", "IV", "V"],
    i: ["i", "iidim", "bIII", "bVI"], 
    ii: ["I", "V"],
    iidim: ["bIII"],
    II: [],
    bIII: ["i", "iidim", "bVI"],
    iii: ["I", "IV"], 
    iv: ["i", "bIII", "v", "v"],
    IV: ["V", "V", "I", "vi"], 
    V: ["I", "I", "I", "IV", "viidim"], 
    v: ["bVII", "i", "iv"], 
    bVI: ["i", "bVII", "bVII"], 
    vi: ["I", "V"], 
    bVII: ["i"], 
    viidim: ["I"]
}
    var rand = Math.random(),
        new_chord = standard_chord_obj[cur_chord][Math.floor(map(rand, 0, 1, 0, standard_chord_obj[cur_chord].length))];
    cur_chord = new_chord;
    return new_chord;
}

function doMarkovSequence(root = 51, scale = maj_scale, octaves = 2, phrase_length = 8, clean = true, tone_anchor = 2, starting_chord = "I", num_phrases = 20) {
    cur_chord = starting_chord;
    var melody = [],
        progression = [],
        p,
        degrees = {
    I: [0, chords.major],
    i: [0, chords.minor],
    ii: [2, chords.minor],
    iidim: [2, chords.diminished_seven],
    II: [2, chords.major],
    bIII: [3, chords.major],
    iii: [4, chords.minor],
    IV: [5, chords.major],
    iv: [5, chords.minor],
    V: [7, chords.major],
    v: [7, chords.minor],
    v: [7, chords.minor],
    bVI: [8, chords.major],
    vi: [9, chords.minor],
    bVII: [10, chords.major],
    viidim: [11, chords.diminished_seven]
};
    for (p = 0; p < num_phrases; p++) {
        var expr = Math.floor(map(Math.random(), 0, 1, 0, 2));
        melody.push(...generateMarkovPhrase(root, scale, octaves, phrase_length, clean, tone_anchor));
        progression.push(getTriadFromDegree(root, degrees[cur_chord], expr));
        generateMarkovChord();
    }
    //Have something where we repeat phrases according to parameters?
    return [melody, progression];
}

//Feed in doMarkovSequence for sequence
function playMarkovSequence(melody_bus = 0, melody_osc_num = 0, chord_bus = 1, sequence, note_length = 0.2, chord_length = 1.6) {
    playNoteSequence(melody_bus, melody_osc_num, sequence[0]);
    playProgression(chord_bus, sequence[1], chord_length);
}

//Without some repetition, the melody seems to wander aimlessly.

//TODO: Output in MIDI?

//<--Audio system using WebAudioAPI-->
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

function init() {
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

//Audio system ends here

//Pre-programmed synth presets begin here
//Eventually there should be a way to save and load these as a JSON or something
function create_temperature_synth(){
    var bus_num = create_new_bus(context.destination);
    var convolver = add_convolution(bus_num);
    dry_wet(bus_num, 1, 20);
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
    add_convolution(bus_num);
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

//Webpage stuff goes here

init();
synths_init();
create_samples_with_loc();

//Data-related stuff
function soundMorph(input, param, time) {
    if(input === 0) {
        //If you make things go to 0 apparently they create ear-destroying noises
    }
    else{
        param.linearRampToValueAtTime(input+0.001, context.currentTime+time);
    }
}


function update_geo_samples(listener_x, listener_y) {
    var i;
    for(i = 0; i < geo_buses.length; i++) {
        /*
        console.log("x" + (geo_audio[i][1] - listener_x));
        console.log("y" + (listener_y - geo_audio[i][2]));
        */
        buses[geo_buses[i]][1][0].positionX.value = (geo_audio[i][3] - listener_x);
        buses[geo_buses[i]][1][0].positionY.value = (listener_y - geo_audio[i][4]);
        //Hard-coded panner index
    }
}


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
document.getElementById("start_a_btn").onclick = function() {
    var b;
    for (b = 2; b < buses.length; b++) {
        start_bus(b);
        }
    document.getElementById("start_a_btn").disabled = true;}
document.getElementById("mute_btn").onclick = function() {
    mute_bus(0);
    mute_bus(1);
    document.getElementById("unmute_btn").disabled = false;
    document.getElementById("mute_btn").disabled = true;
                                                         }
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
                                                         }
document.getElementById("unmute_btn").onclick = function() {
    set_bus_gain(0, 0.03);
    set_bus_gain(1, 0.02);
    document.getElementById("unmute_btn").disabled = true;
    document.getElementById("mute_btn").disabled = false;}
document.getElementById("convolve_btn").onclick = function() {
    add_convolution(0);
    document.getElementById("convolve_btn").disabled = true;}
document.getElementById("rand_gen_btn").onclick = function() {
    var root = parseFloat(document.getElementById("gen_root").value);
    playMarkovSequence(0, 0, 1, doMarkovSequence(root, maj_scale, 2, 8, true, 2, "I", 5), 0.3, 2.4)
}

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
    update_geo_samples(cursorX, cursorY);
    //console.log(cursorX, cursorY);
    //context.listener.setPosition(cursorX, cursorY, 295);
    /*
    soundMorph(map(cursorX, 0, 3600, -1, 1), buses[2][1][0].positionX, 0.1);
    soundMorph(map(cursorY, 0, 1800, -1, 1), buses[2][1][0].positionY, 0.1);
    */
    }

//1022 514
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