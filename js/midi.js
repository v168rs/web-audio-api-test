var MIDIm = (function () {
	//private
	var midi,
		midi_buffer = [],
		max_buffer = 4096;
	
	function map(val, min1, max1, min2, max2) {
    return (val - min1) / (max1 - min1) * (max2 - min2) + min2;
} //from p5js
	
	function parse_buffer(option) {
		var p_arr = [];
		if(option == "note") {
			midi_buffer.forEach(function(a) {
				if(a[0] == 144) {
					p_arr.push(a[1]);
				}
			});
		}
		return p_arr;
	}

	//Turning an array of recurring numbers into n-order markov chains *strings.
	function markov_parse(array, n) {
		var i = 0,
			ret_obj = {};
		for(i = 0; i <= array.length; i++) {
			if(array[i+n]) {
				if(!ret_obj[array.slice(i, i+n)]) {
					ret_obj[array.slice(i, i+n)] = [];
				}
				ret_obj[array.slice(i, i+n)].push(array[i+n].toString());
			}
		}
		return ret_obj;
	}
	
	function pick(array) {
		var rand = Math.random();
		return array[Math.round(map(rand, 0, 1, 0, array.length - 1))];
	} //why haven't I done this already
	
	//string parse integer array
	function spia(str="") {
			var a = str.split(",");
			a.map(function(b){return parseInt(b);});
		}
	
	//abstract markov chains?
	
	//public
	return {
		
		init: function() {
			if (navigator.requestMIDIAccess) {
				navigator.requestMIDIAccess({sysex: false}).then(
					function(midiAccess) {
						alert("MIDI is fine");
						midi = midiAccess;
						var inputs = midi.inputs.values();
						for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
							input.value.onmidimessage = function(message) {
								//log note length too eventually
								if(midi_buffer.length < max_buffer) {
									midi_buffer.push(message.data);
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
		
		//Just notes for now
		mprel: function(n) {
			return markov_parse(parse_buffer("note"), n);
		},
		
		//generate a markov chain from the current midi buffer 
		mwalk: function(n, ssn = 0, max_rep = 2) {
			var markov_obj = this.mprel(n),
				walk = [], //The resulting walk
				opn = Object.getOwnPropertyNames(markov_obj),
				ss = pick(opn), //starting state
				cs = ss, //current state
				i = 0;
			if(ss === undefined) {
				console.error("No starting state found");
				return;}
			if(ssn != 0) {
				ss = opn[ssn];
			}
			walk.push(...ss.split(","));
			for(i = 0; i < max_rep; i++) {
					if(markov_obj[cs]) {
					walk.push(pick(markov_obj[cs]));
						//from end - n to end
					cs = walk.slice(walk.length - n, walk.length);
				}
				else {
					console.log("Ran out of combinations");
					break;
				}
			}
			//What if we can't find the combination we're looking for? Do we break? Do we look for a lower order?
			return walk; 
		}
		
	};
})();
MIDIm.init();

function mwreg(arr) {
	var ret_arr = [];
	//For the sake of testing let's generate some notes
	arr.forEach(function(note){
		ret_arr.push([note, 0.2]);
	});
	return ret_arr;
}

function create_synth(){
    var bus_num = create_new_bus(context.destination);
    set_bus_gain(bus_num, 0.3);
}

//playNoteSequence(0, 0, mwreg(MIDIm.mwalk(2, 0, 10)))

waa_init();
create_synth();
start_bus(0);