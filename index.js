const express = require('express'),
    app = express(),
    { createServer } = require('http'),
    { Server } = require('socket.io'),
    cors = require('cors')

app.use(cors())

const server = createServer(app)
const io = new Server(server, { cors: { origin: "*", methods: "*" } })
const { createBoard, updateSymbol, checkBoard } = require('./functions')
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
        socket.roomCode = roomId //setting player1 defaultRoom

        rooms[roomId] = { users: [{ userId: data.userId }], capacity: 2 }
        updateUsersCount(rooms[roomId])
        // console.log(rooms);
        socket.emit("create-game", { roomId })
        io.in(roomId).emit("game-code", { gameCode: roomId })
        io.in(roomId).emit("gamejoin-alert", `${data.userId} joined room number ${roomId}`)
    })

    socket.on("join-game", (data) => { //Player 2 tries to join
        let roomId = String(data.gameCode)
        if (rooms[roomId] && Array.isArray(rooms[roomId].users)) {

            if (rooms[roomId].inRoom === 2) {
                socket.emit("full-room", { success: false, alert: "Room is already full" })
            } else {
                socket.join(roomId)

                socket.roomCode = roomId;

                // console.log(rooms[roomId].users);
                rooms[roomId]?.users?.push({ userId: data.userId })
                updateUsersCount(rooms[data.gameCode])
                let room = io.sockets.adapter.rooms.get(roomId)
                if (room.has(socket.id)) {
                    io.to(roomId).emit("join-data", { roomId: roomId, success: true, members: io.sockets.adapter.rooms.get(roomId).size })
                } else {
                    socket.emit("join-data", { success: false, alert: "Could not connect" })
                }
            }
        } else {
            socket.emit("incorrect-code", { alert: "Room doesnt exists, try a different code" })
        }
    })


    socket.on("symbol-choice", (data) => {
        // console.log("my choice: ", data)
        let roomId = socket.roomCode;

        // console.log(roomId)
        const myUserId = rooms[roomId].users.find(user => socket.id === user.userId);


        myUserId.symbol = data

        // console.log(myUserId)

        const opponent = rooms[roomId].users.find(user => socket.id !== user.userId);

        opponent.symbol = setSymbol(data)

        // console.log(opponent)
        // console.log(myUserId)

        socket.on("sides-chosen", (data) => {
            if (data.complete) {
                let roomId = socket.roomCode;
                let complete = data.complete
                // console.log(data.chosenSymbol);
                let chosenSymbol = data.chosenSymbol

                let opponentSymbol = setSymbol(chosenSymbol)

                rooms[roomId].gameBoard = createBoard()
                rooms[roomId].movesCounter = 0
                console.log(rooms[roomId].gameBoard);
                socket.to(roomId).emit("sides-chosen", { complete, opponentSymbol })
                let newGameBoard = rooms[roomId].gameBoard
                rooms[roomId].currentTurn = rooms[roomId].users.find(user => user.symbol === 'X').userId
                // console.log(rooms[roomId]);
                let initialTurn = rooms[roomId].currentTurn
                io.in(roomId).emit("create-board", { gameBoard: newGameBoard, initialTurn })
            }
        })


    })

    socket.on("game-move", (data) => {
        let roomId = socket.roomCode;
        let roomBoard = rooms[roomId].gameBoard
        let location = data.location
        let symbol = data.mySymbol
        rooms[roomId].gameEnded = false
        let result = updateSymbol(location[0], location[1], symbol, roomBoard)
        console.log(result);
        if (result) {
            rooms[roomId].movesCounter++
            rooms[roomId].gameBoard = result
            let gameBoard = rooms[roomId].gameBoard
            let checkUp = checkBoard(gameBoard, location[0], location[1], symbol)
            rooms[roomId].currentTurn = rooms[roomId].users.find(user => user.userId !== socket.id).userId
            io.in(roomId).emit("game-move", { gameBoard: rooms[roomId].gameBoard, newTurn: rooms[roomId].currentTurn })
            // let gameEnded = false
            let gameWinner = null
            if (checkUp) {
                rooms[roomId].gameBoard = checkUp.gameBoard
                rooms[roomId].gameEnded = checkUp.gameEnded
                let gameEnded = rooms[roomId].gameEnded
                gameWinner = checkUp.gameWinner
                io.in(roomId).emit("game-end", { gameEnded: gameEnded, gameWinner: gameWinner, gameBoard: rooms[roomId].gameBoard })
            }
            if (!checkUp && rooms[roomId].movesCounter === 9) {
                rooms[roomId].gameEnded = true
                let gameEnded = rooms[roomId].gameEnded
                gameWinner = 'Draw'
                io.in(roomId).emit("game-end", { gameEnded: gameEnded, gameWinner })
            }
        } else {
            socket.emit("illegal-move", { illegal: true, alert: "Illegal move" })
        }
        // console.log(rooms[roomId]);
        // console.log(rooms[roomId].gameBoard);
    })

})

const setSymbol = (data) => {
    if (data === "X") {
        return "O"
    }
    if (data === "O") {
        return "X"
    }
}

server.listen(3000, () => console.log("listening on port 3000"))



// users: [{id: 'm78f0Jam6mIagUpAAAAK', symbol: X },{}    ]