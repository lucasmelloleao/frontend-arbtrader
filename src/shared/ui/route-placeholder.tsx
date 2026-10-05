type RoutePlaceholderProps = {
  /** Título da seção (nome da estratégia/módulo). */
  titulo: string;
  /** Descrição curta exibida sob o título. */
  descricao: string;
};

/**
 * Placeholder de rota do dashboard: título + descrição + aviso de "em
 * construção". Usado nas rotas do sidebar até os endpoints do backend serem
 * mapeados. Server Component puro — sem estado, sem dados.
 */
export function RoutePlaceholder({ titulo, descricao }: RoutePlaceholderProps): React.ReactNode {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">{titulo}</h3>
        <p className="text-sm text-slate-400">{descricao}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center shadow-sm">
        <p className="text-slate-500">Em construção. Os dados aparecerão aqui.</p>
      </div>
    </div>
  );
}
