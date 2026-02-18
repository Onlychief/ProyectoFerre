function guardarEnStorage(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

function obtenerDeStorage(clave) {
  return JSON.parse(localStorage.getItem(clave)) || [];
}