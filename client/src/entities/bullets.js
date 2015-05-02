var Entity   = require("../entity")
var Vector3  = require("../math").vec3
var collision = require("../collision")

var bullet = {
  create: function create(id, creator, bulletType) {
    var ent = new Entity({id: id}, id)
    ent.update = bullet[bulletType]
    ent.position.copy(creator.position)
    ent.direction = creator.rotation.clone()
    ent.velocity = new Vector3(
      Math.sin(creator.euler.y) * Math.cos(creator.euler.x), 
      -Math.sin(creator.euler.x), 
      -Math.cos(creator.euler.y) * Math.cos(creator.euler.x))
    ent.speed = 50
    ent.type = "bullet"
    ent.creator = creator.id

    return ent
  },

  normal: function updateNormal (dt, ent) {
    var from = ent.position.clone()
    var to = ent.position.clone()
    to.x += ent.velocity.x * dt * ent.speed
    to.y += ent.velocity.y * dt * ent.speed
    to.z += ent.velocity.z * dt * ent.speed

    // TODO: Use some type of tree to limit number of entities checked
    var entities = this.entities
    var enemyHit = null
    var closestTime = Number.POSITIVE_INFINITY
    for (var i = 0; i < entities.length; i++) {
      var other = entities[i]
      if ((other.type == "player" || other.type == "remoteplayer") && other.id != ent.creator) {
        var collisionTime = collision.collidesSwept(ent, other, from, to)
        if (collisionTime > 1.0 || collisionTime > closestTime) continue
        closestTime = collisionTime
        enemyHit = other
      }
    }

    if (enemyHit) {
      ent.markedForDeletion = true
      ent.position.copy(enemyHit.position)
    }
    else {
      ent.position.copy(to)
    }
  }
}

module.exports = bullet