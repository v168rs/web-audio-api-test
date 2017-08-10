function array_equals(arr1, arr2) {
    var rt = true;
    arr1.forEach((el, index) => {if(el != arr2[index]) {rt = false;}});
    arr2.forEach((el, index) => {if(el != arr1[index]) {rt = false;}});
    return rt;
}

var MIDIm = (function () {
	//private
	var midi,
		midi_buffer = [],
		max_buffer = 4096;
	
	function map(val, min1, max1, min2, max2) {
    return (val - min1) / (max1 - min1) * (max2 - min2) + min2;
} //from p5js
	
	function parse_buffer(option, buffer = midi_buffer) {
		var p_arr = [],
			listening_buffer = [];
		if(option == "note") {
			buffer.forEach(function(a) {
				if(a[0][0] == 144) {
					p_arr.push(a[0][1]);
				}
			});
		}
		//time between notes
		if(option == "rhythm") {
			buffer.forEach(function(a) {
				if(a[0][0] == 144) {
					listening_buffer.push(a[1]);
				}
			});
			listening_buffer.forEach(function(a, i) {
				if(listening_buffer[i + 1]) {
					p_arr.push(Math.trunc(listening_buffer[i + 1] - listening_buffer[i]));
				}
			});
		}
		//time the note is held
		if(option == "hold") {
			buffer.forEach(function(a) {
				if(a[0][0] == 144) {
					listening_buffer.push(a);
				}
				else if (a[0][0] == 128) {
					var b = listening_buffer.find(function(e) {return a[0][1] == e[0][1];}); //Look for the note with the same pitch as the noteOff signal
					if (b) {
						console.log("Matched note: " + b[0][1]);
						p_arr.push(Math.trunc(a[1] - b[1])); //Push its duration (ms accuracy)
						listening_buffer.splice(listening_buffer.indexOf(b), 1);//Remove from listening buffer
					}	
				}
			});
		}
		return p_arr;
	}
//Polyphony?
	//Turns an array of recurring states into abstract n-order markov chain objects.
	function markov_parse(array, n, sta) {
	var ret_dict = [],
		ret_obj = {};
	//Abstract singular states as numbers
	array.forEach(function(state){
        if(sta == "rn") {
            if(ret_dict.findIndex((el)=>{return ((el[1] == state[1]) && (array_equals(el[0], state[0])));}) == -1) { //If the state can't already be found in the "dictionary array", push it. 
        //TIL there's no function built into Javascript for comparing two arrays.
			 ret_dict.push(state);
            }
        }
        else if(ret_dict.indexOf(state) == -1) {
            console.log(state);
            ret_dict.push(state);
        }
	});
	array.forEach(function(state, index) {
		if(array[index + n]) {
            
            //basically we're just mapping multiple states (index to index + n) to indices in the ret_dict however because Javascript doesn't want us to compare arrays with == we have to do it the hard way
            //meaning element by element
			var a = array.slice(index, index+n).map(function(obj) {return (sta == "rn") ? ret_dict.findIndex((el)=>{return ((el[1] == obj[1]) && (array_equals(el[0], obj[0])));}) : (ret_dict.indexOf(obj));}); //Abstract to numbers
			if(!ret_obj[a]) {
				ret_obj[a] = [];
			}
				ret_obj[a].push((sta == "rn") ? ret_dict.findIndex((el)=>{return ((el[1] == array[index + n][1]) && (array_equals(el[0], array[index + n][0])));}) : ret_dict.indexOf(array[index + n]));
		}
	});
	ret_obj["~n_order"] = n;
	ret_obj["~state"] = sta;
	return [ret_dict, ret_obj];
	}
	
	//Quantize to the nearest decisecond?
	function qra (a = [], n = 50, max = 500) {
		return a.map(function(x) {
			return Math.min(max, Math.round(x/n)*n);
		})
	}
	
	//Group chords from note and rhythm arrays
	function chgrp (n = [], r = []) {
		var ret_arr = [],
			cur_arr = [];
		r = qra(r); //quantize using one setting
		r.forEach(function(time, index) {
			if(n[index] && !cur_arr.find(function(x){return x == n[index];})) {
				cur_arr.push(n[index]);
			}
			if(cur_arr.length > 0 && !(time == 0)) {
				ret_arr.push([cur_arr, time/1000]);
				cur_arr = [];
			}
		})
		return ret_arr;
	}
	
	//Quantize to note values
	
	function pick(array = []) {
		var rand = Math.random();
		return array[Math.round(map(rand, 0, 1, 0, array.length - 1))];
	} //why haven't I done this already
	
	//string parse integer array
	function spia(str="") {
			var a = str.split(",");
			a.map(function(b){return parseInt(b);});
		}
	
	//public
	return {
		onmidinote: function(msg) {},
		
		init: function() {
			if (navigator.requestMIDIAccess) {
				navigator.requestMIDIAccess({sysex: false}).then(
					function(midiAccess) {
						alert("MIDI is fine");
						midi = midiAccess;
						var inputs = midi.inputs.values();
						for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
							input.value.onmidimessage = function(message) {
								MIDIm.onmidinote([message.data, performance.now()]);
								if(midi_buffer.length < max_buffer) {
									var _ma = [];
									_ma.push(message.data);
									_ma.push(performance.now());
									midi_buffer.push(_ma);
								}
							};
						}
					}, function() {alert("MIDI rejected");});
			} else {
				alert("No midi support");
			}
		},
		
		rel: function(option) {
			var rel_arr = [];
			rel_arr = parse_buffer(option);
			midi_buffer = [];
			
			return rel_arr;
		},
        
        ndchdgrel: function() {
            return chgrp(parse_buffer("note"), parse_buffer("rhythm"));
        },
		
		mrprel: function(n) {
			return markov_parse(qra(parse_buffer("rhythm")), n, "rhythm");
		},
		
		mnprel: function(n) {
			return markov_parse(parse_buffer("note"), n, "note");
		},
		
		mhprel: function(n) {
			return markov_parse(qra(parse_buffer("hold")), n, "hold");
		},
		
		chdgrel: function(n) {
			return markov_parse(chgrp(parse_buffer("note"), parse_buffer("rhythm")), n, "rn");
		},
        
        chdgrel_cb: function(n, crb) { //Why did I even make this a module
            return markov_parse(crb, n, "rn");
        },
		
		//generate a markov chain
        //do parse directly in here?
		mwalk: function(markov_arr, ssn = 0, max_rep = 2, parser) {
			var walk = [],
				markov_obj = markov_arr[1],
				opn = Object.getOwnPropertyNames(markov_obj),//"Dictionary array" which we will use to re-translate our output walk into correct values
				mad = markov_arr[0],
				n = markov_obj["~n_order"];
				opn = opn.filter(function(x) {if((x != "~n_order") && (x != "~state")) return x;});			
			var	ss = pick(opn),
				cs = ss,
				i = 1;
			
			if(ss === undefined) {
				console.error("No starting state found");
				return 0;}
			if(ssn != 0) {
				ss = opn[ssn];
			}
			walk.push(...ss.split(",").map(function(o){return parseInt(o);}));
			for(i = 0; i < max_rep; i++) {
				if(markov_obj[cs]) {
					walk.push(pick(markov_obj[cs]));
						//from end - n to end
					cs = String(walk.slice(walk.length - n, walk.length));
				}
				else {
                    if(n == 1) {
                        console.log("Ran out of combinations; trying new state");
					    cs = pick(opn)
                    }
                    else if (n > 1) {
                        console.log("lower order");
                        var temp_arr = parser(n-1);
                        var temp_walk = this.mwalk(temp_arr, 0, 1, parser);
                        temp_walk = temp_walk.map(function(item) {if(mad.indexOf(item) == -1) {mad.push(item);} return mad.indexOf(item);}); //Add new lower-order states to our dictionary so we can properly parse the walk
                        walk.push(...temp_walk); //STOP
                        cs = String(walk.slice(walk.length - n, walk.length));
                    }
				}
			}
			return walk.map(function(num) {return mad[num];});
		},
		//key detection? Generalize across keys?
	};
})();
MIDIm.init();

