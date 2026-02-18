// Referencias HTML
const form = document.getElementById("form-venta");
const listaVentas = document.getElementById("lista-ventas");
const totalGeneralSpan = document.getElementById("total-general");
const subtotalSpan = document.getElementById("subtotal");
const ivaSpan = document.getElementById("iva");
const facturaSpan = document.getElementById("numero-factura");
const fechaSpan = document.getElementById("fecha-actual");
const btnNuevaFactura = document.getElementById("nueva-factura");
const modal = document.getElementById("modal-historial");
const cerrarBtn = document.getElementById("cerrar-modal");
const btnGuardarFactura = document.getElementById("guardar-factura");
const bodyHistorial = document.getElementById("body-historial");
const inputBuscar = document.getElementById("buscar-factura");

//abrir btn
let abrirBtn;

window.addEventListener("DOMContentLoaded", () => {
  const abrirBtn = document.getElementById("abrir-historial");

  if (!abrirBtn) {
    console.error("No se encontró el botón abrir-historial");
    return; // 
  }

  abrirBtn.addEventListener("click", () => {
    renderHistorial();
    modal.style.display = "flex";
  });
});


// Array de ventas
let ventas = [];

// Número factura
let numeroFactura = localStorage.getItem("numeroFactura");
numeroFactura = numeroFactura ? Number(numeroFactura) + 1 : 1;
facturaSpan.textContent = numeroFactura;
localStorage.setItem("numeroFactura", numeroFactura);

// Fecha actual
fechaSpan.textContent = new Date().toLocaleDateString("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

//Funcion FiltrarHistorial
function filtrarHistorial(texto) {
  const historial = obtenerDeStorage("historialFacturas") || [];

  const filtrado = historial.filter(f =>
    f.cliente.toLowerCase().includes(texto) ||
    f.vendedor.toLowerCase().includes(texto) ||
    String(f.numero).includes(texto)
  );

  renderHistorialFiltrado(filtrado);
}

// Exportar a PDF
function exportarPDF() {
  window.print();
}

// Actualizar totales
function actualizarTotales() {
  const totales = calcularTotales(ventas);

  subtotalSpan.textContent = totales.subtotal.toLocaleString();
  ivaSpan.textContent = totales.iva.toLocaleString();
  totalGeneralSpan.textContent = totales.total.toLocaleString();
}

//Función Mostrar Factura

function mostrarFactura(factura) {
  const contenedor = document.getElementById("detalle-factura");

  let subtotal = 0;

  let html = `
    <h2>Factura #${factura.numero}</h2>
    <p><strong>Cliente:</strong> ${factura.cliente}</p>
    <p><strong>Vendedor:</strong> ${factura.vendedor}</p>
    <p><strong>Fecha:</strong> ${factura.fecha}</p>

    <table border="1" style="width:100%; margin-top:10px;">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Precio</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
  `;

  factura.productos.forEach(p => {
    subtotal += p.subtotal;

    html += `
      <tr>
        <td>${p.producto}</td>
        <td>${p.cantidad}</td>
        <td>$${p.precio}</td>
        <td>$${p.subtotal}</td>
      </tr>
    `;
  });

  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  html += `
      </tbody>
    </table>

    <div style="margin-top:15px; text-align:right;">
      <p><strong>Subtotal:</strong> $${subtotal.toLocaleString()}</p>
      <p><strong>IVA:</strong> $${iva.toLocaleString()}</p>
      <p style="font-size:18px;"><strong>Total:</strong> $${total.toLocaleString()}</p>
    </div>
  `;

  contenedor.innerHTML = html;
}

//Función Render Historial
function renderHistorial() {

    let historial = [];

  try {
    historial = obtenerDeStorage("historialFacturas") || [];
  } catch (e) {
    console.error("Error cargando historial:", e);
  }
 
  bodyHistorial.innerHTML = "";
  historial.forEach((f, index) => {
    const total = f.total ?? f.productos.reduce((acc,p)=>acc+p.subtotal,0)*1.19;

    bodyHistorial.innerHTML += `
      <tr>
        <td>${f.numero}</td>
        <td>${f.cliente}</td>
        <td>${f.vendedor}</td>
        <td>${f.fecha}</td>
        <td>$${total.toLocaleString()}</td>
        <td>
          <button class="verFactura" data-index="${index}">Ver</button>
          <button class="eliminarFactura" data-index="${index}">Eliminar</button>
        </td>
      </tr>
    `;
  });

  activarEventosHistorial(historial);
}

//Funcion Renderizar Filtro Historial
function renderHistorialFiltrado(lista) {
  bodyHistorial.innerHTML = ""; 

  lista.forEach((f, index) => {
    const total = f.total ?? f.productos.reduce((acc,p)=>acc+p.subtotal,0)*1.19;
    bodyHistorial.innerHTML += `
      <tr>
        <td>${f.numero}</td>
        <td>${f.cliente}</td>
        <td>${f.vendedor}</td>
        <td>${f.fecha}</td>
        <td>$${total.toLocaleString()}</td>
        <td>
          <button class="verFactura" data-index="${index}">Ver</button>
        </td>
      </tr>
    `;
  });

  activarEventosHistorial(lista);
}

// Funcion Activar Evento Historial
function activarEventosHistorial(historial) {

  // VER FACTURA
  document.querySelectorAll(".verFactura").forEach(btn => {
    btn.addEventListener("click", e => {
      const index = e.target.dataset.index;
      mostrarFactura(historial[index]);
    });
  });

  // ELIMINAR FACTURA
  document.querySelectorAll(".eliminarFactura").forEach(btn => {
    btn.addEventListener("click", e => {
      const index = e.target.dataset.index;

      if (!confirm("¿Eliminar esta factura?")) return;

      let historial = obtenerDeStorage("historialFacturas");
      historial.splice(index, 1);
      localStorage.setItem("historialFacturas", JSON.stringify(historial));

      renderHistorial(); // ← refresca tabla automáticamente
      document.getElementById("detalle-factura").innerHTML = "";
    });
  });

}

// Submit formulario
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const producto = document.getElementById("producto").value;
  const cantidad = Number(document.getElementById("cantidad").value);
  const precio = Number(document.getElementById("precio").value);

  const subtotal = cantidad * precio;

  const venta = crearVenta(producto, cantidad, precio);
  ventas.push(venta);

  const index = ventas.length - 1;

  const fila = document.createElement("tr");
  fila.dataset.index = index;

  fila.innerHTML = `
    <td>${producto}</td>
    <td>${cantidad}</td>
    <td>$${precio}</td>
    <td>$${subtotal}</td>
    <td>
      <button class="editar">Editar</button>
      <button class="eliminar">Eliminar</button>
    </td>
  `;

  listaVentas.appendChild(fila);

  // ELIMINAR
  fila.querySelector(".eliminar").addEventListener("click", () => {
    ventas.splice(index, 1);
    fila.remove();
    actualizarTotales();
  });

  // EDITAR
  fila.querySelector(".editar").addEventListener("click", () => {
    const ventaActual = ventas[index];

    const nuevoProducto = prompt("Editar producto:", ventaActual.producto);
    const nuevaCantidad = Number(prompt("Editar cantidad:", ventaActual.cantidad));
    const nuevoPrecio = Number(prompt("Editar precio:", ventaActual.precio));

    if (!nuevoProducto || !nuevaCantidad || !nuevoPrecio) return;

    const nuevoSubtotal = nuevaCantidad * nuevoPrecio;

    ventas[index] = {
      producto: nuevoProducto,
      cantidad: nuevaCantidad,
      precio: nuevoPrecio,
      subtotal: nuevoSubtotal
    };

    fila.children[0].textContent = nuevoProducto;
    fila.children[1].textContent = nuevaCantidad;
    fila.children[2].textContent = "$" + nuevoPrecio;
    fila.children[3].textContent = "$" + nuevoSubtotal;

    actualizarTotales();
  });

  actualizarTotales();
 
form.reset();

});

