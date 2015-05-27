var Editor = require("./editor.js")

document.addEventListener("DOMContentLoaded", function (e) {
  var canvas = document.getElementById("canvas")
  window.editor = new Editor(canvas)
})