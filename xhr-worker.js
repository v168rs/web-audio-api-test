var requesting_arr = [], //Avoid making concurrent XHR requests for the same files
    playing_arr = [], //Avoid making XHR requests for files that are already playing
    xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";

//Every time we send something back to the main script, use a postMessage
onmessage = function(e) {
    if(e.data[0] == "xhr") {
        var url_array = e.data[1],
            url_iterator = url_array[Symbol.iterator](),
            n1 = url_iterator.next(),
            name,
            n2;
        if (requesting_arr.find(function(c){return c == n1.value; }) || playing_arr.find(function(c){return c == n1.value; })) {
            //console.log("duplicate request for first element " + n1.value);
        }
        else{
            i = 0;
        xhr.onload = function (b) {
            //console.log("clearing request for first element " + n1.value);
            requesting_arr.splice(requesting_arr.findIndex(function(c){return c == n1.value; }), 1);

            postMessage([xhr.response, i, name], [xhr.response]);
            //Array then gets passed to the function

            if (n2 instanceof String) {
                requesting_arr.splice(requesting_arr.findIndex(function(c){return c == n2.value; }), 1);
                //console.log("clearing request for other element " + n1.value);
            }
            n2 = url_iterator.next();
            if (requesting_arr.find(function(c){return c == n2.value; }) || playing_arr.find(function(c){return c == n2.value; })) {
                //console.log("duplicate request for other element " + n2.value);
            }

            else {
                i++;
                if(n2.done == false) {
                    name = n2.value;
                    //console.log("requesting other element " + n2.value);
                    requesting_arr.push(n2.value);
                    xhr.open("GET", n2.value, true);
                    xhr.send();
                }
                else {
                    //console.log("xhr complete!");
                }
            }
        };
        name = n1.value;
        //console.log("requesting first element " + n1.value);
        requesting_arr.push(n1.value);
        xhr.open("GET", n1.value, true);
        xhr.send();
        }
    }
    else if(e.data[0] == "del_pl") {
        playing_arr.splice(playing_arr.findIndex(function(c){return c == e.data[1]; }), 1);
    }
    else if(e.data[0] == "push_pl") {
        playing_arr.push(e.data[1]);
    }
}