var emitter = require("component/emitter")

var API_KEY = "lwjd5qra8257b9"
var nameCounter = 0

function Connection() {
  this.players = {}
  this.on("setname", onSetName.bind(this))
  this.on("players", onPlayers.bind(this))
  this.on("playerenter", onPlayerEnter.bind(this))
  this.on("playerexit", onPlayerExit.bind(this))
}

Connection.prototype = {
  send: function send(event, obj, opts) {
    if (opts == void 0) opts = {}

    var clients = this.clients
    var server = this.server

    var data = {
      event : event,
      context : obj,
      sender : opts.sender || this.peer.id,
      relay: opts.relay
    }

    // If we are just a client send it now.
    if (!this.isServer()) return server.send(data)

    // Handle relaying of data.
    if (clients[data.relay]) return clients[data.relay].send(data)

    // Re-send ourself the event, because we are not a client.
    this.emit(data.event, data)

    // As server broadcast to all clients if there is no relay automatically.
    Object.keys(clients).forEach(function (key) {
      clients[key].send(data)
    })
  },

  connect: function connect(room) {
    this.room = room

    var peer = this.peer = new Peer({key : API_KEY})
    peer.once("error", onJoinError.bind(this))
    peer.once("open", onClientIdAssigned.bind(this))

    var conn = this.server = peer.connect(room)
    conn.on("open", onConnectedToServer.bind(this))
    conn.on("data", onServerData.bind(this))
    conn.on("close", onServerDisconnected.bind(this))
  },

  isServer : function isServer() {
    return !!this.clients
  },

  generateName: function () {
    return "P" + ++nameCounter
  }
}

function onClientIdAssigned(id) {
  console.log("You are", this.peer.id)
}

function onConnectedToServer() {
  console.log("Connected to server")
}

function onJoinError(err) {
  console.log("Unable to join room, starting up new server", err)

  // Kill any connections so that client doesn't end up joining to self
  this.peer.disconnect()

  serve.call(this)
}

function onServerData(data) {
  console.log("Received data from server", data)
  this.emit(data.event, data)
}

function onServerDisconnected() {
  console.log("Server dced! Migrating")
  migrate.call(this)
}

function onClientData(conn, data) {
  console.log("Received client data", data)

  var relay = data.relay || ""

  // If directed at a user other than us, forward data.
  if (relay != this.peer.id)
    return this.send(data.event, data.context, data)

  // If directed at the server emit it.
  if (relay == this.peer.id)
    return this.emit(data.event, data)

  this.send(data.event, data.context, data)
  this.emit(data.event, data)
}

function onClientDisconnected(conn) {
  delete this.clients[conn.peer]
  delete this.players[conn.peer]

  this.send("playerexit", this.players[conn.peer])
  console.log("User closed", conn)
}

function onClientConnected(conn) {
  conn.on("data", onClientData.bind(this, conn))
  conn.once("close", onClientDisconnected.bind(this, conn))
  this.clients[conn.peer] = conn
  this.players[conn.peer] = {
    id: conn.peer,
    name: this.generateName()
  }
  console.log("Client connected ", conn.peer, conn.id)

  setTimeout((function(){
    this.send("playerenter", this.players[conn.peer])
    this.send("players", this.players, {relay: conn.peer})
  }).bind(this), 250)
}

function sendPlayerUpdate (send, player) {
  var obj = {}
  obj[player.id] = player
  send("players", obj)
}

function onSetName (e) {
  this.players[e.sender].name = e.context
  sendPlayerUpdate(this.send.bind(this), this.players[e.sender])
}

function onPlayers (e) {
  var players = this.players
  Object.keys(e.context).forEach(function (id) {
    players[id] = e.context[id]
  })
}

function onPlayerEnter (e) {
  this.players[e.context.id] = e.context
}

function onPlayerExit (e) {
  console.log("Player exited", e)
  delete this.players[e.context.id]
}

function onServerStarted() {
  console.log("server started")
  this.players[this.peer.id] = {
    id: this.peer.id,
    name: this.generateName(),
    isHost: true
  }
  this.send("playerenter", this.players[this.peer.id])
}

function onServerError (e) {
  console.log("Server error:", e)
  if (e.type === "unavailable-id") {
    this.connect(this.room)
  }
}

function serve() {
  // In case this was previously a client, delete the client to host connection
  delete this.server
  nameCounter = 0
  this.clients = {}

  var peer = this.peer = new Peer(this.room, {key : API_KEY})
  peer.once("open", onServerStarted.bind(this))
  peer.on("connection", onClientConnected.bind(this))
  peer.on("error", onServerError.bind(this))
}

function migrate() {
  var id = this.peer.id
    , players = this.players
    , nextHostId = Object.keys(players).filter(function (id) {
      return !players[id].isHost
    })[0]

  console.log("next host", nextHostId)
  
  // Serve if we are next in line.
  if (id === nextHostId)
    serve.call(this, id)
  else if (nextHostId)
    this.connect(nextHostId)
}

emitter(Connection.prototype)

module.exports = Connection
