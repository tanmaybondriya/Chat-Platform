# Debugging Journal — Chat Platform

---

## Bug: BullMQ worker not processing jobs

**Date:** 2026-03-11
**Symptom:** Jobs queuing in Redis (LLEN showed 12) but worker never processed them
**Root Cause:** Queue name was 'notifications' but Worker name was 'notification' — missing 's'
**Fix:** Changed Worker constructor first argument to match queue name exactly
**Lesson:** BullMQ matches workers to queues by EXACT string name. Always copy-paste the name, never retype it.
**When to use debugger:** When console.log shows event received but nothing happens after

---

## Bug: Socket.io Authentication token required

**Symptom:** Postman Socket.io connection rejected with 'Authentication token required'
**Root Cause:** Token was passed in HTTP headers but middleware only read socket.handshake.auth.token
**Fix:** Added fallback to read from socket.handshake.query.token for Postman compatibility
**Lesson:** Socket.io auth ≠ HTTP auth. Token must be in handshake.auth or handshake.query, not Authorization header
**When to use debugger:** When middleware silently rejects but you can't see why

---

## Bug: room:join returning 'not a member' despite correct userId

**Symptom:** isMember always false even though userId was in members array
**Root Cause:** Data sent as Text type in Postman — roomId arrived as undefined
**Fix:** Changed Postman message type to JSON + added defensive parsing in socket handler
**Lesson:** Socket.io event data must be sent as JSON not plain Text. Always add defensive typeof check
**When to use debugger:** When a value that should exist is undefined

---

## Bug: Cannot find module error for chat repository in socket.ts

**Symptom:** Server crashed with MODULE_NOT_FOUND for chat.repository
**Root Cause:** Used require() inside a function with wrong relative path
**Fix:** Moved to top-level import with correct relative path (../../modules/chat/chat.repository)
**Lesson:** Never use require() inside functions in TypeScript. Always use top-level imports. Count directory levels carefully.
**When to use debugger:** Not needed — stack trace shows exact path

---

## Bug: Route POST /api/chat/rooms not found (404)

**Symptom:** All chat routes returning 404
**Root Cause:** app.use('api/chat') missing leading slash — should be '/api/chat'
**Fix:** Added leading slash
**Lesson:** Express route prefixes MUST start with /. Without it Express never matches.
**When to use debugger:** Not needed — check app.ts route registration first

```
## Bug: Route POST /api/auth/me not found (404)

**Symptom:** All chat routes returning 404
**Root Cause:** used post instead of get in auth.routes
**Fix:** changed to get
**Lesson:** always check the route if the error is 404
**When to use debugger:** Not needed — check app.ts route registration first
---

## When to Reach for the Debugger — The Rules

Save these as a cheat sheet:
```

USE DEBUGGER WHEN:
✅ Event/function is called but nothing happens after
✅ A value is undefined that shouldn't be
✅ Async function completes but result is wrong
✅ You've added console.log but still can't find it
✅ Error is caught silently and swallowed

USE CONSOLE.LOG WHEN:
✅ Quick check of a single value
✅ Confirming a code path is reached
✅ Production debugging (no debugger available)

USE REDIS-CLI WHEN:
✅ Checking if data reached Redis
✅ Verifying queue depth (LLEN)
✅ Checking blacklisted tokens (GET blacklist:token)
✅ Inspecting cached values

USE MONGODB COMPASS WHEN:
✅ Verifying data was saved correctly
✅ Checking indexes exist
✅ Inspecting document structure
