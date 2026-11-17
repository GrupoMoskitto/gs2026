import { ArrowUpRight, Blocks } from 'lucide-react';

import { seguirPonteiro } from '../componentes/brilho';
import { Carrossel, cartaoBase } from '../componentes/Carrossel';
import { REPO, RESUMO, parte } from '../dados';

interface Parte {
  pasta: string;
  nome: string;
  materia: string;
  dono: string;
  pronta: boolean;
  resumo: string;
  itens: string[];
}

const f1 = RESUMO.modelo.f1.toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PARTES: Parte[] = [
  {
    pasta: 'mobile',
    nome: 'App do cidadão',
    materia: 'Mobile Development & IoT',
    dono: 'Gabriel Couto',
    pronta: true,
    resumo: 'React Native com Expo e TypeScript estrito.',
    itens: [
      'Mapa com os relatos e a cor do risco',
      'Lista, detalhe e cadastro de relato',
      'Localização, tratando a permissão negada',
      'Funciona sem rede e envia depois',
    ],
  },
  {
    pasta: 'ia',
    nome: 'Modelo de risco',
    materia: 'IA & Machine Learning',
    dono: 'Gabriel Couto',
    pronta: true,
    resumo: `RandomForest em Python, com F1 macro de ${f1} e ${parte(RESUMO.modelo.acuracia)} de acerto.`,
    itens: [
      'Roubos reais e agregados da SSP-SP',
      '129 lugares e 4 faixas do dia',
      'Previsão do mês para cada lugar',
      'Exporta o que o app e este site mostram',
    ],
  },
  {
    pasta: 'soa',
    nome: 'API e banco',
    materia: 'Arquitetura Orientada a Serviços',
    dono: 'João Vitor de Matos',
    pronta: true,
    resumo: 'ASP.NET Core Web API com Entity Framework Core e SQLite.',
    itens: ['Rotas de relatos e de previsões', 'Banco com migrations', 'Carga dos dados na primeira execução', 'Testes de cada rota no Insomnia'],
  },
  {
    pasta: 'csharp',
    nome: 'App do moderador',
    materia: 'C# Software Development',
    dono: 'João Vitor de Matos',
    pronta: true,
    resumo: 'C# com .NET 10 e Windows Forms.',
    itens: [
      'Herança e polimorfismo por tipo de roubo',
      'Cidadão e Moderador como usuários',
      'Listar, filtrar, aprovar e rejeitar',
      'Propriedades que validam os dados',
    ],
  },
  {
    pasta: 'physical',
    nome: 'Botão de pânico',
    materia: 'Physical Computing',
    dono: 'Gabriel Kato',
    pronta: false,
    resumo: 'ESP32 simulado no Wokwi, em Arduino C++.',
    itens: ['Botão num ponto de ônibus', 'Monta um relato de origem iot', 'Envia para a API pelo Wi-Fi', 'LED ou buzzer confirma o envio'],
  },
  {
    pasta: 'os',
    nome: 'Servidor',
    materia: 'Operating Systems',
    dono: 'Gabriel Kato',
    pronta: false,
    resumo: 'Windows Server com Active Directory, DNS e IIS.',
    itens: ['IP fixo, DNS e domínio', 'IIS hospedando a API', 'Alertas de CPU, disco e memória', 'Recuperação automática, com teste de falha'],
  },
  {
    pasta: 'cyber',
    nome: 'Segurança',
    materia: 'Cybersecurity',
    dono: 'Marcelo Affonso',
    pronta: false,
    resumo: 'Relatório de gestão de riscos da solução.',
    itens: ['Ativos: banco, API e servidor', 'Ameaças e vulnerabilidades', 'Riscos e os controles de cada um', 'Scan das portas do servidor'],
  },
  {
    pasta: 'testing',
    nome: 'Arquitetura e pitch',
    materia: 'Testing, Compliance & QA',
    dono: 'Marcelo Affonso',
    pronta: false,
    resumo: 'Diagrama no ArchiMate, documento e pitch.',
    itens: ['Camada de motivação e os ODS', 'Camada de negócios', 'Camadas de aplicação e tecnologia', 'Pitch de até 4 minutos'],
  },
];

export function Partes() {
  return (
    <section id="partes">
      <Carrossel icone={Blocks} rotulo="As oito partes">
        {PARTES.map((p, i) => {
          const escuro = p.pronta && i === 0;
          const cor = escuro ? 'bg-marinho text-white' : p.pronta ? 'bg-azul text-white' : 'bg-superficie text-forte';
          return (
            <article key={p.pasta} onPointerMove={seguirPonteiro} className={`${cartaoBase} p-7 ${cor}`}>
              <p className={`w-fit rounded-full px-3.5 py-1.5 text-[15px] font-medium ${p.pronta ? 'bg-superficie text-forte' : 'bg-nevoa text-forte'}`}>
                {p.pronta ? (
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      <span className="absolute inset-0 animate-ping rounded-full bg-baixo motion-reduce:hidden" />
                      <span className="relative h-2 w-2 rounded-full bg-baixo" />
                    </span>
                    Pronta
                  </span>
                ) : (
                  'Em construção'
                )}
              </p>
              <h3 className="mt-5 text-[30px] leading-[1.05] font-medium tracking-[-0.02em]">{p.nome}</h3>
              <p className={`mt-2 text-[15px] ${escuro ? 'text-claro' : p.pronta ? 'text-white' : 'text-suave'}`}>
                {p.materia} · {p.dono}
              </p>
              <p className="mt-4 text-[16px] font-medium">{p.resumo}</p>
              <ul className="mt-3 grid gap-1.5 text-[15px]">
                {p.itens.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      className={`mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full ${escuro ? 'bg-celeste' : p.pronta ? 'bg-superficie' : 'bg-azul'}`}
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <a href={`${REPO}/tree/main/${p.pasta}`} className="elo mt-auto inline-flex items-center gap-1 pt-4 text-[15px] font-medium">
                {p.pasta}/ no GitHub{' '}
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-saida group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </article>
          );
        })}
      </Carrossel>
    </section>
  );
}
