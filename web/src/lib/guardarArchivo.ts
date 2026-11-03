/** Lo baja al dispositivo con su nombre, como el botón de descarga del navegador. */
export function guardarArchivo(archivo: File) {
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = archivo.name
  enlace.click()
  URL.revokeObjectURL(url)
}
