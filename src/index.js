const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUserInRoom, getUser } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)
    socket.emit('message', generateMessage('Server', 'welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Server', `${user.username} has joined !`))

    callback()
  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('profanity is not allowed')
    }
    io.to(user.room).emit('message', generateMessage(user.username, message))
    callback()
  })
  socket.on('sendLocation', (position, callback) => {
    const user = getUser(socket.id)

    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps/?q=${position.lat},${position.lon}`))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessage('Server', `${user.username} has left`))
    }
  })
})

server.listen(port, () => {
  console.log(`listen on port ${port} `)
})

