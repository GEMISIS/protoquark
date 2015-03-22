var Entity = require("../entity")

var bullet = {
  create: function create(id, creator, type) {
    var ent = new Entity({}, id)
    ent.update = bullet[type]
    ent.position.copy(creator.position)
    ent.direction = creator.rotation.clone()
    return ent
  },

  normal: function updateNormal (dt, ent) {
    ent.position.x += ent.velocity.x * ent.direction.x
    ent.position.y += ent.velocity.y * ent.direction.y
    ent.position.z += ent.velocity.z * ent.direction.z
  }
}

module.exports = bullet