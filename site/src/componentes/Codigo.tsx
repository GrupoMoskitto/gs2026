import { motion } from 'motion/react';

const COR = { chave: '#B0DCFC', texto: '#BFE8D6', numero: '#FBE3A3', resto: 'rgb(255 255 255 / 0.72)' };

/** Pinta uma linha de JSON: chaves, textos e números em cores diferentes. */
function pintar(linha: string) {
  const partes: { t: string; cor: string }[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|([^"\d-]+|-)/g;
  for (const m of linha.matchAll(re)) {
    if (m[1]) {
      partes.push({ t: m[1], cor: m[2] ? COR.chave : COR.texto });
      if (m[2]) partes.push({ t: m[2], cor: COR.resto });
    } else if (m[3]) partes.push({ t: m[3], cor: COR.numero });
    else partes.push({ t: m[0], cor: COR.resto });
  }
  return partes;
}

interface Props {
  linhas: string[];
  titulo?: string;
  className?: string;
}

/** Bloco de código escuro em que as linhas entram uma a uma. */
export function Codigo({ linhas, titulo, className = '' }: Props) {
  return (
    <div className={`overflow-hidden rounded-[18px] bg-[#071d36] font-mono text-[12.5px] leading-[1.65] text-white ${className}`}>
      {titulo ? <p className="border-b border-white/10 px-4 py-2 font-sans text-[13px] font-medium text-[#B0DCFC]">{titulo}</p> : null}
      <pre className="sem-barra overflow-x-auto px-4 py-3">
        {linhas.map((linha, i) => (
          <motion.span
            key={`${i}-${linha}`}
            className="block whitespace-pre"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.05 * i }}
          >
            {pintar(linha).map((p, j) => (
              <span key={j} style={{ color: p.cor }}>
                {p.t}
              </span>
            ))}
          </motion.span>
        ))}
      </pre>
    </div>
  );
}

export const json = (valor: unknown) => JSON.stringify(valor, null, 2).split('\n');
