var Vector3 = THREE.Vector3
var Euler   = THREE.Euler
var Level   = require('./level')

var sharedMaterial
var diffuse
function getMaterial() {
  if (!sharedMaterial) {
    diffuse = THREE.ImageUtils.loadTexture('/blood.png')
    diffuse.magFilter = diffuse.minFilter = THREE.NearestFilter
    sharedMaterial = new THREE.MeshPhongMaterial( {
      specular: 0x444444,
      map: diffuse,
      shininess: 0,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      wireframe: false
    })
  }

  return sharedMaterial
}

var check = new Vector3(1, 1, 1)
var up = new Vector3(0, 1, 0)

function Decal(entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  if (!Level.defaultMesh) throw Error('Scene mesh be set in Level.defaultMesh for decal to work')

  // Copying from decal example
  var m = new THREE.Matrix4()
  var c = entity.direction.clone()
  c.negate()
  c.multiplyScalar(10)
  c.add(entity.position)
  m.lookAt(entity.position, c, up)
  m = m.extractRotation(m)
  var euler = new Euler().setFromRotationMatrix(m)
  var rotation = new Vector3(euler.x, euler.y, euler.z)
  rotation.z = Math.random() * 2 * Math.PI

  var scale = Math.random() * 1 + .5
  var dimensions = new Vector3(scale, scale, scale)

  // cant share geometry.
  var geometry = new THREE.DecalGeometry(Level.defaultMesh, entity.position, rotation, dimensions, check)
  this.o3d.add(new THREE.Mesh(geometry, getMaterial()))
}

Decal.cache = function() {
  getMaterial()
}

module.exports = Decal
