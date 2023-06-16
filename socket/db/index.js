const { Pool } = require('pg')

const connectionString = process.env.PSQL_CONN_STRING
const pool = new Pool({ connectionString })

module.exports = {
    query: (text, params, callback) => {
        return pool.query(text, params, callback)
    },
    getGameData: async (gameUuid) => {
        const data = await pool.query('select deck_id id, max_score max, created_by owner from games where game_uuid = $1', [gameUuid])
        return data.rows[0]
    },
    startGame: async (gameUuid) => {
        const data = await pool.query('update games set started = true where game_uuid = $1' , [gameUuid])
        return data.rows[0]
    },
    endGame: async (gameUuid, winner, winnerId) => {
        await pool.query('update games set ended = true, winner_name = $2, winner_id = $3 where game_uuid = $1' , [gameUuid, winner, winnerId])
    },
    getBlackCard: async (deckId) => {
        console.log(deckId)
        const data =  await pool.query('select card_id, text, fields from cards where deck_id = $1 and color = $2 order by random() limit 1', [deckId, 'black'])
        return data.rows[0]
    },
    getWhiteCards: async (deckId, n) => {
        const data = await pool.query(`select text from cards where deck_id = $1 and color = $2 order by random() limit ${n}`, [deckId, 'white'])
        return data.rows
    }
}