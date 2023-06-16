const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken')
const { Server } = require("socket.io");
const db = require('./db')

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

class Room {
    constructor(id, name, owner, deckId, max) {
        this.id = id
        this.name = name
        this.owner = owner
        this.deckId = deckId

        this.users = {}
        this.black = null

        this.round = 1
        this.maxScore = max
        this.maxPlayers = 5

        this.cardChar = null
        this.cardCharN = 0

        this.status = 'Waiting for game start.'
        this.started = false
        this.logs = []
    }
}

const rooms = {}
const jwtKey = process.env.JWT_KEY

const decodeToken = (token) => {
    let data = null
    try {
        data = jwt.verify(token, jwtKey)

    } catch (err) {
        console.log(err)
    }
    return data
}

io.use(async (socket, next) => {
    console.log('middleware')
    const token = socket.handshake.auth.token
    const decoded = decodeToken(token)
    const gameId = socket.handshake.query.id

    if (decoded === null) {
        const err = new Error("Invalid token.");
        next(err);
        return
    }

    if (decoded.game !== gameId) {
        const err = new Error("Invalid id.");
        next(err);
        return
    }

    let room
    if (Object.keys(rooms).includes(decoded.game)) {
        room = rooms[decoded.game]
    } else {
        const gameData = await db.getGameData(gameId)
        console.log('game data', gameData)
        room = new Room(decoded.game, decoded.name, gameData.owner, gameData.id, gameData.max)
        rooms[decoded.game] = room
    }

    if (!Object.keys(room.users).includes(decoded.user)) {
        const userData = {
            id: decoded.user,
            socketId: socket.id,
            name: decoded.username,
            img: decoded.img,
            sound: decoded.sound,
            online: true,
            score: 0,
            cards: []
        }
        room.users[decoded.user] = userData
        socket.userData = userData
    } else if (!room.users[decoded.user].online === true) {
        room.users[decoded.user].online = true
        room.users[decoded.user].socketId = socket.id
        socket.userData = room.users[decoded.user]
    }

    console.log('rooms', socket.rooms)
    socket.join(gameId)
    console.log('rooms', socket.rooms)

    io.to(gameId).emit('data', rooms[gameId])
    socket.emit('message', 'Passed from middleware 1.')
    next()
})

io.on('connection', (socket) => {
    console.log('connection', socket.id)
    socket.emit('userData', socket.userData)
    socket.emit('message', 'Connected 2.')
    io.to(socket.handshake.query.id).emit('data', rooms[socket.handshake.query.id])

    socket.on('start', async () => {
        console.log('starting game')
        const roomId = socket.handshake.query.id
        console.log(roomId)
        const room = rooms[roomId]

        if (room.owner !== socket.userData.id) {
            io.to(roomId).emit('message', `${socket.id} is impatient.`)
            return
        }

        if (Object.keys(room.users).filter(uId => room.users[uId].online === true).length < 2) {
            io.to(socket.id).emit('message', 'Not enough online users to start game, need at least 2.')
            return
        }

        const cardChar = Object.keys(room.users)[room.cardCharN]
        room.cardChar = room.users[cardChar].id
        room.status = `Game started. ${room.users[cardChar].name} is card char.`
        room.started = true

        room.black = await db.getBlackCard(room.deckId)
        for (let u in room.users) {
            // !!!change, send it only to owner of cards
            const whiteCards = await db.getWhiteCards(room.deckId, 10)
            room.users[u].cards = whiteCards
            socket.userData.cards = whiteCards
            io.to(room.users[u].socketId).emit('userData', whiteCards)
        }

        io.to(roomId).emit('data', room)

        // io.to(roomId).emit('message', { message: `Game started, ${room.reader} is reading now.` })
    })

    socket.on('chosenCards', (roomId, cards) => {
        const room = rooms[roomId]
        room.setUserChosenCards(socket.id, cards)
        const [usersCards, roundEnd] = room.getUsersCards()
        if (roundEnd === false) {
            io.to(roomId).emit('users', room.getUsers())
            return
        }
        const data = room.getData()
        data['usersCards'] = usersCards
        io.to(roomId).emit('data', data)
        if (room.isReaderOnline() === true) return
        io.to(roomId).emit('message', { message: `${room.reader} is offline, everyone can choose a winner now.` })
    })

    socket.on('roundEnd', async (roomId, winnerName) => {
        const room = rooms[roomId]
        const username = room.getUserName(socket.id)
        if (room.users[room.reader].online === false) {
            if (username === winnerName) {
                io.to(socket.id).emit('message', { message: `You can't choose yourself as a winner.` })
                return
            }
        }
        else if (username != room.reader) {
            io.to(socket.id).emit('message', { message: `You are not reading now.` })
            return
        }



        room.endRound(winnerName)
        const winnerOfTheGame = room.isGameEnded()
        if (winnerOfTheGame !== null) {
            const userId = room.getUserId(winnerOfTheGame)
            await db.endGame(roomId, winnerOfTheGame, userId)
            io.to(roomId).emit('message', { message: `Game ended, ${winnerOfTheGame} won.` })
            io.to(roomId).emit('gameEnd', winnerOfTheGame)
            return
        }

        const black = await db.getBlackCard()
        room.setBlack(black.rows[0])

        for (let username in room.users) {
            const n = room.getNumberOfMissingCards(username)
            const white = await db.getWhiteCards(room.deckId, n)
            room.addUserWhiteCards(username, white.rows)
            const userSocketId = room.getUserSocketId(username)
            io.to(userSocketId).emit('cards', room.getUserWhiteCards(username))
        }

        io.to(roomId).emit('data', room.getData())
        io.to(roomId).emit('users', room.getUsers())
        io.to(roomId).emit('sound', room.getUserSound(winnerName))

        io.to(roomId).emit('message', { message: `${winnerName} won round.` })
        io.to(roomId).emit('message', { message: `${room.reader} is reading now.` })
    })

    socket.on('disconnecting', () => {
        const roomId = socket.handshake.query.id
        socket.leave(roomId)
        const room = rooms[roomId]
        if (room && socket.userData) {
            room.users[socket.userData.id].online = false
        }
        io.to(roomId).emit('data', room)
    })
})

server.listen(3000, () => console.log('listening on port 3000'));
