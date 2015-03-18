var emitter = require("component/emitter")

var API_KEY = "98bn0vxj6aymygb9"

// Max ping packets to send
var MAX_PINGS = 15
// Smaller amount of ping packets before we can accurately get latency & server time
var MIN_PINGS = 5

var nameCounter = 0
var pingCounter = 0
var networkIdCounter = 0x10000

function Connection() {
  this.players = {}
  this.on("setname", onSetName.bind(this))
  this.on("players", onPlayers.bind(this))
  this.on("playerenter", onPlayerEnter.bind(this))
  this.on("playerexit", onPlayerExit.bind(this))
  this.on("ping", onPing.bind(this))
  this.on("pong", onPong.bind(this))
  this.on("servertime", onServerTime.bind(this))
}

Connection.prototype = {
  send: function send(event, obj, opts) {
    if (opts == void 0) opts = {}

    var clients = this.clients
    var server = this.server
    var connType = opts.reliable ? "reliable" : "unreliable"

    var data = {
      event : event,
      context : obj,
      sender : opts.sender || this.peer.id,
      relay: opts.relay,
      broadcast: opts.broadcast,
      reliable: opts.reliable
    }

    // If we are just a client send it now.
    if (!this.isServer()) 
      return server[connType] ? server[connType].send(data) : 0

    // Handle relaying of data.
    if (clients[data.relay])
      return clients[data.relay][connType] ? clients[data.relay][connType].send(data) : 0

    // Re-send ourself the event, because we are not a client and we are broadcasting
    this.emit(data.event, data)

    // As server broadcast to all clients if there is no relay automatically.
    Object.keys(clients).forEach(function (key) {
      if (clients[key][connType])
        clients[key][connType].send(data)
    })
  },

  connect: function connect(room) {
    console.log("connecting to", room)
    this.room = room

    var peer = this.peer = new Peer({key : API_KEY})
    peer.once("error", onJoinError.bind(this))
    peer.once("open", onClientIdAssigned.bind(this))
    peer.on("connection", function (e) { console.log("connection!", e) })
    peer.on("call", function (e) { console.log("call!", e) })
    peer.on("close", function (e) { console.log("close!", e) })
    peer.on("disconnected", function (e) { console.log("disconnected!", e) })
  },

  kill: function kill() {
    this.peer.disconnect()
    this.emit("connectionkill")
    console.log("connection killed")
  },

  isServer : function isServer() {
    return !!this.clients
  },

  generateName: function () {
    return "P" + ++nameCounter
  },

  getServerTime: function getServerTime() {
    var serverTimeOffset = this.serverTimeOffset
    return Date.now() / 1000 + (serverTimeOffset ? serverTimeOffset : 0)
  },

  isOwnId: function(id) {
    return id === this.peer.id
  },
}

function onClientIdAssigned(id) {
  console.log("You are", this.peer.id)
  removeServerListeners.call(this)

  var server = this.server = {
    unreliable: this.peer.connect(this.room),
    reliable: this.peer.connect(this.room, {reliable: true})
  }

  Object.keys(server).forEach((function (type) {
    var conn = server[type];
    conn.on("open", onConnectedToServer.bind(this))
    conn.on("data", onServerData.bind(this))
    conn.on("close", onServerDisconnected.bind(this))
    conn.on("error", onServerError.bind(this))
  }).bind(this));
}

function removeServerListeners() {
  var server = this.server
  if (server) {
    Object.keys(server).forEach(function(type) {
      server[type].removeAllListeners()
    })
  }
}

function onConnectedToServer() {
  console.log("Connected to server")
  this.connected = true
}

function onJoinError(err) {
  console.log("Unable to join room, starting up new server", err)
  // Kill any connections so that client doesn't end up joining to self
  this.peer.disconnect()
  serve.call(this)
}

function onServerData(data) {
  //console.log("Received data from server", data)
  this.emit(data.event, data)
}

function onServerTime(data) {
  if (this.isServer()) return

  console.log("onServerTime")
  var serverTime = data.context.time + data.context.latency / 2
  this.serverTimeOffset = serverTime - Date.now() / 1000
  console.log("Round trip time", data.context.latency)
  this.latency = data.context.latency
}

