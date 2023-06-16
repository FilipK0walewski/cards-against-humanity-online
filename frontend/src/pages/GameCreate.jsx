import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import instance from "../services/Common"
import styles from './gameCreator.module.css'

import { Button } from "../components/Button"
import { Checkbox } from "../components/Checkbox"
import { Input } from "../components/Input"
import { Select } from '../components/Select'

export const GameCreate = () => {
    const navigate = useNavigate()

    const [name, setName] = useState()
    const [max, setMax] = useState()
    const [pub, setPub] = useState(false)
    const [password, setPassword] = useState()
    const [decks, setDecks] = useState([])
    const [chosenDeck, setChosenDeck] = useState()

    const getDescks = () => {
        instance.get('/decks', { params: { private: true, public: true, empty: false } }).then(res => {
            setDecks(res.data)
        })
    }

    const createGame = (e) => {
        e.preventDefault()
        instance.post('/games', { name, max_score: max, pub, password, deck_id: chosenDeck }).then(res => {
            navigate(`/games/${res.data.uuid}`)
        })
    }

    useEffect(() => {
        getDescks()
    }, [])

    return (
        <>
            <div className={styles.container}>
                <p>game creator</p>
                <form onSubmit={createGame} className={styles.container}>
                    <Input label="game name" value={name || ''} onChange={e => setName(e.target.value)} />
                    <Input label="max score" value={max || ''} onChange={e => setMax(e.target.value)} type="number" max="30" />
                    <Checkbox label="public game" checked={pub} onChange={() => setPub(p => !p)} />
                    {pub === true ? null : <Input label="game password" value={password || ''} onChange={e => setPassword(e.target.value)} type="password" />}
                    {!decks ? 'no decks' :
                        <Select label="deck" onChange={e => setChosenDeck(e.target.value)}>
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