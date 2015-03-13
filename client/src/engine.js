var Entity     = require("./entity")
var Matrix4    = require("./math").mat4
var Vector3    = require("./math").vec3
var Quaternion = require("./math").quat

var localIdCounter = 0
var SEND_INTERVAL = .05

// Handler by entity type
var handle = {
  player: function(ent, dt) {
    var angle = ent.euler.x
    var sinAngle = Math.sin(angle)
    var cosAngle = Math.cos(angle)
    var speed = ent.speed || 2

    if (ent.control.forward || ent.control.backward) {
      var multiplier = ent.control.forward ? 1 : -1
      ent.position.x += sinAngle * speed * dt * multiplier
      ent.position.z -= cosAngle * speed * dt * multiplier
    }

    if (ent.control.strafeleft || ent.control.straferight) {
      var multiplier = ent.control.straferight ? 1 : -1
      ent.position.x += cosAngle * speed * dt * multiplier
      ent.position.z += sinAngle * speed * dt * multiplier
      ent.updateRotation()
    }

    // Queue up packets to send - we'll clear this once sent
    ent.addSnapshot(this.conn.getServerTime())
  },

  remoteplayer: function(ent, dt) {
    // Note that since we dont know what order these events will arrive,
    // make sure Entity.prototype.trimSnapshots doesn't remove everything
    ent.interpolate(this.conn.getServerTime())
    ent.trimSnapshots()
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
    console.log(e.context)
    var owned = this.conn.isOwnId(e.context.id)
    var ent = new Entity(e.context, this.generateId())
    ent.control = {}
    ent.type = owned ? "player" : "remoteplayer"
    
    this.entities.push(ent)
    this.entityMap[e.context.id] = ent
  },

  playerexit: function onPlayerExit (e) {
    var entities = this.entities
    var ent = entities.filter(function(ent){
      return ent.context.id == e.context.id
    })[0]
    if (!ent) return
    this.entities.splice(this.entities.indexOf(ent), 1)
  },

  players: function onPlayers(e) {
    // Loop through all players besides ourself since that's handled in playerenter
    var self = this
    var conn = this.conn
    Object.keys(e.context).forEach(function(id) {
      if (!conn.isOwnId(id)) {
        var ent = new Entity(e.context, self.generateId())
        ent.control = {}
        ent.type = "remoteplayer"
        
        self.entities.push(ent)
        self.entityMap[id] = ent
      }
    })
  },

  playerstate: function onPlayerState(e) {
    if (!this.conn.isServer()) return

    var ent = this.entityMap[e.sender]
    if (!ent) return

    // Queue packets for future send - dont put in ent.snapshots since we'll handle that with
    // the entitiesupdate event for both client and server

    this.snapshots = this.snapshots || {}
    this.snapshots[e.sender] = (this.snapshots[e.sender] || []).concat(e.context.snapshots)
  },

  entitiesupdate: function onEntitiesUpdate(e) {
    var entitySnapshots = e.context.snapshots
    var self = this
    var me = this.you()

    Object.keys(entitySnapshots).forEach(function(id) {
      var ent = self.entityMap[id]
      var snapshots = entitySnapshots[id]

      // Add interpolated snapshots only if this isnt ourself
      if (ent && snapshots && ent !== me) {
        ent.snapshots = ent.snapshots.concat(snapshots)
      }
    })
  },

  connectionkill: function onConnectionKill() {
    clearInterval(this.sendIntervalId)
  }
}
}

function Engine (connection, controller) {
  this.conn = connection
  this.control = controller
  this.entities = []
  this.entityMap = {}
  this.sendIntervalId = setInterval(onIntervalSend.bind(this), SEND_INTERVAL * 1000)

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
    return this.entityMap[this.conn.peer.id]
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

      if (handler) handler.call(this, ent, dt)
    }
  }
}

function onIntervalSend() {
  var conn = this.conn
  var me = this.you()
  if (me && me.snapshots.length) {
    // Send queued up packets
    conn.send("playerstate", {
      snapshots: me.snapshots
    });
    // Clear for next send.
    me.snapshots = []
  }

  if (conn.isServer() && this.snapshots) {
    conn.send("entitiesupdate", {
      snapshots: this.snapshots
    });
    this.snapshots = {}
  }
}

module.exports = Engine