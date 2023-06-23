import styles from './modal.module.css'

import React from 'react'
import { Button } from './Button'
import { useRef } from 'react'

export const Modal = React.forwardRef(({ text, children, onClose }, ref) => {

    const dialogRef = useRef(null)

    const showModal = () => {
        dialogRef.current.showModal()
    }

    const closeModal = () => {
        if (onClose) onClose()
        dialogRef.current.close()
    }

    const openModal = () => {
        dialogRef.current.showModal()
    }

    React.useImperativeHandle(ref, () => ({
        closeModal, openModal
    }));

    return (
        <>
            {text ? <Button text={text} onClick={showModal} /> : null}
            <dialog ref={dialogRef} className={styles.dialog}>
                <div className={styles.btnContainer}>
                    <Button text="close" onClick={closeModal} />
                </div>
                {children}
            </dialog>
        </>
    )
})