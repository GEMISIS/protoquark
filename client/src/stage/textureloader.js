var textures = []

function loadTexture(file) {
  if (!textures[file]) textures[file] = THREE.ImageUtils.loadTexture(file)

  return textures[file]
}

module.exports = {
  loadTexture: loadTexture
}