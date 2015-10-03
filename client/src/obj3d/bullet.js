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
var lastSparksInitializer
var lastPosition = new Vector3()
var trailTime = 0
var trailPosition = new Vector3()

function createEmitterTrail(scene) {
  if (sparksEmitter) {
    sparksEmitter.removeInitializer(lastSparksInitializer)

    lastSparksInitializer = new SPARKS.Position(new SPARKS.PointZone(trailPosition))
    sparksEmitter.addInitializer(lastSparksInitializer)
    return
  }

  var numParticles = 50
  var freeParticles = []

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
    freeParticles.push(i)
  }

  var particleSystem = new THREE.PointCloud(particleGeo, material)
  particleSystem.frustumCulled = false
  particleSystem.sortParticles = true
  scene.add(particleSystem)

  sparksEmitter = new SPARKS.Emitter(SPARKS.SteadyCounter(numParticles))

  // lastSparksInitializer = new SPARKS.Position(new SPARKS.PointZone(this.entity.position))
  lastSparksInitializer = new SPARKS.Position(new SPARKS.PointZone(trailPosition))
  sparksEmitter.addInitializer(lastSparksInitializer)
  sparksEmitter.addInitializer(new SPARKS.Lifetime(.1, .5))
  
  // sparksEmitter.addAction(new SPARKS.RandomDrift(.5, .5, .5))
  sparksEmitter.addAction(new SPARKS.RandomDrift(2, 2, 2))
  sparksEmitter.addAction(new SPARKS.Age())

  sparksEmitter.addCallback("updated", function(p) {
    particleGeo.vertices[p.vertexId].set(p.position.x, p.position.y, p.position.z)
  })
  sparksEmitter.addCallback("created", function(p) {
    if (freeParticles.length) p.vertexId = freeParticles.pop()
  })
  sparksEmitter.addCallback("dead", function(p) {
    freeParticles.push(p.vertexId)
    particleGeo.vertices[p.vertexId].set(0, -10, 0)
  })

  sparksEmitter.start()
}

function Bullet(entity, scene) {
  this.entity = entity
  this.o3d = new THREE.Object3D()
  this.o3d.add(new THREE.Mesh(getGeometry(), getMaterial()))

  // trail position is slower than the bullet
  trailPosition.copy(this.entity.position)
  trailTime = 0

  // createEmitterTrail.call(this, scene)
}

Bullet.update = function(dt) {
  // if (particleGeo) particleGeo.verticesNeedUpdate = true

  // trailTime += dt
  // trailPosition.lerp(lastPosition, Math.min(trailTime, 1.0))
}

Bullet.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.setFromQuaternion(e.rotation)

    lastPosition.copy(e.position)
  }
}

module.exports = Bullet