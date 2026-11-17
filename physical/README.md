# physical: Physical Computing: IoT & IOB

**Papel no projeto:** **ESP32** simulado no **Wokwi**, integrado à solução.

## Entregas (19/11, 23h55)

- [x] Link do projeto no Wokwi
- [ ] Vídeo de até 4 minutos: apresenta a solução, explica como o circuito foi incorporado e demonstra o funcionamento
- [x] Arquivo `.txt` com o nome dos integrantes

## Avaliação

Solução demonstrando como a IoT pode ser integrada ao projeto.

## Solução

- Simulação de uma transmissão de câmera ao vivo usando uma câmera simples e um ESP32, com botão físico de pausa/retomada da transmissão.
- Programa multi-threaded para aproveitar todos os dois núcleos de processamento do ESP32 (2x Xtensa LX6 32-bits) para aproveitar toda a performance da CPU.
- Solução cost-effective, de alta performance e expansível para construir um live feed de uma ou mais câmeras na aplicação principal.

## Vídeo

Apresentação da câmera ao vivo (57 s): o circuito, a transmissão dos quadros, a pausa pelo botão e o encaixe na solução
(o ponto de ônibus fica em Capão Redondo, o lugar de maior risco previsto pelo modelo). O circuito é o do
`diagram.json`, desenhado com as peças do Wokwi, e o monitor serial segue a mesma lógica do `.cpp`.

https://github.com/user-attachments/assets/ea224566-1476-45d4-8cdf-ff591c81cb67

## Estrutura

```
physical/
├── README.md
├── MoskittoRadar_esp32stream.cpp (código fonte)
└── diagram.json (projeto Wokwi)

```

## Status

Completado.

Detalhes da disciplina: [`docs/disciplinas.md`](../docs/disciplinas.md#7-physical-computing-iot--iob)
