var Entity = require("../entity")

var bullet = {
  create: function create(id, creator, type) {
    var ent = new Entity({}, id)
    ent.update = bullet[type]
    ent.position.copy(creator.position)
    ent.direction = creator.rotation.clone()
    return ent
  },

  normal: function updateNormal (dt) {
    this.position.x += this.velocity.x * this.direction.x
    this.position.y += this.velocity.y * this.direction.y
    this.position.z += this.velocity.z * this.direction.z
  }
}

module.exports = bullet