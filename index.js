const express = require('express'),
    app = express(),
    { createServer } = require('http'),
    { Server } = require('socket.io'),
    cors = require('cors')

app.use(cors())

const server = createServer(app)
const io = new Server(server, { cors: { origin: "*", methods: "*" } })

app.get('/test', (req, res) => res.send("Yessss"))
const rooms = []
io.on('connection', (socket) => {
    socket.on('create-game', () => {
        //create obj of room with random ID
        let id = "5553"
        rooms.push({ id })
        socket.join(id) //send the id to the join, and to the client
        socket.emit('create-game', { id })
    })

})



server.listen(3000, () => console.log("listening on port 3000"))