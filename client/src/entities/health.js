var Entity   = require("../entity")
var Vector3  = require("../math").vec3
var collision = require("../collision")
var gib = require("./gib")

var health = {
  create: function create(id, pos, rot, euler) {
    var ent = new Entity({id: id}, id)
    ent.update = health

    ent.position.copy(pos)
    ent.rotation.copy(rot)
    ent.euler.copy(euler)
    ent.shape = new Vector3(.1, .1, .1)

    ent.type = "bullet"

    return ent
  },

  normal: function updateNormal (dt, ent) {
    var hitPoint

    var hit = collision.getSweptCollision(ent.position.clone(), ent.velocity, this.colliders, ent.shape, true)
    if (hit.collision) {
      ent.position = hit.position
      ent.markedForDeletion = true
      return
    }

    // TODO: Use some type of tree to limit number of entities checked
    var entities = this.entities
    var enemyHit = null
    var closestTime = Number.POSITIVE_INFINITY
    for (var i = 0; i < entities.length; i++) {
      var other = entities[i]
      if (other.type == "player" || other.type == "remoteplayer") {
        // var collisionTime = collision.collidesSwept(ent, other, from, to)
        // if (collisionTime > 1.0 || collisionTime > closestTime) continue
        // closestTime = collisionTime

        var hit = collision.getSweptBoxCollision(ent.position.clone(), ent.velocity, ent.shape, other.position, new Vector3(.5, .5, .5), other.rotation)
        if (hit.collision) {
          enemyHit = other
          hitPoint = hit.position
        }

        if (hit.collision && other.type != "player")
          // TODO: Add health state command.
          //this.addStateCommand({command: "hit", target: other.id, shooter: ent.creator})
      }
    }
  }
}

module.exports = bullet