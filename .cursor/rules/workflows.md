---
description: Linear and Vercel workflow patterns
---

# Workflow Patterns

## Linear Integration Patterns

### Issue References
- Always use [LIN-XXX] in commits and PRs
- Update Linear manually or via comments
- Move issues through workflow states

### When Asked About Work
- Check Linear for assigned issues
- Prioritize by: urgent > high > normal > low
- Consider dependencies between issues

## Vercel Deployment Patterns

### Pre-deployment Checks
- Get latest deployment status
- Verify build is passing
- Compare env vars with local

### Deployment Flow
- Feature branch → Preview deployment
- main branch → Production deployment
- Always get deployment URL after deploy
- Add deployment URL to Linear issue

## Error Recovery Patterns

When Vercel build fails:
1. Get build logs from Vercel
2. Parse error and identify cause
3. Fix locally and test build
4. Push fix and monitor

When production has issues:
1. Get function logs from Vercel
2. Pull production environment variables
3. Reproduce locally with production config
4. Create hotfix branch
5. Deploy to preview first, then production

