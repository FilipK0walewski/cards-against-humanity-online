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
            console.log(tmp.length, data.black.fields)
            if (tmp.length > data.black.fields) tmp.shift()
            console.log(tmp.length, data.black.fields)
            return tmp
        })
    }

    const selectBest = (e) => {
        if (data.cardChar !== userData.id) return
        setBest(e.target.value)
    }

    useEffect(() => {
        const token = localStorage.getItem(id)

        if (!token) {
            localStorage.removeItem(id)
            navigate(`/lobby/${id}`)
            return
        }

        // socket = io(process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3000' : undefined, { auth: { token }, query: { id } });
        socket = io('http://127.0.0.1:3000', { auth: { token }, query: { id } });

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
            console.log('userData', uData)
            setUserData(uData)
        })

        socket.on('message', (text) => {
            console.log('message', text)
            dispatch(addNotification({ text, type: 0 }))
        })

        socket.on('data', (data) => {
            console.log('data')
            console.log(data)
            if (process.env.NODE_ENV === 'development') {
                for (let u in data.users) {
                    data.users[u].img = 'http://127.0.0.1:8000' + data.users[u].img
                }
            }
            setData(data)
        })

        socket.on('error', message => {
            console.log('error:', message)
        })

    }, []);

    return (
        <> {data && userData ? <>
            <div className={`space-y ${styles.container}`}>
                <div className={styles.gameInfo}>
                    <p className={styles.gameName}>{data.name}</p>
                    <p>{data.status}</p>
                    <div className="space-x">
                        <Button text="copy invite url" />
                        {data.started !== true && userData.id === data.owner ? <Button text="start game" onClick={startGame} /> : null}
                    </div>
                </div>


                <ul className={styles.usersList}>
                    {Object.keys(data.users).map(u => (
                        <li key={u} className={`${styles.userContainer} ${data.users[u].online === true ? null : styles.offline}`}>
                            <div className={styles.imageContainer}>
                                <img className={styles.image} src={data.users[u].img} alt={data.users[u].name} />
                            </div>
                            <div className={styles.userText}>
                                <p className={u == userData.id ? styles.you : null}>{data.users[u].name}</p>
                                <p className={styles.score}>{u == data.cardChar ? 'char' : data.users[u].ready === false ? 'thinking' : null}</p>
                                <p className={styles.score}>score: {data.users[u].score}</p>
                            </div>
                            {userData.id == data.owner ? <button onClick={() => kick(u)}>kick</button> : null}
                        </li>
                    ))}
                </ul>

                {!data.started ? null : <div className={`space-y ${styles.cardsContainer}`}>
                    <div className="card black">
                        {data.black.text}
                    </div>

                    {data.reading === true ? <>
                        <ul>
                            {data.cardsToRead.map((i, index) => (<li key={index}>
                                <ul value={index} onClick={selectBest} className={`${styles.userSelectedCards} ${index === best ? 'selected' : null}`} >{i.map(j => (
                                    <li key={j.id} className="card white">{j.text} {best}</li>
                                ))}</ul>
                            </li>
                            ))}
                        </ul>
                        {best !== null && data.cardChar === userData.id ? <Button onClick={sendBest} text="confirm selection" /> : null}
                    </> : <>

                        {userData.ready === true ? <>
                            <p>You selected your cards already, waiting for other players.</p>
                            <ul>
                                {userData.selected.map(i => (
                                    <li className="card white" key={i.id}>{i.text}</li>
                                ))}
                            </ul>

                        </> : <>
                            {data.cardChar === userData.id ? null : <>
                                {data.black.fields === whites.length ? <Button onClick={sendWhites} text="confirm selection" /> : <p>select {data.black.fields} card</p>}
                            </>}

                            {data.cardChar === userData.id ? null : <>
                                {!userData.cards ? null :
                                    <ul>
                                        {userData.cards.map((card, index) => (
                                            <li key={index} value={card.id} onClick={selectWhite} className={`card white ${whites.includes(card.id) ? 'selected' : null}`}>{card.id} {card.text}</li>
                                        ))}
                                    </ul>
                                }
                            </>}
                        </>}
                    </>}

                </div>}
            </div>
        </> : <p>loading...</p>} </>
    )
}