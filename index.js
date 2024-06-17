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
        let displayName = data.userName
        let displayImageIndex = data.imageIndex


        socket.join(roomId) //send the id to the join, and to the client
        socket.roomCode = roomId //setting player1 defaultRoom

        rooms[roomId] = { users: [{ userId: data.userId, wins: 0, displayName, displayImageIndex }], capacity: 2, replay: [] }

        updateUsersCount(rooms[roomId])
        // console.log(rooms);
        socket.emit("create-game", { roomId })
        io.in(roomId).emit("game-code", { gameCode: roomId })
        io.in(roomId).emit("gamejoin-alert", `${data.userId} joined room number ${roomId}`)
    })

    socket.on('clear-connection', () => {
        let userId = socket.id
        let roomId = socket.roomCode

        let roomUsers = rooms[roomId]?.users
        if (roomUsers) {
            rooms[roomId].users = rooms[roomId].users.filter(user => user.userId !== userId)
            console.log("Cleared Connection");

            if (rooms[roomId].users.length < 1) {
                delete rooms[roomId]
                console.log("Cleared Connection and deleted Room");

            }

        }
    })

    socket.on("join-game", (data) => { //Player 2 tries to join
        let roomId = String(data.gameCode)
        let displayName = data.userName
        let displayImageIndex = data.imageIndex
        if (rooms[roomId] && Array.isArray(rooms[roomId].users)) {

            if (rooms[roomId].inRoom === 2) {
                socket.emit("full-room", { success: false, alert: "Room is already full" })
            } else {
                socket.join(roomId)

                socket.roomCode = roomId;


                rooms[roomId]?.users?.push({ userId: data.userId, wins: 0, displayName, displayImageIndex })
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

        let roomId = socket.roomCode;


        const myUserId = rooms[roomId].users.find(user => socket.id === user.userId);


        myUserId.symbol = data



        const opponent = rooms[roomId].users.find(user => socket.id !== user.userId);

        opponent.symbol = setSymbol(data)



        socket.on("sides-chosen", (data) => {
            if (data.complete) {
                let roomId = socket.roomCode;
                let complete = data.complete

                let chosenSymbol = data.chosenSymbol

                let opponentSymbol = setSymbol(chosenSymbol)

                rooms[roomId].gameBoard = createBoard()
                rooms[roomId].movesCounter = 0
                    ;
                socket.to(roomId).emit("sides-chosen", { complete, opponentSymbol })


            }
        })


    })

    socket.on('player2Ready', (data) => {
        let roomId = socket.roomCode
        if (data.success) {

            socket.to(roomId).emit("player2IsReady", { success: true })

        }

    })


    socket.on('both-ready', (data) => {
        if (data.status) {
            let roomId = socket.roomCode
            let newGameBoard = rooms[roomId].gameBoard
            rooms[roomId].currentTurn = rooms[roomId].users.find(user => user.symbol === 'X').userId
            // console.log(rooms[roomId]);
            let initialTurn = rooms[roomId].currentTurn
            const roomUsers = rooms[roomId].users
            io.in(roomId).emit("create-board", { gameBoard: newGameBoard, initialTurn, roomUsers })
        }
    })


    socket.on("game-move", (data) => {
        let roomId = socket.roomCode;
        console.log(roomId);
        console.log(socket.id);
        let room = io.sockets.adapter.rooms.get(roomId)
        if (room.has(socket.id)) {
            console.log(room);
            console.log("hello");
        }
        let roomBoard = rooms[roomId].gameBoard
        let location = data.location
        let symbol = data.mySymbol
        rooms[roomId].gameEnded = false
        let result = updateSymbol(location[0], location[1], symbol, roomBoard)
        // console.log(result);
        if (result) {

            rooms[roomId].movesCounter++
            rooms[roomId].gameBoard = result
            let gameBoard = rooms[roomId].gameBoard
            let checkUp = checkBoard(gameBoard, location[0], location[1], symbol)
            rooms[roomId].users.forEach(user => {
                console.log(user);
            });
            rooms[roomId].currentTurn = rooms[roomId].users.find(user => user.userId !== socket.id).userId
            io.in(roomId).emit("game-move", { gameBoard: rooms[roomId].gameBoard, newTurn: rooms[roomId].currentTurn })
            // let gameEnded = false
            let gameWinner = null

            if (checkUp) {
                rooms[roomId].gameBoard = checkUp.gameBoard
                rooms[roomId].gameEnded = checkUp.gameEnded
                let gameEnded = rooms[roomId].gameEnded

                gameWinner = checkUp.gameWinner
                let winnerUser = rooms[roomId].users.find(user => user.symbol === gameWinner)
                winnerUser.wins++
                let roomUsers = rooms[roomId].users
                console.log("userId", winnerUser.userId);
                io.in(roomId).emit("game-end", { gameEnded: gameEnded, gameWinner: { userId: winnerUser.userId, symbol: gameWinner }, roomUsers, gameBoard: rooms[roomId].gameBoard })
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

    })

    socket.on('recollect-user-info', (data) => {
        console.log("", data.userId);
        console.log("", data.roomId);
        let userRoom = rooms[data.roomId]
        if (userRoom) {
            //In Socket.IO, the socket.id is a read-only property that is automatically generated by the server to uniquely identify each socket connection. Therefore, you cannot directly assign a value to socket.id like socket.id = data.userId.
            //REDIFINE USERID, MAYBE GENERATE AN ID MYSELF AND PUT IN LOCAL STORAGE, THEN USE IT TO IDENTIFY AND TRY JOINING IT.
            let user = userRoom.users.find(user => user.userId === data.userId)
            let opponent = userRoom.users.find(user => user.userId !== data.userId)
            let gameBoard = userRoom.gameBoard
            let currentTurn = userRoom.currentTurn
            socket.roomCode = data.roomId
            socket.id = data.userId
            socket.join(data.roomId)
            socket.emit('refresh-user-info', { userInfo: user, opponentInfo: opponent, gameBoard, currentTurn })
        }
    })

    socket.on("backing-user", () => {
        let roomId = socket.roomCode
        console.log(roomId);
        console.log("hi");
        socket.to(roomId).emit("user-backed", { alert: 'opponent left the game' })
    })

    socket.on("play-again", () => {
        let roomId = socket.roomCode;

        let replay = rooms[roomId].replay
        replay.push(socket.id)
        // console.log("replay?", rooms[roomId].replay);
        let result = shouldReplay(replay)
        if (result) {
            replayReset(roomId)
            // console.log(rooms);
            rooms[roomId].currentTurn = rooms[roomId].users.find(user => user.symbol === 'X').userId
            io.in(roomId).emit("playing-again", { gameBoard: rooms[roomId].gameBoard, gameEnded: rooms[roomId].gameEnded, currentTurn: rooms[roomId].currentTurn })
            rooms[roomId].replay = []
        } else {
            socket.emit("waiting-replay", { alert: "Waiting..." })
        }
    })

})

const shouldReplay = (replayRoom) => {
    if (replayRoom.length === 2) {
        return true
    } else {
        return false
    }
}

const replayReset = (roomId) => {
    rooms[roomId].gameBoard = createBoard()
    rooms[roomId].gameEnded = false
    rooms[roomId].movesCounter = 0

}

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