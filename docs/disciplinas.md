# Parte 4: As disciplinas

Cada professor compõe a sua parte do desafio. Todas as entregas vencem em **19/11, 23h55**, no Teams da disciplina (um integrante envia por equipe).

| Disciplina | Entrega no Teams |
|---|---|
| Arquitetura Orientada a Serviços (SOA) e Web Services | 19/11 |
| Cybersecurity | 19/11 |
| C# Software Development | 19/11 |
| Inteligência Artificial & Machine Learning | 19/11 |
| Mobile Development & IOT | 19/11 |
| Operating Systems | 19/11 |
| Physical Computing: IOT & IOB | 19/11 |
| Testing, Compliance & Quality Assurance | 19/11 |

---

## 1. Arquitetura Orientada a Serviços (SOA) e Web Services

**Conceito:** a solução da GS deve incluir uma aplicação, em qualquer linguagem, que faça parte da CitizenTech. Usar a tecnologia para apoiar a resolução de um problema real da cidade, demonstrando os conceitos do ano em um cenário próximo da realidade.

**Objetivo:** projetar e implementar a **camada de backend** da solução, aplicando: estruturação do domínio, conexão com banco de dados, chamadas de APIs REST e testes manuais com **Insomnia**. Deve evidenciar boas práticas, organização do código e integração com a CitizenTech.

**Entregáveis:**
- Repositório GitHub com o código completo
- README com instruções de execução, descrição da solução e nomes dos integrantes
- Evidências da aplicação

**Formato:** link do GitHub.

**Avaliação (10,0):**

| Critério | Pontos |
|---|---|
| Estruturação do domínio | 3,0 |
| Conexão com banco de dados | 3,0 |
| Migrações | 2,5 |
| Testes manuais | 1,5 |

---

## 2. Cybersecurity

**Conceito:** uma CitizenTech lida com dados sensíveis e serviços essenciais, então a segurança (Confidencialidade, Integridade e Disponibilidade) é inegociável. Conectar o desenvolvimento à **Gestão de Riscos**, antecipando cenários de ataque (vazamentos via OSINT, acessos indevidos, SQL Injection, LFI) e implementando controles desde a concepção (*Security by Design*).

**Objetivo:** aplicar o processo prático de Gestão de Riscos sobre a CitizenTech. Mapear ativos críticos (ex.: banco de dados de cidadãos, servidores), identificar ameaças e vulnerabilidades e comprovar controles técnicos preventivos (tratamento seguro de entradas contra SQLi/LFI, ou segurança da infraestrutura de rede).

**Entregáveis:**
- **Relatório de Gestão de Riscos:** Ativos, Ameaças, Vulnerabilidades, Riscos e Controles propostos
- **Evidências de Segurança (prints/scripts):** por exemplo, código com *Prepared Statements* contra SQL Injection, sanitização de diretórios contra LFI, ou saída de varredura **NMAP** comprovando o fechamento de portas sensíveis

**Formato:** relatório em **PDF**, envio único por equipe na tarefa de Cybersecurity do Teams até 19/11.

**Avaliação (10,0):**

| Critério | Pontos | O que avalia |
|---|---|---|
| Mapeamento de Ativos e Ameaças | 2,5 | Identificação clara do que precisa ser protegido e dos agentes de ameaça ao cidadão |
| Análise de Vulnerabilidades e Riscos | 3,0 | Cenários de ataque plausíveis, baseados nas tecnologias usadas (ex.: SQLi na API, exposição de dados por OSINT) |
| Definição de Controles | 2,5 | Contramedidas adequadas e viáveis para os riscos identificados |
| Evidências Técnicas | 2,0 | Qualidade e veracidade dos prints/códigos que comprovam a blindagem da solução |

---

## 3. C# Software Development

**Conceito:** conectar desenvolvimento de software prático ao conceito de CitizenTech, resolvendo um problema real de moradores locais ou gestores públicos. Usar uma **aplicação desktop em Windows Forms com C#**, ideal para terminais de atendimento, pontos de triagem local, controle administrativo ou postos comunitários.

