FROM node:22-alpine

WORKDIR /app

EXPOSE 5173

# Instala dependencias al arrancar (usa package-lock.json si existe) y levanta Vite.
# --host 0.0.0.0 es necesario para que el navegador del host pueda entrar al contenedor.
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0 --port 5173"]
