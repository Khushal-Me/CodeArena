FROM python:3.11-alpine

# Create non-root user
RUN addgroup -g 1000 runner && \
    adduser -u 1000 -G runner -s /bin/sh -D runner

# Set working directory
WORKDIR /code

# Set user
USER runner

# Default command
CMD ["python", "/code/solution.py"]
