var loadJSON    = require('../stage/modelloader').loadJSON
var loadTexture = require('../stage/textureloader').loadTexture
var Vector3     = THREE.Vector3
var Quaternion  = THREE.Quaternion
var weapons     = require("../config/weapon")
var action      = require("../action")

function switchWeapons(weaponName) {
  if (!this.weaponMesh) return

  var weapon = weapons[weaponName]
  if (!weapon) return

  var opts = {
    modelfile: weapon.model || '/models/assault.json',
    material: this.weaponMesh.material
  }
  loadJSON(opts, function(geometry, material) {
    this.weaponMesh.geometry = geometry
  }.bind(this))
}

function findHandBone(bones) {
  for (var i = 0; i < bones.length; i++) {
    if (bones[i].name === 'Hand_Right_jnt') return bones[i]
  }
  return null
}

function Player(entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()
  this.currentWeapon = entity.weapon.primary.id || 'pistol'
  this.idleTimer = 0
  this.idling = false
  this.runTimer = 0
  this.running = false
  this.runX = 0

  var texture = loadTexture('/textures/terror.png')
  var handsMaterial = this.handsMaterial = new THREE.MeshLambertMaterial({ map: texture, skinning: true, shading: THREE.FlatShading })

  this.handMesh = new THREE.BlendCharacter()
  this.handMesh.load('/models/hands.json', handsMaterial, onHandMeshLoaded.bind(this))
}

function onHandMeshLoaded() {
  this.handMeshLoaded = true
  var handMesh = this.handMesh
  this.o3d.add(handMesh)

  var texture = loadTexture('/textures/pistol.png')
  var weaponMaterial = weaponMaterial = new THREE.MeshLambertMaterial({ map: texture, shading: THREE.FlatShading })
  var opts = {
    modelfile: '/models/pistol.json',
    material: weaponMaterial
  }
  loadJSON(opts, onWeaponMeshLoaded.bind(this))
}

function onWeaponMeshLoaded(geometry, material) {
  // Load weapon mesh after hand since we need to attach weapon to hand
  var bones = this.handMesh.skeleton.bones
  var weaponMesh = this.weaponMesh = new THREE.Mesh(geometry, material)
  var bone = findHandBone(bones)
  if (bone) bone.add(weaponMesh)

  if (this.currentWeapon) switchWeapons.call(this, this.currentWeapon)
}

Player.prototype = {
  hasAnim: function(animName) {
    return animName && this.handMeshLoaded &&this.handMesh.animations[animName]
  },

  isPlaying: function(animName) {
    if (!this.hasAnim(animName)) return
    return this.playerMesh.animations[animName].isPlaying
  },

  play: function(animName, loop, startTime, duration) {
    if (!this.hasAnim(animName)) return
    
    var animation = this.handMesh.animations[animName]
    animation.loop = !!loop
    this.handMesh.play(animName, 1.0, startTime || 0.0)

    if (typeof duration === 'number' && duration > 0) {
      animation.timeScale = animation.data.length / duration
    }
    else {
      animation.timeScale = 1
    }
  },

  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    var weapon = weapons[e.weapon.primary.id]

    var idleY = 0
    if (e.timeSinceLastMove > .5) {
      if (!this.idling) {
        this.idleTimer = 0
        this.idling = true
      }

      this.idleTimer += dt * Math.PI
      idleY = Math.sin(this.idleTimer) * -.025
    }
    else {
      this.idling = false
    }

    if (e.actions & action.RUNNING) {
      if (!this.running) {
        this.running = true
        this.runTimer = 0
      }
      this.runTimer += dt * Math.PI
      this.runX = Math.sin(this.runTimer) * .15
    }
    else {
      this.running = false
      this.runX *= Math.exp(-dt * 10)
    }

    if (this.handMeshLoaded) {
      this.handMesh.position.set(0 + this.runX, -2.5 + idleY, -2.0)
      this.handMesh.rotation.set(Math.PI / 10, 0, 0, 'XYZ')

      if (e.newShot) {
        this.play(weapon.shootAnimation, false, 0, weapon.clip === 1 ? weapon.reloadTime : 0)
      }
      else if (e.newReload && weapon.reloadAnimation) {
        this.play(weapon.reloadAnimation, false, 0, weapon.reloadTime)
      }

      this.handMesh.update(dt)
    }

    o3d.position.set(e.position.x, e.position.y + 1, e.position.z)
    o3d.rotation.setFromQuaternion(e.getRotation())

    // Switch weapons if changed. Using property currentWeapon on Player
    if (this.currentWeapon !== e.weapon.primary.id) {
      this.currentWeapon = e.weapon.primary.id
      switchWeapons.call(this, this.currentWeapon)

      this.play(weapon.reloadAnimation ? weapon.reloadAnimation : weapon.shootAnimation, false, weapon.readyTime)
    }
  }
}

module.exports = Player