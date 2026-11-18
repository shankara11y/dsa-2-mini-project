CXX ?= em++
NATIVE_CXX ?= clang++
EMFLAGS = -O3 -std=c++17 --bind -s MODULARIZE=1 -s EXPORT_ES6=1 -s ALLOW_MEMORY_GROWTH=1

.PHONY: all wasm test build clean serve

all: build

wasm:
	$(CXX) $(EMFLAGS) src/cpp/bindings.cpp -o web/core.js

test:
	$(NATIVE_CXX) -std=c++17 -O3 src/cpp/tests.cpp -o test_runner
	./test_runner
	rm -f test_runner

build: wasm test
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
	@echo "Build complete. Distribution files located in /dist."

serve: build
	python3 -m http.server 8000 --directory dist

clean:
	rm -rf dist test_runner web/core.js web/core.wasm run_tests

