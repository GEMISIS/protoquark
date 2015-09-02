var bullets      = require("./bullets")
var weapons      = require("../config/weapon")
var collision    = require("../collision")
var Vector3      = require("../math").vec3
var action       = require("../action")

var playerShape = new Vector3(.25, .65, .25)

function applyDelta(ent, delta, collision, colliders, stick) {
  var prev = new Vector3().copy(ent.position)
  var hit = collision.getSweptCollision(prev, delta, colliders, playerShape, stick)
  if (hit.collision) ent.position.copy(hit.position)
  else ent.position.add(delta)

  return hit.collision
}

function getWeapon(ent) {
  return ent.weapon.active === "primary" ? ent.weapon.primary : ent.weapon.secondary 
}

function getWeaponStats(weapon) {
  return weapons[weapon.id]
}

function reload(ent) {
  var weapon = getWeapon(ent)
  var weaponStats = getWeaponStats(weapon)

  if (!ent.reloading && weapon.ammunition > 0 && weapon.clip < weaponStats.clip) {
    weapon.reloadTimer = weaponStats.reloadTime
    ent.newReload = true
    ent.reloading = true
  }
}

module.exports = function updatePlayer(dt, ent) {
  var angle = ent.euler.y
  var sinAngle = Math.sin(angle)
  var cosAngle = Math.cos(angle)
  var speed = ent.speed || 4

  var delta = new Vector3(0, 0, 0)
  var colliders = this.colliders

  // Reset from last frame.
  ent.newShot = false
  ent.newReload = false
  var actions = 0

  if (ent.control.forward || ent.control.backward) {
    actions |= action.RUNNING
    var multiplier = ent.control.forward ? 1 : -1
    delta.x += sinAngle * speed * dt * multiplier
    delta.z -= cosAngle * speed * dt * multiplier
  }

  if (ent.control.strafeleft || ent.control.straferight) {
    actions |= action.RUNNING
    var multiplier = ent.control.straferight ? 1 : -1
    delta.x += cosAngle * speed * dt * multiplier
    delta.z += sinAngle * speed * dt * multiplier
  }

  applyDelta(ent, delta, collision, colliders, false)

  if (ent.control.look && (ent.control.look.x > 0 || ent.control.look.y > 0)) {
    // Turning rather.
    // actions |= action.RUNNING
  }

  if (ent.control.jump && !ent.jumping) {
    ent.jumping = true
    ent.jump = 4
    actions |= action.JUMPING
  }

  // apply gravity
  ent.jump -= dt * 10
  var gravity = new Vector3(0, ent.jump * dt, 0)
  var minY = -1.0
  if (applyDelta(ent, gravity, collision, colliders, false) || ent.position.y < minY) {
    ent.position.y = Math.max(ent.position.y, minY)
    ent.jumping = false
    ent.jump = 0
  }

  if (ent.invincibility > 0) ent.invincibility -= dt

  ent.updateRotation()

  // Queue up packets to send - we'll clear this once sent
  if (this.conn.connected) {
    ent.addSnapshot(this.conn.getServerTime(), ent.control)
  }

  var weapon = getWeapon(ent)
  var weaponStats = getWeaponStats(weapon)
  var delay = 1 / weaponStats.firerate

  if (ent.control.reload) reload(ent)

  weapon.shotTimer -= dt
  weapon.shotTimer = Math.max(weapon.shotTimer, 0)
  if (ent.shooting && weapon.shotTimer <= 0) ent.shooting = false

  weapon.reloadTimer -= dt
  weapon.reloadTimer = Math.max(weapon.reloadTimer, 0)
  if (ent.reloading && weapon.reloadTimer <= 0) {
    ent.reloading = false
    weapon.clip = Math.min(weapon.ammunition, weaponStats.clip)
  }

  if (ent.control.shoot && (!ent.lastControl.shoot || weaponStats.automatic) && !ent.shooting && !ent.reloading && weapon.ammunition > 0) {
    if (weapon.clip > 0) {
      ent.newShot = true
      ent.shooting = true
      weapon.shotTimer = delay
      var bulletPos = ent.getOffsetPosition(new Vector3().addVectors(ent.weaponStartOffset, ent.position), ent.weaponOffsetPos)
      this.add(bullets.create(this.genLocalId(), ent, "normal", {
        position: bulletPos,
        damage: weaponStats.damage,
        speed: weaponStats.speed
      }))

      weapon.ammunition--
      weapon.clip--
      // Single shot weapon, immediately reload
      if (weaponStats.clip === 1) {
        reload(ent)
      }
    }
    else {
      reload(ent)
    }
  }
  weapon.shotT = 1.0 - weapon.shotTimer / delay

  if (weapon.shotTimer > Number.EPSILON) actions |= action.SHOOTING
  if (weapon.reloadTimer > Number.EPSILON) actions |= action.RELOADING

  ent.actions = actions
  if (actions != 0) {
    ent.timeSinceLastMove = 0
  }
}