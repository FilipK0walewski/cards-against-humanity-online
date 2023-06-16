import styles from './modal.module.css'

import { Button } from './Button'
import { useEffect, useRef } from 'react'

export const Modal = ({ text, children, opened, closeModal }) => {

    const dialogRef = useRef(null)

    const showModal = () => {
        dialogRef.current.showModal()
    }

    const close = () => {
        closeModal()
        dialogRef.current.close()
    }

    useEffect(() => {
        if (opened === true) dialogRef.current.showModal()
        else if (opened === false) dialogRef.current.close()
    }, [opened])

    return (
        <>
            {opened === undefined ? <Button text={text} onClick={showModal} /> : null}
            <dialog ref={dialogRef} className={styles.dialog}>
                <div className={styles.btnContainer}>
                    <Button text="close" onClick={close} />
                </div>
                {children}
            </dialog>
        </>
    )
}