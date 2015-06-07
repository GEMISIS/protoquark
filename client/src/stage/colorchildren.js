
// async model loader

var models = []

function loadModel(model, material, onsuccess) {
  if (!model) return
  if (models[model]) {
    if (onsuccess) onsuccess(models[model])
    return
  }

  var loader = material ? new THREE.OBJMTLLoader() : new THREE.OBJLoader()
  var onloaded = function (mesh) {
    models[entity.model] = mesh
    onsuccess(mesh)
  }

  if (material)
    loader.load(model, material, onloaded)
  else
    loader.load(model, onloaded)
}

module.exports = function colorChildren(children, color) {
  for ( var i = 0; i < children.length; i++ ) {
    children[i].material.color.setHex(color)
  }
}
