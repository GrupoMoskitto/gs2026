# Design: IA/ML de risco de roubo (pasta `ia/`)

Data: 14/11/2026 · Autor: Gabriel Couto (Coto), RM559579 · Disciplina: Inteligência Artificial & Machine Learning

## Intenção

Dar à solução o componente inteligente pedido na GS: um modelo em Python que prevê o **nível de risco de roubo
por lugar e faixa horária**, treinado com **dados públicos reais da SSP-SP**, cuja previsão aparece no app (aba
Risco, faixa do mapa e detalhe do relato) através da API do João (`GET /api/previsoes`). O autor quer **um resultado
bonito de ver**: as figuras do notebook e do README devem contar a história com clareza e com a cara do app.

Rubrica (10,0): problema e dados 2,0 · preparação e análise 2,0 · modelo e treino 3,0 · avaliação com métrica 2,0 ·
integração 1,0. Entregas: notebook reproduzível, dataset e origem, modelo treinado, métrica, README, vídeo de até 2 min.
O PDF da GS aceita "dados simulados ou públicos, dizendo de onde vieram".

## Decisões do autor nesta conversa

1. **Região metropolitana inteira**, com os mesmos **129 lugares do app** (3 bairros da Paulista + 88 distritos da
   capital + 38 municípios). Resolve a decisão 3 do `AGENTS.md`. O autor avisa o time.
2. **Classificação** com RandomForest, comparada com referências simples.
3. **Dados reais para o modelo:** bases "Celulares Subtraídos" e "Veículos Subtraídos" da SSP-SP, 2024 a 2026,
   baixadas pelo autor e guardadas em `ia/docs/*.xlsx` (fora do Git). **Roubo de celular e de veículo juntos.**
4. **CSV de relatos para a API continua simulado** (precisa de descrição, status e origem, que os BOs não têm), mas
   **calibrado pela distribuição real** da SSP-SP.
5. **Ambiente Python local** em `ia/.venv` com `uv`. Nada é instalado sem o autor ver o comando antes.
6. **Visualização caprichada** (seção própria abaixo).
7. **RAG local ("pergunte aos dados") é extra**, só depois de tudo o que é avaliado estar pronto, e com nova
   conversa antes de instalar qualquer coisa. Fora do escopo deste design.

## Objetivos

- **Urgente (João depende, era para 13/11):** `relatos_simulados.csv` com as colunas exatas do Relato
  (`AGENTS.md`, seção 4), semente fixa, ~10.000 linhas, e o arquivo reserva só com os 3 bairros.
- Extração reprodutível dos BOs reais → arquivo agregado e sem dados pessoais, que vai para o Git.
- Notebook que roda de ponta a ponta: carregar → analisar → preparar → treinar → avaliar → exportar.
- `previsoes.json` no formato da seção 4, 129 × 4 = 516 linhas, com risco vindo dos dados reais.
- Figuras claras e bonitas no notebook e no README.
- README com origem dos dados, regra do `nivel_risco`, modelo, métricas reais e como rodar.

## Não objetivos

- Servir o modelo por API própria. A integração é o `previsoes.json` carregado pela API do João.
- Furtos (sem violência): ficam fora. O app trata de roubo.
- Prever ocorrência individual, rua ou endereço.
- RAG/LLM neste ciclo.

## Anti-objetivos (falha mesmo que "funcione")

- **Qualquer dado pessoal ou endereço no repositório.** Os `.xlsx` brutos e qualquer extração por ocorrência
  (com latitude/longitude exatas) ficam fora do Git. Só entram contagens agregadas por lugar × faixa × dia.
  Nenhuma figura mostra pontos de ocorrências individuais.
- Métrica alta por vazamento: features calculadas com o mesmo período do rótulo que se quer prever.
- Contar o mesmo BO várias vezes (a base bruta repete linhas).
- Códigos de lugar diferentes dos do app.
- Notebook que só roda com os `.xlsx` na máquina do autor: ele roda a partir do arquivo agregado versionado.
- Gráfico bonito que engana: eixos sem rótulo, cor sem legenda, escala que exagera diferença.

## Restrições

