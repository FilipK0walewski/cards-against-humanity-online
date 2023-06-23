import { useEffect, useState } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from "react-router-dom"

import instance from "../services/Common"
import styles from './gameCreator.module.css'

import { Button } from "../components/Button"
import { Checkbox } from "../components/Checkbox"
import { Input } from "../components/Input"
import { Select } from '../components/Select'

import { setUsername } from '../store/common'


export const GameCreate = () => {

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const loggedIn = useSelector(state => state.common.loggedIn)
    const username = useSelector(state => state.common.username)
    const guest = useSelector(state => state.common.guest)

    const [inGameName, setInGameName] = useState()
    const [name, setName] = useState()
    const [max, setMax] = useState()
    const [pub, setPub] = useState(false)
    const [password, setPassword] = useState()
    const [decks, setDecks] = useState([])
    const [chosenDeck, setChosenDeck] = useState()

    const getDescks = () => {
        instance.get('/decks', { available: true }).then(res => {
            setDecks(res.data)
        })
    }

    const createGame = (e) => {
        e.preventDefault()

        if (guest === true && inGameName) {
            instance.put('/profile/username', { text: inGameName }).then(res => {
                dispatch(setUsername(res.data))
            })
        }

        instance.post('/games', { name, max_score: max, pub, password, deck_id: chosenDeck }).then(res => {
            navigate(`/lobby/${res.data.uuid}`)
        })
    }

    useEffect(() => {
        setInGameName(username)
    }, [username])

    useEffect(() => {
        getDescks()
    }, [])

    return (
        <>
            <div className={`${styles.container} p`}>
                <p>game creator</p>
                {loggedIn ? <p>you logged in as {guest == true ? 'guest' : username}</p> : null}
                <form onSubmit={createGame} className={styles.container}>
                    {guest === true ? <Input label="in game name" value={inGameName || ''} onChange={e => setInGameName(e.target.value)} /> : null}
                    <Input label="game name" value={name || ''} onChange={e => setName(e.target.value)} />
                    <Input label="max score" value={max || ''} onChange={e => setMax(e.target.value)} type="number" max="30" />
                    <Checkbox label="public game" checked={pub} onChange={() => setPub(p => !p)} />
                    {pub === true ? null : <Input label="game password" value={password || ''} onChange={e => setPassword(e.target.value)} type="password" />}
                    {!decks ? 'no decks' :
                        <Select label="deck" onChange={e => setChosenDeck(e.target.value)}>
                            <option value=""></option>
                            {decks.map(deck => (
                                <option key={deck.id} value={deck.id}>
                                    {deck.name}
                                </option>
                            ))}
                        </Select>
                    }
                    <Button text="create game" />
                </form>
            </div>
        </>
    )
}