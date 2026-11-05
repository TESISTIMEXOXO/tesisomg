FROM node:22-alpine

WORKDIR /app

# Copia el código con las imágenes de src/correo/ (encabezados/, encabezado-consulta.png y encabezado-invitacion.png): así la imagen funciona sin el volumen
# de docker-compose (en desarrollo, el volumen ./api:/app la tapa con los archivos locales).
COPY . .

EXPOSE 4000

# Instala dependencias al arrancar (usa package-lock.json si existe) y corre el script "dev"
# (por ejemplo: "dev": "tsx watch src/index.ts").
CMD ["sh", "-c", "npm install && npm run dev"]
