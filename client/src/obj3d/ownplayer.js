var Vector3 = THREE.Vector3
var Quaternion = THREE.Quaternion

var shaftGeometry;
var handleGeometry;

var weaponGeometries = {
  pistol: {
    handlePosition: new Vector3(0.0, -.025, .02),
    shaft: new THREE.BoxGeometry(.02, .02, .1),
    handle: new THREE.BoxGeometry(.02, .03, .02)
  },

  sniper: {
    handlePosition: new Vector3(0.0, -.025, .02),
    shaft: new THREE.BoxGeometry(.02, .02, .5),
    handle: new THREE.BoxGeometry(.02, .03, .02)
  },

  assault: {
    handlePosition: new Vector3(0.0, -.035, .02),
    shaft: new THREE.BoxGeometry(.02, .04, .2),
    handle: new THREE.BoxGeometry(.02, .03, .02)
  },
}

function switchWeapons(weaponName) {
  // addWeaponMeshes(this.o3d, material)
  var geometries = weaponGeometries[weaponName]
  if (!geometries) return

  this.handleMesh.geometry = geometries.handle
  this.shaftMesh.geometry = geometries.shaft

  var handle = this.handleMesh
  var position = geometries.handlePosition
  // Take halfway between shaft size and handle size in z dimension. Put below shaft in y dimension
  handle.position.set(position.x, position.y, position.z)
}

function OwnPlayer(entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var material = new THREE.MeshPhongMaterial({
    color: 0xAAAAAA
  })

  this.handleMesh = new THREE.Mesh(weaponGeometries.pistol.handle, material)
  this.shaftMesh = new THREE.Mesh(weaponGeometries.pistol.shaft, material)
  this.o3d.add(this.handleMesh)
  this.o3d.add(this.shaftMesh)

  this.currentWeapon = entity.weapon.primary.id || 'pistol'
  switchWeapons.call(this, this.currentWeapon)
}

OwnPlayer.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity

    o3d.position.copy(e.getOffsetPosition(new Vector3().addVectors(e.weaponStartOffset, e.position), e.weaponOffsetPos))

    var time = e.weapon.primary.shotT || 0
      , weaponAngle = Math.sin(time * Math.PI) * 40 * Math.PI / 180
    o3d.rotation.setFromQuaternion(e.getOffsetRotation(weaponAngle, 0))

    // Switch weapons if changed.
    if (this.currentWeapon !== e.weapon.primary.id) {
      this.currentWeapon = e.weapon.primary.id
      switchWeapons.call(this, this.currentWeapon)
    }
  }
}

module.exports = OwnPlayer