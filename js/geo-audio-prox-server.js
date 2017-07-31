const http = require('http');
const fs = require('fs');
const port = 3000;

const requestHandler = (request, response) => {
    if(request.method == "GET") {
        response.writeHead(200, {'Content-Type' : request.headers["accept"]});
        fs.readFile("../" + request.url, (err, data) => {
        if (err) {throw err;}
        else {
            response.write(data);
            response.end();
        } 
        });
    }
    else if (request.method == "POST") {
        console.log("haha look client wants to post something");
        var jsonString = '';
        request.on('data', function(data) {
           jsonString += data; 
        });
        request.on('end', function() {
            console.log(jsonString);
        });
        response.end();
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