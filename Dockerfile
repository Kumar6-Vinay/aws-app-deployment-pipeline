## Stage1: deps (deterministic install)
FROM node:20-alpine AS deps
WORKDIR /app

# COPY lock + menifast files to leverage Docker cache
COPY package*.json ./

# Deterministic install 
RUN npm ci --omit=dev && npm cache clean --force 

# COPY application source
COPY server.js ./server.js


## Stage2: runtime (small and secure)
FROM node:20-alpine AS runtime
WORKDIR /app

# install tini for handleing SIGTERM
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy node_modules from deps and applcation sourse
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./server.js
COPY package*.json ./

# Change ownership
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080

# Healthcheck: hits local /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:${PORT}/health >/dev/null 2>&1 || exit 1

  
# Run tini as PID1 to handle SIGTERM
ENTRYPOINT ["tini", "--"]

CMD ["node", "server.js"]

