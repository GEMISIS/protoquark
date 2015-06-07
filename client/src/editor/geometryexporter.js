function exportGeometry(geometry) {
  var vertices = geometry.vertices
    , numVerts = Math.min(geometry.visibleVertices, geometry.vertices.length)
    , numFaces = Math.floor(numVerts / 3)
    , faces = geometry.faces

  for (var f = 0; f < numFaces; f++) {
    var index = f * 3
      , color = faces[f].color || new THREE.Color(0xFFFFFF)
    vertices[index].color = color
    vertices[index + 1].color = color
    vertices[index + 2].color = color
  }
  return vertices.slice(0, numVerts)
}

module.exports = exportGeometry