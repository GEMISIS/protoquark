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

function Player (entity) {
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
}

Player.prototype = {
  play: function(animName, weight, loop, ignoreUnusedBones) {
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
  },

  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    // o3d.rotation.setFromQuaternion(e.rotation)
    // Note we're adding offset of Math.PI to getRotationY since model is facing down positive z axis
    // but all the rotations are assuming facing negative z
    o3d.rotation.setFromQuaternion(e.getRotationY(Math.PI))

    if (e.newShot) {
      this.play('sniper', 1, false, true)
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

module.exports = Player