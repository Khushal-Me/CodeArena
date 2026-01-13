#!/bin/sh
set -e

# Compile and run the Java solution
javac /code/Solution.java
exec java -cp /code Solution
