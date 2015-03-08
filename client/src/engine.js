var Entity = require("./entity")

var localIdCounter = 0

var ons = {
control: {
  look: function onLook(dx, dy) {
    var me = this.you()
    me.euler.x += dx
    me.euler.y += dy

    me.rotation = new Quaternion().multiplyQuaternions(
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -me.euler.y),
      new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -me.euler.x))
  }
},
conn: {
  playerenter: function onPlayerEnter (e) {
    var ent = new Entity(e.context)
    this.entities.push(ent)
  },
  playerexit: function onPlayerExit (e) {
    var entities = this.entities
    var ent = entities.filter(function(ent){
      return ent.context.id == e.context.id
    })[0]
    if (!ent) return
    this.entities.splice(this.entities.indexOf(ent), 1)
  }
}
}

function Engine (connection, controller) {
  this.conn = connection
  this.control = controller
  this.entities = []

  var self = this
  Object.keys(ons).forEach(function (key) {
    Object.keys(ons[key]).forEach(function (ev) {
      self[key].on(ev, ons[key][ev].bind(self))
    })
  })
}

Engine.prototype = {
  you: function () {
    if (!this.conn.peer) return
    var id = this.conn.peer.id
    return this.entities.filter(function(ent){
      return ent.context.id == id
    })[0]
  },

  generateId: function generateId() {
    return localIdCounter++;
  }
}

module.exports = Engine