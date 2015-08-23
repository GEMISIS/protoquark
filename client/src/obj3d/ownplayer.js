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

function OwnPlayer(entity) {
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
  weaponMesh.materials
  var bone = findHandBone(bones)
  if (bone) bone.add(weaponMesh)

  switchWeapons.call(this, this.currentWeapon)
  debugger
}

OwnPlayer.prototype = {
  play: function(animName, weight, loop) {
    if (!animName || !this.handMeshLoaded || !this.handMesh.animations[animName]) return
    
    var animation = this.handMesh.animations[animName]
    animation.loop = !!loop
    this.handMesh.play(animName, weight)
  },

  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    var weapon = weapons[this.currentWeapon]

    if (this.handMeshLoaded) {
      // both sniper and shotgun shoot only once and immediately go to animation reload
      // if (this.animation.currentTime > endTime) {
      //   this.animation.stop()
      //   this.animation.play(startTime)
      // }
      this.handMesh.position.set(0, -2.5, -2.0)
      // this.handMesh.rotation.set(Math.PI / 8, Math.PI / 8, 0, 'XYZ')
      this.handMesh.rotation.set(Math.PI / 10, 0, 0, 'XYZ')

      if (e.newShot) {
        // this.animation.data = this.animationDatas[2]
        // this.animation = new THREE.Animation(this.handMesh, this.animationDatas[weapon.shootAnimation || 2])
        debugger
        this.play(weapon.shootAnimation, 1.0)

        // var animationData = this.animationDatas[weapon.shootAnimation || 2]
        // this.animation.data = THREE.AnimationHandler.init(animationData)
        // this.animation.currentTime = 0
        // this.animation.timeScale = 1
        // this.animation.loop = false
        // this.animation.play()
      }
    }

    o3d.position.set(e.position.x, e.position.y + 1, e.position.z)
    o3d.rotation.setFromQuaternion(e.getRotation())
    // o3d.rotation.setFromQuaternion(e.getOffsetRotation(Math.cos(weapon.shotT * Math.PI) * .5, 0))

    // Switch weapons if changed.
    if (this.currentWeapon !== e.weapon.primary.id) {
      this.currentWeapon = e.weapon.primary.id
      switchWeapons.call(this, this.currentWeapon)
      this.play(weapon.realodAnimation, 1.0)
    }
  }
}

module.exports = OwnPlayer