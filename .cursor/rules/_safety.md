---
description: Prevent common mistakes across all projects
---

# Safety Guidelines

## Deployment Safety
- Check for hardcoded secrets or API keys
- Verify environment variables use correct prefixes (NEXT_PUBLIC_ for client)
- Ensure build command will work in production
- Remove console.log statements before committing

## Breaking Change Prevention
- Never modify function signatures without checking all usages
- Don't rename exports without updating imports
- Preserve existing API contracts
- Keep backward compatibility when possible

## Code Quality Gates
- All new code must have TypeScript types
- Async functions need proper error handling
- API routes must return appropriate status codes
- Components should handle loading and error states

