const http = require('http');
const fs = require('fs');
const atob = require('atob');
const jsonfile = require('jsonfile');
const url = require('url');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
//wow

//babby's first server

const port = 80;
const max_json = 1e6; //number of bytes allowed per json upload - 1 MB - who's uploading 3000+ sounds anyways?
const max_audio = 1e7; //number of bytes allowed per audio file upload - 10 MB - people shouldn't bother uploading raw wavs realistically
const rej_url = ["/json/pass.json", "/json/file_hashes.json", "/js/geo-audio-prox-server.js"];

//We need some way of validating URLs and files and making sure they are all playable on the CLIENT AND SERVER to ensure:
//a. Somebody can't upload random and possibly dangerous files to the server
//b. Somebody doesn't try to put a non-sound/non-URL file into the map and then complain that it won't play

//TODO: Restart server if it crashes

//this doesn't explicitly confirm the type; just that it's html5 audio-compatible (returns true/false)
function verify_audio_file(buffer) { 
    var gen_audio_view = [buffer.slice(0, 2), buffer.slice(0, 3), buffer.slice(0, 4)],
        gen_audio_str = ["", "", ""];
    gen_audio_view.forEach(function(uar, index) {
        for(var i = 0; i < uar.length; i++) {
            gen_audio_str[index] += uar[i].toString(16);
        }
    });
    return ((gen_audio_str[0] == "fffb") || (gen_audio_str[1] == "494433") || (gen_audio_str[2] == "664c6143") || (gen_audio_str[2] == "4f676753") || (gen_audio_str[2] == "52494646") || (gen_audio_str[2] == "57415645")); //mp3 is a special snowflake (it gets two file headers that are different sizes, neither of which are the standard 4 bytes)
    //this only checks for magic numbers so you might want to do something a little more sophisticated later
}

function generate_hash(buffer) {
    var hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
}

function validate_sample_URL_array(sample_arr, index = 0, final_callback) { //Is this too heavy?
    if(index == sample_arr.length) {
        final_callback(true);
    }
    else {
        var req = http.request({
            host : url.parse(sample_arr[index][0]).host,
            method : "HEAD",
            path: "/" + url.parse(sample_arr[index][0]).pathname //thanks node.jesus
            //Of course servers require authentication for a HEAD request to a publicly available sound file
            }, 
        function(response) {
            if((response.statusCode == 200) || (response.statusCode == 401)) { //nobody should be dumping API keys into some random server anyways
                //technically the resource exists but we're not authorized to access it (at least I hope that's what 401 means)
                validate_sample_URL_array(sample_arr, index + 1, final_callback);
            }
            else {
                console.log("Invalid URL! Status code: " + response.statusCode);
                console.log("Headers: " + response.rawHeaders);
                final_callback(false);
            }
        });
        req.end();
    }
}

//Sneaky convolution. Never trust it.
function validate_attribute_URL_array(attribute_arr, final_callback) {
    if(!attribute_arr) {
        final_callback(false);
    }
    else {
        var req = http.request({host: url.parse(attribute_arr[0]).host, method : "HEAD", path: "/" + url.parse(attribute_arr[0]).path}, function(response) {
            if(response.statusCode == 200) {
                final_callback(true);
            }
        });
        req.end();
    }
}

//Should probably git ignore this eventually

