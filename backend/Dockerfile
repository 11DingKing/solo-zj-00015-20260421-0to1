FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY . .

RUN go mod tidy

RUN CGO_ENABLED=0 go build -o main .

FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