- Disco com ~3,7 GB livres. Os `.xlsx` (~500 MB) são lidos em fluxo (XML dentro do ZIP) com a biblioteca padrão do
  Python, sem `openpyxl`. O XML da folha de dados de 2026 tem ~560 MB.
- Ambiente mínimo: pandas, numpy, scikit-learn, matplotlib, joblib, `nbclient` + `ipykernel`. Versões fixadas em
  `ia/requirements.txt`. Sem seaborn, plotly ou geopandas (matplotlib dá conta).
- Português em textos, comentários e README. Registrar o uso de IA em `ia/prompts.md` (regra 7 do `AGENTS.md`).
- Mexer só em `ia/` (e na parte de IA do `docs/checklist.md`). Não alterar `soa/` nem `mobile/`.

## Abordagens consideradas

| | Como | Troca |
|---|---|---|
| **1. Classificação por célula (escolhida)** | Conta roubos por célula, rotula baixo/médio/alto, RandomForestClassifier | Bate com o `AGENTS.md` (acurácia, F1); fácil de explicar |
| 2. Regressão da contagem | Prevê quantos roubos a célula terá e converte em nível por limiar | Mais natural para contagem, mas dois passos e métrica principal vira MAE |
| RAG com LLM local | Banco vetorial + modelo pequeno respondendo perguntas | Não é treino nem tem métrica natural; números viram alucinação; disco e prazo. Virou extra |

Origem dos dados: **simulado puro** (primeira versão do design) foi trocado por **dados reais da SSP-SP** no modelo,
porque dá sentido real ao risco mostrado no app e pesa em "problema e dados". O simulado fica só para os relatos.

## Lugares (`ia/data/lugares.csv`)

Gerados de `mobile/src/data/locais.json` (IBGE + OpenStreetMap) com a mesma regra do app
(`mobile/src/config/locais.ts`):
- `bairro-bela_vista` → `bela_vista` (idem `cerqueira_cesar`, `consolacao`), centros de `mobile/src/config/regiao.ts`;
- distritos → `dis_<código>`, exceto Bela Vista e Consolação (já são bairros do projeto);
- municípios → `mun_<código>`, exceto a capital (`mun_3550308`).
Colunas: código, nome, tipo, latitude, longitude, código IBGE do município. Total: 129 (o script falha se for outro).

## Extração dos dados reais (`ia/scripts/extrair_ssp.py`)

Entrada: os 6 `.xlsx` em `ia/docs/`. Abas: METODOLOGIA, DICIONARIO DE DADOS e a de dados. Colunas usadas (conferidas
no cabeçalho de celulares 2026): `NOME_DELEGACIA`, `ANO_BO`, `NUM_BO`, `RUBRICA`, `DATA_OCORRENCIA_BO` (série do
Excel), `HORA_OCORRENCIA` (fração do dia), `DESCR_PERIODO`, `LATITUDE`, `LONGITUDE`, `COD IBGE`, `FLAG_STATUS`.
As bases de veículos têm o cabeçalho conferido antes; se os nomes diferirem, o script mapeia.

Passos:
1. Ler a aba de dados em fluxo, só com as colunas acima.
2. Manter `RUBRICA` de **roubo** (art. 157). Tentados e consumados contam; o número de tentados vai para o resumo.
3. Manter a **região metropolitana** pelo `COD IBGE` (39 municípios de `locais.json`).
4. **Tirar duplicidades** por `NOME_DELEGACIA` + `ANO_BO` + `NUM_BO` (regra da SSP), também entre celular e veículo.
   Guardar, por BO, se envolveu celular, veículo ou os dois.
5. Data + hora → data local e **faixa horária** (madrugada 0–6, manhã 6–12, tarde 12–18, noite 18–24). Sem hora
   válida: usar `DESCR_PERIODO` se mapear; senão descartar e contar. Manter de 2024-01-01 até a última data
   completa da base de 2026.
6. **Lugar:** fora da capital → `mun_<COD IBGE>`. Na capital → centro mais próximo entre os 88 distritos e os
   3 bairros da Paulista (sem coordenada válida: descartar e contar). Aproximação documentada no README.
