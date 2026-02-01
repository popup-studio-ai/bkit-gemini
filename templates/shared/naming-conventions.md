# Naming Conventions

> Shared naming conventions for Skills and Agents
>
> Usage: Add to frontmatter imports in SKILL.md or Agent.md
> ```yaml
> imports:
>   - ${PLUGIN_ROOT}/templates/shared/naming-conventions.md
> ```

## Code Naming

| Category | Convention | Example |
|----------|------------|---------|
| Components | PascalCase | `UserProfile`, `LoginForm` |
| Functions | camelCase | `getUserById`, `validateInput` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Variables | camelCase | `userName`, `isLoading` |
| Files | kebab-case | `user-profile.tsx`, `api-client.js` |
| CSS Classes | kebab-case | `user-card`, `nav-menu` |
| Database Tables | snake_case | `user_profiles`, `order_items` |

## File Structure Naming

```
src/
├── components/          # PascalCase
│   └── UserCard.tsx
├── hooks/               # camelCase with use- prefix
│   └── useAuth.ts
├── utils/               # camelCase
│   └── formatDate.ts
├── types/               # PascalCase
│   └── User.ts
└── api/                 # kebab-case
    └── user-api.ts
```

## Environment Variables

| Prefix | Purpose | Example |
|--------|---------|---------|
| NEXT_PUBLIC_ | Client-side (Next.js) | NEXT_PUBLIC_API_URL |
| DB_ | Database | DB_HOST, DB_PORT |
| API_ | External APIs | API_KEY, API_SECRET |
| AUTH_ | Authentication | AUTH_SECRET, AUTH_PROVIDER |
| SMTP_ | Email | SMTP_HOST, SMTP_PORT |
| STORAGE_ | File storage | STORAGE_BUCKET |

## Boolean Naming

```javascript
// Preferred prefixes for booleans
is   - isActive, isLoading, isValid
has  - hasPermission, hasError
can  - canEdit, canDelete
should - shouldRefresh, shouldValidate
```

## Event Handler Naming

```javascript
// Prefix with 'handle' or 'on'
handleClick    // internal handler
onClick        // prop passed to component
handleSubmit   // form submission
onSuccess      // callback prop
```
