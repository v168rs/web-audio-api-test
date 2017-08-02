const http = require('http');
const fs = require('fs');
const atob = require('atob');
const jsonfile = require('jsonfile');
const port = 3000;

//to fail on existing files
//fs.open(path, "wx", function (err, fd) {
//fs.close(fd, function(err) {
//
//});
//})

//Should probably git ignore this eventually

const requestHandler = (request, response) => {
    if(request.method == "GET") {
        fs.readFile(".." + request.url, (err, data) => {
        if (err) {if (err.code = 'ENOENT') {
            console.error("Requested resource at" + request.url + "does not exist.");
            response.writeHead(404);
            response.end();
            return;
        }}
        else if (request.url == "/json/pass.json") { //Do not let the client access the actual password json
            response.writeHead(404);
            response.end();
            return;
        }
        else {
            response.writeHead(200, {'Content-Type' : request.headers["accept"]});
            response.write(data);
            response.end();
            return;
        } 
        });
    }
    else if (request.method == "POST") {
        var jsonString = '';
        request.on('data', function(data) {
            jsonString += data;
            if(jsonString.length > 1e8) {
                jsonString = "";
                response.writeHead(413);
                response.end();
                console.log("Flood detected");
                request.connection.destroy();
                return;
            }
        });
        request.on('end', function() {
            var np, set_name, password;
            if(request.headers.authorization) {
                np = atob(request.headers.authorization.replace(/Basic/,'')).split(":");
                set_name = np[0];
                password = np[1];
                //Check to see that the name doesn't contain any funky stuff
                if(/[\[\]\<\>!|?\{\}\\:;\(\)*+=&^%$]+/.exec(set_name)) {
                    response.writeHead(401);
                    response.write("Invalid characters detected. Only alphanumerics, spaces, and underscores allowed in set name.");
                    response.end();
                    return;
                }
                var json_obj;
                try {json_obj = JSON.parse(jsonString)} catch(e) {
                    //Check to see if it's valid JSON
                    response.writeHead(400);
                    response.write("Cannot parse request");
                    response.end();
                    return;
                }
                //Validate URL
                //Validate filetype
                if(set_name == "custom") { //this is reserved.
                    console.log("'Custom' name reserved.");
                    response.writeHead(401);
                    response.write("'custom' is reserved by the application.");
                    response.end();
                    return;
                }
                //check if we already have that name...
                jsonfile.readFile("../json/meta.json", function(err, meta_obj) {
                    if(meta_obj.indexOf(set_name) != -1) {
                        //we are updating.
                        //Check it with password in database (if there's no password then ok the change)
                        jsonfile.readFile("../json/pass.json", function(err, file_obj) {
                            if((file_obj[set_name] == password) || (file_obj[set_name] == "")) { //hash browns
                                //Overwrite JSON file for samples...
                                jsonfile.writeFile("../json/geo_audio_samples_" + set_name + ".json", json_obj.sample_set);
                                //Attributes...
                                jsonfile.writeFile("../json/geo_audio_attributes_" + set_name + ".json", json_obj.attributes);
                                console.log("Updating set" + set_name);
                                response.writeHead(200);
                                response.write("OK");
                                response.end();
                                return;
                            }
                            else {
                                console.log("Invalid password.");
                                response.writeHead(401);
                                response.write("Incorrect password.");
                                response.end();
                                return;
                            }
                        });
                        } 
                    else {
                        //we are posting.
                        console.log("Posting set" + set_name);
                        //Input password and name into database
                        jsonfile.readFile("../json/pass.json", function(err, file_obj) {
                            file_obj[set_name] = password; //who really cares if people get these tbh
                            jsonfile.writeFile("../json/pass.json", file_obj);
                        });
                        jsonfile.readFile("../json/meta.json", function(err, file_obj) {
                            file_obj.push(set_name)
                            jsonfile.writeFile("../json/meta.json", file_obj);
                        });
                        //Create new JSON file for samples...
                        jsonfile.writeFile("../json/geo_audio_samples_" + set_name + ".json", json_obj.sample_set, {flag: "wx"});
                        //Attributes...
                        jsonfile.writeFile("../json/geo_audio_attributes_" + set_name + ".json", json_obj.attributes, {flag: "wx"});
                        response.writeHead(201);
                        response.write("Created"); //URI should go in response
                        response.end();
                        return;
                    }
                });
        }});
    };
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if(err) {
        return console.log('something bad happened', err)
    }

    console.log('server is listening on ' + port)
});

//node geo-audio-prox-server.js