"use strict";
//Script for handling MIDI/melody stuff
//parameters that will later be manipulated by the data
var dissonance = 0;
var repetition = 9; //It's not a linear scale

function map(val, min1, max1, min2, max2) {
    return (val - min1) / (max1 - min1) * (max2 - min2) + min2;
} //from p5js

//For now this doesn't work when you have a sum less than num - mostly used to get note values
function rand_array_range(sum = 16, num = 8) {
    var i,
        rand_arr = [],
        final_arr = [],
        es = sum - num;
    rand_arr[0] = 0;
    for (i = 1; i < num; i++) {
        rand_arr.push(Math.round(Math.random()*es));
    }
    rand_arr.push(es);
    rand_arr.sort(function(a, b) {return a - b;});
    rand_arr.forEach(function(n, i) {
        if(rand_arr[i+1] != null) {
            final_arr[i] = 1 + rand_arr[i+1] - rand_arr[i];
        }
    });
    return final_arr;
}

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
        return_note_arr.push(midiToNote(note[0]) + ", " + note[1]);
    })
    return return_note_arr;
}

function rhythmArrayFromMidi(a = []) {
    var return_val_arr = [];
    a.forEach(function(val) {
        return_val_arr.push(note[1]);
    });
    return return_val_arr;
}

function noteToMidi(a = "") {
    var note = /\D(?!-)\D|\D/.exec(a);
    console.log(note);
    var octave = /-\d|\d/.exec(a);
    console.log(octave);
    return (parseInt(octave[0]) + 1)*12 + note_names.indexOf(note[0]);
}

