
// async model loader

var models = []

function loadModel(model, material, onsuccess) {
  if (!model) return
  onsuccess = typeof material === 'function' ? material : onsuccess
  material = typeof material === 'function' ? null : material

  if (models[model]) {
    return onsuccess(models[model])
  }

  var loader = material ? new THREE.OBJMTLLoader() : new THREE.OBJLoader()
  var onloaded = function (mesh) {
    models[model] = mesh
    onsuccess(mesh)
  }

  if (material)
    loader.load(model, material, onloaded)
  else
    loader.load(model, onloaded)
}

module.exports = loadModel
