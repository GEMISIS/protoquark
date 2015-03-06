var Chat       = require("./chat")
var Connection = require("./connection")
var Router     = require("./router")

window.connection = new Connection(name);

function onRoom (name) {
  console.log("connect to or create room:", name)
  window.connection.connect()
}

document.addEventListener("DOMContentLoaded", function (e) {
  // Main entry point.
  console.log("Hello World.")

  var el = document.body

  var router = new Router()
  router.add("room", /^\/([^\/]+)\/?$/)
  router.on("route:room", onRoom)
  router.listen()

  var chat = new Chat(window.connection)
  el.appendChild(chat.el)

  window.addEventListener("keyup", function (e) {
    if (e.keyCode == 13) chat.focus()
  })
})