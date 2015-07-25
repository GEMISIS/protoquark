var health     = require("./entities/health")
var ammo       = require("./entities/ammo")
var weapon     = require("./entities/weapon")
var Entity     = require("./entity")
var Triangle   = require("./math").triangle
var Vector3    = require("./math").vec3

module.exports = {
  loadLevel: loadLevel,
  parseLevel: parseLevel
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

function getItemChance(obj) {
  return !obj.chance || Math.random() * 100 <= obj.chance
}

function parseLevel(level) {
  if (level.healths) {
    level.healths.forEach((function(healthObj) {
      if (!getItemChance(healthObj)) return

      var ent = health.create(this.genLocalId(), healthObj.position, healthObj.amount)
      ent.position.copy(healthObj.position)
      this.add(ent)
    }).bind(this))
  }

  if (level.ammos) {
    level.ammos.forEach((function(ammoObj) {
      if (!getItemChance(ammoObj)) return
      var ent = ammo.create(this.genLocalId(), ammoObj.position, ammoObj.amount)
      ent.position.copy(ammoObj.position)
      this.add(ent)
    }).bind(this))
  }

  if (level.weapons) {
    level.weapons.forEach((function(weaponObj) {
      if (!getItemChance(weaponObj)) return
      var ent = weapon.create(this.genLocalId(), weaponObj.position, weaponObj.amount)
      ent.position.copy(weaponObj.position)
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

  if (level.spawns && level.spawns.length) {
    startingPosition = level.spawns[0].position
  }
}
