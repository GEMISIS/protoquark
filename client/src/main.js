var Chat       = require("./chat")
var Connection = require("./connection")
var Router     = require("./router")
var Stage      = require("./stage")

window.connection = new Connection();

function onRoom (name) {
  console.log("connect to or create room:", name)
  window.connection.connect(name)
}

document.addEventListener("DOMContentLoaded", function (e) {
  // Main entry point.
  console.log("Hello World.")

  var el = document.body

  var router = new Router()
  router.add("room", /^\/([^\/]+)\/?$/)
  router.on("route:room", onRoom)
  router.listen()

  var stage = new Stage()
  el.appendChild(stage.el)
  stage.resize()

  var chat = new Chat(window.connection)
  el.appendChild(chat.el)

  window.addEventListener("resize", stage.resize.bind(stage))

  window.addEventListener("keyup", function (e) {
    if (e.keyCode == 13) chat.focus()
  })
})