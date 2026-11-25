#!/usr/bin/env bash
set -euo pipefail

tag=$1
title=$2
shift 2
flags=()
case "$tag" in
  dev-v*) flags=(--prerelease --latest=false) ;;
  v*) flags=(--latest) ;;
  *) exit 1 ;;
esac

notes="$RUNNER_TEMP/release-notes.md"
{
  printf 'Built from [%s](%s/%s/commit/%s).\n\n' "$GITHUB_SHA" "$GITHUB_SERVER_URL" "$GITHUB_REPOSITORY" "$GITHUB_SHA"
  printf '[Build run](%s/%s/actions/runs/%s), attempt %s.\n\n' "$GITHUB_SERVER_URL" "$GITHUB_REPOSITORY" "$GITHUB_RUN_ID" "$GITHUB_RUN_ATTEMPT"
  printf 'SHA-256\n\n```text\n'
  for asset in "$@"; do
    (cd "$(dirname "$asset")" && shasum -a 256 "$(basename "$asset")")
  done
  printf '```\n'
} > "$notes"

# Resolve or create the exact tag before uploading assets. Never move a tag.
if target=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/tags/$tag" --jq '.object.sha' 2>/dev/null); then
  [[ "$target" == "$GITHUB_SHA" ]] || { echo "Release tag already targets a different commit."; exit 1; }
else
  gh api "repos/$GITHUB_REPOSITORY/git/refs" -f "ref=refs/tags/$tag" -f "sha=$GITHUB_SHA" >/dev/null
fi
# A fresh ref can take time to appear in the CLI's separate tag lookup.
# The ref above is pinned to the build commit. Use that same target for publication.
gh release create "$tag" "$@" --repo "$GITHUB_REPOSITORY" --target "$GITHUB_SHA" \
  --title "$title" --notes-file "$notes" "${flags[@]}"
