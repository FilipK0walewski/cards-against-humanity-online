import styles from './select.module.css'

export const Select = ({ id, value, onChange, label, children }) => {
    return (
        <div className={styles.container}>
            <select className={styles.select} id={id} value={value} onChange={onChange} required>
                {children}
            </select>
            <label className={styles.label} htmlFor={id}>{label}</label>
        </div>
    )
}