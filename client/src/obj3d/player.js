var loadJSON    = require('../stage/modelloader').loadJSON
var loadTexture = require('../stage/textureloader').loadTexture
var Vector3     = THREE.Vector3
var Quaternion  = THREE.Quaternion
var weapons     = require("../config/weapon")

function switchWeapons(weaponName) {
  if (!this.weaponMesh) return
  
  var weapon = weapons[weaponName]
  if (!weapon) return

  loadJSON(weapon.model || '/models/assault.json', this.weaponMesh.material, function(geometry, material) {
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
  loadJSON('/models/pistol.json', weaponMaterial, onWeaponMeshLoaded.bind(this))
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
  play: function(animName, loop, duration) {
    if (!animName || !this.handMeshLoaded || !this.handMesh.animations[animName]) return
    
    var animation = this.handMesh.animations[animName]
    animation.loop = !!loop
    this.handMesh.play(animName, 1.0)

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
    var weapon = weapons[this.currentWeapon]

    if (this.handMeshLoaded) {
      this.handMesh.position.set(0, -2.5, -2.0)
      this.handMesh.rotation.set(Math.PI / 10, 0, 0, 'XYZ')

      if (e.newShot) {
        this.play(weapon.shootAnimation)
      }
    }

    o3d.position.set(e.position.x, e.position.y + 1, e.position.z)
    o3d.rotation.setFromQuaternion(e.getRotation())

    // Switch weapons if changed. Using property currentWeapon on Player
    if (this.currentWeapon !== e.weapon.primary.id) {
      this.currentWeapon = e.weapon.primary.id
      switchWeapons.call(this, this.currentWeapon)
      this.play(weapon.realodAnimation)
    }
  }
}

module.exports = Player