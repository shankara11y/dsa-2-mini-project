#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " PODIUM RUSH — COMPILING & BUILDING FOR PRODUCTION"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Compile C++ to WebAssembly via Emscripten
echo "[1/4] Compiling C++17 to WebAssembly (em++ -O3 with embind)..."
if command -v em++ >/dev/null 2>&1; then
    em++ -O3 -std=c++17 --bind \
        -s MODULARIZE=1 \
        -s EXPORT_ES6=1 \
        -s ALLOW_MEMORY_GROWTH=1 \
        src/cpp/bindings.cpp \
        -o web/core.js
    echo "  -> WebAssembly core generated: web/core.js & web/core.wasm"
else
    echo "  -> Warning: em++ not found in PATH. Using pre-existing web/core.js & web/core.wasm."
fi

# 2. Compile and run native tests to verify DSA invariants
echo "[2/4] Compiling and running native C++ tests..."
if command -v clang++ >/dev/null 2>&1; then
    clang++ -std=c++17 -O3 src/cpp/tests.cpp -o test_runner
    ./test_runner
    rm -f test_runner
elif command -v g++ >/dev/null 2>&1; then
    g++ -std=c++17 -O3 src/cpp/tests.cpp -o test_runner
    ./test_runner
    rm -f test_runner
fi

# 3. Create dist directory and copy files
echo "[3/4] Packaging /dist folder..."
rm -rf dist
mkdir -p dist/modules

cp web/index.html dist/
cp web/style.css dist/
cp web/app.js dist/
cp web/worker.js dist/
cp web/core.js dist/
cp web/core.wasm dist/
cp web/sw.js dist/
cp web/manifest.json dist/
cp web/modules/*.js dist/modules/

# 4. Print build summary and sizes
echo "[4/4] Verifying production bundle in /dist:"
ls -lh dist/
echo ""
echo "=========================================================="
echo " BUILD SUCCESSFUL! Directly deployable in /dist"
echo " To run locally: python3 -m http.server 8000 --directory dist"
echo "=========================================================="

