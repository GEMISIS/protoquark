var Vector3 = THREE.Vector3

var geometry, material
function getGeometry() {
  if (!geometry) geometry = new THREE.BoxGeometry(0.03, 0.03, 0.03)
  return geometry
}
function getMaterial() {
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF
    })
  }
  return material
}

var particleGeo = null
var sparksEmitter = null

function createEmitterTrail(scene) {
  if (sparksEmitter) return

  var numParticles = 30

  var material = new THREE.PointCloudMaterial({
      // color: 0xFFFFFF,
      size: .10,
      sizeAttenuation: true,
      vertexColors: THREE.VertexColors,
      transparent:true
  })

  particleGeo = new THREE.Geometry()
  for (var i = 0; i < numParticles; i++) {
    particleGeo.vertices.push(new Vector3(.5, .5, .5))
    particleGeo.colors.push(new THREE.Color(0xAAAAAA))
  }

  var particleSystem = new THREE.PointCloud(particleGeo, material)
  particleSystem.frustumCulled = false
  particleSystem.sortParticles = true
  scene.add(particleSystem)

  sparksEmitter = new SPARKS.Emitter(SPARKS.SteadyCounter(numParticles))
  sparksEmitter.addInitializer(new SPARKS.Position(new SPARKS.PointZone(this.entity.position)))
  sparksEmitter.addInitializer(new SPARKS.Lifetime(.1, .5))
  sparksEmitter.start()
  sparksEmitter.addAction(new SPARKS.RandomDrift(.5, .5, .5))
  sparksEmitter.addAction(new SPARKS.Age())

  var vertex = 0
  sparksEmitter.addCallback("updated", function(p) {
    particleGeo.vertices[p.vertexId].set(p.position.x, p.position.y, p.position.z)
  })
  sparksEmitter.addCallback("created", function(p) {
    p.vertexId = vertex++
  })
  sparksEmitter.addCallback("dead", function(p) {
    particleGeo.vertices[p.vertexId].set(0, -10, 0)
  })
}

function Bullet (entity, scene) {
  this.entity = entity
  this.o3d = new THREE.Object3D()
  this.o3d.add(new THREE.Mesh(getGeometry(), getMaterial()))

  // createEmitterTrail(scene)
}

Bullet.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.setFromQuaternion(e.rotation)

    // particleGeo.verticesNeedUpdate = true
  }
}

module.exports = Bullet