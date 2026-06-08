FROM node:20-alpine

# Chromium + dipendenze font per Puppeteer + tools per moduli nativi (bcrypt)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_CACHE_DIR=/tmp/.puppeteer-cache

WORKDIR /app

COPY package*.json ./

# --ignore-scripts evita che puppeteer-core tenti di scaricare Chromium
# I moduli nativi (bcrypt) vengono ricompilati esplicitamente dopo
RUN npm install --omit=dev --ignore-scripts \
    && npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 3001

CMD ["node", "server-pg.js"]
