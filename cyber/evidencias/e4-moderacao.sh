#!/bin/bash
# Evidência E4: a rota de moderação só aceita a chave de um moderador, e cada decisão registra quem decidiu.
# Rodar com a API local em Development (chave de demonstração "moskitto-demo"):
#   bash cyber/evidencias/e4-moderacao.sh | tee cyber/evidencias/e4-moderacao.txt
API=${API:-http://localhost:5207}
BANCO=${BANCO:-soa/MoskittoRadar.Api/App_Data/moskitto.db}

passo() {
  printf '\n$'; for a in "$@"; do [[ $a == *[\ \{\'\;]* ]] && printf " '%s'" "$a" || printf ' %s' "$a"; done; echo
  "$@" 2>&1 | grep -v '^\s*$' | grep -iv '^\(date\|server\|transfer-encoding\)'; echo; }

ID=$(curl -s "$API/api/relatos?status=pendente&limite=1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Relato pendente usado no teste: $ID"

echo; echo "== 1. Sem chave: recusado"
passo curl -s -i -X PATCH "$API/api/relatos/$ID/status" -H "Content-Type: application/json" -d '{"status":"aprovado"}'

echo "== 2. Chave errada: recusado"
passo curl -s -i -X PATCH "$API/api/relatos/$ID/status" -H "Content-Type: application/json" -H "Authorization: Bearer chute-qualquer" -d '{"status":"aprovado"}'

echo "== 3. O relato continua pendente"
passo curl -s "$API/api/relatos/$ID"

echo "== 4. Conferir a chave: de quem ela é"
passo curl -s -i "$API/api/moderadores/eu" -H "Authorization: Bearer moskitto-demo"

echo "== 5. Com a chave do moderador: aprovado"
passo curl -s -i -X PATCH "$API/api/relatos/$ID/status" -H "Content-Type: application/json" -H "Authorization: Bearer moskitto-demo" -d '{"status":"aprovado"}'

echo "== 6. Registro da decisão na tabela moderacoes"
passo sqlite3 -header -column "$BANCO" "SELECT RelatoId, StatusAnterior, Decisao, ModeradoPor FROM moderacoes WHERE RelatoId = upper('$ID') OR RelatoId = '$ID';"
