var Entity    = require("../entity")
var Vector3   = require("../math").vec3
var collision = require("../collision")
var gib       = require("./gib")

var from = new Vector3()
var delta = new Vector3()
var to = new Vector3()

var bullet = {
  gibsPerBullet: 4,

  create: function create(id, creator, bulletType, opts) {
    var ent = new Entity({id: id}, id)
    ent.update = bullet[bulletType]
    opts = opts || {}

    var position = opts.position || creator.position
      , rotation = opts.rotation || creator.rotation

    ent.position.copy(position)
    ent.rotation.copy(rotation)
    ent.euler.copy(creator.euler)
    ent.shape = new Vector3(.1, .1, .1)

    ent.direction = creator.rotation.clone()
    ent.velocity = new Vector3(
      Math.sin(creator.euler.y) * Math.cos(creator.euler.x),
      -Math.sin(creator.euler.x),
      -Math.cos(creator.euler.y) * Math.cos(creator.euler.x))
    ent.speed = opts.speed || 100
    ent.damage = opts.damage || 1
    ent.type = "bullet"
    ent.creator = creator.id

    return ent
  },

  normal: function updateNormal (dt, ent) {
    from.copy(ent.position)
    delta.copy(ent.velocity).multiplyScalar(dt * ent.speed)
    to.copy(ent.position).add(delta)
    var hitPoint

    var hit = collision.getSweptCollision(from, delta, this.colliders, ent.shape, true)
    if (hit.collision) {
      ent.position.copy(hit.position)
      ent.markedForDeletion = true
      for (var i = 0; i < bullet.gibsPerBullet; i++) {
        this.add(gib.create(this.genLocalId(), ent, {color: "0xFFFF00"}))
      }
      return
    }

    // TODO: Use some type of tree to limit number of entities checked
    var entities = this.entities
    var enemyHit = null
    var closestTime = Number.POSITIVE_INFINITY
    for (var i = 0; i < entities.length; i++) {
      var other = entities[i]
      if ((other.type == "player" || other.type == "remoteplayer") && other.id != ent.creator) {
        // var collisionTime = collision.collidesSwept(ent, other, from, to)
        // if (collisionTime > 1.0 || collisionTime > closestTime) continue
        // closestTime = collisionTime

        var hit = collision.getSweptBoxCollision(from, delta, ent.shape, other.position, new Vector3(.5, .5, .5), other.rotation)
        if (hit.collision) {
          enemyHit = other
          hitPoint = hit.position
        }

        // Only add state commands if this was our bullet
        if (hit.collision && other.type != "player")
          this.addStateCommand({command: "hit", target: other.id, shooter: ent.creator, damage: ent.damage})
      }
    }

    if (enemyHit) {
      ent.markedForDeletion = true
      ent.position.copy(hitPoint ? hitPoint : enemyHit.position)
      for (var i = 0; i < bullet.gibsPerBullet; i++) {
        this.add(gib.create(this.genLocalId(), ent, {decal:true, size: .05}))
      }
    }
    else {
      ent.position.copy(to)
    }
  }
}

module.exports = bullet