var Entity    = require("../entity")
var Vector3   = require("../math").vec3
var collision = require("../collision")
var decal     = require("./decal")

var gibShape = new Vector3(.025, .025, .025)

function signedRandom() {
  return (Math.random() * 200 - 100) / 100
}

var gib = {
  create: function create(id, creator) {
    var ent = new Entity({id: id, color: "0xFF0000", scale: {x:.025, y:.025, z:.025}}, id)

    ent.update = gib.update
    ent.position.copy(creator.position)
    ent.life = Math.random() * 5 + 2.0
    ent.velocity = new Vector3(signedRandom(), Math.random() * 3 + 1, signedRandom())
    ent.accel = new Vector3(0, -5, 0)
    ent.type = "gib"

    return ent
  },

  update: function update(dt, ent) {
    var from = ent.position.clone()
    ent.velocity.add(new Vector3().copy(ent.accel).multiplyScalar(dt))
    var delta = new Vector3().copy(ent.velocity).multiplyScalar(dt)
    var to = ent.position.clone().add(delta)

    var hit = collision.getSweptCollision(from, delta, this.colliders, gibShape, true)
    if (ent.velocity.y < 0 && hit.collision) {
      ent.position.copy(hit.position)
      this.add(decal.create(this.genLocalId(), ent.position, ent.velocity.clone().normalize()))

      ent.markedForDeletion = true
      ent.velocity.set(0, 0, 0)
      return
    }

    ent.position.copy(to)

    ent.life -= dt
    if (ent.life < 0) ent.markedForDeletion = true
  }
}

module.exports = gib