**Objetivo:** projetar e implementar um protótipo funcional em Windows Forms, unindo:
- **Modelagem de lógica e algoritmos:** tratamento de dados, fluxos de decisão, validações e persistência básica
- **POO:** classes, encapsulamento e organização orientada a objetos em C# para modelar o domínio do problema
- **Interface gráfica eficiente:** telas intuitivas com componentes do Windows Forms, para uso por cidadãos ou operadores locais

**Entregáveis:**
- Versionamento semântico com **pull request**
- Documentação básica (`README.md`): problema escolhido, pessoa real beneficiada, instruções de execução do sistema Windows Forms, tecnologias usadas e nome da equipe

**Formato:** zipar o projeto e criar um arquivo `.txt` com **RM, nome completo e link do repositório**, na tarefa do Teams. Apenas um integrante por equipe faz a tarefa.

**Avaliação:** o PDF não traz a rubrica detalhada.

---

## 4. Inteligência Artificial & Machine Learning

**Conceito:** construir o componente inteligente da CitizenTech: um modelo de ML em **Python** que transforme os dados da equipe em uma previsão ou decisão útil a quem a solução atende.

**Objetivo:** demonstrar um modelo treinado e avaliado com dados do próprio projeto (há bases públicas, mas é possível simular), com a **métrica** que comprova o resultado e a **previsão aparecendo em algum ponto da solução**.

**Entregáveis:**
- Repositório com notebook reproduzível (`.ipynb` ou Colab)
- Dataset e sua origem
- Modelo treinado
- Métrica de avaliação
- README com as decisões e como rodar

**Formato:** notebook (`.ipynb`) e link de **vídeo de até 2 minutos**, na tarefa do Teams.

**Avaliação (10,0):**

| Critério | Pontos |
|---|---|
| Problema e dados | 2,0 |
| Preparação e análise | 2,0 |
| Modelo e treino | 3,0 |
| Avaliação com métrica | 2,0 |
| Integração na solução | 1,0 |

---

## 5. Mobile Development & IOT

**Conceito:** construir o app mobile da CitizenTech em **React Native + Expo com TypeScript**: a porta de entrada do cidadão para a solução.

**Objetivo:** demonstrar o app nativo rodando no celular: identificação, lista, detalhe e cadastro com os dados da solução, e um recurso nativo (câmera, localização ou sensor) a serviço do cidadão.

**Entregáveis:**
- **ZIP da pasta do app (sem `node_modules`)** na tarefa de Mobile no Teams
- `README.md` (Ficha da CitizenTech e como rodar)
- `DECISOES.md` (1 a 2 páginas)
- Array `authors` no `package.json` (nome e RM de todos)
- **Vídeo demo de até 2 minutos**

**Formato:** app em React Native + Expo (**Expo Go**) com **TypeScript estrito**. **WebView não é aceito.**

**Avaliação:**

| Critério | Peso | O que avalia |
|---|---|---|
| Funcionalidade | 40% | 3 ou mais telas com navegação; lista com estados de carregando, erro e vazio; formulário validado que cria um item; identificação lembrada ao reabrir |
| Qualidade TypeScript | 30% | Modo estrito, sem `any`, tipos nos modelos, rotas e respostas, `tsc --noEmit` limpo |
| Recurso nativo | 20% | Câmera, localização, sensor, tempo real ou notificação, com a permissão tratada |
| Organização e documentação | 10% | Camada `services/`, validação pura, `README.md` e `DECISOES.md` |

**Portas de entrada** (termo do PDF, sem explicação adicional; provavelmente requisitos mínimos): `tsc` sem erro e sem `any`, app nativo, identificação completa.

---

## 6. Operating Systems

**Conceito:** desenvolver uma infraestrutura **Windows Server** para sustentar a CitizenTech, aplicando os serviços do semestre (DNS, Active Directory, File Server, IIS, GPO, RDS e DFS). A infraestrutura deve **hospedar a aplicação web da solução**, ser monitorada e responder a situações de falha.

**Objetivo:** construir e administrar um ambiente Windows Server funcional, configurando funções e serviços, permissões NTFS, políticas de grupo e monitoramento de recursos.

