var bullets    = require("./bullets")
var weapons    = require("../config/weapon")
var collision    = require("../collision")
var Vector3    = require("../math").vec3

function applyDelta(ent, delta, collision, colliders, stick) {
  var prev = new Vector3().copy(ent.position)
  var hit = collision.getSweptCollision(prev, delta, colliders, stick)
  if (hit.collision) ent.position = hit.position
  else ent.position.add(delta)
  return hit.collision
}

module.exports = function updatePlayer (dt, ent) {
  var angle = ent.euler.y
  var sinAngle = Math.sin(angle)
  var cosAngle = Math.cos(angle)
  var speed = ent.speed || 2

  var delta = new Vector3(0, 0, 0)
  var colliders = this.colliders

  if (ent.control.forward || ent.control.backward) {
    var multiplier = ent.control.forward ? 1 : -1
    delta.x += sinAngle * speed * dt * multiplier
    delta.z -= cosAngle * speed * dt * multiplier
  }

  if (ent.control.strafeleft || ent.control.straferight) {
    var multiplier = ent.control.straferight ? 1 : -1
    delta.x += cosAngle * speed * dt * multiplier
    delta.z += sinAngle * speed * dt * multiplier
  }

  applyDelta(ent, delta, collision, colliders)

  if (ent.control.jump && !ent.jumping) {
    ent.jumping = true
    ent.jump = 6
  }

  // apply gravity
  ent.jump -= dt * 12
  var gravity = new Vector3(0, ent.jump * dt, 0)
  if (applyDelta(ent, gravity, collision, colliders, false) || ent.position.y < 0) {
    ent.position.y = Math.max(ent.position.y, 0)
    ent.jumping = false
    ent.jump = 0
  }

  ent.updateRotation()

  // Queue up packets to send - we'll clear this once sent
  if (this.conn.connected)
    ent.addSnapshot(this.conn.getServerTime(), ent.control)

  var weapon = ent.weapon.active === "primary" ? ent.weapon.primary : ent.weapon.secondary
  if (!weapon) return
  var weaponStats = weapons[weapon.id]
  weapon.shotTimer -= dt
  if (ent.control.shoot && (!ent.lastControl.shoot || weaponStats.automatic) && weapon.shotTimer <= 0 && weapon.ammunition > 0) {
    weapon.shotTimer = 1 / weaponStats.firerate
    this.add(bullets.create(this.genLocalId(), ent, "normal"))
    weapon.ammunition--
  }
}
