# Scalability & Security Recommendations

## Security
- JWT for REST and socket auth; short-lived access tokens + HttpOnly secure refresh tokens.
- Input validation with JOI/celebrate; sanitize text to prevent XSS.
- Rate limiting per IP and per socket event (e.g., max 10 call invites / minute).
- Enforce HTTPS in production and use HSTS.

## Scalability
- Socket scaling: use `@socket.io/redis-adapter` with Redis pub/sub.
- Presence: store online user sets in Redis and subscribe to presence channel.
- Background jobs: BullMQ with Redis for notifications, media processing, and heavy tasks.
- DB: use read replicas for analytics/reads; write master for transactional flows.
- Caching: cache expensive queries (user profile, chat list) in Redis with short TTL.

## Observability
- Expose Prometheus metrics for socket connections, event rates, queue lengths.
- Integrate tracing (OpenTelemetry) for end-to-end request/ event tracing.
