#!/usr/bin/env bash
# Run `test-openai-two-stage-poster.js` for a Firestore event (repo root as cwd).
#
# Usage (from repo root):
#   bash functions/tests/run-event-integration-tests.sh
#   EVENT_ID=otherId bash functions/tests/run-event-integration-tests.sh
#
# Resolves a signed honoree reference URL (face crop or honoree_photo) when the event has no
# public honoreeFaceCropUrl, and passes it as --face-crop-url.
#
# Vertex skeleton pair (separate): node functions/tests/test-vertex-imagen-skeleton-pair.js --event-id=…

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVENT_ID="${EVENT_ID:-nLXzXItL2caR6FJ5tReP}"

cd "$ROOT"

echo "========================================"
echo "OpenAI two-stage poster test"
echo "Event: ${EVENT_ID}"
echo "Repo:  ${ROOT}"
echo "========================================"

echo ""
echo "==> test-openai-two-stage-poster.js (Firestore prompt + honoree reference URL)"
FACE_URL="$(
  cd "${ROOT}/functions" && EID="${EVENT_ID}" NODE_NO_WARNINGS=1 node -e "
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env', override: true });
const path = require('path');
const eid = process.env.EID || '';
const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'piggybank-a0011';
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '..', 'firebaseserviceAccountKey.json');
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
    storageBucket: 'piggybank-a0011.firebasestorage.app',
  });
}
const storageRepository = require('./repositories/storageRepository');
(async () => {
  const u = await storageRepository.getHonoreeReferenceSignedReadUrl(eid);
  if (u) process.stdout.write(u);
})().catch((err) => {
  process.stderr.write(String(err && err.message ? err.message : err) + '\\n');
  process.exit(2);
});
" 2>/dev/null | grep '^https://' | head -1 || true
)"

if [[ -z "${FACE_URL}" ]]; then
  echo "Could not resolve a signed honoree reference URL (face crop or honoree_photo). Trying without --face-crop-url (requires event.honoreeFaceCropUrl)."
  node functions/tests/test-openai-two-stage-poster.js \
    --event-id="${EVENT_ID}" \
    --use-firestore-prompts
else
  node functions/tests/test-openai-two-stage-poster.js \
    --event-id="${EVENT_ID}" \
    --use-firestore-prompts \
    --face-crop-url="${FACE_URL}"
fi

echo ""
echo "Finished OpenAI two-stage test for event ${EVENT_ID}."
