var loadJSON    = require('../stage/modelloader').loadJSON
var loadTexture = require('../stage/textureloader').loadTexture
var Vector3     = THREE.Vector3
var Quaternion  = THREE.Quaternion
var weapons     = require("../config/weapon")

var geometry;
function getGeometry() {
  if (!geometry) geometry = new THREE.BoxGeometry(1, 1, 1)
  return geometry
}

// Some manual hierarchy ignoring to combine animations where only one half of the skeleton
// is actually used.
// Note that three.js Animation update must be modified to check for this
var hierarchyIgnoredUpper = [
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
]

var hierarchyIgnoredLower = [
  true,
  true,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
]

function RemotePlayer(entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var material = this.material = new THREE.MeshBasicMaterial({
    color: 0xAAAAAA,
    transparent: true,
    opacity: 1.0
  })

  // this.o3d.add(new THREE.Mesh(getGeometry(), material))

  var texture = loadTexture('/textures/terror.png')
  var playerMaterial = this.playerMaterial = new THREE.MeshLambertMaterial({ map: texture, skinning: true, shading: THREE.FlatShading })

  this.playerMesh = new THREE.BlendCharacter()
  this.playerMesh.load('/models/chars.json', playerMaterial, onPlayerMeshLoaded.bind(this))
}

function onPlayerMeshLoaded() {
  this.o3d.add(this.playerMesh)
  this.playerMeshLoaded = true
  this.play('running', 1, true, true)

  var texture = loadTexture('/textures/pistol.png')
  var weaponMaterial = weaponMaterial = new THREE.MeshLambertMaterial({ map: texture, shading: THREE.FlatShading })
  loadJSON('/models/pistol.json', weaponMaterial, onWeaponMeshLoaded.bind(this))
}

function onWeaponMeshLoaded(geometry, material) {
  var bones = this.playerMesh.skeleton.bones
  var weaponMesh = this.weaponMesh = new THREE.Mesh(geometry, material)
  var bone = findHandBone(bones)

  // Rotate since by default weapon is places as if we're looking down neg z
  weaponMesh.rotation.set(0, Math.PI, 0, 'XYZ')

  if (bone) bone.add(weaponMesh)
}

function findHandBone(bones) {
  for (var i = 0; i < bones.length; i++) {
    if (bones[i].name === 'Hand_Right_jnt') return bones[i]
  }
  return null
}

function switchWeapons(weaponName) {
  if (!this.weaponMesh || !weapons[weaponName]) return
  
  var weapon = weapons[weaponName]

  loadJSON(weapon.model || '/models/assault.json', this.weaponMesh.material, function(geometry, material) {
    this.weaponMesh.geometry = geometry
  }.bind(this))
}

RemotePlayer.prototype = {
  play: function(animName, weight, loop, ignoreUnusedBones, duration) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return
    
    var animation = this.playerMesh.animations[animName]
    animation.loop = !!loop
    this.playerMesh.play(animName, weight)

    if (ignoreUnusedBones && animName === 'running') {
      animation.hierarchyIgnored = hierarchyIgnoredLower
    }
    else if (ignoreUnusedBones) {
      animation.hierarchyIgnored = hierarchyIgnoredUpper
    }
    else {
      // No ignoring.
      animation.hierarchyIgnored = []
    }

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
    o3d.position.set(e.position.x, e.position.y - .65, e.position.z)

    var weapon = weapons[e.weapon.primary.id]

    // o3d.rotation.setFromQuaternion(e.rotation)
    // Note we're adding offset of Math.PI to getRotationY since model is facing down positive z axis
    // but all the rotations are assuming facing negative z
    o3d.rotation.setFromQuaternion(e.getRotationY(Math.PI))

    if (e.newShot) {
      this.play(weapon.shootAnimation, 1, false, true)
    }

    if (this.weaponMesh && this.currentWeapon !== e.weapon.primary.id) {
      this.currentWeapon = e.weapon.primary.id
      switchWeapons.call(this, this.currentWeapon)
    }

    // blink if invincible
    var blinkInterval = .5
    if (e.invincibility && e.invincibility > 0) {
      this.material.opacity = Math.cos(e.invincibility / blinkInterval * 2 * Math.PI) * .5 + .5
    }
    else {
      this.material.opacity = 1
    }
  }
}

module.exports = RemotePlayer