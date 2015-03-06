var Router = require("./router")
var Chat   = require("./chat")

function onRoom (name) {
  console.log("connect to or create room:", name)
}

document.addEventListener("DOMContentLoaded", function (e) {
  // Main entry point.
  console.log("Hello World.")

  var el = document.body

  var router = new Router()
  router.add("room", /^\/([^\/]+)\/?$/)
  router.on("route:room", onRoom)
  router.listen()

  var chat = new Chat
  el.appendChild(chat.el)

  window.addEventListener("keyup", function (e) {
    if (e.keyCode == 13) chat.focus()
  })
})