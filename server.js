var express = require("express")
var jade    = require("jade")
var random  = require("random-word")

var app = express()
app.enable("trust proxy")
app.use(express.static("./client/bin"))
app.use(express.static("./client/assets"))

// Stores list of in use rooms
var rooms = []

app.get('/', function (req, res){
	jade.renderFile("./index.jade", {}, function(err, html) {
    if (!err) return res.send(html)
    res.status(503).send("Could not render the page.")
  });
})

// Redirects client to random game room.
app.get('/rooms\/$', function (req, res){
	if(req.query.name != undefined)
	{
		res.redirect("/rooms/" + req.query.name)
	}
	else
	{
		res.redirect("/rooms/" + random())
	}
})

// Opens game room.
app.post('/quit\/[^.\/]+\/?$', function (req, res) {
	var name = req.url.substr(req.url.lastIndexOf("/") + 1)

	console.log("Client left room " + name)
	if(rooms[name] != undefined)
	{
		if(rooms[name] <= 1)
		{
			delete rooms[name]
		}
		else
		{
			rooms[name] -= 1
		}
	}
	return res.send("quitter")
});

// Opens game room.
app.get('/rooms\/[^.\/]+\/?$', function (req, res) {
	var name = req.url.substr(req.url.lastIndexOf("/") + 1)

	jade.renderFile("./html.jade", {}, function(err, html) {
		if (!err)
		{
			console.log("Client joined room " + name)
			if(rooms[name] == undefined)
			{
				rooms[name] = 1
			}
			else
			{
				rooms[name] += 1
			}
			console.log(rooms[name])
			return res.send(html)
		}
		else
		{
		    res.status(503).send("Could not render the page.")
		}
	});
});

app.listen(1337)