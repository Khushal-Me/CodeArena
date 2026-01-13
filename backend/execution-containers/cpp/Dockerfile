FROM gcc:11

# Create non-root user
RUN groupadd -g 1000 runner && \
    useradd -u 1000 -g runner -s /bin/sh runner

# Set working directory
WORKDIR /code

# Set user
USER runner

# Default command - compile and run
CMD ["sh", "-c", "g++ -o /code/solution /code/solution.cpp -O2 && /code/solution"]
