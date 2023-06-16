import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import instance from "../services/Common"

import { useDispatch, useSelector } from 'react-redux'
import { logOut } from '../store/common'

import styles from './profile.module.css'
import { Button } from '../components/Button'

export const Profile = () => {
    const dispatch = useDispatch()
    const loggedIn = useSelector((state) => state.common.loggedIn)
    const username = useSelector((state) => state.common.username)

    const navigate = useNavigate()

    const [profile, setProfile] = useState()
    const [imgHover, setImgHover] = useState(false)

    const getProfile = () => {
        instance.get('/profile').then(res => {
            if (process.env.NODE_ENV === 'development') {
                res.data.img = 'http://127.0.0.1:8000' + res.data.img
                res.data.sound = 'http://127.0.0.1:8000' + res.data.sound
            }
            setProfile(res.data)
        })
    }

    const handleImgChange = async (e) => {
        const data = new FormData()
        data.append('image', e.target.files[0])
        instance.post('/profile/image', data).then(res => {
            setProfile({ ...profile, ...{ img: process.env.NODE_ENV === 'development' ? `http://127.0.0.1:8000${res.data.url}` : res.data.url } })
        })
    }

    const handleSoundChange = (e) => {
        const data = new FormData()
        data.append('sound', e.target.files[0])
        instance.post('/profile/sound', data).then(res => {
            setProfile({ ...profile, ...{ sound: process.env.NODE_ENV === 'development' ? `http://127.0.0.1:8000${res.data.url}` : res.data.url } })
        })
    }

    const handleLogOut = () => {
        dispatch(logOut())
        navigate('/')
    }

    useEffect(() => {
        if (!loggedIn) navigate('/')
        getProfile()
    }, [])

    return (
        <>
            {!profile ? null :
                <div className={styles.container}>
                    <label className={styles.imageContainer} onMouseEnter={() => setImgHover(true)} onMouseLeave={() => setImgHover(false)}>
                        <input type="file" accept='image/*' onChange={handleImgChange} placeholder="photo" style={{ display: 'none' }} />
                        <div className={`${styles.backgroundImage} bg-img`} style={{ backgroundImage: `url(${profile.img})` }}>
                            {imgHover === true ?
                                <span className={styles.imageEditBtn}>edit</span>
                                : null
                            }
                        </div>
                    </label>
                    <p>{username}</p>
                    <p>{profile.description}</p>
                    <audio controls src={profile.sound}>
                        <a href={profile.sound}>Download song</a>
                    </audio>
                    <label>
                        change sound
                        <input type="file" accept='audio/*' onChange={handleSoundChange} style={{ display: 'none' }} />
                    </label>

                    <Button text="log out" onClick={handleLogOut} />
                </div>
            }
        </>
    )
}