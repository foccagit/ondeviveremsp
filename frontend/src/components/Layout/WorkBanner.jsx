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
          ×
        </button>
      </div>
      <p className={styles.meta}>
        {ehAlias && <>Região de {bairro.nome} · </>}
        Zona {bairro.zona} · {formatNumber(bairro.populacao)} habitantes
      </p>
      <p className={styles.description}>{bairro.descricao}</p>
    </div>
  );
}
