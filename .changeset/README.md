# Changesets

This directory contains changesets for the Atriz monorepo. Changesets are used to manage versioning and changelogs.

## Creating a Changeset

When you make changes that should trigger a version bump, run:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the version bump type (major, minor, patch)
3. Write a summary of the changes

### Version Bump Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Major (1.0.0 → 2.0.0)**: Breaking changes
  - API changes that break existing code
  - Removing features
  - Major architectural changes

- **Minor (1.0.0 → 1.1.0)**: New features (backwards compatible)
  - New functionality
  - New APIs
  - Enhancements

- **Patch (1.0.0 → 1.0.1)**: Bug fixes and small updates
  - Bug fixes
  - Documentation updates
  - Internal refactoring

### Which Packages to Version

**Framework Packages** (always version these when changed):
- `@atriz/core` - Core framework functionality
- `@atriz/auth` - Authentication module

**Application Packages** (ignored by changesets):
- `@atriz/website` - Example app (private)
- `@atriz/mextrack-api` - Mextrack API (private)
- `@atriz/pshop-api` - PShop API (private)

## Workflow

### 1. Create a changeset
```bash
# After making changes, create a changeset
pnpm changeset

# This creates a file in .changeset/ directory
```

### 2. Commit the changeset
```bash
git add .changeset/
git commit -m "feat(core): add new validation type"
git push
```

### 3. Automatic versioning on merge
When your PR is merged to `main`, the GitHub Actions workflow will:
- Automatically create a "Version Packages" PR
- This PR will update versions and CHANGELOGs
- When merged, packages will be published (if NPM_TOKEN is configured)

## Examples

### Example 1: Adding a new feature to @atriz/core
```bash
$ pnpm changeset

🦋  Which packages would you like to include? 
✔ @atriz/core

🦋  Which packages should have a major bump? 
(Press <space> to select, <a> to toggle all, <i> to invert selection)
❯ ◯ @atriz/core

🦋  Which packages should have a minor bump? 
(Press <space> to select, <a> to toggle all, <i> to invert selection)
❯ ◉ @atriz/core  # Select this for new features

🦋  Please enter a summary for this change (this will be in the changelogs):
Summary › Add support for file upload validation

Changeset created! 🎉
```

### Example 2: Bug fix in @atriz/auth
```bash
$ pnpm changeset

🦋  Which packages would you like to include? 
✔ @atriz/auth

🦋  Which packages should have a patch bump?
❯ ◉ @atriz/auth  # Select this for bug fixes

🦋  Please enter a summary for this change:
Summary › Fix JWT token expiration validation

Changeset created! 🎉
```

### Example 3: Breaking change in @atriz/core
```bash
$ pnpm changeset

🦋  Which packages would you like to include? 
✔ @atriz/core

🦋  Which packages should have a major bump?
❯ ◉ @atriz/core  # Select this for breaking changes

🦋  Please enter a summary for this change:
Summary › BREAKING: Change BaseController constructor signature

Changeset created! 🎉
```

## Commands

```bash
# Create a new changeset
pnpm changeset

# Add a changeset with empty message (opens editor)
pnpm changeset add

# Check changeset status
pnpm changeset status

# Version packages (usually done by CI)
pnpm version-packages

# Publish packages (usually done by CI)
pnpm release
```

## Best Practices

1. **One changeset per logical change**: If you fix multiple bugs, create separate changesets
2. **Clear summaries**: Write clear, user-facing descriptions
3. **Always create changesets**: Don't merge PRs without changesets for framework packages
4. **Review the Version PR**: Check that versions and changelogs look correct before merging

## Troubleshooting

### I forgot to add a changeset to my PR
No problem! You can add one before merging:
```bash
pnpm changeset
git add .changeset/
git commit -m "chore: add changeset"
git push
```

### I need to modify a changeset
Changesets are markdown files in `.changeset/`. You can edit them directly:
```bash
# Find the changeset file
ls .changeset/

# Edit it
code .changeset/some-changeset-name.md
```

### The Version PR has conflicts
1. Merge `main` into the version PR branch
2. Resolve conflicts in `package.json` and `CHANGELOG.md` files
3. Commit and push

## More Information

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
