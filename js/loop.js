var param1 = 0;

function make_piano_loop() {
	var bus_num = create_new_bus(context.destination, false);
	add_queuer_sampler(bus_num, "snd/loop/piano.wav", false, ["snd/loop/chiffy1.wav", "snd/loop/chiffy2.wav", "snd/loop/chiffy3.wav"]);
	add_convolution(bus_num);
	add_filter(bus_num);
}

//Mostly copied from index.js
//phase vocoder somehow?

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
	make_piano_loop();
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
	soundMorph((color_V === 1) ? 0 : map(color_V, 0, 1, 200, 5000), buses[0][1][0].frequency, 0.1);
    param1 = (color_V === 1) ? param1 : Math.round(map(color_V, 0, 1, 0, 2));
    }

document.getElementById("data_pic_slider").oninput = function() {
		swapImages("img/data/lstd_0" + (parseInt(document.getElementById("data_pic_slider").value) + 1) + "_c.png", "img/data/lstd_0" + (parseInt(document.getElementById("data_pic_slider").value) + 1) + "_gs.png");
    }

screen_init();