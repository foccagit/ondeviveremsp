import styles from './footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>ondeviveremsp · projeto independente</p>

      <p className={styles.line}>
        <strong>Aluguéis:</strong> 17 distritos com dados de mercado (QuintoAndar/Imovelweb e
        Loft, 2025). Demais com estimativa baseada em zona e padrão da região.
      </p>

      <p className={styles.line}>
        <strong>Distâncias e POIs:</strong> Google Maps. Tempos em horário normal (em pico podem
        aumentar 40-70%).
      </p>

      <p className={styles.line}>
        <strong>Segurança:</strong> estimativa simplificada. Versão com dados oficiais do SSP-SP
        em desenvolvimento.
      </p>

      <p className={styles.contact}>
        Dúvidas ou correções:{' '}
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
