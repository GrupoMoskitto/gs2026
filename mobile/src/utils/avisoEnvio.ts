import type { ResumoEnvio } from '@/services/fila';

export interface AvisoEnvio {
  titulo: string;
  texto: string;
}

function relatos(n: number): string {
  return n === 1 ? '1 relato' : `${n} relatos`;
}

export function avisoDoEnvio(resumo: ResumoEnvio): AvisoEnvio | null {
  const partes: string[] = [];
  if (resumo.enviados.length > 0) partes.push(`${relatos(resumo.enviados.length)} enviado${resumo.enviados.length === 1 ? '' : 's'}.`);

  if (resumo.erro) {
    const ficam =
      resumo.restantes === 1
        ? 'O relato que falta continua guardado no aparelho e será enviado quando a conexão voltar.'
        : `Os ${resumo.restantes} relatos que faltam continuam guardados no aparelho e serão enviados quando a conexão voltar.`;
    partes.push(resumo.erro.message, ficam);
  }
  if (resumo.recusados > 0) {
    const motivo = resumo.motivoRecusa ? ` Motivo: ${resumo.motivoRecusa}` : '';
    partes.push(
      resumo.recusados === 1
        ? `O servidor recusou 1 relato, que saiu da fila.${motivo}`
        : `O servidor recusou ${resumo.recusados} relatos, que saíram da fila.${motivo}`,
    );
  }

  if (!resumo.erro && resumo.recusados === 0) return null;
  const titulo = resumo.erro ? 'Não foi possível enviar' : resumo.recusados === 1 ? 'Relato recusado' : 'Relatos recusados';
  return { titulo, texto: partes.join(' ') };
}
