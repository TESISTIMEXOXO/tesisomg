Web (React + Vite) y API (Express + MongoDB) con todo en Docker :p


-`docker compose up -d --build`
-Web: http://localhost:5173 · API: http://localhost:4000
-Después de cambiar el `.env`: `docker compose up -d`.

Para preparar el entorno, copiá `.env.example` como `.env`. Para que varias personas compartan los mismos viajes, cada una debe configurar `MONGODB_URI` con el mismo cluster de MongoDB Atlas. Pasen esa URI y las credenciales de Google OAuth por un medio privado, nunca en GitHub. Si `MONGODB_URI` queda vacía, la app usa el Mongo local de Docker y los datos no se comparten.

Los mapas usan OpenStreetMap; no hace falta configurar una clave de mapas ni habilitar facturación para esa función.
