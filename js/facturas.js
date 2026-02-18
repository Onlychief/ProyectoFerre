function calcularTotales(ventas) {
  let subtotal = ventas.reduce((acc, v) => acc + v.subtotal, 0);
  let iva = subtotal * 0.19;
  let total = subtotal + iva;

  return { subtotal, iva, total };
}

function crearVenta(producto, cantidad, precio) {
  return {
    producto,
    cantidad,
    precio,
    subtotal: cantidad * precio
  };
}