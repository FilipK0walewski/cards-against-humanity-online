import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { useSelector, useDispatch } from 'react-redux'

import instance from "../services/Common"

import { Button } from "../components/Button"
import { Input } from "../components/Input"

import styles from './auth.module.css';

import { logIn } from '../store/common'

export const Login = () => {
    const dispatch = useDispatch()
    const loggedIn = useSelector((state) => state.common.loggedIn)
    const guest = useSelector((state) => state.common.guest)

    const navigate = useNavigate()

    const [username, setUsername] = useState()
    const [password, setPassword] = useState('')

    const handleLogIn = (e) => {
        e.preventDefault()
        instance.post('/auth/login', { username, password }).then(res => {
            dispatch(logIn(res.data))
            navigate('/')
        })
    }

    useEffect(() => {
        if (loggedIn && guest == false) navigate('/')
    })

    return (
        <>
            <main className={styles.mainContainer}>
                <form className={styles.form} onSubmit={handleLogIn}>
                    <Input label="username" value={username || ''} onChange={e => setUsername(e.target.value)} />
                    <Input label="password" type="password" value={password || ''} onChange={e => setPassword(e.target.value)} />
                    <Button text="log in" />
                </form>
                <nav className={styles.nav}>
                    <ul className={styles.ul}>
                        <li>
                            <Link className="text-slate-800 underline" to='/'>main page</Link>
                        </li>
                        <li>
                            <Link className="text-slate-800 underline" to='/register'>create account</Link>
                        </li>
                    </ul>
                </nav>
            </main>
        </>
    )
}