var param1 = 0;
var buffer_picker = [
    [
        [[79],0.35],[[76],0.25],[[72],0.05],[[60,67,64],0.5],[[76],0.5],[[67,79,59,62],0.5],[[57,67,60],0.2],[[84],0.5],[[86],0.1],[[88],0.3],[[86],0.2],[[67,60,57,84],0.5],[[76],0.5],[[66,78,62,69],0.5],[[62,79,67,71],0.5],[[67,74,71,79],0.3],[[79],0.3],[[60,88,67,64],0.5],[[86],0.35],[[84],0.5],[[83,71,62,67],0.5],[[74,67,71,81],0.25],[[83],0.25],[[60,84,67,64],0.5],[[84],0.5],[[79],0.5],[[59,62,67,76],0.5],[[67,72,64,60],0.5],[[79],0.35],[[76],0.2],[[60,64,72,67],0.5],[[76],0.5],[[59,67,62,79],0.5],[[57,67,60,84,79],0.5],[[86],0.05],[[79],0.05],[[88],0.3],[[86],0.05],[[79],0.15],[[67,60,84,57],0.5],[[76],0.5],[[66,78,62,69],0.5],[[62,71,79,67],0.5],[[62,71,67,79],0.3],[[79],0.25],[[60,67,64,86,79,88],0.5],[[79,86],0.3],[[84],0.5],[[83],0.5],[[55,62,59],0.5],[[81],0.35],[[83],0.15],[[84],0.25],[[67,60,64],0.25],[[84],0.5],[[79],0.25],[[60],0.05],[[67,64],0.25],[[76],0.5],[[72],0.25],[[60,67,64],0.5],[[88,84],0.05],[[79],0.25],[[88,79,84],0.25],[[60,67,79,64,84,88],0.5],[[89,79,84],0.25],[[60,67,64],0.3],[[79,84,91],0.5],[[84,86,91,67,62,58],0.5],[[84,89],0.35],[[88],0.5],[[57,64,84,81],0.05],[[88],0.5],[[81,86],0.5],[[81,88,84],0.5],[[81,89,84],0.5],[[56,64,80,84,89],0.5],[[56],0.25],[[64],0.25],[[80],0.05],[[89,84],0.5],[[88,84,79,64,67,60],0.45],[[60],0.25],[[64],0.05],[[67],0.2],[[86,79],0.3],[[84,79],0.5],[[67],0.05],[[71,74,83,79],0.45],[[67],0.25],[[71],0.25],[[81],0.05],[[74],0.25],[[83],0.3],[[74,67,84,71],0.5],[[74],0.5],[[66,62,78,74,69],0.5],[[71,62,67,79,74,83],0.5],[[62,71,67,79,74],0.5],[[60,67,76,84,79],0.5],[[84,76,79],0.5],[[76,84,79],0.3],[[83],0.3],[[64,57,81,76],0.5],[[81,76],0.3],[[64,57],0.3],[[81,76],0.25],[[55],0.35],[[60,53,81,89,84],0.5],[[81,89,84],0.3],[[81,88],0.35],[[81,86],0.35],[[84],0.35],[[55,62,84,79],0.5],[[83,79],0.5],[[79],0.4],[[79],0.4],[[60,67,76,84,79],0.5],[[86,76,79],0.3],[[59,67],0.1],[[76],0.05],[[88],0.05],[[79],0.45],[[89],0.5],[[91,57,81,85,88],0.5],[[57],0.5],[[84],0.35],[[86],0.5],[[62,69,88,81,84],0.5],[[89,81],0.05],[[84],0.45],[[74,67,86,79,83],0.5],[[67,60,79,76,84],0.5],[[60,67,72,76,79],0.5],[[60,67,84,76,79],0.5],[[72,60,67,79,76],0.45]
    ],
    [
        [[62,55,59],0.05],[[67],0.4],[[71],0.2],[[74],0.2],[[74],0.2],[[74],0.2],[[55,62,59,76],0.5],[[74],0.3],[[55,62,59],0.25],[[71],0.4],[[67],0.15],[[74],0.2],[[74],0.2],[[74],0.15],[[62,59,55,71],0.5],[[67],0.25],[[62],0.05],[[55],0.25],[[62],0.05],[[57,50],0.15],[[62],0.2],[[62],0.2],[[62],0.2],[[62],0.2],[[62],0.2],[[67,62,55],0.1],[[59],0.5],[[62],0.25],[[55,62,59,67],0.5],[[67],0.25],[[62,57,54,67],0.45],[[69],0.2],[[55,59,52],0.1],[[67],0.15],[[69],0.3],[[57,54,50],0.05],[[64],0.4],[[64],0.2],[[66],0.15],[[48,67,55,52],0.5],[[55,47,67,50],0.5],[[71],0.35],[[67],0.3],[[71],0.25],[[55,62,59,74],0.5],[[74],0.25],[[55,62,59],0.3],[[71],0.45],[[71],0.15],[[67],0.35],[[71,59,55,62],0.15],[[74],0.35],[[71],0.15],[[69],0.25],[[54,57,50],0.3],[[69],0.3],[[69],0.15],[[69],0.15],[[69],0.15],[[69],0.5],[[55,69,60,76,59],0.5],[[69,74],0.25],[[62,55,59],0.3],[[71],0.5],[[71],0.25],[[55],0.05],[[62,59],0.25],[[69,74],0.25],[[71],0.5],[[74],0.25],[[71],0.25],[[69],0.15],[[71],0.1],[[67],0.3],[[62,55,59],0.25],[[71],0.5],[[62,55,59],0.5],[[62],0.35],[[64],0.2],[[67],0.25],[[67],0.3],[[60,55,59,69],0.4],[[59,62,55,71],0.4],[[71],0.05],[[62,55],0.05],[[59],0.1],[[74],0.3],[[74],0.25],[[69],0.25],[[69,54,57,50],0.3],[[62],0.5],[[69,50,54,57,62],0.25],[[69,62],0.3],[[69],0.1],[[62],0.2],[[62],0.2],[[55,67,59,62],0.5],[[55,59,62],0.25],[[67],0.3],[[71],0.25],[[59,55,62],0.25],[[71],0.25],[[71],0.25],[[62,54,57,74],0.5],[[74],0.25],[[54,57,62],0.3],[[62,55,67,59],0.3],[[71],0.15],[[74],0.2],[[74],0.2],[[74],0.2],[[76],0.25],[[55,59],0.05],[[62],0.25],[[74],0.5],[[62,55,59,71],0.3],[[67],0.2],[[74],0.15],[[74],0.2],[[74],0.2],[[62,59,55],0.05],[[71],0.5],[[67],0.5],[[54,50,62,57],0.5],[[62,55,59,67],0.5],[[62,54,50,57],0.45],[[55,62,59,67],0.45],[[50,54,57,74],0.45],[[62,55,59,79],0.5]
    ]
];
var buffer_loc = [
    {latitude : 38.8977,
     longitude : -77.0365},
    {latitude : 39.9042,
    longitude : 116.407394}
];

