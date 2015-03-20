var Entity     = require("./entity")

function createBullet(id, creator, type) {
  var bulletEnt = new Entity({}, id)
  bulletEnt.update = bullet[type]
  bulletEnt.position.copy(creator.position)
  bulletEnt.direction = creator.rotation.clone()
  return bulletEnt
}

var bullet = {
  create: createBullet,

  normal: function updateNormal (dt) {
      this.position.x += this.velocity.x * this.direction.x
      this.position.y += this.velocity.y * this.direction.y
      this.position.z += this.velocity.z * this.direction.z
  },
  rocket: function updateRocket (dt) {
    // wat
  }
}

module.exports = bullet