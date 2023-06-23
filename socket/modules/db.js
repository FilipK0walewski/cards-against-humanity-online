const { Pool } = require('pg')

const connectionString = process.env.PSQL_CONN_STRING
const pool = new Pool({ connectionString })

module.exports = {
    getGameData: async (gameUuid) => {
        await pool.query('update games set ended = false where game_uuid = $1', [gameUuid])
        const data = await pool.query('select game_name name, deck_id deck, max_score max, created_by owner, ended from games where game_uuid = $1', [gameUuid])
        return data.rows[0]
    },
    getUserData: async (userId) => {
        const data = await pool.query('select a.username username, b.img_url img, b.sound_url sound from users a join profiles b on a.id = b.user_id where a.id = $1', [userId])
        return data.rows[0]
    },
    endGame: async (gameUuid, winner) => {
        await pool.query('update games set ended = true, winner = $2 where game_uuid = $1' , [gameUuid, winner])
    },
    getBlackCard: async (deckId) => {
        const data =  await pool.query('select id, text, fields from cards where deck_id = $1 and color = $2 order by random() limit 1', [deckId, 'black'])
        return data.rows[0]
    },
    getWhiteCards: async (deckId, n) => {
        const data = await pool.query(`select id, text from cards where deck_id = $1 and color = $2 order by random() limit ${n}`, [deckId, 'white'])
        return data.rows
    }
}