function precal_loc() {
    buffer_loc.forEach((obj)=>{obj.x = (obj.longitude + 180) * 10; obj.y = (90 - obj.latitude) * 10;});
}
precal_loc();

//testing function
function mwreg() {
	var ret_arr = [],
		not_arr = MIDIm.mwalk(MIDIm.mnprel(param1), 0, parseInt(document.getElementById("gen_rep").value), MIDIm.mnprel),
		rht_arr = MIDIm.mwalk(MIDIm.mrprel(param1), 0, parseInt(document.getElementById("gen_rep").value), MIDIm.mrprel);
	not_arr.forEach(function(note, index){
		if(rht_arr[index]) {
			ret_arr.push([note, rht_arr[index]/1000]);
		}
	});
	return ret_arr;
}

function mwrn() {
	var not_arr = MIDIm.mwalk(MIDIm.chdgrel(param1), 0, parseInt(document.getElementById("gen_rep").value), MIDIm.chdgrel);
	console.log(not_arr);
	return not_arr;
}

function mwrncb(cb) { //I feel like higher orders wouldn't work too well
	var not_arr = MIDIm.mwalk(MIDIm.chdgrel_cb(1, cb), 0, 10, MIDIm.chdgrel_cb);
	return not_arr;
}

function create_synth(){
    var bus_num = create_new_bus(context.destination);
	add_osc(bus_num, "sawtooth");
	add_osc(bus_num, "square");
    add_osc(bus_num, "sawtooth");
    
	add_osc(bus_num, "sine");
	add_convolution(bus_num, "snd/imp/impulse.wav");
	add_ADHSR_env(bus_num, 0.3, 0.2, 0.05, 0, 0.5);
	add_filter(bus_num)
	dry_wet(0, 1, 100);
	
    set_bus_gain(bus_num, 0.03);
}

