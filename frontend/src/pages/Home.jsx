import { Link } from "react-router-dom"
import { useSelector } from 'react-redux'

import styles from './home.module.css'

export const Home = () => {
    const loggedIn = useSelector((state) => state.common.loggedIn)

    return (
        <>
            <div className={styles.container}>
                <h1>Cards against humanity</h1>
                <nav>
                    <ul className={styles.list}>
                        <li>
                            <Link className="card white" to='/games/create'>create game</Link>
                        </li>
                        <li>
                            <Link className="card white" to='/decks?public=true&private=false'>public decks</Link>
                        </li>
                        {loggedIn ? <li>
                            <Link className="card black" to='/decks?public=false&private=true'>your decks</Link>
                        </li> : null}
                    </ul>
                </nav>
            </div>
        </>
    )
}