# Rule: Automatic GitHub Push After Code Updates

Whenever any code modifications, additions, fixes, or redesigns are made to the codebase:
1. Automatically stage the modified and newly created files: `git add <files>`
2. Create a concise, meaningful commit message describing the changes: `git commit -m "<message>"`
3. Automatically push the commit to the GitHub repository: `git push origin main`
4. Report the commit hash and pushed status to the user.
