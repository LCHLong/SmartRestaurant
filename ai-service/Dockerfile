FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package installation
RUN pip install --no-cache-dir uv

# Copy requirements and install (CPU-only PyTorch to prevent heavy 4GB CUDA downloads)
COPY requirements.txt .
RUN uv pip install --system --no-cache torch --index-url https://download.pytorch.org/whl/cpu && \
    uv pip install --system --no-cache --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Copy source code
COPY . .

EXPOSE 8000 80

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --reload"]
