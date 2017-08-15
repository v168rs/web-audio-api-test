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
            console.log(markov_arr);
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
        [[55],0.35],[[52],0.2],[[48],0.45],[[52],0.45],[[55],0.5],[[60],0.5],[[62,64],0.25],[[62],0.15],[[60],0.5],[[52],0.2],[[54],0.5],[[55],0.5],[[55],0.3],[[55],0.25],[[62],0.1],[[64],0.45],[[62],0.25],[[60],0.4],[[59],0.5],[[57],0.25],[[59],0.25],[[60],0.45],[[60],0.35],[[55],0.45],[[52],0.5],[[48],0.5],[[55],0.35],[[52],0.15],[[48],0.45],[[52],0.5],[[55],0.5],[[60],0.5],[[62],0.05],[[64],0.35],[[62],0.2],[[60],0.5],[[53],0.5],[[54],0.5],[[55],0.5],[[55],0.5],[[62],0.1],[[64],0.5],[[62],0.25],[[60],0.45],[[59],0.5],[[57],0.25],[[59],0.2],[[60],0.5],[[60],0.4],[[55],0.45],[[52],0.45],[[48],0.5],[[64],0.4],[[64],0.25],[[64],0.45],[[65],0.4],[[67],0.35],[[65],0.1],[[67],0.5],[[65],0.25],[[64],0.25],[[62],0.4],[[64],0.45],[[65],0.5],[[65],0.5],[[65],0.5],[[64],0.5],[[62],0.25],[[60],0.45],[[59],0.5],[[57],0.25],[[59],0.25],[[60],0.45],[[52],0.4],[[54],0.45],[[55],0.5],[[55],0.45],[[60],0.45],[[60],0.5],[[60],0.25],[[59],0.2],[[57],0.45],[[57],0.4],[[57],0.35],[[62],0.4],[[65],0.25],[[64],0.25],[[62],0.2],[[60],0.25],[[60],0.45],[[59],0.5],[[55],0.25],[[55],0.25],[[60],0.5],[[62],0.25],[[64],0.25],[[65],0.25],[[67],0.5],[[60],0.25],[[62],0.25],[[64],0.5],[[65],0.25],[[62],0.5],[[60],0.5],[[55],0.5]
    ],
    [
        [[55],0.4],[[59],0.15],[[62],0.3],[[62],0.3],[[64],0.5],[[62],0.45],[[59],0.35],[[55],0.25],[[62],0.2],[[62],0.2],[[62],0.2],[[59],0.45],[[55],0.5],[[50],0.2],[[50],0.2],[[50],0.2],[[50],0.2],[[50],0.2],[[50],0.15],[[55],0.5],[[50],0.25],[[55],0.5],[[55],0.3],[[55],0.45],[[57],0.45],[[52],0.25],[[52],0.2],[[54],0.15],[[55],0.5],[[55],0.5],[[59],0.3],[[55],0.25],[[59],0.25],[[62],0.5],[[62],0.4],[[59],0.3],[[59],0.15],[[55],0.35],[[59],0.15],[[62],0.35],[[59],0.2],[[57],0.45],[[57],0.5],[[64],0.45],[[62],0.5],[[59],0.5],[[55],0.5],[[62],0.3],[[59],0.5],[[62],0.3],[[59],0.25],[[57],0.1],[[59],0.1],[[55],0.5],[[59],0.5],[[50],0.35],[[52],0.2],[[55],0.3],[[55],0.4],[[59],0.5],[[62],0.5],[[57],0.4],[[57],0.2],[[52],0.5],[[57],0.5],[[50],0.35],[[55],0.5],[[55],0.3],[[59],0.5],[[59],0.3],[[62],0.5],[[55],0.4],[[59],0.15],[[62],0.3],[[62],0.25],[[64],0.45],[[62],0.45],[[59],0.35],[[55],0.2],[[62],0.2],[[62],0.2],[[62],0.2],[[59],0.45],[[55],0.5],[[50],0.5],[[55],0.5],[[50],0.5],[[55],0.5],[[62],0.5],[[67],0.5]
    ],
    [
        [[60],0.2],[[62],0.2],[[63],0.25],[[55],0.2],[[62],0.2],[[53],0.2],[[51],0.1],[[53],0.2],[[50],0.2],[[48],0.2],[[51],0.25],[[55],0.25],[[60],0.2],[[53],0.25],[[63],0.25],[[62],0.2],[[65],0.2],[[68],0.25],[[60],0.15],[[59],0.05],[[60],0.05],[[59],0.05],[[57],0.25],[[55],0.25],[[59,60],0.2],[[62],0.2],[[65],0.25],[[63],0.25],[[60],0.25],[[55],0.2],[[60],0.2],[[64],0.2],[[60],0.25],[[65],0.25],[[60],0.25],[[67],0.25],[[60],0.25],[[68],0.2],[[60],0.2],[[62],0.25],[[58],0.25],[[53],0.25],[[58],0.2],[[62],0.2],[[58],0.25],[[63],0.25],[[58],0.2],[[65],0.3],[[58],0.25],[[67],0.2],[[58],0.2],[[60],0.45],[[55],0.25],[[56],0.25],[[60],0.3],[[63],0.2],[[58],0.25],[[55],0.25],[[53],0.25],[[55],0.2],[[58],0.25],[[63],0.25],[[56],0.15],[[55],0.25],[[53],0.25],[[55],0.2],[[56],0.25],[[51],0.2],[[51],0.05],[[50],0.2],[[51],0.2],[[53],0.25],[[50],0.25],[[46],0.25],[[44],0.25],[[43],0.3],[[46],0.2],[[51],0.3],[[46],0.2],[[44],0.25],[[51],0.2],[[46],0.25],[[51],0.25],[[48],0.25],[[51],0.2],[[49],0.25],[[51],0.2],[[46],0.25],[[51],0.15],[[51],0.1],[[48],0.25],[[51],0.25],[[49],0.2],[[51],0.25],[[48],0.45],[[51],0.4],[[56],0.1],[[56],0.5],[[53],0.5],[[62],0.5],[[58],0.5],[[67],0.5],[[65],0.25],[[63],0.25],[[62],0.3],[[60],0.2],[[62],0.2],[[63],0.3],[[58],0.25],[[55],0.25],[[58],0.25],[[51],0.5],[[67],0.2],[[68],0.25],[[70],0.2],[[67],0.2],[[70],0.25],[[65],0.2],[[64],0.25],[[62],0.15],[[64],0.05],[[62],0.05],[[60],0.25],[[64],0.25],[[67],0.25],[[70],0.25],[[68],0.3],[[65],0.25],[[61],0.25],[[67],0.3],[[64],0.2],[[60],0.25],[[58],0.25],[[55],0.25],[[56],0.25],[[60],0.25],[[65],0.25],[[57],0.25],[[58],0.25],[[62],0.25],[[65],0.45],[[67],0.25],[[65],0.25],[[67],0.2],[[63],0.25],[[62],0.25],[[60],0.2],[[59],0.25],[[65],0.25],[[63],0.25],[[62],0.25],[[60],0.15],[[63],0.3],[[57],0.2],[[55],0.3],[[54],0.2],[[55],0.25],[[57],0.25],[[54],0.2],[[50],0.25],[[57],0.2],[[62],0.25],[[55],0.25],[[54],0.2],[[60],0.2],[[58],0.25],[[55],0.3],[[48],0.2],[[54],0.3],[[55],0.2],[[57],0.25],[[51],0.2],[[48],0.3],[[46],0.25],[[50],0.2],[[54],0.2],[[55],0.25],[[45],0.2],[[54],0.2],[[55],0.4],[[58],0.1],[[60],0.1],[[58],0.1],[[60],0.1],[[58],0.1],[[60],0.5],[[61],0.2],[[64],0.25],[[60],0.2],[[67],0.25],[[58],0.25],[[56],0.2],[[58],0.25],[[60],0.2],[[56],0.25],[[53],0.25],[[52,50],0.2],[[53],0.25],[[56],0.25],[[59],0.25],[[55],0.2],[[62],0.25],[[53],0.2],[[51],0.25],[[53],0.25],[[55],0.25],[[51],0.25],[[48],0.25],[[47],0.25],[[48],0.3],[[52],0.2],[[54],0.25],[[50],0.25],[[60],0.25],[[48],0.25],[[47],0.2],[[50],0.2],[[53],0.25],[[56],0.25],[[55],0.2],[[59],0.2],[[62],0.2],[[65],0.25],[[63],0.2],[[60],0.25],[[55],0.2],[[59],0.25],[[60],0.2],[[55],0.25],[[51],0.25],[[43],0.2]
    ]
];
var buffer_loc = [
    {latitude : 38.8977,
     longitude : -77.0365},
    {latitude : 39.9042,
    longitude : 116.407394},
    {latitude : 50.9803,
    longitude : 10.3156}
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



var wt = [0 , 0, 0],
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
        interv = null;
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