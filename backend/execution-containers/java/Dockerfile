FROM eclipse-temurin:17-jdk-jammy

# Create non-root user
RUN groupadd -g 1001 runner && \
    useradd -u 1001 -g runner -s /bin/bash runner

# Set working directory
WORKDIR /code

# Ensure runner can access the directory
RUN chown -R runner:runner /code

# Set user
USER runner

# Default command - compile and run
CMD ["sh", "-c", "javac /code/Solution.java && java -cp /code Solution"]
