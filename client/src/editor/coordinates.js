var Vector3 = THREE.Vector3

// Convert map point (2d) to world 3d point
module.exports = {
  convert2Dto3D: function convert2Dto3D(point, y, canvasDimensions, gradient) {
    gradient = gradient || .025
    return new Vector3((point.x - canvasDimensions.x / 2) * gradient, y, (point.y - canvasDimensions.y / 2) * gradient)
  }
}
