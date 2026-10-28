import { Router } from "express";
import { z } from "zod";
import { avisarConsultaAlEquipo, mandarConfirmacionConsulta } from "../auth/mail.js";
import { Consulta } from "../modelos/Consulta.js";

export const rutasContacto = Router();

/** Las mismas reglas que muestra el front. */
const ConsultaSchema = z.object({
  email: z.email(),
  asunto: z.string().trim().min(3).max(120),
  descripcion: z.string().trim().min(10).max(2000),
});

/* Es público y manda mails: sin un tope, cualquiera podría llenar la base o la casilla de otro. */
const UNA_HORA_MS = 60 * 60 * 1000;
const MAX_POR_EMAIL = 3;
const MAX_POR_IP = 10;

rutasContacto.post("/", async (req, res) => {
  const pedido = ConsultaSchema.safeParse(req.body);
  if (!pedido.success) {
    res.status(400).json({ error: "datos-invalidos" });
    return;
  }
  const email = pedido.data.email.toLowerCase();
  const ip = req.ip ?? null;

  const desde = new Date(Date.now() - UNA_HORA_MS);
  const [delEmail, deLaIp] = await Promise.all([
    Consulta.countDocuments({ email, createdAt: { $gt: desde } }),
    ip ? Consulta.countDocuments({ ip, createdAt: { $gt: desde } }) : 0,
  ]);
  if (delEmail >= MAX_POR_EMAIL || deLaIp >= MAX_POR_IP) {
    res.status(429).json({ error: "demasiadas-consultas" });
    return;
  }

  const consulta = await Consulta.create({ ...pedido.data, email, ip });
  // Si un mail falla, la consulta ya quedó guardada: se le dice igual a la persona que llegó.
  const [confirmacion, aviso] = await Promise.allSettled([
    mandarConfirmacionConsulta(email),
    avisarConsultaAlEquipo({ ...pedido.data, email }),
  ]);
  if (confirmacion.status === "rejected") console.error("No se pudo mandar la confirmación de la consulta", confirmacion.reason);
  if (aviso.status === "rejected") console.error("No se pudo avisar al equipo de la consulta", aviso.reason);
  consulta.confirmacionEnviada = confirmacion.status === "fulfilled";
  consulta.avisoEnviado = aviso.status === "fulfilled";
  await consulta.save();
  res.status(201).json({ ok: true });
});
