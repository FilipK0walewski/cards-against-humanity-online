class User {
    constructor(socketId, data) {
        this.socketId = socketId
        this.id = data.user_id
        this.name = data.username
        this.img = data.img_url ? data.img_url : 'https://pierdolnik.online/static/cj.png'
        this.sound = data.sound_url

        this.whiteCards = []
        this.chosenCards = []
        this.online = true
        this.score = 0

        this.ready = false
        this.playing = false
    }

    getData() {
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            online: this.online,
            img: this.img,
            sound: this.sound,
            ready: this.ready,
            playing: this.playing,
        }
    }

    setChosenCards(chCards) {
        const tmp = []
        for (let card of this.whiteCards) {
            let dd = false
            for (let c of chCards) {
                if (c.card_id == card.card_id) {
                    dd = true
                    break
                }
            }
            if (dd === false)
                tmp.push(card)
        }
        this.whiteCards = tmp
        this.chosenCards = chCards
        this.ready = true
    }
}

class Room {
    constructor(owner, gameName, deckId, maxScore) {
        this.owner = owner
        this.gameName = gameName
        this.deckId = deckId
        this.maxScore = parseInt(maxScore)
        this.gameStarted = false

        this.users = {}
        this.usersMap = {}

        this.reader = null
        this.readingTime = false
        this.readerCounter = 0

        this.maxPlayers = 12
        this.currentRound = null
        this.black = null
    }

    getBlackFields() {
        let tmp = this.black.fields
        if (!tmp) tmp = 1
        return tmp
    }

    getData() {
        return {
            owner: this.owner,
            gameName: this.gameName,
            deckId: this.deckId,
            maxScore: this.maxScore,
            gameStarted: this.gameStarted,
            reader: this.reader === null ? null : this.users[this.reader].socketId,
            readingTime: this.readingTime,
            currentRound: this.currentRound,
            black: this.black,
            usersCards: null
        }
    }

    getNumberOfMissingCards(username) {
        return 12 - this.users[username].whiteCards.length
    }


    getNumberOfUsersOnline() {
        let n = 0
        for (let username in this.users) {
            if (this.users[username].online === true) n += 1
        }
        return n
    }

    getUserId(username) {
        return this.users[username].id
    }

    getUserSocketId(username) {
        return this.users[username].socketId
    }

    getUserName(socketId) {
        return this.usersMap[socketId]
    }

    getUserSound(username) {
        return this.users[username].sound
    }

    getUserWhiteCards(username) {
        return this.users[username].whiteCards
    }

    getUsers() {
        const data = {}
        for (let name in this.users) {
            const user = this.users[name]
            const userData = user.getData()
            userData['owner'] = user.socketId === this.owner ? true : false
            if ((user.socketId) === null) continue
            data[user.socketId] = userData
        }
        return data
    }

    getUsersCards() {
        let end = true
        const cards = {}
        for (let username of Object.keys(this.users).sort(() => { return 0.5 - Math.random() })) {
            let userCards = this.users[username].chosenCards
            if (this.reader !== username && userCards.length === 0 && this.users[username].playing === true) end = false
            cards[username] = userCards
        }
        if (end === true) this.readingTime = true
        return [cards, end]
    }

    getUserSocketIds() {
        return Object.keys(this.usersMap)
    }

    setBlack(card) {
        this.black = card
    }

    setReader() {
        while (true) {
            let name = Object.keys(this.users)[this.readerCounter]
            if (this.users[name].online === false) {
                this.readerCounter += 1
                if (this.readerCounter >= Object.keys(this.users).length) {
                    this.readerCounter = 0
                }
                continue
            }
            break
        }
        let name = Object.keys(this.users)[this.readerCounter]
        this.reader = name
    }

    setUserChosenCards(userId, cards) {
        const username = this.usersMap[userId]
        this.users[username].setChosenCards(cards)
    }

    setUserOffline(userId) {
        const name = this.usersMap[userId]
        // if (!name) return
        this.users[name].online = false
        this.users[name].playing = false
        this.users[name].ready = false
        this.users[name].socketId = null
        delete this.usersMap[userId]

        // if (this.reader === name)
        // this.resetRound()
        // this.reader = null

        if (this.owner !== userId)
            return

        let found = false
        for (let name in this.users) {
            if (this.users[name].online === false) continue
            this.owner = this.users[name].socketId
            found = true
            break
        }
        if (found === false) this.owner = null
    }

    setUserWhiteCards(username, cards) {
        this.users[username].whiteCards = cards
    }

    addUser(userId, data) {
        const username = data.username
        if (Object.keys(this.users).includes(username)) {
            this.users[username].socketId = userId
            this.users[username].online = true
            this.users[username].playing = false
            this.usersMap[userId] = username
            return
        }
        const user = new User(userId, data)
        this.users[username] = user
        this.usersMap[userId] = username
    }

    addUserWhiteCards(username, cards) {
        const tmp = this.users[username].whiteCards
        this.users[username].whiteCards = [...tmp, ...cards]
        this.users[username].chosenCards = []
    }

    endRound(winnerName) {
        this.users[winnerName].score += 1

        this.readerCounter += 1
        if (this.readerCounter >= Object.keys(this.users).length)
            this.readerCounter = 0
        this.setReader()

        this.currentRound += 1
        this.readingTime = false

        for (let name in this.users) {
            this.users[name].ready = false
            this.users[name].playing = true
        }
    }

    startGame() {
        this.gameStarted = true
        this.currentRound = 1
        for (let name in this.users) {
            this.users[name].playing = true
        }
        this.setReader()
    }

    isGameEnded() {
        for (let name in this.users) {
            if (this.users[name].score >= this.maxScore) return name
        }
        return null
    }

    isFull() {
        return Object.keys(this.users).length >= this.size
    }

    isReaderOnline() {
        return this.users[this.reader].online
    }

    userExists(name) {
        const exists = Object.keys(this.users).includes(name)
        if (exists === false) return false
        if (this.users[name].online === false) return false
        return true
    }

}

module.exports = { Room }