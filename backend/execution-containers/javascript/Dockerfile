FROM node:20-alpine

# Create non-root user (use existing node user or create runner)
RUN addgroup -g 1001 runner 2>/dev/null || true && \
    adduser -u 1001 -G runner -s /bin/sh -D runner 2>/dev/null || true

# Set working directory
WORKDIR /code

# Ensure runner can access the directory
RUN chown -R 1001:1001 /code 2>/dev/null || chown -R node:node /code

# Set user (use runner if exists, otherwise node)
USER runner

# Default command
CMD ["node", "/code/solution.js"]
