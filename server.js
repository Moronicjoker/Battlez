var http = require('http');
var url = require('url');
var fs = require('fs');
var mime = require('mime');
var WebSocketServer = require('websocket').server;

// HTTP Server
var server = http.createServer(function(req, res) {
	var reqObject = url.parse(req.url, true);
	var action = reqObject.pathname;
	console.log('action: -',action,'-');
	try {
		if(action == '/'){
			var file = fs.readFileSync('./index.html');
			res.writeHead(200, {'content-type': 'text/html'});
		} else {
			if( action != '/server.js' && action != '/mongoDB.js' ) {
				var file = fs.readFileSync('.'+action);	
				res.writeHead(200, {'Content-Type': mime.lookup('.'+action)});
			} else {
				res.writeHead(404, {'Content-Type': 'text/html'});
				res.end(req.url + " not found.");
				return;
			};
		};
	} catch (e) {
		if (e.code === 'ENOENT') {
			console.log('File not found!');
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.end(req.url + " not found.");
			return;
		} else {
			throw e;
		}
	};
	res.end(file, 'binary');
	// to use port 80 on ubuntu: sudo node JSFILE
}).listen(80);

// WEBSOCKET Server
wsServer = new WebSocketServer({
	httpServer: server
});
var connectionIDCounter = 0;
var allConnections = {};

wsServer.on('request',function(request) {
	var connection = request.accept(null,request.origin);
	connection.id = (connectionIDCounter ++).toString();
	//connection.authenticated = false;
	allConnections[connection.id] = connection;
	
	sendMessageToClient( connection.id, {msg:'connectionId', id: connection.id } );

	// on message
	connection.on('message',function(message){
		var msgObject = JSON.parse(message.utf8Data);
		console.log('incoming msgObject: ',connection.id,msgObject);
		
		//if( connection.authenticated !== false) {
		for( singleConnection in allConnections ){
			allConnections[singleConnection].send(message.utf8Data);
		};

	}); // end of message handling

	// on close
	connection.on('close',function() {
		delete allConnections[connection.id];
	});
});

GLOBAL.sendMessageToClient = function(connectionID,msgObject) {
	console.log('connectionID: ',connectionID);
	console.log('msgObject: ',msgObject);
	msgObject = JSON.stringify(msgObject);
	allConnections[connectionID].send(msgObject);
};