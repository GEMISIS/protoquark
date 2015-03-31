var ons = {
  connected: "You connection to the server has been established.",
  opening: "Opening connection.",
  connectionkill: "Your connection was killed.",
  migration: "Please wait while P2P server is migrating.",
  peeridassigned: "Peer assigned, connecting to the server.",
  createdserver: "Server created.",
  createserver: "Creating server...",
  createservererror: "An error occured while creating the server."
}

function onStatusEvent (ev, message) {
  var el = this.el
  el.textContent = message
  el.classList.add('active')

  if (ev == 'connectionkill' || ev == 'createservererror') {
    el.classList.add('error')
  }
  else {
    el.classList.remove('error')
  }

  if (ev == 'connected' || ev == 'createdserver') {
    el.classList.add('success')
    setTimeout(function () {
      el.classList.remove('active')
    }, 2000)
  }
  else {
    el.classList.remove('success')
  }
}

function Status (connection) {
  var self = this
  this.conn = connection
  this.el = document.createElement('label')
  this.el.className = "connection-status"
  Object.keys(ons).forEach(function (key){
    connection.on(key, onStatusEvent.bind(self, key, ons[key]))
  })
}

module.exports = Status