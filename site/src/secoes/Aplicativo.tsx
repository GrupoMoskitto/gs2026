import { Smartphone } from 'lucide-react';

import { Carrossel, Cartao } from '../componentes/Carrossel';
import { Celular } from '../componentes/Celular';
import { VideoLoop } from '../componentes/VideoLoop';

// Loops gravados no emulador (o mesmo material do vídeo do app), em public/app/loops.
const TELAS = [
  {
    nome: 'mapa',
    texto: 'O risco de agora, direto no mapa da região.',
    cor: 'bg-celeste text-forte',
    alt: 'Mapa do app: busca por Pinheiros e um relato aberto',
  },
  {
    nome: 'risco',
    texto: 'A previsão do modelo, faixa por faixa do dia.',
    cor: 'bg-marinho text-white',
    alt: 'Aba Risco: troca da tarde para a noite e os maiores riscos',
  },
  {
    nome: 'risco-lugar',
    texto: 'Cada lugar, com o risco de cada horário.',
    cor: 'bg-alto-suave text-sobre-alto',
    alt: 'Aba Risco: o detalhe de Guarulhos, faixa por faixa',
  },
  { nome: 'risco-modelo', texto: 'Que horas e o que mais roubam.', cor: 'bg-superficie text-forte', alt: 'Aba Risco: roubos por hora e o que é levado' },
  { nome: 'novo', texto: 'Relate em segundos, sem dados pessoais.', cor: 'bg-azul text-white', alt: 'Novo relato: bicicleta, na Mooca, agora' },
  {
    nome: 'novo-salvo',
    texto: 'Sem rede? O relato fica guardado e é enviado depois.',
    cor: 'bg-nevoa text-forte',
    alt: 'O relato é salvo no aparelho por falta de conexão',
  },
  {
    nome: 'relatos',
    texto: 'Todos os relatos, com busca e situação.',
    cor: 'bg-baixo-suave text-sobre-baixo',
    alt: 'Lista de relatos com a busca por bicicleta',
  },
  { nome: 'relato', texto: 'Abra um relato e veja o risco dali.', cor: 'bg-marinho text-white', alt: 'Detalhe de um relato, com o mapa e o risco do lugar' },
  { nome: 'tema', texto: 'Claro ou escuro, como o seu celular.', cor: 'bg-celeste text-forte', alt: 'Ajustes: troca do tema claro para o escuro' },
];

export function Aplicativo() {
  return (
    <section id="app">
      <Carrossel icone={Smartphone} rotulo="O app do cidadão">
        {TELAS.map((t) => (
          <Cartao key={t.nome} texto={t.texto} className={t.cor}>
            <div className="absolute inset-x-0 top-0 mx-auto w-[66%] transition-transform duration-500 ease-saida group-hover:-translate-y-2">
              <Celular>
                <VideoLoop nome={t.nome} alt={t.alt} />
              </Celular>
            </div>
          </Cartao>
        ))}
      </Carrossel>
    </section>
  );
}
