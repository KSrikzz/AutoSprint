FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install alembic

# Copy project files
COPY . .

# Setting up startup script for migrations
RUN chmod +x startup.sh

# Run the application using the startup script
CMD ["./startup.sh"]