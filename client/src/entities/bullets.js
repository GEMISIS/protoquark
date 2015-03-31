var Entity   = require("../entity")
var Vector3  = require("../math").vec3

var bullet = {
  create: function create(id, creator, bulletType) {
    var ent = new Entity({id: id}, id)
    ent.update = bullet[bulletType]
    ent.position.copy(creator.position)
    ent.direction = creator.rotation.clone()
    ent.velocity = new Vector3(0, 0, -1)
    ent.velocity.applyQuaternion(creator.rotation)
    ent.type = "bullet"

    return ent
  },

  normal: function updateNormal (ent, dt) {
    var vel = ent.velocity
    var pos = ent.position
    pos.x += vel.x * dt
    pos.y += vel.y * dt
    pos.z += vel.z * dt

    console.log(pos)
  }
}

module.exports = bullet