**Entregáveis:**
- **Repositório GitHub:** README.md (com a Ficha da CitizenTech), roteiro de configuração e evidências técnicas (prints e saídas de `ipconfig`, `nslookup`, `Test-NetConnection`)
- Infraestrutura funcional
- Monitoramento: alertas de CPU, disco e memória no Monitor de Desempenho
- Teste de falha
- **Vídeo de demonstração de até 7 minutos:** infraestrutura configurada (funções, serviços, dependências e permissões), teste de falha e aplicação hospedada no IIS executando completamente

**Formato:** link do repositório no GitHub, enviado por um único integrante no Teams até 19/11, às 23h55.

**Percurso da equipe:**
1. **Preparar o ambiente** para receber um app: Windows Server completo (VM no VirtualBox, VMware, Hyper-V ou Azure) com domínio, DNS e IP fixo, para receber qualquer aplicação web desenvolvida em outra disciplina.
2. **A aplicação hospedada:** instalar e configurar no IIS todos os recursos necessários (funções, runtime, dependências, site, pool de aplicativos, entre outros) e executar a aplicação com sucesso.
3. **A infraestrutura:** preparar DNS, pastas e permissões NTFS, GPO, acesso remoto, monitoramento e auditoria.
4. **Resultados e conclusão:** apresentar o ambiente configurado (dentro da VM), com evidências de cada etapa, executando a aplicação web CitizenTech hospedada.

**Avaliação (10 pts):**

| Critério | Pontos |
|---|---|
| Infraestrutura de rede e identidade (IP fixo, hostname, DNS e domínio no Active Directory) | 2 |
| Aplicação hospedada no IIS (site, pool de aplicativos, dependências, pasta e permissões NTFS) | 2 |
| Monitoramento da infra com alertas de CPU, disco e memória (Monitor de Desempenho) | 2 |
| Serviços tolerantes a falhas (recuperação automática do serviço e do pool do IIS) e teste de falha | 1 |
| Logs de auditoria e acompanhamento (Visualizador de Eventos e logs do IIS) | 1 |
| Funcionamento completo da proposta | 2 |

Entrega via tarefas no Teams.

---

## 7. Physical Computing: IOT & IOB

**Conceito:** incorporar à solução um **circuito com ESP32 no Wokwi**, explorando sensores e componentes eletrônicos para mostrar como a tecnologia contribui para resolver ou minimizar o problema da CitizenTech.

**Objetivo:** desenvolver e simular um circuito funcional com ESP32, demonstrando como o Physical Computing pode ser integrado à solução e contribuir para sua aplicação prática.

**Ideia central:** o aluno **não** cria um projeto paralelo só para cumprir a atividade. Precisa pensar em como IoT e Physical Computing agregam valor à CitizenTech do grupo.

**Entregáveis:**
- Link do projeto desenvolvido no Wokwi
- Link do vídeo demonstrativo (até 4 min), apresentando brevemente a solução do grupo, como o circuito com ESP32 foi incorporado ao projeto e seu funcionamento no Wokwi
- Arquivo `.txt` com o nome dos integrantes

**Avaliação:** o PDF não traz a rubrica detalhada.

---

## 8. Testing, Compliance & Quality Assurance

**Conceito:** apresentar a **Arquitetura de Soluções baseada no TOGAF**.

**Objetivo:** praticar a Arquitetura de Soluções de software usando TOGAF, a partir da apresentação da solução proposta.

**Entregáveis:**
- **Diagrama de Arquitetura de Soluções**, na ferramenta **ArchiMate**, contemplando as camadas **Motivação, Negócios, Sistemas (Aplicação) e Infraestrutura (Tecnologia)**
- **Documento descritivo** da solução, com os principais elementos que detalham e justificam a proposta a partir do desafio da GS
- Também é aqui que se envia o **vídeo de pitch** (até 4 min, YouTube) para o Prêmio Melhor GS

**Avaliação:**

| Critério | Peso |
|---|---|
| Visão da Arquitetura (Camada de Motivação) | 20% |
| Visão de Negócios (Camada de Business) | 20% |
| Visão de Sistemas (Camada de Aplicação) | 20% |
| Visão de Infraestrutura (Camada de Tecnologia) | 20% |
| Apresentação do nome do projeto, da composição da equipe (nome e RM) e descrição do desafio/problema escolhido | 10% |
| Definição do público-alvo e estimativas de impacto, fundamentadas em estudos de dados de mercado/estatísticas | 10% |
