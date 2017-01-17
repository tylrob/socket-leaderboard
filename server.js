//Server
var express = require('express');
var morgan = require('morgan');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('uuid');

app.use(express.static('public'));
app.use(morgan('dev'));

//Mock database
var database = [
	{
		'id': uuid.v4(),
		'athlete': 'Tyler',
		'score': 50
	},
	{
		'id': uuid.v4(),
		'athlete': 'Avery',
		'score': 75
	},
	{
		'id': uuid.v4(),
		'athlete': 'Meris',
		'score': 100
	}
];

var removeFromDb = function(score){
	database = database.filter(function(e) { return e.id !== score.id; });
};

var totalConnections = 0;

io.on('connection', function(socket){
	totalConnections++;
	console.log("Someone connected. total connections: " + totalConnections);
	socket.on('disconnect', function(){
		totalConnections--;
		console.log("Someone disconnected. total connections: " + totalConnections);
	});

	//Create
	socket.on('scores:create', function(score, callback){
		console.log('Server heard scores:create event');
		var score = {
			'id': uuid.v4(),
			'athlete': score.athlete,
			'score': score.score
		};
		
		//save score to our mock database, too
		database.push(score);

		//emit create event back to client
		socket.emit('scores:create', score);
		socket.broadcast.emit('scores:create', score);
	});

	//Read
	socket.on('scores:read', function(data, callback){
		console.log('Server heard scores:read event');

		//send the mock database, a collection of scores, to the client
		callback(null, database);
	});

	//Update
	socket.on('scores:update', function(data, callback){
		console.log('Server heard scores:update event');
	});

	//Delete
	socket.on('scores:delete', function(score){
		console.log('Server heard scores:delete event');
		removeFromDb(score);
		socket.emit('scores/' + score.id + ':delete', score);
		socket.broadcast.emit('scores/' + score.id + ':delete', score);
	});

	//sample code from socketio website as an example
	socket.on('ferret', function (name, fn) {
		var msg = "object";
    	socket.emit('posts:create', "some message");
    	fn('server data');
  	});
});

http.listen(3000, function(){
	console.log("Server is listening on port 3000");
});

