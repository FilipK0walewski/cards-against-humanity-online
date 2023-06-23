const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { decodeToken, Room } = require('./modules/common')
const db = require('./modules/db')

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const rooms = {}

io.use(async (socket, next) => {
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
        room = new Room(decoded.game, gameData.name, gameData.owner.toString(), gameData.deck, gameData.max, gameData.ended)
        rooms[decoded.game] = room
    }

    const userId = decoded.user.toString()
    const user = await db.getUserData(userId)
    if (!Object.keys(room.users).includes(userId)) {
        room.addUser(userId, socket.id, user.username || 'guest', user.img, user.sound)
        socket.userData = room.users[userId].data
    } else if (!room.users[userId].online === true) {
        room.users[userId].username = user.username || 'guest'
        room.users[userId].img = user.img
        room.users[userId].sound = user.sound
        room.users[userId].online = true
        room.users[userId].socketId = socket.id
        socket.userData = room.users[userId]
    }

    socket.join(gameId)
    io.to(gameId).emit('data', room.data)
    next()
})

io.on('connection', (socket) => {
    socket.emit('message', 'Connected.')
    socket.emit('userData', socket.userData)
    io.to(socket.handshake.query.id).emit('data', rooms[socket.handshake.query.id].data)

    socket.on('start', async () => {
        const roomId = socket.handshake.query.id
        const room = rooms[roomId]

        if (room.owner !== socket.userData.id) {
            socket.emit('message', `You can't start game, only owner can do it.`)
            return
        }

        if (room.ended === false && room.started === true) {
            socket.emit('message', `Game already started.`)
            return
        }

        if (Object.keys(room.users).filter(uId => room.users[uId].online === true).length < 2) {
            io.to(socket.id).emit('message', 'Not enough online users to start game, need at least 2.')
            return
        }

        await room.restart()
        for (let uId in room.users) {
            const whiteCards = await db.getWhiteCards(room.deckId, 10)
            room.users[uId].cards = whiteCards
            room.users[uId].selected = null
            room.users[uId].score = 0
            io.to(room.users[uId].socketId).emit('userData', room.users[uId].data)
        }

        io.to(roomId).emit('data', room.data)
    })

    socket.on('whites', (selected) => {
        const roomId = socket.handshake.query.id
        const room = rooms[roomId]

        if (!selected || room.black.fields !== selected.length) {
            socket.emit('message', 'Invalid number of selected cards.')
            return
        }

        const userId = socket.userData.id
        if (room.users[userId].selected !== null) {
            socket.emit('message', 'You selected your cards already.')
            return
        }

        room.users[userId].setSelected(selected)
        socket.userData = room.users[userId].data
        socket.emit('userData', room.users[userId].data)

        if (room.readyUsers.length !== room.playingUsers.length) {
            io.to(roomId).emit('data', room.data)
            return
        }

        room.setReading()
        room.updateStatus()
        io.to(roomId).emit('data', room.data)
    })

    socket.on('best', async (selected) => {
        if (!selected) {
            socket.emit('message', 'Select card.')
            return
        }

        const roomId = socket.handshake.query.id
        const room = rooms[roomId]

        if (room.cardChar !== socket.userData.id) {
            socket.emit('message', 'You are not card char.')
            return
        }

        const [winners, winScore] = await room.getWinners(selected)
        for (let uId of winners) {
            socket.emit('message', `${room.users[uId].name} scored ${winScore} point.`)
        }

        if (room.maxUserScore >= room.maxScore) {
            const usersWithMaxScore = Object.keys(room.users).filter(uId => room.users[uId].score === room.maxUserScore)
            if (usersWithMaxScore.length === 1) {
                await room.endGame(usersWithMaxScore[0])
                io.to(roomId).emit('data', room)
                return
            } 
        }

        for (let uId in room.users) {
            if (room.users[uId].selected !== null) {
                const newWhites = await db.getWhiteCards(room.deckId, room.black.fields)
                const userCards = [...room.users[uId].cards, ...newWhites]
                room.users[uId].cards = userCards
            } else if (room.users[uId].cards.length === 0){
                room.users[uId].cards = await db.getWhiteCards(room.deckId, 10)
            }
            room.users[uId].selected = null
            io.to(room.users[uId].socketId).emit('userData', room.users[uId].data)
        }

        await room.newRound()
        io.to(roomId).emit('data', room.data)
    })

    socket.on('kick', (userId) => {
        const roomId = socket.handshake.query.id
        const room = rooms[roomId]

        if (room.owner != socket.userData.id) {
            socket.emit('message', 'You cant\'t kick user, you are not owner of this game.')
            return
        }

        if (!Object.keys(room.users).includes(userId)) {
            socket.emit('message', `User with id ${userId} does not exists.`)
        }

        io.to(userId).emit('kick')
        delete room.users[userId]
        socket.emit('message', `User with id ${userId} kicked out.`)
        io.to(roomId).emit('data', room.data)
    })

    socket.on('disconnecting', () => {
        const roomId = socket.handshake.query.id
        const room = rooms[roomId]
        if (room && socket.userData) {
            try {
                room.users[socket.userData.id].online = false
            } catch {
                io.to(roomId).emit('message', 'Error while disconnecting.')
            }
        }

        try {
            if (room.onlineUsers.length === 0) {
                delete rooms[roomId]
                return
            }
        } catch {
            io.to(roomId).emit('message', 'Error while deleting room.')
        }

        socket.leave(roomId)
        io.to(roomId).emit('data', room.data)
    })
})

server.listen(3000, () => console.log('listening on port 3000'));