const requestHandler = (request, response) => {
    if(request.method == "GET") {
        fs.readFile("../" + decodeURI(request.url), (err, data) => {
        if (err) {if (err.code == 'ENOENT') {
            console.error("Requested resource at" + request.url + "does not exist.");
            response.writeHead(404);
            response.end("Requested resource at " + request.url + "does not exist.");
            return;
        }} //this should catch any cases where we request a file that does not exist
        else if (rej_url.indexOf(request.url) != -1) { //Do not let the client access the actual password json
            response.writeHead(404);
            response.end();
            return;
        }
        else {
            if(/\.html/.exec(request.url)) {
                response.writeHead(200, {'Content-Type' : "text/html"});
            }
            else if (/\.json/.exec(request.url)) {
                response.writeHead(200, {'Content-Type' : "application/json"});
                     }
            else {
                response.writeHead(200, {'Content-Type' : request.headers["accept"]});
            }
            response.end(data);
            return;
        } 
        });
    }
    if(request.method == "HEAD") { 
        fs.readFile("../" + decodeURI(request.url), (err, data) => {
            if(err && (err.code == 'ENOENT')) {
                console.error("Requested resource at " + request.url + "does not exist.");
                response.writeHead(404);
                response.end("Requested resource at " + request.url + "does not exist.");
            }
            else {
                response.writeHead(200, {'Content-Type' : request.headers["accept"]});
                response.end();
            }
        });
        
        return;
    }
    //TODO: 414
    else if (request.method == "POST") {
        if(request.headers["content-type"] == 'application/octet-stream') {
            var data_buf = [];
            request.on('data', function(chunk) {
                if(Buffer.concat(data_buf).length > max_audio) {
                    response.writeHead(413);
                    response.end("Uploaded data too large");
                    request.connection.destroy();
                    return;
                }
                data_buf.push(chunk);
            });
            request.on('end', function() {
                var rndstr = Math.floor(Math.random()*Date.now()); //lazy PRNG
                data_buf = Buffer.concat(data_buf);
                jsonfile.readFile("../json/file_hashes.json", function(err, f_hash_obj) {
                    var fhsh = generate_hash(data_buf);
                    if(f_hash_obj[fhsh]) {
                        response.writeHead(200);
                        console.log("Duplicate file");
                        response.end(f_hash_obj[fhsh]);
                        return;
                    }
                    else {
                        if(verify_audio_file(data_buf)) {
                        switch (request.headers["x-filetype"]) {
                            case "audio/mp3":
                                fs.writeFile("../rec_snd/" + rndstr + ".mp3", data_buf, {flags: 'wx'});
                                response.writeHead(200);
                                response.end("rec_snd/" + rndstr + ".mp3");
                                f_hash_obj[fhsh] = "rec_snd/" + rndstr + ".mp3";
                                jsonfile.writeFile("../json/file_hashes.json", f_hash_obj);
                                break;
                            case "audio/wav":
                                fs.writeFile("../rec_snd/" + rndstr + ".wav", data_buf, {flags: 'wx'});
                                response.writeHead(200);
                                response.end("rec_snd/" + rndstr + ".wav");
                                f_hash_obj[fhsh] = "rec_snd/" + rndstr + ".wav";
                                jsonfile.writeFile("../json/file_hashes.json", f_hash_obj);
                                break;
                            case "audio/ogg":
                                fs.writeFile("../rec_snd/" + rndstr + ".ogg", data_buf, {flags: 'wx'});
                                response.writeHead(200);
                                response.end("rec_snd/" + rndstr + ".ogg");
                                f_hash_obj[fhsh] = "rec_snd/" + rndstr + ".ogg";
                                jsonfile.writeFile("../json/file_hashes.json", f_hash_obj);
                                break;
                            case "audio/flac":
                                fs.writeFile("../rec_snd/" + rndstr + ".flac", data_buf, {flags: 'wx'});
                                response.writeHead(200);
                                response.end("rec_snd/" + rndstr + ".flac");
                                f_hash_obj[fhsh] = "rec_snd/" + rndstr + ".flac";
                                jsonfile.writeFile("../json/file_hashes.json", f_hash_obj);
                                break;
                            default:
                                response.writeHead(400);
                                response.end();
                                break;
                               }
                    }
                    return;
                    }
                });
            });
        }
        else {
            var jsonString = '';
            request.on('data', function(data) {
                jsonString += data;
                if(jsonString.length > max_json) {
                    jsonString = "";
                    response.writeHead(413);
                    response.end("Request entity too large");
                    request.connection.destroy();
                    return;
                }
            });
            request.on('end', function() {
                var np, set_name, password;
                if(request.headers.authorization) {
                    np = atob(request.headers.authorization.replace(/Basic/,'')).split(":");
                    set_name = np[0].replace(/\W/,'');
                    password = np[1];
                    //Check to see that the name doesn't contain any funky stuff
                    if(/\W/.exec(np[0])) {
                        response.writeHead(400);
                        response.end("Invalid characters detected: Only alphanumerics and underscores allowed in set name");
                        return;
                    }
                    var json_obj;
                    try {json_obj = JSON.parse(jsonString)} catch(e) {
                        //Check to see if it's valid JSON
                        response.writeHead(400);
                        response.end("Cannot parse request");
                        return;
                    }
                    //Validate URLs
                    validate_sample_URL_array(json_obj.sample_set, 0, function(state) {
                        if(!state) {
                            console.log("Invalid URLs detected");
                            response.writeHead(400);
                            response.end("Invalid URLs detected in upload");
                            return;
                        }
                        //Attributes
                        validate_attribute_URL_array(json_obj.attributes, function(state)
                            {
                            if(!state) {
                            console.log("Invalid URLs detected");
                            response.writeHead(400);
                            response.end("Invalid URLs detected in upload");
                            return;
                        }
                            if(state) { //>>>>CALLBACKS
                                if(set_name == "custom") {
                                    console.log("'Custom' name reserved.");
                                    response.writeHead(403);
                                    response.end("'Custom' is reserved by the application");
                                    return;
                                }
                                //check if we already have that name
                                jsonfile.readFile("../json/meta.json", function(err, meta_obj) {
                                    if(meta_obj.indexOf(set_name) != -1) {
                                        //we are updating
                                        //Check it with password in database (if there's no password then ok the change)
                                        jsonfile.readFile("../json/pass.json", function(err, file_obj) {
                                            if(err) {
                                                response.writeHead(404);
                                                response.end();
                                                return;
                                            }
                                            //encrypt mister server sid!
                                            bcrypt.compare(password, file_obj[set_name], function(err, res) {
                                                if ((res == true) || (file_obj[set_name] === undefined)) {
                                                    //Overwrite JSON file for samples
                                                    jsonfile.writeFile("../json/geo_audio_samples_" + set_name + ".json", json_obj.sample_set);
                                                    //Attributes
                                                    jsonfile.writeFile("../json/geo_audio_attributes_" + set_name + ".json", json_obj.attributes);
                                                    console.log("Updating set " + set_name);
                                                    response.writeHead(200);
                                                    response.write("OK");
                                                    response.end();
                                                    return;
                                                }
                                                else {
                                                    response.writeHead(401);
                                                    response.write("Incorrect password.");
                                                    response.end();
                                                    return;
                                                }    
                                            });
                                        });
                                        } 
                                    else {
                                        //we are posting.
                                        console.log("Posting set " + set_name);
                                        //Input password and name into database
                                        jsonfile.readFile("../json/pass.json", function(err, file_obj) {
                                            
                                            if(password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {file_obj[set_name] = "";} //sha256 empty string
                                            else {
                                                bcrypt.hash(password, 10, function(err, hash) {file_obj[set_name] = hash; jsonfile.writeFile("../json/pass.json", file_obj);});
                                            }
                                        });
                                        jsonfile.readFile("../json/meta.json", function(err, file_obj) {
                                            file_obj.push(set_name)
                                            jsonfile.writeFile("../json/meta.json", file_obj);
                                        });
                                        //Create new JSON file for samples
                                        jsonfile.writeFile("../json/geo_audio_samples_" + set_name + ".json", json_obj.sample_set, {flag: "wx"});
                                        //Attributes
                                        jsonfile.writeFile("../json/geo_audio_attributes_" + set_name + ".json", json_obj.attributes, {flag: "wx"});
                                        response.writeHead(200);
                                        response.end();
                                        return;
                                    }
                                }); //this is where the meta readFile ends
                            }
                        });
                    });
                } //authorization check
            });
        }
    }
}; //(internally screaming)


const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if(err) {
        return console.log('something bad happened', err)
    }

    console.log('server is listening on ' + port)
});

//node geo-audio-prox-server.js