var scales = { chromatic : [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    maj_scale : [0, 2, 2, 1, 2, 2, 2],
    min_scale : [0, 2, 1, 2, 2, 1, 2],
    maj_pentatonic : [0, 2, 2, 3, 2],
    min_pentatonic : [0, 3, 2, 2, 3],
    min_blues : [0, 3, 2, 1, 1, 3],
    maj_blues : [0, 2, 1, 1, 3, 2],
    mixolydian : [0, 2, 2, 1, 2, 2, 1]
           };

//Returns array of midi notes
function getScaleFromRoot(scale, midi_root, octaves = 1) {
    var scale_return = [],
        last_note = 0;
    var k;
    for (k = 0; k < octaves; k++) {
        last_note = midi_root + 12 * k;
        scales[scale].forEach(
            function(note) {
                last_note += note;
                scale_return.push(last_note);
            }
        );        
    }
    scale_return.push(midi_root + 12*k); //add the last note
    return scale_return;
}

//stats of an object of properties whose names are values and whose values are indices
function objectStat(object) {
    var sum = 0,
        marr = [],
        nn = 0;
    Object.getOwnPropertyNames(object).forEach((name, index)=>{
        marr.push(object[name]); 
        for(var i = 0; i < object[name]; i++){sum += parseInt(name); if(name != 0) {nn++;}}
    }); //O(N^2) but thankfully not on anything too big
    return {sum : sum, num : nn, mean : (sum/nn), max : Object.getOwnPropertyNames(object)[marr.findIndex((val)=>{return val == Math.max(...marr);})]};
}

//Statistically brute-force analyze an array of notes or progression to determine the key it is likely in (returns other information as well)
function midiArrayToKey(arr, base = true) {
    var ret_obj = {},
        robj = {},
        mfrqobj = {};
    if(arr.find((el)=>{return el instanceof Array})) {
        var temp_arr = [];
        arr.forEach((cr)=>{temp_arr.push(...cr[0])});
        arr = temp_arr;
    }
    arr.forEach((not, ind)=>{
        mfrqobj[not % 12] = (mfrqobj[not % 12] === undefined) ? 1 : ++mfrqobj[not % 12];
    });
    ret_obj["mfrqobj"] = mfrqobj;
    if(base) {
        for(var i = 0; i <= 11; i++) { //for more sophisticated things we could test for other scales
            var comp_obj = midiArrayToKey(getScaleFromRoot("maj_scale", i), false)["mfrqobj"], //This assumes an almost uniform scale profile with emphasis on the tonic. This is not realistic.
                mfrqst = objectStat(mfrqobj),
                csst = objectStat(comp_obj),
                num_sum = 0,
                den_sumx = 0,
                den_sumy = 0,
                den_sum = 0, //not dim sum but close
                R = 0;
            for(var j = 0; j <= 11; j++) { //I didn't take statistics so bear with me
                mfrqobj[j] = (mfrqobj[j] === undefined) ? 0 : mfrqobj[j];
                comp_obj[j] = (comp_obj[j] === undefined) ? 0 : comp_obj[j];
                num_sum += (mfrqobj[j] - mfrqst["mean"])*(comp_obj[j] - csst["mean"]);
                den_sumx += Math.pow((mfrqobj[j] - mfrqst["mean"]), 2);
                den_sumy += Math.pow((comp_obj[j] - csst["mean"]), 2);
            }
            den_sum += Math.sqrt(den_sumx*den_sumy);
            R = num_sum/den_sum;
            robj[i] = R;
        }
        ret_obj["robj"] = robj;
        ret_obj["key"] = /\w*[^0]/.exec(midiToNote(objectStat(robj)["max"]));
        ret_obj["keyn"] = objectStat(robj)["max"];
        console.log("Likely in the key of " + ret_obj["key"]);
    }
    return ret_obj;
}
//It isn't right all of the time but it's probably good enough for pop music

var tonal_mask = {
    major_to_minor: [0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, -1],
    minor_to_major: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
    up_3_minor: [-1, 0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1]
}

//well that was simpler than expected
function applyTonalMask(arr, mask, offset = midiArrayToKey(arr)["keyn"]) {
    if(arr.find((el)=>{return el instanceof Array})) {
        arr.forEach((cr)=>{cr[0] = applyTonalMask(cr[0], mask, offset)});
    }
    else {
        return arr.map((note)=>{return note + mask[(note - offset) % 12];});
    }
    return arr;
}

//Simple chords and inversions - Labeled in the key of C for simplicity. Inversions don't skip keys; they're all in order (for now).
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

//getDegreeFromTriad?

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
var cur_note = 69,
    cur_chord = "I";

//Probably isn't an actual Markov chain
//Generates a phrase of a given number of notes (note_num) based off our arrays; Give scale as maj_scale, min_scale, etc. Duration is in seconds. Tone_anchor is a variable that determines how much the generator prefers the current chord's tones.
function generateMarkovPhrase(root, scale, octaves = 2, note_num = 8, clean = true, tone_anchor = 2, duration = 16) {
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
    //Maybe do something a little less silly
    //Through clever multiplication we can use this coefficient (where 2 is now) to select a unit note length
    var rand3 = rand_array_range(note_num*2, note_num);
    var j = 0;
    for (j = 0; j < note_num; j++) {
        var rand1 = Math.random();
        var rand2 = Math.random();
        var expr1 = Math.abs(12 + cur_note - root) % 12
        var note_array = [];
        note_array.push(root + cur_melody_obj[expr1][Math.floor(rand1*cur_melody_obj[expr1].length)]);
        //Say we generate 8 notes whose lengths add up to 16. Now we want this to fit evenly into 20 seconds:
        //[3, 1, 1, 2, 1, 2, 2, 4]
        //Divide each by 16 and multiply by 20.
        note_array.push(rand3[j]*duration/(note_num*2));
        //Enable us to pass an old rhythm in?
        melody.push(note_array);
        cur_note = root + cur_melody_obj[expr1][Math.floor(rand1*cur_melody_obj[expr1].length)];
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
        new_chord = standard_chord_obj[cur_chord][Math.floor(rand*standard_chord_obj[cur_chord].length)];
    cur_chord = new_chord;
    return new_chord;
}

function doMarkovSequence(root = 51, scale = "maj_scale", octaves = 2, phrase_length = 8, clean = true, tone_anchor = 2, starting_chord = "I", num_phrases, duration) {
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
        var expr = Math.floor(Math.random()*2);
        var ch_arr = [];
        melody.push(...generateMarkovPhrase(root, scale, octaves, phrase_length, clean, tone_anchor, duration/num_phrases));
        ch_arr.push(getTriadFromDegree(root, degrees[cur_chord], expr));
        ch_arr.push(duration/num_phrases); //We are assuming that there is one chord per phrase for now.
        progression.push(ch_arr); //Rhythm for chord progressions next
        generateMarkovChord();
    }
    //Have something where we repeat phrases according to parameters?
    return [melody, progression];
}

//Available modulations? Music comes from repetition
//Separate rhythm repetition from melody repetition somehow? Rhythmic repetition is much more common
function doMetaSequence(root = 53, scale = "maj_scale", octaves = 2, phrase_length = 8, clean = true, tone_anchor = 2, starting_chord = "I", num_phrases = 12, duration = 48, melody_bus = 0, melody_osc_num = 0, chord_bus = 1) {
    //Record index and contents of LAST UNIQUE PHRASE so we don't keep repeating the same thing over and over
    var meta_sequence = [],
        i = 0,
        push_phrase,
        master_rep = [[0, 0], [0, 0], [-1, 1], [-2, 1], [-2, 2], [-2, 2], [-2, 2], [-4, 2], [-4, 4], [-4, 4]]; //Back how far and grab how many phrases? Weight common forms
    //Generate a new unique phrase
    push_phrase = doMarkovSequence(root, scale, octaves, phrase_length, clean, tone_anchor, starting_chord, 1, duration/num_phrases);
    meta_sequence.push(push_phrase);
    var intvl = setInterval(function () {
        //Play the current phrase
        playMarkovSequence(melody_bus, melody_osc_num, chord_bus, meta_sequence[i]);
        //Check if we have room for more
        if(i == num_phrases) {
            clearInterval(intvl);
        }
        //If more than n number of phrases before are available AND this is within the total number of phrases allowed, add those to the list of possibility and select groups of 1, 2, 4. Also check for repetition.
        var pick_rep = [];
        master_rep.forEach(function(xy, index){
            if((index <= repetition) && (meta_sequence[i+xy[0]]) && ((meta_sequence.length - 1 + xy[1]) <= num_phrases)) {
                pick_rep.push(xy);
                console.log(xy)
            }
        });
        var cur_opt = pick_rep[Math.floor(Math.random()*(pick_rep.length - 1))]
        if (cur_opt[0] == 0) {
            //Generate a new unique phrase [0, 0]
            console.log("making new phrase");
            push_phrase = doMarkovSequence(root, scale, octaves, phrase_length, clean, tone_anchor, cur_chord, 1, duration/num_phrases);
        }
        else {
            var k;
            //console.log("grabbing " + cur_opt[1] " phrases from position " + i+cur_opt[0]);
            for(k = 0; k <= cur_opt[1]; k++) {
                push_phrase = push_phrase.concat(meta_sequence[i+cur_opt[0]+k]);
            } //oh god it's asynchronous what have I done.
        }
        meta_sequence.push(push_phrase);
        i++; //Increment!
    }, duration/num_phrases*1000);
    return meta_sequence;
}