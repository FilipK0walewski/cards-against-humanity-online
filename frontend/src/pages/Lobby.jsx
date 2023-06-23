import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"

import instance from "../services/Common"
import styles from './lobby.module.css'

import { Button } from '../components/Button'
import { Input } from '../components/Input'

export const Lobby = () => {
    const guest = useSelector(state => state.common.guest)
    const username = useSelector(state => state.common.username)
    const loggedIn = useSelector(state => state.common.loggedIn)

    const { id } = useParams()
    const navigate = useNavigate()

    const [game, setGame] = useState()
    const [gameUsername, setGameUsername] = useState()
    const [gamePassword, setGamePassword] = useState()

    const getGame = () => {
        instance.get(`games/${id}`).then(res => {
            setGame(res.data)
        })
    }

    const joinGame = (e) => {
        e.preventDefault()
        instance.get(`/games/join`, { params: { game: id }, headers: { username: gameUsername, password: gamePassword } }).then(res => {
            localStorage.setItem(id, res.data.token)
            navigate(`/games/${id}`)
        })
    }

    useEffect(() => {
        setGameUsername(username)
    }, [username])

    useEffect(() => {
        const token = localStorage.getItem(id)
        if (token) {
            navigate(`/games/${id}`)
        }
        getGame()
    }, [])

    return <div className={styles.container}>
        {game ? <>
            <p style={{ fontWeight: 'bold' }}>{game.name}</p>
            <form onSubmit={joinGame} className={styles.joinForm}>
                {loggedIn === true && guest === true ? <>
                    <p>You are not logged in.</p>
                    <Input label="in game name" value={gameUsername || ''} onChange={(e) => setGameUsername(e.target.value)} />
                </> : null}
                {game.public === false && game.owner !== username ? <>
                    <p>game is private</p>
                    <Input label="game password" type="password" value={gamePassword || ''} onChange={(e) => setGamePassword(e.target.value)} />
                </> : null}
                <Button text="join game"></Button>
            </form>
        </> : <p>loading...</p>}
    </div>
}