import styles from './button.module.css';

export const Button = ({ onClick, text, style, disabled }) => {

    return (
        <button className={styles.btn} disabled={disabled} onClick={onClick} style={style}>{text}</button>
    )
}