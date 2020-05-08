const socket = io()

// elements
const messages = document.querySelector('#messages')
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const locationButton = document.querySelector('#location-button')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
  const newMessage = messages.lastElementChild

  const newMessageStyles = getComputedStyle(newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin
  const visibleHeight = messages.offsetHeight
  const containerHeight = messages.scrollHeight
  const scrollOffset = messages.scrollTop + visibleHeight

  if (containerHeight -  newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight

  }


}

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('kk:mm')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('locationMessage', (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('kk:mm')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  messageFormButton.setAttribute('disabled', 'disabled')

  socket.emit('sendMessage', messageFormInput.value, (error) => {
    messageFormButton.removeAttribute('disabled')
    messageFormInput.value = ''
    messageFormInput.focus()
    if (error) {
      return alert(error)
    }
  })
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return
  }
  locationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      lat: position.coords.latitude,
      lon: position.coords.longitude
    }, () => {
      locationButton.removeAttribute('disabled')
      console.log('location shared')
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
