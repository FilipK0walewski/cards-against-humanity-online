import { Link } from "react-router-dom"
import { useSelector } from 'react-redux'

import styles from './home.module.css'

export const Home = () => {
    const guest = useSelector((state) => state.common.guest)

    return (
        <>
            <div className={styles.container}>
                <h1>Cards against sanity online</h1>
                <nav>
                    <ul className={styles.list}>
                        <li>
                            <Link className="card white" to='/games/create'>create game</Link>
                        </li>
                        <li>
                            <Link className="card white" to='/decks'>public decks</Link>
                        </li>
                        {guest === false ? <li>
                            <Link className="card black" to='/decks?private=true'>your decks</Link>
                        </li> : null}
                    </ul>
                </nav>
            </div>
        </>
    )
}