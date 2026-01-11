# saas-cli Maintenance Guide

This document outlines how to keep saas-cli updated with minimal effort.

---

## 1. Dependabot (Automatic)

**Already configured** in `.github/dependabot.yml`.

**What it does:**
- Checks npm dependencies weekly
- Checks GitHub Actions weekly
- Creates PRs against `develop` branch
- Groups dependencies to reduce PR noise

**Your action:** Review and merge Dependabot PRs when they appear. CodeRabbit will auto-review them.

---

## 2. Template Updates (Manual, 2-3x per year)

The code generation templates (`saas gen *`) produce Dart code using these packages:

| Package | Watch For | Template Files |
|---------|-----------|----------------|
| Riverpod | Major API changes | `src/services/template.ts` |
| Drift | Schema/query syntax changes | `src/services/template.ts` |
| Freezed | Annotation changes | `src/services/template.ts` |
| GoRouter | Route builder changes | `src/services/template.ts` |
| Supabase Flutter | Client API changes | `src/services/template.ts` |

**When to update:**
- Major version releases (2.x → 3.x)
- Deprecation warnings in generated code
- User reports of broken output

**How to update:**
1. Check the package's migration guide
2. Update templates in `src/services/template.ts`
3. Test with `saas gen <type> test_output`
4. Update tests if output format changed

---

## 3. GitHub Release Watch (Notifications)

Watch these repos to get notified of new releases:

### How to Watch
1. Go to the repo on GitHub
2. Click **Watch** → **Custom** → check **Releases**
3. You'll get email/notifications for new releases

### Repos to Watch

| Repo | Why |
|------|-----|
| [riverpod](https://github.com/rrousselGit/riverpod) | State management templates |
| [drift](https://github.com/simolus3/drift) | Database templates |
| [freezed](https://github.com/rrousselGit/freezed) | Model templates |
| [go_router](https://github.com/flutter/packages/tree/main/packages/go_router) | Router templates |
| [supabase-flutter](https://github.com/supabase/supabase-flutter) | Supabase integration |
| [supabase-cli](https://github.com/supabase/cli) | CLI wrapper compatibility |

---

## 4. Quick Reference

### Weekly (Automatic)
- [ ] Dependabot PRs appear → review & merge

### Monthly (5 min check)
- [ ] Skim watched repo releases for breaking changes
- [ ] Check GitHub Issues for user-reported template bugs

### On Major Release (when notified)
- [ ] Read migration guide
- [ ] Update affected templates
- [ ] Test generated output
- [ ] Bump version, update CHANGELOG
- [ ] Create release

---

## 5. Current Dependabot Config

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    target-branch: "develop"
    schedule:
      interval: "weekly"
    groups:
      development-dependencies:
        dependency-type: "development"
      production-dependencies:
        dependency-type: "production"

  - package-ecosystem: "github-actions"
    directory: "/"
    target-branch: "develop"
    schedule:
      interval: "weekly"
```

---

## 6. Testing After Updates

```bash
# Run full test suite
pnpm test

# Test code generation manually
pnpm build
node dist/index.js gen riverpod test_provider
node dist/index.js gen drift test_table
node dist/index.js gen freezed TestModel

# Clean up test files
rm -f test_*.dart
```

---

## 7. Version Bump Checklist

When releasing a new version:

1. Update `package.json` version
2. Update `CHANGELOG.md`
3. Commit to develop
4. Create PR to main
5. Merge and tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
6. Push tag: `git push origin vX.Y.Z`
7. GitHub Actions auto-publishes to npm
