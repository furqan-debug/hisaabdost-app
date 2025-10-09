# Contributing to HisaabDost

Thank you for considering contributing to HisaabDost! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)

---

## Code of Conduct

### Our Pledge

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Any unprofessional conduct

---

## Getting Started

### Prerequisites

1. Read the [README.md](./README.md) and [SETUP.md](./SETUP.md)
2. Set up your development environment
3. Familiarize yourself with the tech stack:
   - React 18 + TypeScript
   - Vite 5
   - Supabase
   - Tailwind CSS + shadcn/ui
   - Capacitor 7

### Fork and Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/hisaabdost.git
cd hisaabdost

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/hisaabdost.git

# Install dependencies
npm install
```

---

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow coding standards (see below)
- Keep changes focused and atomic
- Test your changes locally

### 3. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add expense filtering by date"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 4. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type - use `unknown` if necessary
- Use strict mode (`"strict": true` in tsconfig.json)

**Example:**
```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserName(user: User): string {
  return user.name;
}

// ❌ Bad
function getUserName(user: any) {
  return user.name;
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Extract reusable logic into custom hooks

**Example:**
```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {label}
    </button>
  );
};

// ❌ Bad
const Button = (props: any) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

### File Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (shadcn)
│   ├── expense/         # Feature-specific components
│   └── layout/          # Layout components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── services/            # API and business logic
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

### Naming Conventions

- **Components**: PascalCase (`ExpenseCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useExpenses.ts`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`ExpenseData`)

### Styling

- Use Tailwind CSS utility classes
- Follow the design system (check `tailwind.config.ts`)
- Use semantic color tokens from `index.css`
- Avoid inline styles

**Example:**
```typescript
// ✅ Good - Using Tailwind utilities
<div className="flex items-center gap-4 p-4 bg-background rounded-lg">
  <Button className="bg-primary text-primary-foreground">Submit</Button>
</div>

// ❌ Bad - Inline styles
<div style={{ display: 'flex', padding: '16px', backgroundColor: '#fff' }}>
  <button style={{ background: 'blue', color: 'white' }}>Submit</button>
</div>
```

### Code Quality

- **No console.logs** in production code
- **Remove commented code** before committing
- **Handle errors properly** - use try/catch and error boundaries
- **Add JSDoc comments** for complex functions
- **Use meaningful variable names**

**Example:**
```typescript
// ✅ Good
/**
 * Calculates the total expense amount for a given period
 * @param expenses - Array of expense objects
 * @param startDate - Start date of the period
 * @param endDate - End date of the period
 * @returns Total amount as a number
 */
function calculateTotalExpenses(
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): number {
  return expenses
    .filter(e => e.date >= startDate && e.date <= endDate)
    .reduce((sum, e) => sum + e.amount, 0);
}

// ❌ Bad
function calc(arr: any[], d1: any, d2: any) {
  return arr.filter(x => x.d >= d1 && x.d <= d2).reduce((a, b) => a + b.amt, 0);
}
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples

```bash
# Feature
git commit -m "feat(expenses): add date range filter"

# Bug fix
git commit -m "fix(auth): resolve login redirect issue"

# Documentation
git commit -m "docs: update setup instructions in README"

# Refactor
git commit -m "refactor(api): simplify expense fetching logic"

# Multiple lines
git commit -m "feat(budget): add monthly budget tracking

- Add budget creation form
- Implement budget vs actual comparison
- Add visual progress indicators

Closes #123"
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest main:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run tests and linting**:
   ```bash
   npm run lint
   npm run build
   ```

3. **Test your changes**:
   - Test locally in browser
   - Test on mobile (if mobile-related changes)
   - Verify no console errors

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested locally
- [ ] Tested on mobile
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass (linting, build)
2. **Code review** by at least one maintainer
3. **Address feedback** - make requested changes
4. **Squash commits** if requested
5. **Merge** when approved

---

## Testing

### Manual Testing

Before submitting a PR:

1. **Functionality**: Test all affected features
2. **UI/UX**: Check responsive design, dark mode
3. **Edge cases**: Test with empty states, errors
4. **Performance**: Check for memory leaks, slow renders
5. **Browser compatibility**: Test on Chrome, Firefox, Safari

### Test Checklist

- [ ] Feature works as expected
- [ ] No console errors or warnings
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode works correctly
- [ ] Error states handled properly
- [ ] Loading states work
- [ ] Forms validate correctly
- [ ] Data persists in Supabase

---

## Questions?

- **General questions**: Open a GitHub Discussion
- **Bug reports**: Open a GitHub Issue
- **Feature requests**: Open a GitHub Issue with "Feature Request" label
- **Security issues**: Email the maintainers directly

---

## Recognition

Contributors will be:
- Listed in the project's contributors section
- Mentioned in release notes for significant contributions
- Invited to maintainer team for consistent, high-quality contributions

Thank you for contributing to HisaabDost! 🎉