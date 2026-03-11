FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install alembic

# Copy project files
COPY . .

# Run migrations on startup, then start the application
CMD ["sh", "-c", "alembic upgrade heads && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]