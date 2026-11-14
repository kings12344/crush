# API Plan (not yet implemented)

## Authentication
POST /auth/register
POST /auth/login
POST /auth/verify-email
POST /auth/refresh
POST /auth/logout

## Profiles and discovery
GET /me
PATCH /me/profile
GET /discover
GET /profiles/:id

## Matching
POST /likes
POST /secret-crushes
GET /matches
POST /matches/:id/unmatch
POST /users/:id/block

## Messaging
GET /conversations
GET /conversations/:id/messages
POST /conversations/:id/messages
WebSocket: conversation message events

## Videos
POST /videos/upload-session
POST /videos
GET /feed
POST /videos/:id/likes
POST /videos/:id/comments
POST /videos/:id/report

## Calls
POST /calls
POST /calls/:id/accept
POST /calls/:id/decline
POST /calls/:id/end

All endpoints require authentication and server-side authorization. Secret Crush endpoints must not return unmatched sender identities.
