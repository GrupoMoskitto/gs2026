import { ArrowUpRight, Blocks, Play } from 'lucide-react';

import { seguirPonteiro } from '../componentes/brilho';
import { Carrossel, cartaoBase } from '../componentes/Carrossel';
import { VideoDialogo } from '../componentes/VideoApp';
import { REPO, RESUMO, parte } from '../dados';

interface Parte {
  pasta: string;
  nome: string;
  materia: string;
  dono: string;
  pronta: boolean;
  resumo: string;
  itens: string[];
  video?: { src: string; capa: string; duracao: string };
}

const f1 = RESUMO.modelo.f1.toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PARTES: Parte[] = [
  {
    pasta: 'mobile',
    video: {
      src: '/app/apresentacao.mp4',
      capa: '/app/apresentacao.jpg',
      duracao: '1 min 21 s',
    },
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
    video: {
      src: '/videos/ia.mp4',
      capa: '/videos/ia.webp',
      duracao: '1 min 10 s',
    },
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
    video: {
      src: '/videos/soa.mp4',
      capa: '/videos/soa.webp',
      duracao: '1 min 8 s',
    },
    nome: 'API e banco',
    materia: 'Arquitetura Orientada a Serviços',
    dono: 'João Vitor de Matos',
    pronta: true,
    resumo: 'ASP.NET Core Web API com Entity Framework Core e SQLite.',
    itens: ['Rotas de relatos e de previsões', 'Banco com migrations', 'Carga dos dados na primeira execução', 'Testes de cada rota no Insomnia e no Bruno'],
  },
  {
    pasta: 'csharp',
    video: {
      src: '/videos/csharp.mp4',
      capa: '/videos/csharp.webp',
      duracao: '1 min 9 s',
    },
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
    video: {
      src: '/videos/iot.mp4',
      capa: '/videos/iot.webp',
      duracao: '57 s',
    },
    nome: 'Câmera ao vivo',
    materia: 'Physical Computing',
    dono: 'Gabriel Kato',
    pronta: true,
    resumo: 'ESP32 simulado no Wokwi, em Arduino C++.',
    itens: ['Câmera num ponto de ônibus', 'Captura e transmite em núcleos separados', 'Botão pausa e retoma a transmissão', 'LED pisca a cada quadro enviado'],
  },
  {
    pasta: 'os',
    nome: 'Servidor',
    materia: 'Operating Systems',
    dono: 'Gabriel Kato',
    pronta: false,
    resumo: 'Windows Server 2025 numa VM, com Active Directory, DNS, DHCP e IIS.',
    itens: ['IIS rodando a API', 'Active Directory, DNS e DHCP', 'Monitor de Desempenho com alertas', 'Recuperação automática, com teste de falha'],
  },
  {
    pasta: 'cyber',
    nome: 'Segurança',
    materia: 'Cybersecurity',
    dono: 'Marcelo Affonso',
    pronta: true,
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
            <article key={p.pasta} onPointerMove={seguirPonteiro} className={`${cartaoBase} h-auto! min-h-[460px] p-7 ${cor}`}>
              {!p.pronta && <p className="mb-5 w-fit rounded-full bg-nevoa px-3.5 py-1.5 text-[15px] font-medium text-forte">Em construção</p>}
              <h3 className="text-[30px] leading-[1.05] font-medium tracking-[-0.02em]">{p.nome}</h3>
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
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-5">
                {p.video && (
                  <VideoDialogo
                    src={p.video.src}
                    capa={p.video.capa}
                    titulo={`Vídeo: ${p.nome}`}
                    descricao={`Apresentação da parte ${p.nome}, com ${p.video.duracao}.`}
                  >
                    <button type="button" className="botao bg-superficie py-2.5 text-[15px] text-forte hover:bg-celeste">
                      <Play size={14} fill="currentColor" aria-hidden="true" /> Ver vídeo · {p.video.duracao}
                    </button>
                  </VideoDialogo>
                )}
                <a href={`${REPO}/tree/main/${p.pasta}`} className="elo inline-flex items-center gap-1 text-[15px] font-medium">
                  {p.pasta}/ no GitHub{' '}
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-saida group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              </div>
            </article>
          );
        })}
      </Carrossel>
    </section>
  );
}
