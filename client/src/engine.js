var emitter    = require('component/emitter')
var Entity     = require("./entity")
var Matrix4    = require("./math").mat4
var Quaternion = require("./math").quat
var Settings   = require('./settings')
var Vector3    = require("./math").vec3
var Triangle   = require("./math").triangle
var weapons    = require("./config/weapon")
var health     = require("./entities/health")
var ammo       = require("./entities/ammo")

require("./entities/player")
require("./entities/remoteplayer")

var localIdCounter = 0
var startingHealth = 1
var startingScore = 0
var SEND_INTERVAL = .04

function handleDirection(control, down) {
  var me = this.you()
  if (!me) return
  me.lastControl[control] = me.control[control]
  me.control[control] = down
}

function loadLevel(url, done) {
  var req = new XMLHttpRequest()
  var resp = {
    progress: function (ev) {
      this.emit('levelloadprogress', 0 /* 0 ~ 1 calc progress here */)
    },
    load: function (ev) {
      var err, data

      if (req.status == 200) {
        try {
          data = JSON.parse(req.responseText)
        }
        catch(e) {
          err = e
        }
      }
      else {
        err = Error('An error occured while loading the level data.')
      }

      done(err, data)
    },
    error: function (ev) {
      done(err)
    }
  }

  req.overrideMimeType("application/json")
  req.open('GET', url, true)
  Object.keys(resp).forEach((function (key) {
    req.addEventListener(key, resp[key].bind(this))
  }).bind(this))
  req.send()
}

function parseLevel(level) {
  // level.blocks.forEach((function(block) {
  //   var ent = new Entity(block, this.genLocalId())
  //   ent.type = 'block'
  //   var pos = block.position
  //   ent.position = new Vector3(pos.x, pos.y, pos.z)
  //   //ent.context.color = Math.floor(Math.random()*16777215).toString(16)
  //   var color = Math.floor(Math.random()*50) + 25
  //   ent.context.color = (color | (color << 8) | (color << 16)).toString(16)
  //   this.add(ent)
  // }).bind(this))

  if(level.healths !== undefined) {
    level.healths.forEach((function(healthObj) {
      var ent = health.create(this.genLocalId(), healthObj.position, healthObj.amount)
      var pos = healthObj.position
      ent.position = new Vector3(pos.x, pos.y, pos.z)
      //ent.context.color = Math.floor(Math.random()*16777215).toString(16)
      var color = Math.floor(Math.random()*50) + 25
      ent.context.color = (color | (color << 8) | (color << 16)).toString(16)
      this.add(ent)
    }).bind(this))
  }

  if(level.ammos !== undefined) {
    level.ammos.forEach((function(ammoObj) {
      var ent = ammo.create(this.genLocalId(), ammoObj.position, ammoObj.amount)
      var pos = ammoObj.position
      ent.position = new Vector3(pos.x, pos.y, pos.z)
      //ent.context.color = Math.floor(Math.random()*16777215).toString(16)
      var color = Math.floor(Math.random()*50) + 25
      ent.context.color = (color | (color << 8) | (color << 16)).toString(16)
      this.add(ent)
    }).bind(this))
  }

  if (level.mesh) {
    // ... //
  }

  if (level.collisionVertices) {
    var collisionVerts = level.collisionVertices
      , id = this.genLocalId()
    var ent = new Entity({id: id, vertices: collisionVerts}, id)
    ent.type = "level"
    this.add(ent)

    for (var i = 0; i < collisionVerts.length; i += 3) {
      var a = collisionVerts[i]
        , b = collisionVerts[i + 1]
        , c = collisionVerts[i + 2]
      this.addTriangleCollider(new Triangle(new Vector3(a.x, a.y, a.z), new Vector3(b.x, b.y, b.z), new Vector3(c.x, c.y, c.z)))
    }
  }
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

    console.log("Adding", id, owned)
    // Create the entity only if we're not migrating / it doesnt exist
    var ent = createPlayer(e.context, owned ? "player" : "remoteplayer")
    this.add(ent)
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
    ent.latency = e.context.latency
  },
  death: function onPlayerDeath(e) {
    // our death usually
    var id = e.context.id
    var entity = this.entityMap[id]
    if (!entity || id != this.you().id) return

    var pos = e.context.position
    entity.position.set(pos.x, pos.y, pos.z)
    entity.health.current = entity.health.max
    entity.weapon.primary.ammunition = weapons[entity.weapon.primary.id].ammunition
  },
  gamestate: function onGameState(e) {
    var entityMap = this.entityMap
    var states = e.context.states
    var scores = {}
    for (var i = 0; i < states.length; i++) {
      var state = states[i]
      var player = entityMap[state.id]
      if (player) {
        player.health.current = state.currentHealth
        player.score = state.currentScore
        scores[state.id] = {name: state.id, score: player.score}
      }
    }
    this.emit('scoreboard', scores)
  },
  statecommand: function onStateCommand(e) {
    var entityMap = this.entityMap
    var states = e.context.states
    for (var i = 0; i < states.length; i++) {
      var state = states[i]
      var target = entityMap[state.target]
      if (state.command == 'hit' && target) {
        processCommandHit.call(this, target, state)
      }
      else if(state.command == 'health' && target) {
        processHealthGet.call(this, target, state);
      }
      else if(state.command == 'ammo' && target) {
        processAmmoGet.call(this, target, state);
      }
    }
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
  this.settings = new Settings
  this.conn = connection
  this.control = controller
  this.entities = []
  this.entityMap = {}
  this.sendIntervalId = setInterval(onIntervalSend.bind(this),
    SEND_INTERVAL * 1000)
  this.stateIntervalId = setInterval(onStateSend.bind(this), 500)
  this.sendInterval = SEND_INTERVAL
  this.colliders = []

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
    "jump"
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
    if(entityMap[id]) {
      states.push({
        id: id,
        currentHealth: entityMap[id].health.current,
        currentScore: entityMap[id].score,
      })
    }
  })

  if (states.length) {
    conn.send("gamestate", { states: states })
  }
}

