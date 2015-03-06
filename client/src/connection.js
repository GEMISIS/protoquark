var emitter = require("component/emitter")

var API_KEY = "lwjd5qra8257b9"

function Connection(room) {
  this.room = room
}

Connection.prototype = {
  send: function send(event, obj, receiver) {
    var clients = this.clients
      , clientToServerConn = this.clientToServerConn

    var data = {
      event : event,
      context : obj,
      sender : this.id
    }

    if (this.isServer()) {
      if (receiver && clients[receiver]) {
        clients[receiver].send(data)
      }
      else if (!receiver) {
        this.emit(event, data)

        // Sendall
        for (var key in clients) {
          if (clients[key]) {
            clients[key].send(data)
          }
        }
      }
    }
    else if (clientToServerConn) {
      clientToServerConn.send(data)
    }
  },

  connect: function connect() {
    var peer = this.peer = new Peer({key : API_KEY})
    peer.on("error", onJoinError.bind(this))
    peer.on("open", onClientIdAssigned.bind(this))

    var clientToServerConn = this.clientToServerConn = peer.connect(this.room)
    clientToServerConn.on("open", onConnectedToServer.bind(this))
    clientToServerConn.on("data", onServerData.bind(this))
  },

  isServer : function isServer() {
    return !!this.clients
  }
}

function onClientIdAssigned(id) {
  console.log("You are", id)
  this.id = id
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

function onClientData(data) {
  var conn = arguments[0]

  console.log("Received client data", data)
  this.emit(data.event, data)
}

function onClientDisconnected() {
  var conn = arguments[0]
  delete this.clients[conn.peer]
  console.log("User closed", conn)
}

function onClientConnected(conn) {
  console.log("Client connected ", conn.peer, conn.id)

  this.clients[conn.peer] = conn

  conn.on("data", onClientData.bind(this, conn))
  conn.on("close", onClientDisconnected.bind(this, conn))
}

function onServerStarted() {
  console.log("server started")
  this.id = this.room
}

function serve() {
  // In case this was previously a client, delete the client to host connection
  delete this.clientToServerConn
  this.clients = {}

  var peer = this.peer = new Peer(this.room, {key : API_KEY})
  peer.on("connection", onClientConnected.bind(this))
  peer.on("open", onServerStarted.bind(this))
}

emitter(Connection.prototype)

module.exports = Connection
