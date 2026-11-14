# Site de resultados da IA (Moskitto Radar). Contexto de build: a pasta ia/ (veja ../compose.yaml).
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY web/requirements.txt web/requirements.txt
RUN pip install -r web/requirements.txt

COPY data/*.json data/lugares.csv data/roubos_agregados.csv data/roubos_por_hora.csv data/
COPY web/ web/

RUN useradd --system --no-create-home moskitto
USER moskitto

ENV PORT=5000
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://localhost:{os.environ[\"PORT\"]}/health')" || exit 1

CMD exec gunicorn --bind "0.0.0.0:${PORT}" --workers 2 --access-logfile - web.app:app
