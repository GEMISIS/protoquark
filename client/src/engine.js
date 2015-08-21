var emitter    = require('component/emitter')
var Entity     = require("./entity")
var Matrix4    = require("./math").mat4
var Quaternion = require("./math").quat
var Settings   = require('./settings')
var Vector3    = require("./math").vec3
var Triangle   = require("./math").triangle
var weapons    = require("./config/weapon")
var parseLevel = require("./level").parseLevel
var loadLevel  = require("./level").loadLevel

require("./entities/player")
require("./entities/remoteplayer")

var localIdCounter = 0
var startingHealth = 1
var startingScore = 0
var sendInterval = .04
var serverStateInterval = .5
var startingPosition = {x: 0, y: 3, z: 0}
var matchTime = 120000

function handleDirection(control, down) {
  var me = this.you()
  if (!me) return
  me.lastControl[control] = me.control[control]
  me.control[control] = down
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
// packet events
conn: {
  setting: function (e) {
    if (this.conn.isServer()) return
    this.setting.update(e.context.key, e.context.value)
  },
  playerenter: function onPlayerEnter (e) {
    console.log("onPlayerEnter", e.context)

    var id = e.context.id
    var conn = this.conn
    var owned = conn.isOwnId(id)
    var ent = this.entityMap[id]
    var exists = !!ent

    // If we get an existing entity context id, means we've migrated.
    // The only case where this would need to be reset would be for the new
    if (exists) {
      ent.type = owned ? "player" : "remoteplayer"
      addUpdate(ent)
      return
    }

    // Create the entity only if we're not migrating / it doesnt exist
    var ent = createPlayer(e.context, owned ? "player" : "remoteplayer")
    this.add(ent)

    // tell new user his starting position
    if (conn.isServer() && !conn.isOwnId(id)) {
        conn.send("reposition", {position: startingPosition}, {relay:id, reliable: true})
    }

    if(this.conn.isServer() && conn.isOwnId(id)) {
      createGameTimer(conn)
    }
  },

  playerexit: function onPlayerExit (e) {
    console.log("onPlayerExit", e)

    var entities = this.entities
    var ent = entities.filter(function(ent){
      return ent.context.id == e.context.id
    })[0]

    if (!ent) return

    console.log("Removing", ent)
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

      // If already exists, just update its update function
      var previousEnt = self.entityMap[id]
      if (previousEnt) {
        previousEnt.type = "remoteplayer"
        addUpdate(previousEnt)
        return
      }

      var ent = createPlayer(e.context[id], "remoteplayer")
      self.add(ent)
    })
  },
  playerstate: function onPlayerState(e) {
    if (!this.conn.isServer()) return

    var ent = this.entityMap[e.sender]
    if (!ent) return

    // Ignore out of order packets
    if (ent.lastSnapshotTime && e.context.time < ent.lastSnapshotTime) return
    ent.lastSnapshotTime = e.context.time

    // Queue packets for future send - dont put in ent.snapshots since we'll handle that with
    // the playerssnapshots event for both client and server
    this.playersSnapshots[e.sender] = (this.playersSnapshots[e.sender] || []).concat(e.context.snapshots)
    ent.latency = e.context.latency
    ent.invincibility = e.context.invincibility
  },
  death: function onPlayerDeath(e) {
    // our death usually
    var id = e.context.id
    var ent = this.entityMap[id]
    if (!ent) return
    // if (!ent || id != this.you().id) return

    var pos = e.context.position
    ent.position.set(pos.x, pos.y, pos.z)
    ent.health.current = ent.health.max
    ent.weapon.primary.ammunition = weapons[ent.weapon.primary.id].ammunition
    ent.invincibility = e.context.invincibility
  },
  gameOver: function onGameOver(e) {
    // our death usually
    var id = this.you().id
    var ent = this.entityMap[id]
    if (!ent) return
    // if (!ent || id != this.you().id) return

    ent.position.set(-1000, -1000, -1000)
    ent.health.current = ent.health.max
    ent.weapon.primary.ammunition = weapons[ent.weapon.primary.id].ammunition
    ent.invincibility = 3.0

    if(this.conn.isServer()) {
      Object.keys(this.entityMap).forEach(function(key) {
        this.entityMap[key].score = startingScore
      }.bind(this))
    }

    this.emit('hideScores')
    this.emit('matchFinished', this.scores)
    this.gameOver = true
  },
  reposition: function onPlayerReposition(e) {
    // our reposition
    var me = this.you()
      , pos = e.context.position
    if (me) me.position.set(pos.x, pos.y, pos.z)
  },
  gamestate: function onGameState(e) {
    // These game states can include info on ourself in addition to other players
    var entityMap = this.entityMap
    var states = e.context.states
    this.scores = {}
    for (var i = 0; i < states.length; i++) {
      var state = states[i]
      var player = entityMap[state.id]
      if (player) {
        player.health.current = state.currentHealth
        player.score = state.currentScore
        this.scores[state.id] = {name: state.id, score: player.score}
      }
    }
    this.emit('scoreboard', this.scores)
  },
  statecommand: function onStateCommand(e) {
    var entityMap = this.entityMap
    var states = e.context.states
    for (var i = 0; i < states.length; i++) {
      var state = states[i]
      var target = entityMap[state.target]
      if (state.command == 'hit' && target) {
        processHit.call(this, target, state)
      }
      else if (state.command == 'weapon' && target) {
        processWeaponGet.call(this, target, state)
      }
      else if(state.command == 'health' && target) {
        processHealthGet.call(this, target, state);
      }
      else if(state.command == 'ammo' && target) {
        processAmmoGet.call(this, target, state);
      }
    }
  },
  playerssnapshots: function onPlayersSnapshots(e) {
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
  itemsupdate: function onItemsUpdate(e) {
    var ids = Object.keys(e.context.ids).forEach(function(id) {
      var obj = e.context.ids[id]
        , props = Object.keys(obj)
        , ent = this.entityMap[id]
      if (!ent) return

      for (var i = 0; i < props.length; i++) {
        ent[props[i]] = obj[props[i]]
      }
    }.bind(this))
  },
  migration: function onMigration(e) {
    // New host's player will be old host's player
    var newPlayer = this.entityMap[e.context.previousHost]
    var previousPlayer = this.entityMap[e.context.newHost]
    if (!newPlayer || !previousPlayer) return

    // Set new host's position into old
    // Don't care what we do to new host's old player since he'll be removed during the migration.
    newPlayer.snapshots = previousPlayer.snapshots
    newPlayer.position = previousPlayer.position
    newPlayer.rotation = previousPlayer.rotation
    newPlayer.euler = previousPlayer.euler
    newPlayer.lastSnapshotTime = previousPlayer.lastSnapshotTime
    newPlayer.control = previousPlayer.control
    newPlayer.lastControl = previousPlayer.lastControl
  },

  peeridassigned: function onPeerIdAssigned (e) {
    console.log("peerid", e)
    this.localPrefixId = e
    this.settings.update('mapUrl', '/defaultmap.json')
  },

  connectionkill: function onConnectionKill() {
    clearInterval(this.sendIntervalId)
    clearInterval(this.stateIntervalId)
  }
},
settings: {
  update: function onSettingsUpdate (settings, key, value) {
    if (key == 'mapUrl') {
      loadLevel.call(this, this.settings.mapUrl, (function (err, level) {
        parseLevel.call(this, level)
      }).bind(this))
    }

    if (!this.conn.isServer()) return

    this.conn.send('setting', {
      key: key,
      value: value
    }, {
      broadcast: true
    })
  }
}
}

