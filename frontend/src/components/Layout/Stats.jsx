import styles from './stats.module.css';
export default function Stats() {
  return (
    <section className={styles.stats}>
      <h1 className={styles.headline}>
        <span className={styles.num}>96</span> distritos,{' '}
        <span className={styles.num}>700+</span> bairros,{' '}
        <span className={styles.num}>12,4</span> milhões de pessoas e milhares de rotinas
        diferentes. Qual combina com a sua?
      </h1>
    </section>
  );
}
