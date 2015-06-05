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
  if(req.query.name !== undefined && req.query.name != "") {
    var address = "/rooms/" + req.query.name + "/"
    if(req.query.maxPlayers !== undefined) {
      address += "?maxPlayers=" + req.query.maxPlayers
    }
    res.redirect(address)
  }
  else {
    var foundRoom = false
    for (var room in rooms) {
      if(rooms[room].playerCount < rooms[room].maxPlayers) {
        res.redirect("/rooms/" + rooms[room].name)
        foundRoom = true
        break;
      }
    }
    if(foundRoom === false) {
      res.redirect("/rooms/" + random())
    }
  }
})

// Opens game room.
app.post('/quit\/[^.\/]+\/?$', function (req, res) {
  var name = req.url.substr(req.url.lastIndexOf("/") + 1)

  if(rooms[name] != undefined) {
    if(rooms[name].playerCount <= 1) {
      delete rooms[name]
    }
    else {
      rooms[name].playerCount -= 1
    }
    console.log("Player left room " + name)
  }
  return res.send("quitter")
});

// Opens game room.
app.get('/rooms\/[^.\/]+\/?$', function (req, res) {
  var name = req.url.substr(req.url.indexOf("/") + 1)
  name = name.substr(name.indexOf("/") + 1)

  jade.renderFile("./html.jade", {}, function(err, html) {
    if (!err) {
      if(rooms[name] == undefined) {
        var maxPlayers = 8
        if(req.query.maxPlayers !== undefined && req.query.maxPlayers > 1) {
          maxPlayers = req.query.maxPlayers
        }
        rooms[name] = { playerCount: 1, maxPlayers: maxPlayers, name: name }
        console.log("Player created room " + name + ".  Max players is " + maxPlayers)
      }
      else {
        rooms[name].playerCount += 1
        console.log("Player joined room " + name)
      }
      return res.send(html)
    }
    else {
        res.status(503).send("Could not render the page.")
    }
  });
});

app.listen(1337)