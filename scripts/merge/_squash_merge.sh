#!/usr/bin/env bash
set -euo pipefail

BRANCH_NAME="${1:-}"
if [[ -z "${BRANCH_NAME}" ]]; then
  echo "Usage: $0 <branch_name>"
  exit 1
fi

echo "==> Squash-merging branch: ${BRANCH_NAME} into master"

# Ensure we're in a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "Error: not inside a git repository" >&2
  exit 1
}

git fetch origin --prune
git checkout master
git pull --ff-only origin master

REMOTE_REF="origin/${BRANCH_NAME}"
LOCAL_REF="${BRANCH_NAME}"

if git show-ref --verify --quiet "refs/remotes/${REMOTE_REF}"; then
  echo "Merging remote ${REMOTE_REF}"
  git merge --squash "${REMOTE_REF}" || true
elif git show-ref --verify --quiet "refs/heads/${LOCAL_REF}"; then
  echo "Merging local ${LOCAL_REF}"
  git merge --squash "${LOCAL_REF}" || true
else
  echo "Error: Branch not found locally or remotely: ${BRANCH_NAME}" >&2
  exit 1
fi

# Prevent secrets from being committed if they got staged during merge
git restore --staged backend/serviceAccount.json 2>/dev/null || true
git restore --staged backend/config.env 2>/dev/null || true
git checkout -- backend/serviceAccount.json 2>/dev/null || true
git checkout -- backend/config.env 2>/dev/null || true

# Stage all merge changes
git add -A

# If nothing staged, skip commit
if git diff --cached --quiet; then
  echo "No changes to commit for ${BRANCH_NAME}"
  exit 0
fi

git commit -m "merge(squash): ${BRANCH_NAME}"
git push origin master

echo "✅ Completed squash-merge for ${BRANCH_NAME}"


