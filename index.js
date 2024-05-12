const express = require('express'),
    app = express(),
    { createServer } = require('http'),
    { Server } = require('socket.io'),
    cors = require('cors')

app.use(cors())

const server = createServer(app)
const io = new Server(server, { cors: { origin: "*", methods: "*" } })

app.get('/test', (req, res) => res.send("Yessss"))



const createBoard = () => {
    let gameBoard = []
    let iterations = 3
    for (let i = 0; i < iterations; i++) {
        let buttonRow = []
        for (let j = 0; j < iterations; j++) {
            buttonRow.push({
                symbol: '',
                animationTrigger: 0,
                isInactive: false,
                location: [i, j]
            })
        }
        gameBoard.push(buttonRow)
    }
    return gameBoard
}


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
        socket.roomCode = roomId //setting player1 defaultRoom
        rooms[roomId] = { users: [{ userId: data.userId }], capacity: 2 }
        updateUsersCount(rooms[roomId])
        console.log(rooms);
        socket.emit("create-game", { roomId })
        io.to(roomId).emit("game-code", { gameCode: roomId })
        io.to(roomId).emit("gamejoin-alert", `${data.userId} joined room number ${roomId}`)
    })

    socket.on("join-game", (data) => { //Player 2 tries to join
        let roomId = String(data.gameCode)
        if (rooms[roomId].inRoom === 2) {
            socket.emit("full-room", { success: false, alert: "Room is already full" })
        } else {
            socket.join(roomId)
            socket.roomCode = roomId
            console.log(rooms[roomId].users);
            rooms[roomId]?.users?.push({ userId: data.userId })
            updateUsersCount(rooms[data.gameCode])
            let room = io.sockets.adapter.rooms.get(roomId)
            if (room.has(socket.id)) {
                io.to(roomId).emit("join-data", { roomId: roomId, success: true, members: io.sockets.adapter.rooms.get(roomId).size })


            } else {
                socket.emit("join-data", { success: false, alert: "Could not connect" })
            }
        }
    })
})



server.listen(3000, () => console.log("listening on port 3000"))



// users: [{id: 'm78f0Jam6mIagUpAAAAK', symbol: X },{}    ]