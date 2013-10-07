#!/bin/bash

# This must currently run from the root of the repo
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

supervisor -- src/server.js \
    --path=/usr/local/google/home/blois/src/dart/dart:/dart/ \
    --path=../../:/github/ \
    --path=../../../../dart/:/scratch/ \
