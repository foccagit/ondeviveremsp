import styles from './attribution.module.css';

export default function Attribution() {
  return (
    <p className={styles.attr}>
      Mapa baseado em{' '}
      <a
        href="https://commons.wikimedia.org/wiki/File:Mapa_sp.svg"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        Mapa_sp.svg
      </a>{' '}
      (Wikimedia Commons, CC BY 3.0)
    </p>
  );
}
