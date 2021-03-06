var express = require("express")
var app = express()
var http = require("http").createServer(app)
var bodyParser = require("body-parser")
var io = require("socket.io").listen(http)
var _ = require("underscore");

var participants = [];

/* Server config */

//Server's IP address
app.set("ipaddr", "127.0.0.1");

//Server's port number
app.set("port", 8080);

//Specify the views folder
app.set("views", __dirname + "/views");

//View engine is Jade
app.set("view engine", "jade");

//Specify where the static content is
app.use(express.static("public", __dirname + "/public"));

//Tells server to support JSON requests
app.use(bodyParser.json());

/* Server routing */

//Handle route
app.get("/", function(request, response) {

  //To call index
  response.render("index");

});

//POST method to create a message
app.post("/message", function(request, response) {

  //The request body
  var message = request.body.message;

  //Check msg is empty
  if(_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, {error: "Message is invalid"});
  }

  var name = request.body.name;
  io.sockets.emit("incomingMessage", {message: message, name: name});

  response.json(200, {message: "Message received"});

});

io.on("connection", function(socket){

  socket.on("newUser", function(data) {
    participants.push({id: data.id, name: data.name});
    io.sockets.emit("newConnection", {participants: participants});
  });

  socket.on("nameChange", function(data) {
    _.findWhere(participants, {id: socket.id}).name = data.name;
    io.sockets.emit("nameChanged", {id: data.id, name: data.name});
  });

  socket.on("disconnect", function() {
    participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });

});

//Start the http server at port and IP defined before
http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});