function onServerDisconnected() {
  migrate.call(this)
}

function onClientData(conn, data) {
  // console.log("Received client data", data)

  var relay = data.relay || ""
  var broadcast = data.broadcast

  // If directed at a user other than us, forward data.
  if (!broadcast && relay && relay != this.peer.id)
    return this.send(data.event, data.context, data)

  // If directed at the server emit it.
  if (relay == this.peer.id || !broadcast) return this.emit(data.event, data)

  // broadcast
  this.send(data.event, data.context, data)
}

function onClientDisconnected(conn) {
  var client = this.clients[conn.peer]
  var connType = conn.reliable ? "reliable" : "unreliable"
  if (client && client[connType]) {
    delete client[connType]
  }

  // Both connections removed?
  if (!client.reliable && !client.unreliable) {
    this.send("playerexit", this.players[conn.peer])
    delete this.players[conn.peer]
    delete this.clients[conn.peer]
  }

  console.log("User closed", conn)
}

function onClientConnected(conn) {
  console.log(conn.reliable ? "Reliable" : "Unreliable", " cient connected ", conn.peer)

  var player = this.players[conn.peer] = {
    id: conn.peer,
    name: this.generateName()
  }

  var client = this.clients[conn.peer] = this.clients[conn.peer] || {}
  client[conn.reliable ? "reliable" : "unreliable"] = conn

  conn.on("data", onClientData.bind(this, conn))
  conn.once("close", onClientDisconnected.bind(this, conn))

  conn.once("open", (function(conn){
    if (conn.reliable) {
      // Send new player info to everyone including new player
      this.send("playerenter", player, {reliable: true})
      // Send updated players listing to new player
      this.send("players", this.players, {relay: player.id, reliable: true})
    }
    else {
      pingClient.call(this, player.id, MAX_PINGS)
    }
  }).bind(this, conn))
}

function pingClient(id, times) {
  times = times || 1

  while (times-- > 0) {
    setTimeout((function(){
      this.send("ping", {time : Date.now() / 1000, which : pingCounter++}, {relay : id})
    }).bind(this), times * 250)
  }
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
  console.log("players updated")
}

function onPlayerEnter (e) {
  this.players[e.context.id] = e.context
  console.log("playerenter", e.context.id)
}

function onPlayerExit (e) {
  console.log("onPlayerExit", e)
  if (e.context && this.players[e.context.id])
    delete this.players[e.context.id]
}

function onPing(e) {
  // "Pong" back to sender - only if client
  if (!this.isServer())
    this.send("pong", e.context)
}

function onPong(e) {
  if (!this.isServer()) return

  // We received a pong to our ping request.
  var latency = Date.now() / 1000 - e.context.time
  var player = this.players[e.sender]
  var latencies = player.latencies = player.latencies || []
  latencies.push(latency)

  if (latencies.length < MIN_PINGS) return

  // Once we gathered enough packets, we can do a median check to get the latency
  player.latency = latencies.sort()[Math.floor(latencies.length / 2)]
  player.latencies = []

  this.send("servertime", {
    time: Date.now() / 1000,
    latency: player.latency
  })
}

function onServerStarted() {
  console.log("server started")
  this.connected = true
  this.players[this.peer.id] = {
    id: this.peer.id,
    name: this.generateName(),
    isHost: true
  }
  this.send("playerenter", this.players[this.peer.id])
}

function onServerError (e) {
  console.log("Server error:", e)
  if (e.type === "unavailable-id")
    this.connect(this.room)
}

function serve() {
  console.log("starting server")
  // In case this was previously a client, delete the client to host connection
  removeServerListeners.call(this)
  delete this.server
  nameCounter = 0
  this.clients = {}

  var peer = this.peer = new Peer(this.room, {key : API_KEY})
  peer.once("open", onServerStarted.bind(this))
  peer.on("connection", onClientConnected.bind(this))
  peer.on("error", onServerError.bind(this))
}

function migrate() {
  console.log("migrating server")
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
