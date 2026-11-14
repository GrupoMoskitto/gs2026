# Uso de IA · IA & ML

A GS permite IA como copiloto, com registro dos prompts. O autor revisou e sabe explicar o código gerado.

| Data | Autor | Prompt (resumo) | O que foi aceito |
|---|---|---|---|
| 14/11/2026 | Gabriel Couto | Juntar roubo de celular e de veículo; leitura das planilhas | Leitor de xlsx em streaming, limpeza (roubo, RMSP, BO sem repetição, faixa pela hora ou período) e agregação por lugar, dia e faixa |
| 14/11/2026 | Gabriel Couto | Relatos simulados para a API do João | `gerar_relatos`: lugar, dia e faixa sorteados na proporção dos roubos reais, seed 42, sem dado pessoal |
| 14/11/2026 | Gabriel Couto | Revisão das figuras | Correção do fim do período (mês recente incompleto na base de celulares), títulos com a conclusão, rótulos sem sobreposição |
| 14/11/2026 | Gabriel Couto | Site Flask simples com o branding do Moskitto para ver os resultados, com gráficos; opção de rodar com Docker Compose | `web/` (Flask + gráficos SVG sem biblioteca, modo claro e escuro, tabelas alternativas), `web/Dockerfile`, `compose.yaml` |
| 14/11/2026 | Gabriel Couto | "Atualize o bind mount" | `compose.yaml` monta `web/` e `data/` só leitura (`:ro,z` por causa do SELinux), gunicorn com `--reload` e template relido a cada pedido |
