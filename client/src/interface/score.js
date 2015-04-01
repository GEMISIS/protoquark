function onScoreBoard (e) {
  
}

function Score (connection) {
  this.conn = connection
  this.el = document.createElement('div')

  connection.on('scoreboard', onScoreBoard.bind(this))
}

Score.prototype = {
  open: function open () {
    this.el.classList.add("active")
    this.render()
  },
  close: function close () {
    this.el.classList.remove("active")
  },
  render: function render () {

  }
}

module.exports = Score