# Test Configuration

## Test Scripts Overview

This project provides multiple test configurations to optimize development workflow:

### Available Test Scripts

```bash
# Fast tests (recommended for development)
npm test                    # Default: Fast tests without file-system-watch
npm run test:fast          # Explicit fast tests (81 tests, ~15 seconds)

# Full tests (for comprehensive validation)
npm run test:full          # All tests including file-system-watch (85 tests, ~2 minutes)
npm run test:ci            # CI/CD full test suite

# Development utilities
npm run test:watch         # Fast tests with file watching for development
```

## Test Performance Comparison

| Test Suite | Test Count | Duration | Use Case |
|------------|------------|----------|----------|
| `test:fast` | 81 tests | ~15 seconds | Daily development |
| `test:full` | 85 tests | ~2 minutes | Pre-commit validation |
| `test:ci` | 85 tests | ~2 minutes | CI/CD pipeline |

## File System Watch Tests

The file-system-watch-test.js contains 4 tests that:
- Test real file system operations with extended timeout (60s)
- Validate compilation compatibility with file watchers
- Ensure no temporary files remain after compilation
- Test rapid successive compilations

**Why excluded from default tests:**
- Long execution time (adds ~1.5 minutes)
- File system intensive operations
- Primarily needed for integration testing

## Recommendations

### For Development
```bash
npm test              # Quick feedback during development
npm run test:watch    # Continuous testing while coding
```

### Before Commits
```bash
npm run test:full     # Comprehensive validation
npm run lint          # Code quality check
```

### CI/CD Pipeline
```bash
npm run test:ci       # Full test suite
npm run lint          # Linting validation
```

## Environment Variables

- `CI=true`: Automatically detected by GitHub Actions
- `GRAB_DEPS_DEBUG=1`: Enable debug logging for troubleshooting

## Test Structure

- `test/deps-test.js` - Basic dependency extraction
- `test/es-module-test.js` - ES module export/import handling
- `test/file-system-watch-test.js` - File system compatibility (slow)
- `test/wpscripts-test.js` - WordPress scripts compilation
- `test/namespace-test.js` - Namespace handling
- `test/pascal-case-test.js` - PascalCase component naming
- And more...

All tests maintain 100% pass rate across all configurations.
