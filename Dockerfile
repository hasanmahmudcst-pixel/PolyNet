# PolyNet Production Backend Dockerfile
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# শুধু প্রোডাকশন ডিপেন্ডেন্সি ইনস্টল করা
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# আপনার আপলোড করা ফাইলগুলো কপি করা
COPY . .

# dist ফোল্ডার যদি ভেঙে আপলোড হয়ে থাকে, তবে ফাইলটি খুঁজে সঠিক জায়গায় নিয়ে আসার ট্রিক
RUN if [ ! -d "dist" ] && [ -f "server.cjs" ]; then mkdir dist && mv server.cjs dist/; fi

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
