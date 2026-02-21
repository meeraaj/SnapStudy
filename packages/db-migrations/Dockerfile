FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir alembic sqlmodel psycopg2-binary python-dotenv

COPY alembic.ini .
COPY alembic/ ./alembic/

CMD ["alembic", "upgrade", "head"]
