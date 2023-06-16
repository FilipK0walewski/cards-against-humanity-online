import { Link, Outlet } from "react-router-dom";
import { useSelector } from 'react-redux'
import styles from './styles.module.css';

export const DefaultLayout = () => {
    const loggedIn = useSelector((state) => state.common.loggedIn)
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
                            {loggedIn ? <Link to='/profile' className="link">{username}</Link> : <Link to='/login' className="link">login</Link>}
                        </li>
                    </ul>
                </nav>
            </header>
            <div className={styles.mainContainer}>
                <Outlet />
            </div>
        </>
    )
}