# 100Bocas development environment
FROM node:lts-bookworm

# Install Python 3.11 and build deps for asyncpg/psycopg2
RUN apt-get update && \
    apt-get install -y python3.11 python3.11-venv python3-pip \
    postgresql-client nginx gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default

# Configure environment
ENV PYTHONUNBUFFERED=1
ENV BOCAS_DB=postgresql://bocas:bocas_pass@db:5432/100bocas
ENV BOCAS_HOST=0.0.0.0
ENV BOCAS_PORT=8112

# Create workspace
WORKDIR /workspace
