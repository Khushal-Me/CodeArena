#!/bin/sh
set -e

# Compile and run the C++ solution
g++ -o /code/solution /code/solution.cpp -O2
exec /code/solution
