var geometry
function getGeometry(entity) {
  if (!geometry) {
    geometry = new THREE.Geometry()

    var vertices = entity.context.vertices
      , numFaces = Math.floor(vertices.length / 3)

    for (var i = 0; i < vertices.length; i++) {
      var v = vertices[i]
      geometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z))
    }
    for (var f = 0; f < numFaces; f++) {
      var index = f * 3
        , face = new THREE.Face3(index, index + 1, index + 2)
        , color = vertices[index].color

      face.color = new THREE.Color(color.r, color.g, color.b)
      geometry.faces.push(face)
    }

    geometry.computeFaceNormals()
    geometry.computeVertexNormals() // Mainly for the decals
    geometry.verticesNeedUpdate = true
    geometry.colorsNeedUpdate = true
  }

  return geometry
}

function Level(entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var material = new THREE.MeshPhongMaterial({ shading: THREE.FlatShading, vertexColors: THREE.FaceColors })
  // var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors })
  // var material = new THREE.MeshNormalMaterial()
  var mesh = new THREE.Mesh(getGeometry(entity), material)

  this.o3d.frustumCulled = mesh.frustumCulled = false
  this.o3d.add(mesh)

  this.o3d.updateMatrix()

  Level.defaultMesh = mesh
}

module.exports = Level