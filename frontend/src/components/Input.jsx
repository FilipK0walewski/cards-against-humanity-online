import styles from './input.module.css'

export const Input = (props) => {

    const { label, value, onChange, onBlur, type = "text", style = { backgroundColor: "var(--bg-0)" } } = props
    const id = !props.id ? `${label}-input` : props.id

    return (
        <div className={styles.container}>
            <input placeholder='0' onBlur={onBlur} className={styles.input} id={id} type={type} value={value} onChange={onChange} required />
            <label className={styles.label} htmlFor={id} style={style}>{label}</label>
        </div>
    )
}
