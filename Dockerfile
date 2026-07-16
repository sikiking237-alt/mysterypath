FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application code
COPY backend/ backend/

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the application
WORKDIR /app/backend
CMD ["python", "run.py"]
