import { Link, Outlet } from "react-router-dom";
import { useSelector } from 'react-redux'
import styles from './styles.module.css';

export const DefaultLayout = () => {
    const loggedIn = useSelector((state) => state.common.loggedIn)
    const guest = useSelector((state) => state.common.guest)
    const username = useSelector((state) => state.common.username)

    return (
        <>
            <header className={styles.header}>
                <nav className={styles.nav}>
                    <ul className={styles.ul}>
                        <li>
                            <Link className="link" to='/'>cards</Link>
                        </li>
                        <li>
                            {loggedIn && guest === false ? <Link to='/profile' className="link">{username}</Link> : <Link to='/login' className="link">login</Link>}
                        </li>
                    </ul>
                </nav>
            </header>
            <div className={styles.mainContainer}>
                {/* <ul style={{position: 'absolute'}}>
                    <li>logged in: {loggedIn === true ? 'yes' : 'no'}</li>
                    <li>guest: {guest === true ? 'yes' : 'no'}</li>
                    <li>username: {username === null ? '-' : username}</li>
                </ul> */}
                <Outlet />
            </div>
        </>
    )
}