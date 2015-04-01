var bullets    = require("./bullets")
var weapons    = require("../config/weapon")

module.exports = function updatePlayer (dt, ent) {
  var angle = ent.euler.y
  var sinAngle = Math.sin(angle)
  var cosAngle = Math.cos(angle)
  var speed = ent.speed || 2

  if (ent.control.forward || ent.control.backward) {
    var multiplier = ent.control.forward ? 1 : -1
    ent.position.x += sinAngle * speed * dt * multiplier
    ent.position.z -= cosAngle * speed * dt * multiplier
  }

  if (ent.control.strafeleft || ent.control.straferight) {
    var multiplier = ent.control.straferight ? 1 : -1
    ent.position.x += cosAngle * speed * dt * multiplier
    ent.position.z += sinAngle * speed * dt * multiplier
  }

  ent.updateRotation()

  // Queue up packets to send - we'll clear this once sent
  if (this.conn.connected)
    ent.addSnapshot(this.conn.getServerTime(), ent.control)

  var weapon = ent.weapon.active === "primary" ? ent.weapon.primary : ent.weapon.secondary
  if (weapon) return
  var weaponStats = weapons[weapon.id]
  weapon.shotTimer -= dt
  if (ent.control.shoot && (!ent.lastControl.shoot || weaponStats.automatic) && weapon.shotTimer <= 0 && weapon.ammunition > 0) {
    weapon.shotTimer = 1 / weaponStats.firerate
    this.add(bullets.create(this.genLocalId(), ent, "normal"))
    weapon.ammunition--
  }
}
