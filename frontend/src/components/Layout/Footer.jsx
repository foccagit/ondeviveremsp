import styles from './footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <span>{year}</span>
    </footer>
  );
}
