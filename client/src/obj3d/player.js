function Player (geo) {
  this.o3d = new THREE.Object3D()

  var material = new THREE.MeshBasicMaterial({
    color: 0xff0000
  })
  var geometry = geo || new THREE.BoxGeometry(1, 1, 1)
  var mesh = new THREE.Mesh(geometry, material)

  this.o3d.add(mesh)
}

module.exports = Player