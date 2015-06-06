var Entity   = require("../entity")
var Vector3  = require("../math").vec3
var collision = require("../collision")
var gib = require("./gib")

var health = {
  create: function create(id, pos) {
    var ent = new Entity({id: id}, id)
    ent.update = health.updateHealth

    ent.position.copy(pos)
    ent.shape = new Vector3(.1, .1, .1)

    ent.type = "bullet"

    return ent
  },

  updateHealth: function updateHealth (dt, ent) {
    var hitPoint

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

        var hit = collision.collides(ent, other)
        if (hit) {
          enemyHit = other
          hitPoint = hit.position
          console.log("Got health!")
        }

        //if (hit.collision && other.type != "player")
          // TODO: Add health state command.
          //this.addStateCommand({command: "hit", target: other.id, shooter: ent.creator})
      }
    }
  }
}

module.exports = health