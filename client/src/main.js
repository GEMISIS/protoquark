var Chat       = require("./chat")
var Connection = require("./connection")
var Controller = require("./controller")
var Router     = require("./router")
var Stage      = require("./stage")

window.connection = new Connection();

function onRoom (name) {
  window.connection.connect(name)
}

document.addEventListener("DOMContentLoaded", function (e) {
  var conn = window.connection
  var el = document.body

  var router = new Router()
  router.add("room", /^\/([^\/]+)\/?$/)
  router.on("route:room", onRoom)

  var stage = window.stage = new Stage(conn)
  el.appendChild(stage.el)
  stage.resize()

  var chat = new Chat(conn)
  el.appendChild(chat.el)

  var controller = new Controller(conn)
  controller.listen()

  window.addEventListener("resize", stage.resize.bind(stage))

  window.addEventListener("keyup", function (e) {
    if (e.keyCode == 13) chat.focus()
  })

  window.addEventListener("beforeunload", function (e) {
    connection.kill()
  })

  router.listen()
})