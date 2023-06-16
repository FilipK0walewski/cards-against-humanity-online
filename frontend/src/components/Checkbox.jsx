import styles from './checkbox.module.css'

export const Checkbox = ({ label, value, onChange }) => {
    return (
        <div className={styles.container}>
            <input id={`checkbox-${label}`} type="checkbox" value={value} onChange={onChange} />
            <label htmlFor={`checkbox-${label}`}>{label}</label>
        </div>
    )
}
