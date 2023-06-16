import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import instance from "../services/Common";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux'

import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { Input } from '../components/Input'
import { Modal } from "../components/Modal";

import styles from './decks.module.css'

export function Decks() {
    const loggedIn = useSelector(state => state.common.loggedIn)
    const navigate = useNavigate()

    const [searchParams, setSearchParams] = useSearchParams()
    const [decks, setDecks] = useState([])

    const [clickedRow, setClickedRow] = useState()

    const [name, setName] = useState()
    const [isPublic, setIsPublic] = useState(false)

    const createDeck = async (e) => {
        e.preventDefault()
        await instance.post('/decks', { name, public: isPublic })
        const res = await instance.get('/decks', { params: { public: searchParams.get('public'), private: searchParams.get('private') } })
        setDecks(res.data)
    }

    useEffect(() => {
        if (!clickedRow) return
        navigate(`/decks/${clickedRow}`)
    }, [clickedRow])

    useEffect(() => {
        async function getDecks() {
            const res = await instance.get('/decks', { params: { public: searchParams.get('public'), private: searchParams.get('private') } })
            setDecks(res.data)
        }
        getDecks()
    }, [])

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <p>{
                        searchParams.get('public') === 'true' && searchParams.get('private') === 'true' && loggedIn ? 'Available' :
                            searchParams.get('private') === 'true' && loggedIn ? 'Your' : searchParams.get('public') === 'false' ? 'No' : 'Public'
                    } decks</p>
                    {loggedIn ?
                        <Modal text="create deck"  >
                            <form onSubmit={createDeck} className={styles.form}>
                                <Input value={name || ''} label="deck name" onChange={e => setName(e.target.value)} />
                                <Checkbox label="public deck" value={isPublic} onChange={() => { setIsPublic(e => !e) }} />
                                <Button text="create deck" />
                            </form>

                        </Modal>
                        : null}
                </div>
                {!decks || decks.length === 0 ? <p>no decks</p> :
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>name</th>
                                <th className={styles.th}>owner</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableRows}>
                            {decks.map((d) => (
                                <tr key={d.id} onClick={() => { setClickedRow(d.id) }} className={styles.tr}>
                                    <td className={styles.td}>{d.name}</td>
                                    <td className={styles.td}>{d.owner}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }
            </div>
        </>
    )
}