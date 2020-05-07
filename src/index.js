const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {

  socket.emit('message', 'Welcome')
  socket.broadcast.emit('message', 'A new user as join')

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('profanity is not allowed')
    }
    io.emit('message', message)
    callback()
  })
  socket.on('sendLocation', (position, callback) => {

    io.emit('locationMessage', `https://google.com/maps/?q=${position.lat},${position.lon}`)
    callback()
  })

  socket.on('disconnect', () => {
    io.emit('message', 'a user as left')
  })
})

server.listen(port, () => {
  console.log(`listen on port ${port} `)
})