btnNuevaFactura.addEventListener("click", () => {
  ventas = [];
  listaVentas.innerHTML = "";

  actualizarTotales();

  document.getElementById("cliente").value = "";
});


//Boton Cerrar Modal
cerrarBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Evento Guardar Factura
btnGuardarFactura.addEventListener("click", () => {

  if (ventas.length === 0) {
    alert("No hay productos para guardar");
    return;
  }

  const cliente = document.getElementById("cliente").value || "Consumidor final";
  const vendedor = document.getElementById("vendedor").value;
  const fecha = document.getElementById("fecha-actual").textContent;

  let subtotal = 0;
ventas.forEach(v => subtotal += v.subtotal);

const iva = subtotal * 0.19;
const total = subtotal + iva;

const factura = {
  numero: numeroFactura,
  cliente,
  vendedor,
  fecha,
  productos: ventas,
  subtotal,
  iva,
  total
};

  let historial = obtenerDeStorage("historialFacturas") || [];

  historial.push(factura);

  localStorage.setItem("historialFacturas", JSON.stringify(historial));

  alert("Factura guardada correctamente");
  ventas = [];
  listaVentas.innerHTML = "";

  actualizarTotales();

  document.getElementById("cliente").value = "";

});

window.addEventListener("click", e => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const buscador = document.getElementById("buscar-factura");

  if (!buscador) return;

  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filas = document.querySelectorAll("#body-historial tr");

    filas.forEach(fila => {
      const contenido = fila.textContent.toLowerCase();
      fila.style.display = contenido.includes(texto)
        ? ""
        : "none";
    });
  });
});

