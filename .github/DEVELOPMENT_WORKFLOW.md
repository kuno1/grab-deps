# Development Workflow Guidelines

## 🚨 Important: Pull Request Based Development

**This repository requires ALL changes to be made through Pull Requests. Direct commits to master branch should be avoided.**

## ✅ Proper Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
```

### 2. Make Changes and Test
```bash
# Make your changes
npm test                    # Run all tests
npm run lint               # Check for lint errors
npm run format            # Auto-fix formatting issues
```

### 3. Commit Changes
```bash
git add .
git commit --no-gpg-sign -m "descriptive commit message

• Detailed explanation of changes
• Include fixes or features implemented
• Reference issue numbers if applicable

Co-Authored-by: CLINE"
```

### 4. Push Branch and Create PR
```bash
git push origin feature/your-feature-name
# Then create Pull Request through GitHub UI
```

### 5. After PR Approval and Merge
```bash
git checkout master
git pull origin master
git branch -d feature/your-feature-name  # Clean up local branch
```

## ❌ What NOT to Do

- ~~Direct commits to master branch~~
- ~~Direct tag pushes without PR review~~
- ~~Bypassing CI/CD checks~~

## 🏷️ Release Process

### For Maintainers Only:
1. Ensure all changes are merged via PRs
2. Update version in `package.json`
3. Create and push tag:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

## 🧪 Quality Standards

All PRs must:
- ✅ Pass all 85 tests (100% success rate)
- ✅ Pass ESLint validation
- ✅ Include proper commit messages
- ✅ Reference related issues

## 🤖 AI Developer Notes

**For AI assistants working on this repository:**
- Always create feature/bugfix branches
- Never push directly to master
- Always run `npm run lint` before committing
- Use `npm run format` to fix formatting issues
- Create PRs for all changes, even small fixes
- Remember: **PR-first development is mandatory**

---

*This workflow ensures code quality, proper review process, and maintainable development history.*
