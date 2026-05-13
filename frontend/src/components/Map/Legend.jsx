import styles from './legend.module.css';

const ITEMS = [
  { label: 'Bairros mais procurados', token: 'high' },
  { label: 'Médio', token: 'mid' },
  { label: 'Pouco procurados', token: 'low' },
];

export default function Legend() {
  return (
    <ul className={styles.legend}>
      {ITEMS.map((item) => (
        <li key={item.token} className={styles.item}>
          <span className={`${styles.swatch} ${styles[`swatch_${item.token}`]}`} />
          <span className={styles.label}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
