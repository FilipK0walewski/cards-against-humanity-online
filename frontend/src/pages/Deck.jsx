import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import instance from "../services/Common";

import { useSelector } from 'react-redux'
import { useNavigate } from "react-router-dom";

import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import styles from './deck.module.css'

export function Deck() {
    const navigate = useNavigate()
    const loggedIn = useSelector(state => state.common.loggedIn)
    const username = useSelector(state => state.common.username)

    const { id } = useParams()
    const [deck, setDeck] = useState()

    const [cardEdit, setCardEdit] = useState(false)
    const [cardIndex, setCardIndex] = useState()
    const [card, setCard] = useState({})

    const [page, setPage] = useState(1)
    const [pageInput, setPageInput] = useState(1)
    const [pageSize,] = useState(50)

    const getDeck = () => {
        instance.get(`/decks/${id}`, { params: { page } }).then(res => {
            setDeck(res.data)
        })
    }

    const deleteDeck = async () => {
        instance.delete(`/decks/${id}`).then(() => {
            navigate('/decks')
        })
    }

    const createCard = () => {
        instance.post('/cards', { deck_id: parseInt(id), text: card.text, color: card.color, fields: card.fields || null }).then(() => {
            setCardIndex(null)
            setPage(1)
            getDeck()
        })
    }

    const updateCard = () => {
        instance.put(`/cards/${card.card_id}`, { text: card.text, color: card.color, fields: card.fields || null }).then(() => {
            setCardIndex(null)
            getDeck()
        })
    }

    const deleteCard = () => {
        instance.delete(`/cards/${deck.cards[cardIndex].card_id}`).then(() => {
            setCardIndex(null)
            getDeck()
        })
    }

    const handleCreateUpdate = (e) => {
        e.preventDefault()
        if (cardIndex === -1) createCard()
        else updateCard()
    }

    const setPublic = () => {
        instance.patch(`/decks/${id}`, { public: !deck.public }).then(res => {
            setDeck(i => ({ ...i, ...{ public: res.data.public } }))
        })
    }

    const fileChange = async (e) => {
        if (e.target.files[0]) {
            let formData = new FormData();
            formData.append("file", e.target.files[0]);
            await instance.post('/cards/file-import', formData, { params: { deck_id: id } })
        }
    }

    const downloadExample = () => {
        instance.get('/cards/example', { responseType: 'blob' }).then(res => {
            const href = URL.createObjectURL(res.data)
            const link = document.createElement('a')
            link.href = href
            link.setAttribute('download', 'example.csv')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(href)
        })
    }

    const decrementPage = () => {
        if (page === 1) return
        setPage(page - 1)
    }

    const incrementPage = () => {
        if (page === Math.ceil(deck.size / pageSize)) return
        setPage(page + 1)
    }

    const handlePage = (e) => {
        e.preventDefault()
        if (!pageInput) {
            setPageInput(page)
            return
        }
        let n = parseInt(pageInput)
        const max = Math.ceil(deck.size / pageSize)
        if (n < 1) n = 1
        else if (n > max) n = max
        if (n === page) {
            setPageInput(n)
            return
        }
        setPage(n)
    }

    const handleCard = (e) => {
        card[e.target.id] = e.target.value
        setCard({ ...card })
    }

    useEffect(() => {
        if (cardIndex === null || cardIndex === undefined) {
            setCardEdit(false)
            return
        }

        setCardEdit(true)
        if (cardIndex === -1) {
            setCard({})
            return
        }

        const tmpCard = deck.cards[cardIndex]
        setCard({ text: tmpCard.text, color: tmpCard.color, card_id: tmpCard.card_id, fields: tmpCard.fields })
    }, [cardIndex])

    useEffect(() => {
        getDeck()
        setPageInput(page)
    }, [page])

    useEffect(() => {
        getDeck()
    }, [])

    return (
        <> {deck ? <div className={styles.container}>
            <Modal opened={cardEdit} closeModal={() => { setCardEdit(false); setCardIndex(null) }}>
                <form className={styles.formContainer} onSubmit={handleCreateUpdate}>
                    <Input id="text" label="card text" value={card.text || ''} onChange={handleCard} />
                    <Select id="color" label="color" value={card.color || ''} onChange={handleCard}>
                        <option value=""></option>
                        <option value="black">black</option>
                        <option value="white">white</option>
                    </Select>
                    {card.color === 'black' ? <Input id="fields" label='number of fields' type="number" value={card.fields || ''} onChange={handleCard} /> : null}
                    <div className={styles.flexEnd}>
                        <Button text={cardIndex === -1 ? 'add card' : 'update card'} />
                    </div>
                </form>
                {cardIndex === -1 ? null : <Button text="remove card" onClick={deleteCard} style={{ position: 'absolute', bottom: '1rem' }} />}
            </Modal>

            <p className={styles.deckName}>Deck {deck.name}</p>
            <p>This deck {deck.size === 0 ? 'is empty' : `has ${deck.size} cards`}.</p>
            {deck.cards && loggedIn === true && deck.owner === username ? <>
                <p>You can add new cards by clicking "add card" button.
                    If you want to add more than one card you have to import text file with cards data.
                    Click "upload cards file" to upload file.
                    Example file can by downloaded by clicking "download example file".
                    Deck is {deck.public === true ? 'public' : 'private'}, click "set {deck.public === true ? 'private' : 'public'}" to make deck {deck.public === true ? 'private' : 'public'}.</p>
                <div className={styles.buttons}>
                    <Button text="add card" onClick={() => { setCardIndex(-1) }} />
                    <label className={styles.textBtn}>upload cards file<input style={{ display: 'none' }} onChange={fileChange} type="file" /></label>
                    <Button text="download example file" onClick={downloadExample} />
                    <Button text={`set ${deck.public === true ? 'private' : 'public'}`} onClick={setPublic} />
                    <Button text="remove deck" onClick={deleteDeck} />
                </div>
            </> : null}

            {!deck.cards || deck.cards.length === 0 ? null : <>
                <hr />
                <div className={styles.paginationContainer}>
                    <Button text="&larr;" onClick={decrementPage} style={{ fontSize: '2rem' }} disabled={page === 1 ? true : false} />
                    <form onSubmit={handlePage} className={styles.paginationInputForm}>
                        <Input type="number" value={pageInput} onBlur={handlePage} onChange={e => setPageInput(e.target.value)} />
                    </form>
                    <span>from {Math.ceil(deck.size / 50)}</span>
                    <Button text="&rarr;" onClick={incrementPage} style={{ fontSize: '2rem' }} disabled={Math.ceil(deck.size / pageSize) === page ? true : false} />
                </div>
                <ul className={styles.cardsList}>
                    {deck.cards.map((card, index) => (
                        <li id={card.card_id} key={`c-${index}`} className={`m-1 card ${card.color === 'black' ? 'black' : 'white'}`} onClick={() => { loggedIn === true && deck.owner === username ? setCardIndex(index) : null }}>
                            {card.text}
                        </li>
                    ))}
                </ul>
            </>}
        </div> : null}
        </>
    )
}