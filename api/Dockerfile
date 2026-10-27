FROM node:22-alpine

WORKDIR /app

EXPOSE 4000

# Instala dependencias al arrancar (usa package-lock.json si existe) y corre el script "dev"
# (por ejemplo: "dev": "tsx watch src/index.ts").
CMD ["sh", "-c", "npm install && npm run dev"]
