import { Link, Outlet } from "react-router-dom";
import { useEffect } from "react";
import instance from "../services/Common";

import styles from './styles.module.css';
import { useSelector, useDispatch } from 'react-redux'
import { removeNotification } from '../store/common'


export const Common = () => {
    const dispatch = useDispatch()
    const notifications = useSelector((state) => state.common.notifications)

    useEffect(() => {
        if (notifications.length === 0) return
        setTimeout(() => {
            dispatch(removeNotification())
        }, 5000)
    }, [notifications])

    return (
        <>
            <Outlet />
            <div className={styles.notifications}>
                {notifications.slice(0).reverse().map((i, index) => (
                    <div key={index} style={{ backgroundColor: i.type === 0 ? 'blue' : 'red' }} className={`${styles.notification}`}>
                        {i.text}
                    </div>
                ))}
            </div>
        </>
    )
}