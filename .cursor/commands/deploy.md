# Smart Deploy

Intelligent deployment workflow using Vercel.

## Deployment Flow

1. **Pre-flight Checks**
   - Run build locally
   - Check TypeScript errors
   - Verify env vars match production

2. **Check Vercel Status**
   - Use: Check latest deployment status
   - Use: Get project environment variables
   - Compare with local .env

3. **Deploy**
   - Deploy to appropriate environment
   - Get deployment URL
   - Monitor initial logs

4. **Update Linear**
   - Add deployment URL as comment
   - Update issue status if needed

Execute this complete flow step by step.

