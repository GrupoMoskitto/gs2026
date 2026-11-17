// FIAP Global Solution 2026.2
// Grupo Moskitto - 3ESPA
// Integrantes:
// Gabriel Kato, Gabriel Couto, João Vitor de Matos, Marcelo Affonso (RMs no integrantes.txt!)


#include <Arduino.h>

// Pinagem
#define PIN_POT 34      // Simula variação na imagem capturada (posição/brilho)
#define PIN_BTN 15      // Pausa / Retoma o streaming
#define PIN_LED 2       // LED indicador de transmissão TX

// Configurações da Câmera Emulada
#define FRAME_WIDTH  32
#define FRAME_HEIGHT 16
#define FRAME_SIZE   (FRAME_WIDTH * FRAME_HEIGHT) // 512 bytes por frame (8-bit Grayscale)

// Estrutura que emula o "camera_fb_t" da biblioteca "esp_camera.h"
typedef struct {
  uint8_t buf[FRAME_SIZE];
  size_t len;
  uint32_t frame_id;
  uint32_t timestamp;
} VirtualFrameBuffer;

// Queue FreeRTOS para transferir frames entre o Core 0 (Captura) e Core 1 (Rede)
QueueHandle_t frameQueue;

// Variáveis de controle
volatile bool isStreaming = true;
unsigned long lastDebounceTime = 0;

// Tabela de caracteres ASCII do mais escuro para o mais claro
const char* ASCII_PALETTE = " .:-=+*#%@";


// Task 1 (rodando no Core 0): Emulação da Câmera (Captura Procedural)
void cameraCaptureTask(void *pvParameters) {
  uint32_t frameCounter = 0;
  VirtualFrameBuffer fb;

  while (true) {
    if (isStreaming) {
      int potValue = analogRead(PIN_POT);
      
      // Mapeia a leitura da resistencia como a posição no eixo X de um objeto em movimento e brilho de fundo
      int objCenterX = map(potValue, 0, 4095, 2, FRAME_WIDTH - 3);
      int objCenterY = FRAME_HEIGHT / 2 + (int)(sin(frameCounter * 0.3) * 4); // Oscilação vertical automática
      uint8_t bgBrightness = map(potValue, 0, 4095, 10, 80);

      // Buffer fill dos pixels (0 a 255)
      for (int y = 0; y < FRAME_HEIGHT; y++) {
        for (int x = 0; x < FRAME_WIDTH; x++) {
          int idx = y * FRAME_WIDTH + x;
          
          // Cá lculo da distância até o objeto
          int dx = x - objCenterX;
          int dy = y - objCenterY;
          float dist = sqrt(dx * dx + dy * dy);

          if (dist < 3.2) {
            fb.buf[idx] = 255; // centro do objeto
          } else if (dist < 5.0) {
            fb.buf[idx] = 160; // borda suave / iluminação
          } else {
            // gradiente horizontal
            fb.buf[idx] = constrain(bgBrightness + (x * 2), 0, 120);
          }
        }
      }

      fb.len = FRAME_SIZE;
      fb.frame_id = ++frameCounter;
      fb.timestamp = millis();

      // Envia o frame para a fila de transmissão (até 10ms de espera se estiver cheia)
      xQueueSend(frameQueue, &fb, pdMS_TO_TICKS(10));
    }

    // Controla o FPS da captura (~5 FPS para boa visualização no Serial Monitor do Wokwi)
    vTaskDelay(pdMS_TO_TICKS(200));
  }
}


// Tarefa 2 (Core 1): Simulação do Servidor (Empacotamento e Transmissão)
void networkStreamTask(void *pvParameters) {
  VirtualFrameBuffer rxFrame;
  unsigned long lastFrameTime = millis();

  while (true) {
    // Aguarda um novo frame chegar
    if (xQueueReceive(frameQueue, &rxFrame, portMAX_DELAY) == pdTRUE) {
      digitalWrite(PIN_LED, HIGH); // Acende o LED indicando início de envio de pacote

      // Cálculo de FPS da transmissão (RX)
      unsigned long now = millis();
      float fps = 1000.0 / (now - lastFrameTime);
      lastFrameTime = now;

      // Simulação de Cabeçalho HTTP / WebSocket
      Serial.print("(Simulação de Header HTTP / WebSocket)");
      Serial.println("\n==========================================");
      Serial.printf("[MOSKITTOSERVER] POST /api/v1/stream HTTP/1.1\n");
      Serial.printf("Host: moskitto.br.local | Content-Type: image/raw-gray\n");
      Serial.printf("Frame ID: #%lu | Payload Size: %u bytes | Framerate: %.1f FPS\n", 
                    rxFrame.frame_id, rxFrame.len, fps);
      Serial.println("------------------------------------------");

      // Renderiza o payload recebido em Arte ASCII para visualização ao vivo pelo Serial Monitor
      String frameRender = "";
      for (int y = 0; y < FRAME_HEIGHT; y++) {
        frameRender += "|";
        for (int x = 0; x < FRAME_WIDTH; x++) {
          uint8_t pixel = rxFrame.buf[y * FRAME_WIDTH + x];
          int charIdx = map(pixel, 0, 255, 0, 9);
          frameRender += ASCII_PALETTE[charIdx];
        }
        frameRender += "|\n";
      }
      Serial.print(frameRender);
      Serial.println("==========================================\n");

      // Simula latência de rede (25ms) e apaga o LED indicando recebimento concluído do payload
      vTaskDelay(pdMS_TO_TICKS(25));
      digitalWrite(PIN_LED, LOW);
    }
  }
}


void setup() {
  Serial.begin(115200);
  pinMode(PIN_POT, INPUT);
  pinMode(PIN_BTN, INPUT_PULLUP);
  pinMode(PIN_LED, OUTPUT);

  Serial.println("Inicializando a Transmissão...");
  delay(500);
  Serial.println("Conectando ao Wi-Fi (SSID_exemplo)...");
  delay(500);
  Serial.println("OK! IPv4 recebido: 0.0.0.0");

  // Queue com capacidade para 2 frames (Double Buffering)
  frameQueue = xQueueCreate(2, sizeof(VirtualFrameBuffer));

  // Inicia Tarefa de Captura no Core 0
  xTaskCreatePinnedToCore(
    cameraCaptureTask,
    "CamCapture",
    4096,
    NULL,
    2,
    NULL,
    0
  );

  // Inicia Tarefa de Rede no Core 1
  xTaskCreatePinnedToCore(
    networkStreamTask,
    "NetStream",
    4096,
    NULL,
    1,
    NULL,
    1
  );
}

void loop() {
  // Monitora o botão físico para pausar/retomar o streaming
  if (digitalRead(PIN_BTN) == LOW) {
    if ((millis() - lastDebounceTime) > 300) {
      isStreaming = !isStreaming;
      lastDebounceTime = millis();
      Serial.println(isStreaming ? "\n>>> STREAMING RETOMADO <<<" : "\n>>> STREAMING PAUSADO <<<");
    }
  }
  vTaskDelay(pdMS_TO_TICKS(50));
}