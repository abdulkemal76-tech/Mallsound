# Phase 0: Payload-First Security TDD Specification (`security_spec.md`)

## 1. Data Invariants & Relationship Mapping

1. **Verified Identity Invariant**: Every write (`create`, `update`, `delete`) across `/playlists/{playlistId}`, `/favorites/{favoriteId}`, and `/customTracks/{trackId}` requires an authenticated user with `request.auth != null && request.auth.token.email_verified == true`.
2. **Ownership Invariant**: Every document in `/playlists`, `/favorites`, and `/customTracks` must declare `ownerId == request.auth.uid` on creation, and `ownerId` + `createdAt` are strictly immutable during updates (`incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt`).
3. **Path Variable Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) validates the document ID via `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Secure List Queries**: No blanket `allow read: if isSignedIn();` rules exist. `allow list` on `/playlists`, `/favorites`, and `/customTracks` strictly enforces `resource.data.ownerId == request.auth.uid` (or `resource.data.isPublic == true` for public playlists), ensuring zero unauthorized scraping and zero PII leakage.
5. **Temporal Integrity**: `createdAt` must equal `request.time` on `create`, and `updatedAt` must equal `request.time` on `create` and `update`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Playlist Creation)**:
   ```json
   {
     "title": "Spoofed Playlist",
     "description": "Created on behalf of another user",
     "coverTheme": "amber",
     "trackIds": ["trk-1"],
     "ownerId": "victim_user_uid_999",
     "ownerName": "Attacker",
     "isPublic": true,
     "createdAt": "SERVER_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
2. **Payload 2 (Shadow Field Injection on Playlist Creation)**:
   ```json
   {
     "title": "My Playlist",
     "description": "Clean description",
     "coverTheme": "amber",
     "trackIds": [],
     "ownerId": "auth_user_1",
     "ownerName": "User One",
     "isPublic": false,
     "isVerifiedOfficial": true,
     "createdAt": "SERVER_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
3. **Payload 3 (Unbounded Array Exhaustion on Playlist `trackIds`)**:
   ```json
   {
     "title": "DoS Playlist",
     "description": "Too many tracks",
     "coverTheme": "emerald",
     "trackIds": ["t1","t2","t3","...(55 items)...","t55"],
     "ownerId": "auth_user_1",
     "ownerName": "User One",
     "isPublic": false,
     "createdAt": "SERVER_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
4. **Payload 4 (Array Type Poisoning in `trackIds`)**:
   ```json
   {
     "title": "Bad Array Element",
     "description": "First element is a number instead of string",
     "coverTheme": "indigo",
     "trackIds": [12345],
     "ownerId": "auth_user_1",
     "ownerName": "User One",
     "isPublic": false,
     "createdAt": "SERVER_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
5. **Payload 5 (Ownership Hijack on Playlist Update)**:
   ```json
   {
     "title": "Updated Title",
     "description": "Updated",
     "coverTheme": "amber",
     "trackIds": ["trk-1"],
     "ownerId": "new_owner_uid",
     "ownerName": "User One",
     "isPublic": false,
     "createdAt": "ORIGINAL_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
6. **Payload 6 (Immutable `createdAt` Tampering on Update)**:
   ```json
   {
     "title": "Updated Title",
     "description": "Updated",
     "coverTheme": "amber",
     "trackIds": ["trk-1"],
     "ownerId": "auth_user_1",
     "ownerName": "User One",
     "isPublic": false,
     "createdAt": "FORGED_NEW_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
7. **Payload 7 (Forged Client Timestamp on Favorite Creation)**:
   ```json
   {
     "trackId": "trk-senja-01",
     "ownerId": "auth_user_1",
     "createdAt": "2020-01-01T00:00:00Z"
   }
   ```
8. **Payload 8 (ID Poisoning / Regex Violation on Favorite `trackId`)**:
   ```json
   {
     "trackId": "invalid/track$id with spaces!",
     "ownerId": "auth_user_1",
     "createdAt": "SERVER_TIMESTAMP"
   }
   ```
9. **Payload 9 (Update Attempt on Immutable Favorite Document)**:
   ```json
   {
     "trackId": "trk-senja-02",
     "ownerId": "auth_user_1",
     "createdAt": "SERVER_TIMESTAMP"
   }
   ```
10. **Payload 10 (Invalid Genre Enum on CustomTrack Creation)**:
    ```json
    {
      "title": "Lagu Baru",
      "artist": "Band Indie",
      "album": "Single 2026",
      "genre": "BlackMetalUnlisted",
      "audioUrl": "https://example.com/audio.mp3",
      "durationSec": 180,
      "lyricsText": "Bait pertama",
      "ownerId": "auth_user_1",
      "ownerName": "User One",
      "createdAt": "SERVER_TIMESTAMP",
      "updatedAt": "SERVER_TIMESTAMP"
    }
    ```
11. **Payload 11 (Oversized String Payload / Denial of Wallet on CustomTrack `lyricsText`)**:
    ```json
    {
      "title": "Lagu Panjang",
      "artist": "Band Indie",
      "album": "Single 2026",
      "genre": "Indie Senja",
      "audioUrl": "https://example.com/audio.mp3",
      "durationSec": 180,
      "lyricsText": "<string of length 5000 exceeding 2000 limit>",
      "ownerId": "auth_user_1",
      "ownerName": "User One",
      "createdAt": "SERVER_TIMESTAMP",
      "updatedAt": "SERVER_TIMESTAMP"
    }
    ```
12. **Payload 12 (Unverified Email Token Write Attempt)**:
    ```json
    {
      "auth": { "uid": "auth_user_1", "token": { "email_verified": false } },
      "payload": {
        "trackId": "trk-senja-01",
        "ownerId": "auth_user_1",
        "createdAt": "SERVER_TIMESTAMP"
      }
    }
    ```
