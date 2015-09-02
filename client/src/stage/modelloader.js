// async obj and json model loader
// caches model if already loaded
var meshesOBJ = []
var geometryJSON = []

function loadOBJ(modelfile, materialfile, onsuccess) {
  if (!modelfile) return
  onsuccess = typeof materialfile === 'function' ? materialfile : onsuccess
  materialfile = typeof materialfile === 'function' ? null : materialfile

  if (meshesOBJ[modelfile]) {
    return onsuccess(meshesOBJ[modelfile])
  }

  var loader = materialfile ? new THREE.OBJMTLLoader() : new THREE.OBJLoader()
  var onloaded = function (mesh) {
    meshesOBJ[modelfile] = mesh
    onsuccess(mesh)
  }

  if (materialfile)
    loader.load(modelfile, materialfile, onloaded)
  else
    loader.load(modelfile, onloaded)
}

/**
  * onsuccess will get passed in the created geometry and supplied material
  */
function loadJSON(modelfile, material, onsuccess) {
  if (geometryJSON[modelfile]) {
    return onsuccess(geometryJSON[modelfile], material)
  }

  var loader = new THREE.JSONLoader()
  loader.load(modelfile, function(geometry, materials) {
    geometryJSON[modelfile] = geometry
    // Note we override whatever materials was set
    if (onsuccess) onsuccess(geometry, material)
  })
}

module.exports = {
  loadOBJ: loadOBJ,
  loadJSON: loadJSON
}
