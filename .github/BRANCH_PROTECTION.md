# Branch protection for `main`

Use this configuration to require CI before merge.

## Recommended rules

- Require a pull request before merging
- Require approvals: `1`
- Require review from Code Owners
- Dismiss stale approvals when new commits are pushed
- Require status checks before merging
- Required status check: `quality` (from `.github/workflows/ci.yml`)
- Require branches to be up to date before merging
- Restrict force pushes and deletions

## Setup in GitHub UI

1. Open your repository on GitHub.
2. Go to **Settings** → **Branches**.
3. Under **Branch protection rules**, click **Add rule**.
4. Set **Branch name pattern** to `main`.
5. Enable the rules listed above.
6. Under required checks, select `quality`.
7. Save.

## Optional API method (without GitHub CLI)

If you have a personal access token with repo admin rights:

```bash
curl -L \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/Theodorphus/Konstbyte/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "checks": [{ "context": "quality" }]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_conversation_resolution": true,
    "lock_branch": false,
    "allow_fork_syncing": true
  }'
```