function Engine (connection, controller) {
  this.localPrefixId = ''
  this.gameOver = false
  this.settings = new Settings
  this.conn = connection
  this.control = controller
  this.entities = []
  this.entityMap = {}
  this.sendInterval = sendInterval
  this.sendIntervalId = setInterval(onIntervalSend.bind(this),
    sendInterval * 1000)
  this.colliders = []

  // Server controlled stuff
  this.playersSnapshots = {}
  this.stateIntervalId = setInterval(onStateSend.bind(this), serverStateInterval * 1000)
  this.itemsStates = {}

  var self = this

  var controls = [
    "jump",
    "strafeleft",
    "straferight",
    "grenade",
    "reload",
    "backward",
    "forward",
    "shoot",
    "jump",
    "zoom"
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
  you: function you () {
    if (!this.conn.peer) return
    return this.entityMap[this.conn.peer.id]
  },

  resetPosition: function resetPosition() {
    var id = this.you().id
    var ent = this.entityMap[id]
    if (!ent) return

    var pos = startingPosition
    ent.position.set(pos.x, pos.y, pos.z)
    ent.health.current = ent.health.max
    ent.weapon.primary.ammunition = weapons[ent.weapon.primary.id].ammunition
    ent.invincibility = 3.0
  },

  genLocalId: function genLocalId() {
    return this.localPrefixId + '-' + localIdCounter++
  },

  update: function update(dt) {
    var conn = this.conn
    var entities = this.entities

    for (var i = 0; i < entities.length; i++) {
      var ent = entities[i]
      if (ent.update) ent.update.call(this, dt, ent)
    }

    // 2nd pass to delete
    for (var i = 0; i < entities.length; i++) {
      var ent = entities[i]
      if (ent.markedForDeletion) {
        this.remove(ent)
        i--
      }
    }
  },

  addItemState: function addItemState(ent, prop, value) {
    if (!this.conn.isServer()) return
    if (!this.itemsStates[ent.id]) this.itemsStates[ent.id] = {}
    this.itemsStates[ent.id][prop] = value
  },

  add: function add (ent) {
    if (!ent.id) throw Error('Entity has not been assigned an id.')
    if (this.entityMap[ent.id]) throw Error('Entity with id already exists.')
    this.entities.push(ent)
    this.entityMap[ent.id] = ent

    // Batch blocks into one polygon soup if it's a collision block
    if (ent.type === 'block')
      this.addBoxCollider(ent)
  },

  remove: function remove (ent) {
    if (typeof ent == 'string') ent = this.entityMap[ent]
    if (!ent) throw Error('Entity not provided.')
    if (!ent.id || !this.entityMap[ent.id])
      throw Error('Invalid entity requested to be removed')

    this.entities.splice(this.entities.indexOf(ent), 1)
    delete this.entityMap[ent.id]
  },

  addTriangleCollider: function addTriangleCollider(tri) {
    this.colliders.push(tri)
  },

  addBoxCollider: function addBoxCollider(ent) {
    if (!ent.context || !ent.context.scale || !ent.context.position) return
    var colliders = this.colliders
    var scale = ent.context.scale
      , pos = ent.context.position
      , width = scale.x / 2
      , height = scale.y / 2
      , depth = scale.z / 2
      , a = new Vector3().addVectors(pos, new Vector3(-width, height, depth))
      , b = new Vector3().addVectors(pos, new Vector3(-width, -height, depth))
      , c = new Vector3().addVectors(pos, new Vector3(width, -height, depth))
      , d = new Vector3().addVectors(pos, new Vector3(width, height, depth))
      , e = new Vector3().addVectors(pos, new Vector3(-width, height, -depth))
      , f = new Vector3().addVectors(pos, new Vector3(-width, -height, -depth))
      , g = new Vector3().addVectors(pos, new Vector3(width, -height, -depth))
      , h = new Vector3().addVectors(pos, new Vector3(width, height, -depth))
    // poly faces
    // back front
    // e-h   a-d
    // f-g   b-c

    // front
    colliders.push(new Triangle(a, b, c))
    colliders.push(new Triangle(a, c, d))
    // back
    colliders.push(new Triangle(h, g, f))
    colliders.push(new Triangle(h, f, e))
    // left
    colliders.push(new Triangle(e, f, b))
    colliders.push(new Triangle(e, b, a))
    // right
    colliders.push(new Triangle(d, c, g))
    colliders.push(new Triangle(d, g, h))
    // top
    colliders.push(new Triangle(e, a, d))
    colliders.push(new Triangle(e, d, h))
    // bottom
    colliders.push(new Triangle(b, f, g))
    colliders.push(new Triangle(b, g, c))
  },

  addStateCommand: function addStateCommand(obj) {
    var states = this.stateCommands = this.stateCommands || []
    states.push(obj)
  }
}

// Called by server periodically to send to players
function onStateSend() {
  var conn = this.conn
  if (!conn.isServer()) return

  var states = []
  var entityMap = this.entityMap
  Object.keys(conn.players).forEach(function(id) {
    if (!entityMap[id]) return

    states.push({
      id: id,
      currentHealth: entityMap[id].health.current,
      currentScore: entityMap[id].score,
      currentWeapon: entityMap[id].weapon.primary.id
    })
  })

  if (states.length) {
    conn.send("gamestate", { states: states })
  }

  conn.send("itemsupdate", {
    ids: this.itemsStates
  })

  this.itemsStates = {}
}

var lastSendTime = 0
function onIntervalSend() {
  var conn = this.conn
  var me = this.you()
  var states = this.stateCommands
  if (me && me.snapshots.length && conn.connected) {
    // Send queued up packets
    conn.send("playerstate", {
      snapshots: me.snapshots,
      time: conn.getServerTime(),
      latency: conn.latency,
      invincibility: me.invincibility || 0.0
    })
    // Clear for next send.
    me.snapshots = []
  }

  if (conn.isServer() && this.playersSnapshots) {
    conn.send("playerssnapshots", {
      snapshots: this.playersSnapshots,
      time: conn.getServerTime()
    })
    this.playersSnapshots = {}
  }

  if (states && states.length) {
    conn.send("statecommand", {
      states: states
    })
    this.stateCommands = []
  }

  // If tab inactive update entities since thats on the requestAnimation timer
  if (document.hidden) {
    // this.update(conn.getServerTime() - lastSendTime)
  }

  lastSendTime = conn.getServerTime()
}

function addStartingWeapon(ent) {
  switchToWeapon(ent, "pistol")
}

function switchToWeapon(ent, weaponId) {
  if (!weapons[weaponId]) return
  var weapon = ent.weapon = ent.weapon || {}
  weapon.active = "primary"
  weapon.primary = {
    id: weaponId,
    shotTimer: 0,
    ammunition: weapons[weaponId].ammunition
  }
}

function createPlayer(context, type) {
  var ent = new Entity(context, context.id)
  ent.type = type
  ent.health = {max: startingHealth, current: startingHealth}
  ent.score = startingScore
  ent.position.copy(startingPosition)
  ent.jump = 0
  ent.control = {}
  ent.lastControl = {}
  addStartingWeapon(ent)
  addUpdate(ent)

  // We want the gun to start this far from player and be used as the new origin during transformations
  ent.weaponOffsetPos = new Vector3(.075, 0, -.20)
  ent.weaponStartOffset = new Vector3(0, .20, 0)

  return ent
}

function addUpdate(ent) {
  if (!ent.type) return

  try {
    ent.update = require('./entities/' + ent.type)
  }
  catch (e) {
    // console.log("no update for", ent.type, ent.id, ent)
  }
}

function processHit(target, command) {
  if (target.invincibility && target.invincibility > 0) return

  target.health.current -= command.damage || .34
  if (target.health.current <= Number.EPSILON) {
    target.health.current = target.health.max
    target.position.set(0, 3, 0)
    this.entityMap[command.shooter].score += 1
    // this.conn.send("death", {killer: command.shooter, id:target.id, position: startingPosition, invincibility: 3.0}, {relay:target.id})
    this.conn.send("death", {killer: command.shooter, id:target.id, position: startingPosition, invincibility: 3.0})
  }
}

function processWeaponGet(target, command) {
  var weaponIds = Object.keys(weapons)
  if (weaponIds.length) switchToWeapon(target, weaponIds[Math.floor(Math.random() * weaponIds.length)])
}

function processHealthGet(target, command) {
  target.health.current += command.amount
  target.health.current = Math.min(target.health.max, target.health.current)
}

function processAmmoGet(target, command) {
  var weapon = target.weapon.primary
  weapon.ammunition += command.amount
  weapon.ammunition = Math.min(weapons[weapon.id].ammunition, weapon.ammunition)
}

emitter(Engine.prototype)

module.exports = Engine