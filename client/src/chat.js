function add (ul, name, text) {
  if (!text) return
  var li = document.createElement("li")
  var span = document.createElement("span")
  span.textContent = name + ": "
  var msg = document.createTextNode(text)
  li.appendChild(span)
  li.appendChild(msg)

  ul.appendChild(li)
  ul.scrollTop = ul.scrollHeight
}

function onKeyUp (e) {
  e.preventDefault()
  e.stopPropagation()
  if (e.keyCode != 13) return
  this.submit()
}

function onChat (e) {
  add(this.ul, this.names[e.sender] || e.sender, e.context)
}

function onPlayers (e) {
  names = this.names
  Object.keys(e.context).forEach(function (key) {
    names[key] = e.context[key].name
  })
}

function onPlayerEnter (e) {
  this.names[e.context.id] = e.context.name
}

function Chat (connection) {
  var conn = this.conn = connection
  conn.on("chat", onChat.bind(this))
  conn.on("players", onPlayers.bind(this))
  conn.on("playerenter", onPlayerEnter.bind(this))
  this.names = {}
  this.el = document.createElement("div")
  this.el.className = "chat noselect"
  this.ul = document.createElement("ul")
  this.el.appendChild(this.ul)
  this.input = document.createElement("input")
  this.input.type = "text"
  this.input.placeholder = "Press enter to type..."
  this.input.addEventListener("keyup", onKeyUp.bind(this))
  this.input.addEventListener("blur", this.blur.bind(this))
  this.el.appendChild(this.input)
}

Chat.prototype = {
  submit: function submit() {
    value = this.input.value

    if (!value) return this.blur()

    this.conn.send("chat", value, {broadcast: true})
    this.input.value = ""
  },

  focus: function focus() {
    this.el.classList.add("focus")
    this.input.placeholder = "Say something..."
    this.input.focus()
  },

  blur: function blur () {
    this.input.blur()
    this.el.classList.remove("focus")
    this.input.placeholder = "Press enter to type..."
  }
}

module.exports = Chat