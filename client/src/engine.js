var Entity     = require("./entity")
var Matrix4    = require("./math").mat4
var Vector3    = require("./math").vec3
var Quaternion = require("./math").quat
var weapons    = require("./config/weapon")
require('./entities/player')

var localIdCounter = 0
var SEND_INTERVAL = .04

function handleDirection(control, down) {
  var me = this.you()
  if (me) me.control[control] = down
}

var ons = {
control: {
  look: function onLook(state) {
    var me = this.you()

    if (!me) return

    me.euler.y += state.x
    me.euler.x += state.y

    me.updateRotation()
  }
},
conn: {
  playerenter: function onPlayerEnter (e) {
    console.log("onPlayerEnter", e.context)

    var contextId = e.context.id
    var conn = this.conn
    var owned = conn.isOwnId(contextId)
    var exists = !!this.entityMap[contextId]

    // If we get an existing entity context id, means we've migrated.
    // The only case where this would need to be reset would be for the new
    if (exists && (!conn.isServer() || !owned))
      return

    // Create the entity only if we're not migrating
    // var ent = exists ? this.entityMap[contextId] : new Entity(e.context, owned ? contextId : this.genLocalId())
    var ent = new Entity(e.context, contextId)
    ent.type = owned ? "player" : "remoteplayer"

    try {
      if (!ent.update)
        ent.update = require('./entities/' + ent.type)
    }
    catch (e) {
      console.log(e)
    }

    if (exists) return

    addStartingWeapon.call(this, ent)

    ent.control = {}
    this.add(ent)
  },

  playerexit: function onPlayerExit (e) {
    console.log("onPlayerExit", e)

    var entities = this.entities
    var ent = entities.filter(function(ent){
      return ent.context.id == e.context.id
    })[0]

    if (!ent) return

    this.remove(ent)
  },

  players: function onPlayers(e) {
    // Loop through all players besides ourself since that's handled in playerenter
    var self = this
    var conn = this.conn
    Object.keys(e.context).forEach(function(id) {
      if (conn.isOwnId(id)) {
        self.entityMap[id].type = "player"
        return
      }

      var previousEnt = self.entityMap[id]
      if (previousEnt) {
        previousEnt.type = "remoteplayer"
        return
      }

      var ent = new Entity(e.context[id], id)
      ent.control = {}
      addStartingWeapon.call(this, ent)
      ent.type = "remoteplayer"
      ent.update = require('./entities/remoteplayer')
      self.add(ent)
    })
    console.log("onPlayers")
  },

  playerstate: function onPlayerState(e) {
    if (!this.conn.isServer()) return

    var ent = this.entityMap[e.sender]
    if (!ent) {
      console.log("Cant find", e.sender)
      return
    }

    // Queue packets for future send - dont put in ent.snapshots since we'll handle that with
    // the entitiesupdate event for both client and server

    // Ignore out of order packets
    if (ent.lastSnapshotTime && e.context.time < ent.lastSnapshotTime) return
    ent.lastSnapshotTime = e.context.time

    this.snapshots = this.snapshots || {}
    this.snapshots[e.sender] = (this.snapshots[e.sender] || []).concat(e.context.snapshots)
  },

  entitiesupdate: function onEntitiesUpdate(e) {
    var entitySnapshots = e.context.snapshots
    var self = this
    var me = this.you()

    if (this.lastServerTime && e.context.time < this.lastServerTime) return
    this.lastServerTime = e.context.time

    Object.keys(entitySnapshots).forEach(function(id) {
      var ent = self.entityMap[id]
      var snapshots = entitySnapshots[id]

      // Add interpolated snapshots only if this isnt ourself
      if (ent && snapshots && ent !== me) {
        ent.snapshots = ent.snapshots.concat(snapshots)
      }
    })
  },

  migration: function onMigration(e) {
    // New host's player will be old host's player
    var newPlayer = this.entityMap[e.context.previousHost]
    var previousPlayer = this.entityMap[e.context.newHost]
    if (!newPlayer || !previousPlayer) return

    // Set new host's position into old
    // Don't care what we do to newHostPlayer since he'll be removed during the migration.
    newPlayer.snapshots = previousPlayer.snapshots
    newPlayer.position = previousPlayer.position
    newPlayer.rotation = previousPlayer.rotation
    newPlayer.euler = previousPlayer.euler
    newPlayer.lastSnapshotTime = previousPlayer.lastSnapshotTime
  },

  peeridassigned: function onPeerIdAssigned (e) {
    console.log("peerid", e)
    this.localPrefixId = e
  },

  connectionkill: function onConnectionKill() {
    clearInterval(this.sendIntervalId)
  }
}
}

function Engine (connection, controller) {
  this.localPrefixId = ''
  this.conn = connection
  this.control = controller
  this.entities = []
  this.entityMap = {}
  this.sendIntervalId = setInterval(onIntervalSend.bind(this),
    SEND_INTERVAL * 1000)
  this.sendInterval = SEND_INTERVAL

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

  genLocalId: function genLocalId() {
    return this.localPrefixId + '-' + localIdCounter++;
  },

  update: function update(dt) {
    var conn = this.conn
    var entities = this.entities

    for (var i = 0; i < entities.length; i++) {
      var ent = entities[i]
      if (ent.update) ent.update.call(this, dt, ent)
    }
  },

  add: function add (ent) {
    if (!ent.id) throw Error('Entity has not been assigned an id.')
    if (this.entityMap[ent.id]) throw Error('Entity with id already exists.')
    console.log("added", ent)
    this.entities.push(ent)
    this.entityMap[ent.id] = ent
  },

  remove: function remove (ent) {
    if (typeof ent == 'string') ent = this.entityMap[ent]
    if (!ent) throw Error('Entity not provided.')
    if (!ent.id || !this.entityMap[ent.id])
      throw Error('Invalid entity requested to be removed')

    console.log("Removing", ent)
    this.entities.splice(this.entities.indexOf(ent), 1)
    delete this.entityMap[ent.id]
  }
}

function onIntervalSend() {
  var conn = this.conn
  var me = this.you()
  if (me && me.snapshots.length && conn.connected) {
    // Send queued up packets
    conn.send("playerstate", {
      snapshots: me.snapshots,
      time: conn.getServerTime()
    });
    // Clear for next send.
    me.snapshots = []
  }

  if (conn.isServer() && this.snapshots) {
    conn.send("entitiesupdate", {
      snapshots: this.snapshots,
      time: conn.getServerTime()
    });
    this.snapshots = {}
  }
}

function addStartingWeapon(ent) {
  var weapon = ent.weapon = ent.weapon || {}
  weapon.active = "primary"
  weapon.primary = {
    id: "pistol",
    shotTimer: 0
  }
}

module.exports = Engine