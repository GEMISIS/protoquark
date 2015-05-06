var Entity   = require("../entity")
var Vector3  = require("../math").vec3
var collision = require("../collision")

var gibShape = new Vector3(.1, .1, .1)

function signedRandom() {
  return (Math.random() * 200 - 100) / 100
}

var gib = {
  create: function create(id, creator) {
    var ent = new Entity({id: id, color: "0xFF0000", scale: {x:.025, y:.025, z:.025}}, id)

    ent.update = gib.update
    ent.position.copy(creator.position)
    ent.life = Math.random() * 5 + .25
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

    if (ent.velocity.y < 0 && collision.getSweptCollision(from, delta, this.colliders, gibShape, true).collision) {
      ent.position = collision.position
      ent.markedForDeletion = true
      return
    }

    ent.position.copy(to)

    ent.life -= dt
    if (ent.life < 0) ent.markedForDeletion = true
  }
}

module.exports = gib