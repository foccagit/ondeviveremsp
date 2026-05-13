import { formatNumber } from '@/lib/format';
import styles from './workbanner.module.css';

export default function WorkBanner({ bairro, onClear }) {
  if (!bairro) return null;
  return (
    <div className={styles.banner}>
      <div className={styles.head}>
        <h2 className={styles.name}>{bairro.nome}</h2>
        <button type="button" onClick={onClear} aria-label="Limpar seleção" className={styles.clear}>
          ×
        </button>
      </div>
      <p className={styles.meta}>
        Zona {bairro.zona} · {formatNumber(bairro.populacao)} habitantes
      </p>
      <p className={styles.description}>{bairro.descricao}</p>
    </div>
  );
}
