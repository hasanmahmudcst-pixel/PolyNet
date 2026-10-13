# PolyNet Production Backend Dockerfile
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# শুধু প্রোডাকশন ডিপেন্ডেন্সি এবং ফায়ারস্টোরের মিসিং মডিউলটি ইনস্টল করা
COPY package*.json ./
RUN npm ci --omit=dev && npm install @google-cloud/firestore && npm cache clean --force

# আপনার আপলোড করা ফাইলগুলো কপি করা
COPY . .

# dist ফোল্ডার স্ট্রাকচার চেক করার ট্রিক
RUN if [ ! -d "dist" ] && [ -f "server.cjs" ]; then mkdir dist && mv server.cjs dist/; fi

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