var chord_buffer = 20, //millisecond window in which any note played will be considered a chord
    //why? Because I was not thinking when I made the original synth architecture and I can't change it now
	chord_array_buffer = [],
	last_played = performance.now();
MIDIm.onmidinote = function(msg) {
	if((msg[0][0] == 144) && Math.abs(msg[1]-last_played) <= chord_buffer) {
		chord_array_buffer.push(msg[0][1])
	}
	else if(msg[0][0] == 144) {
		chord_array_buffer = [];
		chord_array_buffer.push(msg[0][1])
	}
	if(msg[0][0] == 144) {
		playChord(0, chord_array_buffer, 0)
	}
	last_played = msg[1];
}

waa_init();
create_synth();
start_bus(0);
//intervals

//Document stuff



var wt = [0 , 0],
    interv;

//function for combining two or more different buffers
function mix_buffers(gran = 100) {
    ret_buf = [];
    wt.forEach((weight, index) => {
        for(var i = 0; i < Math.round(weight*gran)/100; i++) {
            ret_buf.push(...buffer_picker[index]); //jesus christ
        }
    });
    return ret_buf; //I hope you like arrays with 50k+ elements
}

function start_generation() {
    var _t = playProgression(0, mwrncb(mix_buffers()));
    return setInterval(()=>{_t = playProgression(0, mwrncb(mix_buffers()))}, _t*1000);
}


