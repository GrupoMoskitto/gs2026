import { COR_NIVEL, NA_FAIXA, ROTULO_NIVEL, decimal, faixaDeAgora, maioresRiscos, nivelDe, taxaDe } from '../dados';

/** Faixa que corre para o lado com os maiores riscos da faixa do dia atual. */
export function Letreiro() {
  const faixa = faixaDeAgora();
  const lugares = maioresRiscos(faixa, 14);

  const lista = (oculta: boolean) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={oculta || undefined}>
      {lugares.map((l) => {
        const nivel = nivelDe(l.codigo, faixa);
        return (
          <li key={l.codigo} className="flex items-center gap-2.5 rounded-full bg-superficie px-4 py-2.5 text-[15px] whitespace-nowrap text-forte">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_NIVEL[nivel] }} aria-hidden="true" />
            <span className="font-medium">{l.nome}</span>
            <span className="text-suave">
              {ROTULO_NIVEL[nivel].toLowerCase()} · {decimal(taxaDe(l.codigo, faixa))} roubos/dia
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section aria-label={`Maiores riscos ${NA_FAIXA[faixa]}`} className="letreiro relative overflow-hidden">
      <div className="letreiro-trilho flex w-max">
        {lista(false)}
        {lista(true)}
      </div>
    </section>
  );
}