7. Saída versionada: `ia/data/roubos_agregados.csv` com `bairro, data, faixa_horaria, roubos, roubos_celular,
   roubos_veiculo` (só linhas com roubos > 0). Resumo: `ia/data/extracao_resumo.json` com as contagens de cada
   etapa e por ano.

Nenhuma linha por ocorrência é gravada no repositório. Cache intermediário, se houver, em `ia/data/bruto/` (ignorado).

## Relatos simulados (`ia/scripts/gerar_relatos.py`)

~10.000 linhas de 01/05/2026 a 31/10/2026, semente 42, colunas e valores exatamente como a seção 4 do `AGENTS.md`:
- **Onde e quando:** sorteados proporcionalmente aos roubos reais (`roubos_agregados.csv`) por lugar × faixa horária
  × dia da semana. Hora exata sorteada dentro da faixa.
- `tipo`: celular e veículo com o peso da proporção real; bolsa/mochila, bicicleta, comércio e outro com pesos fixos.
- `id`: UUID v4 determinístico a partir da semente.
- `descricao`: frases curtas por tipo, sem nomes nem placas; ~30% vazias; até 280 caracteres.
- `latitude`/`longitude`: centro do lugar + deslocamento aleatório (menor em distritos, maior em municípios),
  **3 casas decimais**, dentro de `CAIXA_REGIAO` do app (lat -24,1 a -23,15; lng -47,1 a -45,75). Na Paulista,
  parte cai perto das estações Consolação, Trianon-Masp e Brigadeiro.
- `bairro`: código do lugar. `ocorrido_em`: ISO 8601 com `-03:00`.
- `status`: ~75% aprovado, ~18% pendente, ~7% rejeitado. `origem`: ~80% mobile, ~10% desktop, ~10% iot.

**Arquivo reserva:** `ia/data/relatos_paulista.csv` (só os 3 bairros). A ordem é extrair → gerar.

## Modelo (`ia/notebooks/modelo_risco.ipynb`)

**Célula** = lugar × faixa horária × tipo de dia (útil / fim de semana) → 129 × 4 × 2 = 1.032 células.
**Taxa** = roubos da célula ÷ número de dias daquele tipo no período.

**Regra do `nivel_risco`:** limites de taxa calculados **no período do rótulo de treino** — baixo até o percentil 50,
médio do 50 ao 80, alto acima do 80. Os mesmos limites rotulam o teste. Ajuste dos percentis permitido, com a regra
final escrita no README e no notebook.

**Pergunta do modelo:** dado o histórico de um lugar e suas características, qual o nível de risco no período seguinte?
- **Treino:** features de 2024 → rótulo de 2025.
- **Teste:** features de 2025 → rótulo de 2026 (até a última data completa).
- **Previsão final** (`previsoes.json`): features dos últimos 12 meses → nível previsto para o próximo período.

**Features** (nada do período do rótulo):
- taxa da célula no período anterior; taxa do lugar inteiro no período anterior;
- participação da faixa no total do lugar no período anterior; fração de roubos de veículo no lugar;
- tipo do lugar; distância à Praça da Sé e à Paulista em km;
- faixa horária (codificada); fim de semana (0/1).

**Modelos:** referência 1 "classe mais comum"; referência 2 **"o nível do período anterior se repete"**;
RandomForestClassifier (semente fixa, `class_weight="balanced"`), busca pequena de hiperparâmetros por validação
cruzada só no treino.

**Métricas no teste:** acurácia, **F1 macro** (principal), matriz de confusão, relatório por classe, comparação com as
referências e importância das features. Se o modelo não superar a referência 2, o README diz isso e explica.

## Visualização

Uma identidade só para todas as figuras, com a **paleta do app** (`mobile/src/theme/`, `mobile/mockup/tokens.css`):
risco baixo, médio e alto nas cores de sucesso, alerta e perigo do app, sempre com legenda em texto (nunca só cor);
fundo claro, fonte sem serifa, títulos que dizem a conclusão ("A noite concentra X% dos roubos"), eixos rotulados
em português, fonte da imagem citada no rodapé ("Fonte: SSP-SP, Celulares e Veículos Subtraídos, 2024–2026").
Um módulo `ia/scripts/estilo.py` define cores e estilo; o notebook importa.

