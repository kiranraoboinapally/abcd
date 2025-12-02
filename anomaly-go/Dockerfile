FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o anomaly-go main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/anomaly-go .
COPY DB_COMM.env REST.env .  # Mount these as volumes in production
EXPOSE 8080
CMD ["./anomaly-go"]