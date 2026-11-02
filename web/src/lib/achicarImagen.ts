const LADO_MAXIMO = 2000
const CALIDAD = 0.85

/** Las fotos del celular pesan más de lo que acepta la lectura: se achican antes de subirlas. */
export async function achicarImagen(archivo: File) {
  if (!archivo.type.startsWith('image/')) return archivo
  try {
    const imagen = await createImageBitmap(archivo)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(imagen.width * escala)
    lienzo.height = Math.round(imagen.height * escala)
    lienzo.getContext('2d')?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
    imagen.close()
    const blob = await new Promise<Blob | null>((listo) => lienzo.toBlob(listo, 'image/jpeg', CALIDAD))
    return blob ? new File([blob], 'comprobante.jpg', { type: 'image/jpeg' }) : archivo
  } catch {
    return archivo
  }
}
