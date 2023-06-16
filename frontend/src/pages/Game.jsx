import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { io } from "socket.io-client"

import { useDispatch } from "react-redux"
import { addNotification } from "../store/common"

import styles from './game.module.css'

import { Button } from '../components/Button'
import { Input } from '../components/Input'

let socket
export const Game = () => {
    const { id } = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [data, setData] = useState()
    const [userData, setUserData] = useState()
    const [socketId, setSocketId] = useState(null)

    const startGame = () => {
        socket.emit('start')
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
        <> {data ? <>
            <div className={styles.container}>
                <div className={styles.gameInfo}>
                    <p className={styles.gameName}>{data.name}</p>
                    <p>{data.status}</p>
                    <div className="space-x">
                        <Button text="copy invite url" />
                        {userData.id === data.owner ? <Button text="start game" onClick={startGame} /> : null}
                        <Button text="start game" onClick={startGame} />
                    </div>
                </div>

                <ul className={styles.usersList}>
                    {Object.keys(data.users).map(u => (
                        <li key={u} className={`${styles.userContainer} ${data.users[u].online === true ? null : styles.offline}`}>
                            <div className={styles.imageContainer}>
                                <img className={styles.image} src={data.users[u].img} alt={data.users[u].name} />
                            </div>
                            <div className={styles.userText}>
                                <p>{data.users[u].name}</p>
                                <p className={styles.score}>score: {data.users[u].score}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                {!data.started ? null : <>
                    <p>game started</p>
                    <p>{data.users[data.cardChar].name} is card char.</p>
                    <div className="card black">
                        {data.black.text}
                    </div>
                    {data.cardChar === userData.id ? null : <>
                        <p>your white cards here</p>
                        {!userData.cards ? null :
                            <ul>
                                {userData.cards.map(card => (
                                    <li className="card white">{card.text}</li>
                                ))}
                            </ul>
                        }
                    </>}
                </>}
            </div>
            {/* <div>
                    <div className="w-full h-1/2 border border-slate-400 rounded p-2 overflow-y-auto relative">
                        <ul className="flex flex-wrap">
                            {data.black ? <li className="card black m-1 !cursor-default select-none">{data.black.text}</li> : null}
                            {data.usersCards && data.readingTime === true ?
                                <>
                                    {
                                        Object.keys(data.usersCards).map((u, i) => (
                                            <>
                                                {data.usersCards[u].map((c, j) => (
                                                    <li key={`cd-${i}-${j}`} value={i} onClick={handleWinningCards} className={
                                                        `m-1 select-none card white ${u === winningCards ? 'border-emerald-300 border-2' : ''} ${u === socketId ? '!bg-emerald-100' : ''} ${socketId === data.reader || !(data.reader in users) ? '' : '!cursor-default'} ${i % 2 !== 0 ? 'bg-slate-500' : ''}`}
                                                    >{c.text}</li>
                                                ))}
                                            </>
                                        ))
                                    }
                                </>
                                :
                                <>
                                    {chosenWhites.map((c, i) => (
                                        <li onClick={whiteChosenClick} className="select-none card white m-1" key={`white-${i}`} value={i}>{c.text}</li>
                                    ))}
                                    {Object.keys(users).map((userId, i) => (
                                        <>
                                            {userId === socketId || users[userId].ready === false ? null : [...Array(data.black.fields ? data.black.fields : 1)].map(() => (
                                                <li key={`uk-${userId}-${i}`} className="card white m-1 !cursor-default"></li>
                                            ))}
                                        </>
                                    ))}
                                </>
                            }
                        </ul>
                        {(socketId === data.reader || !(data.reader in users)) && data.readingTime === true ? <button disabled={!winningCards} onClick={endRound} className="btn-primary btn-primary absolute m-1 right-0 bottom-0">confirm</button> : null}
                        {data.black === null || users[socketId].ready === true || chosenWhites.length !== data.black.fields ? null : <button onClick={sendChosen} className="btn-primary btn-primary absolute m-1 right-0 bottom-0">confirm cards</button>}
                    </div>
                    <div className="w-full h-1/2 flex relative">
                        <div className="w-full h-full border border-slate-400 rounded p-2 overflow-y-auto">
                            {!whites || whites.length === 0 ? <p>no cards</p> :
                                <ul className="flex flex-wrap">
                                    {whites.map((c, i) => (
                                        <li key={i} value={i} className="white card m-1 select-none" onClick={whiteClick}>
                                            {c.text}
                                        </li>
                                    ))}
                                </ul>
                            }
                        </div>
                        {data.reader === socketId || (users[socketId].ready === true || data.readingTime === true) ?
                            <>
                                <div className='absolute w-full h-full bg-slate-500 opacity-25 rounded'></div>
                                {data.reader === socketId ?
                                    <p className='absolute top-1/2 left-1/2 bold text-xl -translate-x-1/2 -translate-y-1/2 text-center bg-slate-500 p-2 rounded-sm select-none z-2000'>
                                        Now is your turn to read, wait for other player to choose their cards.
                                    </p>
                                    : null}
                            </>
                            : null}
                    </div>
                </div>
                <div className="md:w-96 h-min md:h-full bg-slate-400 rounded overflow-y-auto border border-slate-400">
                    <div className="p-2 w-full flex justify-between">
                        <p className="text-lg font-bold">{data.gameName}</p>
                        {!data.currentRound ? null : <p className="text-lg font-bold">round {data.currentRound}</p>}
                    </div>
                    {users ?
                        <ul className="space-y-2">
                            {Object.keys(users).map((u) => (
                                <li className="bg-slate-200 m-1 p-2 rounded-sm flex items-center space-x-3 select-none overflow-y-auto" key={u}>
                                    <div className="w-16 h-16 bg-slate-400 bg-img rounded-full" style={{ backgroundImage: `url(${users[u].img})` }}></div>
                                    <div className="flex flex-col">
                                        <div className='flex space-x-1'>
                                            <p className="font-bold text-lg">{users[u].name} {u === socketId ? '(you)' : ''}</p>
                                            {users[u].owner === true ? 'crown' : null}
                                        </div>
                                        <p className="text-sm">score: {users[u].score}</p>
                                        {!data.gameStarted ? <span className='text-xs opacity-0'>dd</span> :
                                            <>
                                                {users[u].playing === true ?
                                                    <p className="text-xs bold">{data.reader === u ? 'reading now' : !data.readingTime && users[u].ready === true ? 'done' : 'thinking'}</p>
                                                    :
                                                    <p className="text-xs bold">starts in next round</p>
                                                }
                                            </>
                                        }
                                    </div>
                                </li>
                            ))}
                        </ul>
                        : <p>no users</p>}
                </div>
                {data.gameStarted === false ?
                    <>
                        <div className="absolute w-full h-full bg-indigo-300 opacity-50 top-0 left-0"></div>
                        <div className="flex flex-col items-center space-y-2 absolute top-1/2 left-1/2 bg-slate-400 -translate-x-1/2 -translate-y-1/2 p-4 rounded-sm !z-1000">
                            <p className="text-xl select-none">Waiting for game start</p>
                            {users === null ? null :
                                <>
                                    {socketId in users && users[socketId].owner === true ? <button onClick={startGame} className="btn-primary">start game</button> : null}
                                </>
                            }
                        </div>
                    </>
                    : null
                }
                {winner !== null ?
                    <>
                        <div className="absolute w-full h-full bg-indigo-700 top-0 left-0"></div>
                        <div className="flex flex-col items-center space-y-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-sm !z-1000">
                            <h1 className="text-3xl select-none text-slate-100">Game won by {winner}</h1>
                            <Link to='/' className='underline text-slate-100'>go to home page</Link>
                        </div>
                    </>
                    : null
                } */}
        </> : null
        }
        </>
    )
}