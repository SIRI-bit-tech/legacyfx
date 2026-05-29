#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
# We use $PORT which is automatically set by Render
echo "Starting FastAPI application on port $PORT..."
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
