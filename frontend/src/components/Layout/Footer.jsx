import styles from './footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>ondeviveremsp · projeto independente</p>
      <p className={styles.contact}>
        <a
          href="https://github.com/foccagit/ondeviveremsp"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/foccagit/ondeviveremsp
        </a>
      </p>
    </footer>
  );
}
