
module.exports = function colorChildren(children, color) {
  for ( var i = 0; i < children.length; i++ ) {
    children[i].material.color.setHex(color)
  }
}
