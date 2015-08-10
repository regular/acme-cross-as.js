if [ "$#" -ne 1 ]; then
    echo "Illegal number of parameters"
    exit 1
fi
# Override by setting EMSCRIPTEN environment variable
EMSCRIPTEN_ROOT=$(python -c 'import os; import imp; print imp.load_source("", os.path.expanduser("~/.emscripten")).EMSCRIPTEN_ROOT')
SCRIPTDIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
SOURCEDIR=$( cd "$1" && pwd )
echo "Running from $SCRIPTDIR"
echo "Using emscripten in $EMSCRIPTEN_ROOT"
if [ -z "$SOURCEDIR" ]; then
    echo "Specify a path to a source tree"
    exit 1
fi
echo "source is in $SOURCEDIR"
echo "Building Bitcode ..."
#$EMSCRIPTEN_ROOT/emconfigure ../configure $CONFIG_ARGS --with-extra-options=-Wno-warn-absolute-paths || exit 2
make -C $SOURCEDIR/src clean
$EMSCRIPTEN_ROOT/emmake make -C $SOURCEDIR/src || exit 1

echo "Copying tools to bitcode-for-js"
rm -rf $SCRIPTDIR/build
mkdir -p $SCRIPTDIR/build &&
cp $SOURCEDIR/src/acme build/acme.bc

