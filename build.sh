#!/bin/bash
PATH=$(pwd)/node_modules/.bin:$PATH
mkdir -p client/bin
duo --stdout ./client/src/main.js > ./client/bin/main.js