# Stage 1: Build Go Binary
FROM golang:1.23-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /app/bin/weatherly-api ./cmd/api

# Stage 2: Minimal Production Runtime
FROM alpine:3.20

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata && adduser -D -g '' weatherly

COPY --from=builder /app/bin/weatherly-api /app/weatherly-api
COPY --from=builder /app/migrations /app/migrations

USER weatherly
EXPOSE 8080

ENTRYPOINT ["/app/weatherly-api"]
