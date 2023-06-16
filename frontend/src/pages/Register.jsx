import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import instance from "../services/Common"

import { useDispatch } from 'react-redux'
import { addNotification } from '../store/common'

import { Button } from "../components/Button"
import { Input } from "../components/Input"
import styles from './auth.module.css';

export const Register = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [username, setUsername] = useState()
    const [password0, setPassword0] = useState()
    const [password1, setPassword1] = useState()

    const logIn = (e) => {
        e.preventDefault()
        if (!username) {
            dispatch(addNotification({ text: 'Invalid username.', type: 0 }))
            return
        }
        if (password0 != password1) {
            dispatch(addNotification({ text: 'Pasword does not match.', type: 0 }))
            return
        }
        instance.post('/auth/register', { username, password0, password1 }).then(res => {
            dispatch(addNotification({ text: `User created, now you can log in as ${res.data.username}.`, type: 0 }))
            navigate('/login')
        })
    }

    return (
        <>
            <main className={styles.mainContainer}>
                <form className={styles.form} onSubmit={logIn}>
                    <Input label="username" type="text" value={username || ''} onChange={e => setUsername(e.target.value)} />
                    <Input label="password" type="password" value={password0 || ''} onChange={e => setPassword0(e.target.value)} />
                    <Input label="confirm password" type="password" value={password1 || ''} onChange={e => setPassword1(e.target.value)} />
                    <Button text="create account" />
                </form>
                <nav className={styles.nav}>
                    <ul className={styles.ul}>
                        <li>
                            <Link to='/'>main page</Link>
                        </li>
                        <li>
                            <Link to='/login'>log in</Link>
                        </li>
                    </ul>
                </nav>
            </main>
        </>
    )
}