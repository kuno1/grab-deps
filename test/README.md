# Test Directory Structure

This directory contains test files and resources for the grab-deps library.

## Directory Organization

### `/test/assets/`
Contains source files used to test the build functionality.
- **Purpose**: Source files for testing `compileDirectory` function
- **Content**: JavaScript files with various patterns (ES6 modules, CommonJS, etc.)
- **package.json**: Mock configuration file for testing

### `/test/dist/`
Contains the output of build operations from the assets directory.
- **Purpose**: Destination directory for compiled JavaScript files
- **Content**: Compiled versions of files from `/test/assets/`

### `/test/src/`
Contains files for testing dependency parsing and `wp-dependencies.json` generation.
- **Purpose**: Source files for testing `scanDir` and `dumpSetting` functions
- **Content**: Various JavaScript and CSS files with different dependency patterns

### Test Files (in `/test/`)
Mocha test files that test the library's functionality:
- `deps-test.js` - Tests for dependency parsing
- `dir-test.js` - Tests for directory scanning
- `dump-test.js` - Tests for dump settings functionality
- `es-module-test.js` - Tests for ES module handling
- `folder-handle-test.js` - Tests for folder-based handle generation
- `import-detection-test.js` - Tests for import detection feature
- `meta-test.js` - Tests for metadata parsing
- `wpscripts-test.js` - Tests for wp-scripts integration
