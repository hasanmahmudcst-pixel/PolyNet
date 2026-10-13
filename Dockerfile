# PolyNet Production Backend Dockerfile
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# শুধু প্রোডাকশন ডিপেন্ডেন্সি ইনস্টল করা
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# আপনার আপলোড করা রেডি dist ফোল্ডার সরাসরি কপি করা (এটি গিটহাবে আছে)
COPY dist ./dist

# যদি public ফোল্ডার বা firebase ফাইল গিটহাবে থাকে তবেই কপি হবে, না থাকলে এরর দেবে না
COPY public* ./public/
COPY firebase-applet-config.json* ./

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
