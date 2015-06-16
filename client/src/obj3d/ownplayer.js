var Vector3 = THREE.Vector3
var Quaternion = THREE.Quaternion

var shaftGeometry;
var handleGeometry;

function getShaftGeometry() {
  if (!shaftGeometry) shaftGeometry = new THREE.BoxGeometry(.02, .02, .1)
  return shaftGeometry
}

function getHandleGeometry() {
  if (!handleGeometry) handleGeometry = new THREE.BoxGeometry(.02, .03, .02)
  return handleGeometry
}

function getHandleMesh(material) {
  var mesh = new THREE.Mesh(getHandleGeometry(), material)
  // position half of height of handle and shaft
  mesh.position.set(0, -(.03 + .02) / 2, .02)
  return mesh
}

function getShaftMesh(material) {
  return new THREE.Mesh(getShaftGeometry(), material)
}

function addWeaponMeshes(o3d, material) {
  o3d.add(getShaftMesh(material))
  o3d.add(getHandleMesh(material))
}

function OwnPlayer (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var material = new THREE.MeshPhongMaterial({
    color: 0xAAAAAA
  })
  addWeaponMeshes(this.o3d, material)
}

OwnPlayer.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity

    o3d.position.copy(e.getOffsetPosition(new Vector3().addVectors(e.weaponStartOffset, e.position), e.weaponOffsetPos))

    var time = e.weapon.primary.shotT || 0
      , weaponAngle = Math.sin(time * Math.PI) * 40 * Math.PI / 180
    o3d.rotation.setFromQuaternion(e.getOffsetRotation(weaponAngle, 0))
  }
}

module.exports = OwnPlayer