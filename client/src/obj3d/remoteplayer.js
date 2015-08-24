var loadJSON    = require('../stage/modelloader').loadJSON
var loadTexture = require('../stage/textureloader').loadTexture
var Vector3     = THREE.Vector3
var Quaternion  = THREE.Quaternion
var weapons     = require("../config/weapon")
var action      = require("../action")

var geometry;
function getGeometry() {
  if (!geometry) geometry = new THREE.BoxGeometry(1, 1, 1)
  return geometry
}

var runAnim = 'run'
var idleAnim = 'idle'
var animCrossDuration = .10

// Some manual hierarchy ignoring to combine animations where only one half of the skeleton
// is actually used.
// Note that three.js Animation update must be modified to check for this
// hierarchy to pass to ignore lower parts
var ignoredLower = [false, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
var ignoredUpper = [true, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
var ignoredArms = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true]
var ignoredNone = []

function RemotePlayer(entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()
  this.playingShootAnim = false
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
  this.play(idleAnim, true)

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
  isPlaying: function(animName) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return false
    return this.playerMesh.animations[animName].isPlaying
  },

  isCrossFading: function(animName) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return false
    for (var i = 0; i < this.playerMesh.weightSchedule.length; i++) {
      if (this.playerMesh.weightSchedule[i].anim == this.playerMesh.animations[animName]) return true
    }
  },

  getWeight: function(animName) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return false
    return this.playerMesh.animations[animName].weight
  },

  stop: function(animName) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return false
    var animation = this.playerMesh.animations[animName]
    animation.stop(0)
    animation.weight = 0
  },

  setIgnore: function(animName, ignore) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return
    
    var animation = this.playerMesh.animations[animName]
    if (typeof ignore === 'object') {
      if (ignore.upper) animation.hierarchyIgnored = ignoredUpper
      else if (ignore.lower) animation.hierarchyIgnored = ignoredLower
      else if (ignore.arms) animation.hierarchyIgnored = ignoredArms
      else animation.hierarchyIgnored = ignoredNone
    }
    else {
      animation.hierarchyIgnored = ignoredNone
    }
  },

  fadeIn: function(animName, duration) {
    this.fade(animName, 0, 1, duration)
  },

  fadeOut: function(animName, duration) {
    this.fade(animName, 1, 0, duration)
  },

  fade: function(animName, start, end, duration) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return

    this.playerMesh.weightSchedule.push( {
      anim: this.playerMesh.animations[animName],
      startWeight: start,
      endWeight: end,
      timeElapsed: 0,
      duration: duration
    } );
  },

  // cross fades but prevAnimName is already playing
  playFadeIn: function(animName, prevAnimName, loop, ignore, duration) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return
    var prevAnim = this.playerMesh.animations[prevAnimName]
    var nextAnim = this.playerMesh.animations[animName]

    if (prevAnim && prevAnim.isPlaying) {
      this.play(animName, loop, ignore, duration)
      nextAnim.weight = 0

      this.fadeOut(prevAnimName, animCrossDuration)
      this.fadeIn(animName, animCrossDuration)
    }
    else {
      this.play(animName, loop, ignore, duration)
    }
  },

  play: function(animName, loop, ignore, duration) {
    if (!animName || !this.playerMeshLoaded || !this.playerMesh.animations[animName]) return
    
    var animation = this.playerMesh.animations[animName]
    animation.loop = !!loop
    this.playerMesh.play(animName, 1.0)

    this.setIgnore(animName, ignore)

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
    var actions = e.actions
    o3d.position.set(e.position.x, e.position.y - .65, e.position.z)

    var weapon = weapons[e.weapon.primary.id]
    var shootAnimation = weapon.shootAnimation

    // Note we're adding offset of Math.PI to getRotationY since model is facing down positive z axis
    // but all the rotations are assuming facing negative z
    o3d.rotation.setFromQuaternion(e.getRotationY(Math.PI))

    if (e.newShot) {
      this.play(shootAnimation, false, {lower:true})
      this.playingShootAnim = true
    }

    if (this.weaponMesh && this.currentWeapon !== e.weapon.primary.id) {
      this.currentWeapon = e.weapon.primary.id
      switchWeapons.call(this, this.currentWeapon)
    }

    var running = actions & action.RUNNING
    var shooting = actions & action.SHOOTING
    if (running && !this.isPlaying(runAnim)) {
      this.playFadeIn(runAnim, idleAnim, true)
    }
    else if (!running && !this.isPlaying(idleAnim)) {
      this.playFadeIn(idleAnim, runAnim, true)
    }

    // If was previously shooting and animation has just ended, then cross fade from the end frame of the shoot animation
    // (which it should currently be on since it stays with end frame after animation is done) to idle / running animation.
    // Note we need a flag playingShootAnim since when we set to last frame with timeScale of 0, isPlaying would still return true
    if (this.playingShootAnim && !this.isPlaying(shootAnimation) /*!shooting*/) {
      var animation = this.playerMesh.animations[shootAnimation]

      this.playingShootAnim = false

      // play last-ish frame
      animation.play(animation.data.length - Number.EPSILON)
      // make it never advance (at least until we play the animation again)
      animation.timeScale = 0

      // now cross fade
      this.fadeOut(shootAnimation, animCrossDuration)
      // Cross fade only if not already fading in.
      if (running && !this.isCrossFading(runAnim)) {
        this.fadeIn(runAnim, animCrossDuration)
      }
      else if (!running && !this.isCrossFading(idleAnim)) {
        this.fadeIn(idleAnim, animCrossDuration)
      }
    }

    // Only ignore upper animations if shooting
    this.setIgnore(runAnim, {upper: this.playingShootAnim || shooting})
    this.setIgnore(idleAnim, {upper: this.playingShootAnim || shooting})

    // blink if invincible
    var blinkInterval = .5
    if (e.invincibility && e.invincibility > 0) {
      this.material.opacity = Math.cos(e.invincibility / blinkInterval * 2 * Math.PI) * .5 + .5
    }
    else {
      this.material.opacity = 1
    }

    // !NOTE! Do this last since some of our animation smoothing crossfades works better with it.
    if (this.playerMeshLoaded) {
      this.playerMesh.update(dt)
    }
  }
}

module.exports = RemotePlayer