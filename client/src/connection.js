var API_KEY = "lwjd5qra8257b9"

function Connection(id, server) {
  if (server) {
    console.log("Serving ...")
    this.serve(id)
  }
  else {
    console.log("Connecting ...")
    this.connect(id)
  }
}

Connection.prototype.connect = function(serverId) {

  var self = this
  this.peer = new Peer({key : API_KEY})

  this.peer.on("error", function(err) {
    console.log("error " + err)

    // Unable to connect to server, become server ourself
    console.log("No server found, creating one...")
    self.serve(serverId)
  })

  this.peer.on("open", function(id) {
    console.log("you are", id)
    self.id = id
  })

  this.clientToServerConn = this.peer.connect(serverId)

  this.clientToServerConn.on("error", function(err) {
    console.log("error " + err)
  })

  this.clientToServerConn.on("open", function() {
    console.log("Connected to server")
  })

  this.clientToServerConn.on("data", function(data) {
    console.log("Server data", data)
  })
}

Connection.prototype.serve = function(id) {
  var self = this
  
  this.peer = new Peer(id, {key : API_KEY})
  this.id = id

  // In case this was previously a client, delete the client to host connection
  delete this.clientToServerConn

  this.clients = {}

  this.peer.on("connection", function(conn) {
    console.log("Peer connected ", conn.id, conn.label, conn.peer)

    self.clients[conn.peer] = conn

    conn.on("data", function(data) {
      console.log("Received from client " + data)
    })

    conn.on("close", function() {
      delete self.clients[conn.peer]
      console.log("User closed")
    })
  })

  this.peer.on("open", function(id) {
    console.log("server opened")
  })
}

Connection.prototype.send = function(data, receiver) {
  if (this.clientToServerConn) {
    this.clientToServerConn.send(data)
  }
  else if (receiver && this.clients && this.clients[receiver]) {
    this.clients[receiver].send(data)
  }
}

module.exports = Connection