function onIntervalSend() {
  var conn = this.conn
  var me = this.you()
  var states = this.stateCommands
  if (me && me.snapshots.length && conn.connected) {
    // Send queued up packets
    conn.send("playerstate", {
      snapshots: me.snapshots,
      time: conn.getServerTime(),
      latency: conn.latency
    })
    // Clear for next send.
    me.snapshots = []
  }

  if (conn.isServer() && this.snapshots) {
    conn.send("entitiesupdate", {
      snapshots: this.snapshots,
      time: conn.getServerTime()
    })
    this.snapshots = {}
  }

  if (states && states.length) {
    conn.send("statecommand", {
      states: states
    })
    this.stateCommands = []
  }
}

function addStartingWeapon(ent) {
  var weapon = ent.weapon = ent.weapon || {}
  var weaponId = "pistol"
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
  ent.jump = 0
  ent.control = {}
  ent.lastControl = {}
  addStartingWeapon(ent)
  addUpdate(ent)
  return ent
}

function addUpdate(ent) {
  if (!ent.type) return

  try {
    // if (!ent.update)
    ent.update = require('./entities/' + ent.type)
  }
  catch (e) {
    // console.log("no update for", ent.type, ent.id, ent)
  }
}

function processCommandHit(target, command) {
  target.health.current -= .34
  if (target.health.current <= Number.EPSILON) {
    target.health.current = target.health.max
    target.position.set(0, 3, 0)
    this.entityMap[command.shooter].score += 1
    this.conn.send("death", {killer: command.shooter, id:target.id, position: {x: 0, y: 3, z: 0}}, {relay:target.id})
  }
}

function processHealthGet(target, command) {
  target.health.current += command.amount
  if(target.health.current > target.health.max) {
    target.health.current = target.health.max
  }
}

function processAmmoGet(target, command) {
  console.log(command.amount)
  target.weapon.primary.ammunition += command.amount
  console.log("Old: " + target.weapon.primary.ammunition)
  if(target.weapon.primary.ammunition > weapons[target.weapon.primary.id].ammunition) {
    target.weapon.primary.ammunition = weapons[target.weapon.primary.id].ammunition
    console.log("New: " + target.weapon.primary.ammunition)
  }
}

emitter(Engine.prototype)

module.exports = Engine