Figuras (salvas em `ia/figuras/` como PNG, as principais também no README):
1. **Mapa da região metropolitana**: centro de cada lugar como círculo, tamanho = roubos por dia, cor = nível previsto
   para a noite; contorno da caixa da região e rótulos dos lugares de maior risco. Painel com as 4 faixas lado a lado
   (pequenos múltiplos) para mostrar o risco "andando" ao longo do dia.
2. **Funil da limpeza**: linhas lidas → roubos → região metropolitana → sem duplicidade → com lugar e hora.
3. **Relógio do risco**: roubos por hora do dia (barras de 24 h), faixas horárias sombreadas e rotuladas.
4. **Calendário**: mapa de calor dia da semana × hora.
5. **Série no tempo**: roubos por mês, celular × veículo, 2024–2026.
6. **Ranking**: top 15 lugares por taxa à noite, barras horizontais coloridas pelo nível.
7. **Matriz de confusão** (contagens e %) e **comparação de F1** modelo × referências (barras).
8. **Importância das features** (barras horizontais).
9. **Grade lugar × faixa** (mapa de calor dos 30 lugares de maior risco × 4 faixas), que é o que o app mostra.

Antes de desenhar, o builder carrega a skill de visualização de dados (`dataviz`) para cores, marcas e legendas.

## Saídas

- `ia/data/lugares.csv`, `ia/data/roubos_agregados.csv`, `ia/data/extracao_resumo.json`.
- `ia/data/relatos_simulados.csv` e `ia/data/relatos_paulista.csv` (vão para o João).
- `ia/model/modelo_risco.joblib`: modelo final.
- `ia/data/previsoes.json` (516 linhas) e `ia/data/previsoes_paulista.json` (12 linhas):
  `{ "bairro", "faixa_horaria", "nivel_risco", "score" }`.
  - O modelo prevê dia útil e fim de semana; probabilidade final = média ponderada 5/7 e 2/7.
  - `nivel_risco` = classe de maior probabilidade.
  - `score` = E = P(médio) × 0,5 + P(alto) × 1,0, **limitado à faixa do nível**: baixo 0,05–0,34 · médio 0,35–0,59 ·
    alto 0,60–0,95, em 2 casas (cortes do `nivelDoScore` do app), para mapa, aba Risco e detalhe concordarem.
- `ia/figuras/*.png`.

## Como rodar (a documentar no README)

1. `uv venv ia/.venv` e `uv pip install -r ia/requirements.txt`.
2. (Só quem tem os `.xlsx`) `python ia/scripts/extrair_ssp.py`.
3. `python ia/scripts/gerar_relatos.py`.
4. Executar o notebook (Jupyter ou `nbclient`), que grava modelo, previsões e figuras.
O README explica como baixar as bases no portal da SSP-SP (Bases de Dados → Celulares/Veículos Subtraídos → ano).

## Integração

- O João carrega `relatos_simulados.csv` e `previsoes.json` na primeira execução da API.
- A API precisa aceitar os códigos de lugar no campo `bairro` (pedido já no `DECISOES.md` do mobile). Até lá, usa os
  arquivos `_paulista`. O autor combina com o time.

## Entregas e documentação

- `ia/README.md` reescrito: problema; **origem dos dados** (SSP-SP, base bruta, não é estatística oficial, como
  baixar, o que foi descartado; lugares do IBGE/OSM; relatos simulados e como foram gerados); regra do
  `nivel_risco`; modelo; métricas reais; figuras principais; como rodar; integração; limitações.
- `ia/prompts.md`; checklist do `ia/README.md` e parte de IA do `docs/checklist.md`.
- Vídeo de até 2 min: fora deste design (o autor grava).

## Deixado ao builder

- Pesos dos tipos que não vêm da SSP, frases das descrições, grade de hiperparâmetros.
- Ajuste dos percentis do rótulo, com a regra final documentada.
- Detalhes de layout das figuras dentro da identidade acima.
