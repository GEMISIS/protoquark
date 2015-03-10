var Entity = require("./entity")
var Matrix4    = require("./math").mat4
var Vector3    = require("./math").vec3
var Quaternion = require("./math").quat

var localIdCounter = 0

var handle = {
  player: function(ent, dt) {
    var angle = ent.euler.y
    var sinAngle = Math.sin(angle)
    var cosAngle = Math.cos(angle)
    var speed = ent.speed || 2

    if (ent.control.forward || ent.control.backward) {
      var multiplier = ent.control.forward ? 1 : -1
      
      ent.position.x += cosAngle * speed * dt * multiplier
      ent.position.z += sinAngle * speed * dt * multiplier
    }

    if (ent.control.strafeleft || ent.control.straferight) {
      var multiplier = ent.control.straferight ? 1 : -1
      
      ent.position.x += sinAngle * speed * dt * multiplier
      ent.position.z += cosAngle * speed * dt * multiplier
    }
  }
}

function handleDirection(control, down) {
  var me = this.you()
  if (me) me.control[control] = down
}

var ons = {
control: {
  look: function onLook(state) {
    var me = this.you()

    if (!me) return

    me.euler.x += state.x
    me.euler.y += state.y

    me.rotation = new Quaternion().multiplyQuaternions(
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -me.euler.y),
      new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -me.euler.x))
  }
},
conn: {
  playerenter: function onPlayerEnter (e) {
    var ent = new Entity(e.context)
    ent.control = {}

    ent.type = "player"

    this.entities.push(ent)
  },

  playerexit: function onPlayerExit (e) {
    var entities = this.entities
    var ent = entities.filter(function(ent){
      return ent.context.id == e.context.id
    })[0]
    if (!ent) return
    this.entities.splice(this.entities.indexOf(ent), 1)
  },
}
}

function Engine (connection, controller) {
  this.conn = connection
  this.control = controller
  this.entities = []

  var self = this

  var controls = [
    "jump",
    "strafeleft",
    "straferight",
    "grenade",
    "reload",
    "backward",
    "forward",
    "shoot"
  ]

  controls.forEach(function(c) {
    controller.on(c, handleDirection.bind(self, c))
  })

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
  },

  update: function update(dt) {
    var conn = this.conn
    var entities = this.entities

    for (var i = 0; i < entities.length; i++) {
      var ent = entities[i]
      var handler = handle[ent.type]

      if (handler) handler(ent, dt)
    }
  }
}

module.exports = Engine