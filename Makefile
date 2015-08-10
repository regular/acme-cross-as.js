BIN:=$(shell npm bin)

all: lib/_acme.js

build/acme.bc:
	./make-bitcode-for-javascript.sh acme091

lib/_acme.js: build/acme.bc
	EMSCRIPTEN=~/dev/emscripten ~/dev/emscripten/emcc \
	build/acme.bc -o lib/_acme.js \
	-s EXPORT_NAME=\"exports\" -s MODULARIZE=1 \
	-s ASSERTIONS=0 \
	-s DEMANGLE_SUPPORT=0 \
	-s NO_FILESYSTEM=0 \
	-s NO_BROWSER=1 \
	-s EXPORTED_RUNTIME_METHODS=[\'intArrayFromString\',\'FS_open\',\'FS_createDataFile\',\'FS_unlink\',\'FS_makedev\',\'FS_getMode\',\'FS_getPath\',\'FS_registerDevice\',\'FS_mkdev\',\'FS_ErrnoError\',\'FS_createDevice\'] \
	-s NODE_STDOUT_FLUSH_WORKAROUND=0 \
	-s NO_DYNAMIC_EXECUTION=1 \
	-s USE_SDL=0 \
	-s USE_SDL_IMAGE=0 \
	-v \
	-O2 \
	--memory-init-file 0 \
	--llvm-lto 3 \
	-s AGGRESSIVE_VARIABLE_ELIMINATION=1
	echo "module.exports = exports;" >> lib/_acme.js

clean:
	rm lib/_acme.js*

.PHONY: test
test: lib/_acme.js
	#cp lib/_acme.js.mem test
	cd test && cat test.js|$(BIN)/brfs|$(BIN)/browserify - --noparse=$(shell pwd)/lib/_acme.js | $(BIN)/testling -u
