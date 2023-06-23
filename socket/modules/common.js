const jwt = require('jsonwebtoken')
const db = require('./db')

const secret = process.env.SECRET_KEY

class User {
    constructor(id, socketId, name, img, sound) {
        this.id = id
        this.socketId = socketId
        this.name = name
        this.img = img
        this.sound = sound
        this.online = true
        this.score = 0
        this.selected = null
        this.cards = []
    }

    get basicData() {
        return {
            name: this.name,
            img: this.img,
            sound: this.sound,
            online: this.online,
            score: this.score
        }
    }

    get data() {
        return { ...this }
    }

    setSelected(cardIds) {
        this.selected = this.cards.filter(card => cardIds.includes(card.id))
        this.cards = this.cards.filter(card => !cardIds.includes(card.id))
    }

}

class Room {
    constructor(id, name, owner, deckId, max, ended) {
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

        this.started = false
        this.ended = ended
        this.reading = false
        this.cardsToRead = null

        this.status = 'Waiting for game start.'
        this.logs = []

        this.roundWinners = null
        this.roundWinScore = null
    }

    get data() {
        const users = {}
        for (let uId in this.users) {
            users[uId] = this.users[uId].basicData
        }

        return {
            name: this.name,
            owner: this.owner,
            users,
            black: this.black,
            cardChar: this.cardChar,
            started: this.started,
            ended: this.ended,
            reading: this.reading,
            cardsToRead: this.cardsToRead,
            status: this.status,
            logs: this.logs
        }
    }

    get onlineUsers() {
        return Object.keys(this.users).filter(uId => this.users[uId].online === true)
    }

    get readyUsers() {
        return Object.keys(this.users).filter(uId => this.users[uId].selected !== null)
    }

    get playingUsers() {
        return Object.keys(this.users).filter(uId => uId !== this.cardChar && this.users[uId].online === true && this.users[uId].cards.length !== 0)
    }

    get maxUserScore() {
        return Math.max(...Object.keys(this.users).map(uId => this.users[uId].score))
    }

    addUser(id, socketId, name, img, sound) {
        const user = new User(id, socketId, name, img, sound)
        this.users[id] = user
    }

    updateStatus() {
        this.status = `Round ${this.round}, ${this.users[this.cardChar].name} is card char.`
    }

    async restart() {
        this.black = await db.getBlackCard(this.deckId)
        this.round = 1
        this.cardCharN = 0
        this.started = true
        this.ended = false
        this.reading = false
        this.cardsToRead = null
        this.cardChar = Object.keys(this.users)[0]
        this.updateStatus()
    }

    async endGame(winnerId) {
        this.ended = true
        this.status = `${this.users[winnerId].name} won the game.`
        await db.endGame(this.id, winnerId)
    }

    async newRound() {
        this.round += 1
        this.black = await db.getBlackCard(this.deckId)
        this.cardsToRead = null
        this.reading = false
        this.cardCharN += 1
        if (this.cardCharN >= this.onlineUsers.length) {
            this.cardCharN = 0
        }
        this.cardChar = this.onlineUsers[this.cardCharN]
        this.updateStatus()
    }

    setReading() {
        const allCards = []
        for (let uId in this.users) {
            if (uId === this.cardChar) continue
            if (this.users[uId].selected === null) continue
            allCards.push(this.users[uId].selected)
        }

        this.reading = true
        this.cardsToRead = allCards
    }

    async getWinners(cards) {
        const winners = []
        for (let uId in this.users) {
            if (uId === this.cardChar || this.users[uId].selected === null || this.users[uId].selected.length !== cards.length) continue
            let winner = true
            for (let i = 0; i < cards.length; i++) {
                if (cards[i].id !== this.users[uId].selected[i].id) {
                    winner = false
                    break
                }
            }
            if (winner === true) winners.push(uId)
        }

        const winScore = Math.floor(1 / winners.length * 100) / 100
        for (let uId of winners) {
            this.users[uId].score += winScore
        }

        return [winners, winScore]
    }

    getNewCardChar() {
        let newCardChar = null
        for (let i = 0; i < Object.keys(this.users).length; i++) {
            if (i < this.cardCharN) continue
            const uId = Object.keys(this.users)[i]
            if (this.users[uId].online !== true) continue
            newCardChar = uId
            break
        }
        return newCardChar
    }
}

const decodeToken = (token) => {
    let data = null
    try {
        data = jwt.verify(token, secret)

    } catch (err) {
        console.log(err)
    }
    return data
}

module.exports = {
    decodeToken,
    Room,
}
