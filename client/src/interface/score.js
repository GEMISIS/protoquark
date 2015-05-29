var ce = require('../eltree')

function onScoreBoard (scores) {
  this.scores = scores
  this.render()
}

function Score (engine) {
  this.engine = engine
  this.tree = ce({
    tagName: 'div',
    className: 'scoreboard',
    children: [{
      key: 'table',
      tagName: 'table',
      children: [{
        tagName: 'thead',
        children: [{
          key: 'row',
          tagName: 'tr',
          children: [
          { tagName: 'th', textContent: 'Rank' },
          { tagName: 'th', textContent: 'Player'},
          { tagName: 'th', textContent: 'Score'}
          ]
        }]
      }, {
        key: 'body',
        tagName: 'tbody'
      }]
    }]
  })
  this.el = this.tree.el
  this.scores = []

  engine.on('scoreboard', onScoreBoard.bind(this))
}

Score.prototype = {
  open: function open () {
    this.el.classList.add("active")
    this.render()
  },
  close: function close () {
    this.el.classList.remove("active")
  },
  toggle: function toggle () {
    this.el.classList.toggle('active')
  },
  render: function render () {
    var body = this.tree.children.table.children.body.el
    while (body.firstChild) {
      body.removeChild(body.firstChild)
    }

    var scores = this.scores
    Object.keys(this.scores).map(function(key) {
      return scores[key]
    }).sort(function (a, b) {
      if (a.score > b.score) return -1
      if (a.score < b.score) return 1
      return 0
    }).forEach(function (item, index, arr) {
      body.appendChild(ce({
        tagName: 'tr',
        children: [
        { tagName: 'td', textContent: index + 1 },
        { tagName: 'td', textContent: item.name },
        { tagName: 'td', textContent: item.score }
        ]
      }).el)
    })
  }
}

module.exports = Score