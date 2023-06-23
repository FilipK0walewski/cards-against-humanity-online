import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { io } from "socket.io-client"

import { useDispatch } from "react-redux"
import { addNotification } from "../store/common"

import { Button } from '../components/Button'
import styles from './game.module.css'

let socket
export const Game = () => {
    const { id } = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [data, setData] = useState()
    const [userData, setUserData] = useState()
    const [socketId, setSocketId] = useState(null)

    const [whites, setWhites] = useState([])
    const [best, setBest] = useState(null)

    const goToGameCreate = () => {
        navigate('/games/create')
    }

    const copyInviteUrl = () => {
        navigator.clipboard.writeText(document.URL);
    }

    const startGame = () => {
        socket.emit('start')
    }

    const sendWhites = () => {
        socket.emit('whites', whites)
    }

    const sendBest = () => {
        socket.emit('best', data.cardsToRead[best])
    }

    const kick = (userId) => {
        if (window.confirm(`Kick player ${data.users[userId].name}?`)) {
            socket.emit('kick', userId)
        }
    }

    const selectWhite = (e) => {
        setWhites(arr => {
            const tmp = [...arr, e.target.value]
            if (tmp.length > data.black.fields) tmp.shift()
            return tmp
        })
    }

    const selectBest = (index) => {
        if (data.cardChar !== userData.id) return
        setBest(index)
    }

    useEffect(() => {
        const token = localStorage.getItem(id)

        if (!token) {
            localStorage.removeItem(id)
            navigate(`/lobby/${id}`)
            return
        }

        socket = io(process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3000' : undefined, { auth: { token }, query: { id } });

        socket.on('connect', () => {
            setSocketId(socket.id)
        });

        socket.on('disconnect', () => {
            setSocketId(null)
        });

        socket.on('connect_error', (err) => {
            dispatch(addNotification({ text: err.message, type: 1 }))
            localStorage.removeItem(id)
            navigate(`/lobby/${id}`)
        });

        socket.on('userData', (uData) => {
            setUserData(uData)
            setWhites([])
            setBest(null)
        })

        socket.on('message', (text) => {
            dispatch(addNotification({ text, type: 0 }))
        })

        socket.on('data', (data) => {
            if (process.env.NODE_ENV === 'development') {
                for (let u in data.users) {
                    data.users[u].img = 'http://127.0.0.1:8000' + data.users[u].img
                }
            }
            setData(data)
        })

        socket.on('error', message => {
            dispatch(addNotification({ message, type: 1 }))
        })

        return (() => {
            socket.close()
        })

    }, []);

    return (
        <> {data && userData ? <>
            {data.ended === true ? <div className={`space-y ${styles.endGame}`}>
                <p>{data.status}</p>
                {data.owner === userData.id ? <Button onClick={startGame} text="restart game" /> : <span>only owner of game can do restart</span>}
                <Button onClick={goToGameCreate} text="create new game" />
            </div> :
                <div className={`space-y ${styles.container}`}>
                    <div className={`space-y ${styles.gameInfo}`}>
                        <p className={styles.gameName}>{data.name}</p>
                        <p>{data.status}</p>
                        <div className="space-x">
                            <Button onClick={copyInviteUrl} text="copy invite url" />
                            {data.started !== true && userData.id == data.owner ? <Button text="start game" onClick={startGame} /> : null}
                        </div>

                        <ul className={`space-y ${styles.usersList}`}>
                            {Object.keys(data.users).map(u => (
                                <li key={u} className={`${styles.userContainer} ${data.users[u].online === true ? null : styles.offline}`}>
                                    <div className={styles.imageContainer}>
                                        <img className={styles.image} src={data.users[u].img} alt={data.users[u].name} />
                                    </div>
                                    <div className={styles.userText}>
                                        <p className={u == userData.id ? styles.you : null}>{data.users[u].name}</p>
                                        <p className={styles.score}>{u == data.cardChar ? 'char' : data.users[u].selected === null ? 'thinking' : null}</p>
                                        <p className={styles.score}>score: {data.users[u].score}</p>
                                    </div>
                                    {userData.id == data.owner && userData.id != u ? <button className={styles.kickButton} onClick={() => kick(u)}>kick</button> : null}
                                </li>
                            ))}
                        </ul>

                        {data.started ? <div className={`space-y ${styles.blackCardContainer}`}>
                            <div className="card black">
                                {data.black.text}
                            </div>

                            {data.reading === true ? <>
                                {data.cardChar == userData.id ? <>
                                    <p>Read cards and select</p>
                                    {best !== null && data.cardChar === userData.id ? <Button onClick={sendBest} text="confirm selection" /> : null}
                                </> : <p>{data.users[data.cardChar].name} is reading</p>}
                            </> : data.cardChar == userData.id ? <>
                                <p>wait for users to choose their cards.</p>
                            </> : userData.selected !== null ? <>
                            </> : userData.selected === null ? <>
                                {userData.cards.length === 0 ? <>
                                    <p>You join in middle of the round, wait to round end.</p>
                                </> : data.black.fields === whites.length ?
                                    <Button onClick={sendWhites} text="confirm selection" />
                                    :
                                    <p>select {data.black.fields} card{data.black.fields > 1 ? 's' : null}</p>
                                }
                            </> : null}

                        </div> : null}

                    </div>


                    {!data.started ? null : <div className={`space-y ${styles.cardsContainer}`}>
                        {data.reading === true ? <ul className={`${styles.userCards} space-x`}>
                            {data.cardsToRead.map((i, index) => (<li key={index}>
                                {i === null ? null :
                                    <ul onClick={() => selectBest(index)} className={`${styles.userSelectedCards} ${index === best ? 'selected' : null}`} >{i.map(j => (
                                        <li key={j.id} className="card white">{j.text}</li>
                                    ))}</ul>}
                            </li>
                            ))}
                        </ul> : <>

                            {userData.selected !== null ? <>
                                <ul className={styles.availableCards}>
                                    {userData.selected.map(i => (
                                        <li className="card white" key={i.id}>{i.text}</li>
                                    ))}
                                </ul>

                            </> : <>
                                {data.cardChar === userData.id ? null : <>
                                    {!userData.cards ? null :
                                        <ul className={`${styles.availableCards}`}>
                                            {userData.cards.map((card, index) => (
                                                <li key={index} value={card.id} onClick={selectWhite} className={`m-1 card white ${whites.includes(card.id) ? 'selected' : null}`}>
                                                    {card.text}
                                                </li>
                                            ))}
                                        </ul>
                                    }
                                </>}

                                {data.cardChar === userData.id ? null : <>
                                </>}
                            </>}
                        </>}

                    </div>}
                </div>}
        </> : <p>loading...</p>} </>
    )
}