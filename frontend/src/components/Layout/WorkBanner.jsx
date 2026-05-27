import { formatNumber } from '@/lib/format';
import styles from './workbanner.module.css';

export default function WorkBanner({ bairro, aliasAtivo, onClear }) {
  if (!bairro) return null;

  // Se há um alias ativo (ex: "Vila Madalena"), mostra ele como título principal
  // e a linha meta inclui "Região de {distrito}" como contexto.
  const ehAlias = !!aliasAtivo && aliasAtivo.distritoId === bairro.id;
  const tituloPrincipal = ehAlias ? aliasAtivo.nomeExibicao : bairro.nome;

  return (
    <div className={styles.banner}>
      <div className={styles.head}>
        <h2 className={styles.name}>{tituloPrincipal}</h2>
        <button type="button" onClick={onClear} aria-label="Limpar seleção" className={styles.clear}>
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <line x1="4" y1="4" x2="20" y2="20" />
            <line x1="20" y1="4" x2="4" y2="20" />
          </svg>
        </button>
      </div>
      <div className={styles.meta}>
        {ehAlias && <span className={styles.metaItem}>Região de {bairro.nome}</span>}
        <span className={styles.metaItem}>Zona {bairro.zona}</span>
        <span className={styles.metaItem}>{formatNumber(bairro.populacao)} habitantes</span>
      </div>
      <p className={styles.description}>{bairro.descricao}</p>
    </div>
  );
}