document.getElementById("gen").onclick = function() {
	playNoteSequence(0, 0, mwreg());
}

document.getElementById("genrn").onclick = function() {
	playProgression(0, mwrn());
}

document.getElementById("genc").onclick = function() {
	if(!interv) {
        interv = start_generation();
    }
    else {
        alert("Already playing");
    }
}

document.getElementById("genp").onclick = function() {
    if(interv) {
        clearInterval(interv);
    }
    else {
        alert("Not playing");
    }
}

document.getElementById("clear").onclick = function() {
	MIDIm.rel("note");
}


function swapImages(new_img_src, new_data_img_src) {
    var display_canvas_context = document.getElementById("display_canvas").getContext("2d"),
        data_canvas_context = document.getElementById("data_canvas").getContext("2d"),
        new_img = new Image(),
        new_data_img = new Image();
    new_img.src = new_img_src;
    new_data_img.src = new_data_img_src;
    new_img.onload = function() {
		display_canvas_context.clearRect(0, 0, display_canvas.width, display_canvas.height);
		display_canvas_context.drawImage(new_img, 0, 0);
	};
	new_data_img.onload = function() {
		data_canvas_context.clearRect(0, 0, data_canvas.width, data_canvas.height);
		data_canvas_context.drawImage(new_data_img, 0, 0);
	};
}

//CANVAS
function screen_init() {
    var display_canvas = document.getElementById("display_canvas"),
        display_canvas_context = display_canvas.getContext("2d"),
        data_canvas = document.getElementById("data_canvas"),
        data_canvas_context = data_canvas.getContext("2d"),
        img = new Image(),
        data_img = new Image(),
        body = document.getElementById("body");
	context = new AudioContext();
    img.src = "img/data/lstd_01_c.png"
    data_img.src = "img/data/lstd_01_gs.png"
    img.onload = function() {
		display_canvas_context.drawImage(img, 0, 0);
	};
	data_img.onload = function() {
		data_canvas_context.drawImage(data_img, 0, 0);
	};
}
    
document.getElementById("body").onmousemove = function(e) {
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
	soundMorph((color_V === 1) ? 0 : map(color_V, 0, 1, 400, 5000), buses[0][1][0].frequency, 0.1);
    param1 = (color_V === 1) ? param1 : Math.round(map(color_V, 0, 1, 1, 3));
    wt.forEach((w, i)=>{wt[i] = 1000/Math.sqrt( Math.pow(buffer_loc[i].x - cursorX, 2) + Math.pow(buffer_loc[i].y - cursorY, 2));});
    }

document.getElementById("data_pic_slider").oninput = function() {
		swapImages("img/data/lstd_0" + (parseInt(document.getElementById("data_pic_slider").value) + 1) + "_c.png", "img/data/lstd_0" + (parseInt(document.getElementById("data_pic_slider").value) + 1) + "_gs.png");
    }

screen_init();