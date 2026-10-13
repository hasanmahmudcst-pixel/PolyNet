# PolyNet Production Backend Dockerfile
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# শুধু প্রোডাকশন ডিপেন্ডেন্সি ইনস্টল করা
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# আপনার আপলোড করা রেডি dist এবং public ফোল্ডার সরাসরি কপি করা
COPY dist ./dist
COPY public ./public
COPY firebase-applet-config.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
