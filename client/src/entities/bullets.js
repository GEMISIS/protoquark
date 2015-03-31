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

  normal: function updateNormal (dt, ent) {
    ent.position.x += ent.velocity.x * dt
    ent.position.y += ent.velocity.y * dt
    ent.position.z += ent.velocity.z * dt
  }
}

module.exports = bullet