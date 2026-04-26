FROM python:3.11-slim

WORKDIR /app

# System dependencies for OCR + image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-hin \
    tesseract-ocr-eng \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
# Copy from backend directory
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
# Copy everything from backend directory into /app
COPY backend/ .

EXPOSE 8000

# Set environment variable for python path
ENV PYTHONPATH=/app

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
