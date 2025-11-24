# Debug Production

Investigate production issues using Vercel.

## Debugging Steps

1. **Get Recent Logs**
   - Get deployment build logs
   - Get function logs for recent errors

2. **Check Configuration**
   - Get environment variables from Vercel
   - Compare with expected values

3. **Analyze Errors**
   - Parse error patterns
   - Identify root cause
   - Check if error exists in staging

4. **Local Reproduction**
   - Pull production env to .env.local
   - Test with production configuration

5. **Fix and Deploy**
   - Create hotfix branch
   - Apply minimal fix
   - Deploy to preview first
   - Verify fix works
   - Deploy to production

Guide me through debugging the issue.

