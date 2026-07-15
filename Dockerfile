FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application code
COPY backend/ backend/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Run the application
WORKDIR /app/backend
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:10000", "wsgi:app"]
