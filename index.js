const express = require('express'),
    app = express(),
    { createServer } = require('http'),
    { Server } = require('socket.io'),
    cors = require('cors')

app.use(cors())

const server = createServer(app)
const io = new Server(server, { cors: { origin: "*", methods: "*" } })

app.get('/test', (req, res) => res.send("Yessss"))

const rooms = {}

function getRandomId() {

    return Math.floor(100000 + Math.random() * 900000)
}

function doesRoomExist(roomId) {
    return io.sockets.adapter.rooms.has(roomId);
}

function updateUsersCount(room) {
    if (room && Array.isArray(room.users)) {
        room.inRoom = room.users.length
    }
}
io.on('connection', (socket) => {

    socket.on('create-game', (data) => {
        console.log("Received user Id", data.userId);
        let roomId = String(getRandomId())

        socket.join(roomId) //send the id to the join, and to the client
        rooms[roomId] = { users: [data.userId], capacity: 2 }
        updateUsersCount(rooms[roomId])
        console.log(rooms);
        socket.emit("create-game", { roomId })
        io.to(roomId).emit("game-code", { gameCode: roomId })
        io.to(roomId).emit("gamejoin-alert", `${data.userId} joined room number ${roomId}`)
    })

    socket.on("join-game", (data) => {
        let roomId = String(data.gameCode)

        socket.join(roomId)
        // console.log(doesRoomExist(roomId));

        console.log(rooms[roomId].users);
        rooms[roomId]?.users?.push(data.userId)
        updateUsersCount(rooms[data.gameCode])
        let room = io.sockets.adapter.rooms.get(roomId)
        if (room.has(socket.id)) {
            socket.emit("join-data", { success: true, members: io.sockets.adapter.rooms.get(roomId).size })
        } else {
            socket.emit("join-data", { success: false, alert: "Could not connect" })
        }
    })
})



server.listen(3000, () => console.log("listening on port 3000"))