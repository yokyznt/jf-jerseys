// ===== JF JERSEYS: FAVORITOS + CARRITO =====
window.JFCarrito = (function () {

    var CARRITO_KEY = 'jf_carrito';
    var COMPRADOS_KEY = 'jf_comprados';
    var FAVORITOS_KEY = 'jf_favoritos';

    function leer(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
            return [];
        }
    }

    function escribir(key, datos) {
        localStorage.setItem(key, JSON.stringify(datos));
    }

    function escapar(texto) {
        var d = document.createElement('div');
        d.textContent = texto;
        return d.innerHTML;
    }

    function numeroDePrecio(texto) {
        var n = parseFloat(String(texto).replace(/[^0-9.]/g, ''));
        return isNaN(n) ? 0 : n;
    }

    // ===== CARRITO (lo que se agrega desde la página de producto) =====
    function agregarAlCarrito(item) {
        var carrito = leer(CARRITO_KEY);

        var existente = carrito.find(function (p) {
            return p.nombre === item.nombre && p.talla === item.talla &&
                (p.personalizacion || '') === (item.personalizacion || '');
        });

        if (existente) {
            existente.cantidad += item.cantidad;
        } else {
            carrito.push(item);
        }

        escribir(CARRITO_KEY, carrito);
        actualizarUI();
    }

    function quitarDelCarrito(index) {
        var carrito = leer(CARRITO_KEY);
        carrito.splice(index, 1);
        escribir(CARRITO_KEY, carrito);
        actualizarUI();
    }

    function finalizarCompra(metodoPago) {
        var carrito = leer(CARRITO_KEY);
        if (carrito.length === 0) return;

        var comprados = leer(COMPRADOS_KEY);
        carrito.forEach(function (item) {
            item.metodoPago = metodoPago || 'No especificado';
            comprados.push(item);
        });

        escribir(COMPRADOS_KEY, comprados);
        escribir(CARRITO_KEY, []);
        actualizarUI();
    }

    // ===== RENDER DEL PANEL =====
    function renderizarLista(lista, contenedorId) {
        var ul = document.getElementById(contenedorId);
        if (!ul) return;
        ul.innerHTML = '';

        lista.forEach(function (item, index) {
            var li = document.createElement('li');
            li.className = 'carrito-item';

            var subtotal = numeroDePrecio(item.precio) * (item.cantidad || 1);
            var quitarBoton = contenedorId === 'carritoLista'
                ? '<button class="carrito-quitar" data-index="' + index + '" aria-label="Quitar">×</button>'
                : '';

            var lineaPerso = item.personalizacion
                ? '<span class="carrito-item-detalle">Personalizado: ' + escapar(item.personalizacion) + '</span>'
                : '';

            var lineaPago = item.metodoPago
                ? '<span class="carrito-item-detalle">Pagado con: ' + item.metodoPago + '</span>'
                : '';

            li.innerHTML =
                '<img src="' + item.img + '" alt="' + item.nombre + '">' +
                '<div class="carrito-item-info">' +
                    '<p>' + item.nombre + '</p>' +
                    '<span class="carrito-item-detalle">Talla ' + (item.talla || '-') + ' · Cant. ' + (item.cantidad || 1) + '</span>' +
                    lineaPerso +
                    lineaPago +
                    '<span class="carrito-item-precio">$' + subtotal.toLocaleString('es-MX') + '</span>' +
                '</div>' +
                quitarBoton;

            ul.appendChild(li);
        });

        if (contenedorId === 'carritoLista') {
            ul.querySelectorAll('.carrito-quitar').forEach(function (boton) {
                boton.addEventListener('click', function () {
                    quitarDelCarrito(parseInt(boton.getAttribute('data-index')));
                });
            });
        }
    }

    function actualizarUI() {
        var carrito = leer(CARRITO_KEY);
        var comprados = leer(COMPRADOS_KEY);

        var contador = document.getElementById('carritoContador');
        if (contador) {
            var totalUnidades = carrito.reduce(function (s, i) { return s + (i.cantidad || 1); }, 0);
            contador.textContent = totalUnidades;
            contador.style.display = totalUnidades > 0 ? 'flex' : 'none';
        }

        var vacio = document.getElementById('carritoVacio');
        if (vacio) vacio.style.display = carrito.length === 0 ? 'block' : 'none';

        var finalizarBtn = document.getElementById('finalizarCompraBtn');
        if (finalizarBtn) finalizarBtn.style.display = carrito.length > 0 ? 'block' : 'none';

        var compradosBloque = document.getElementById('compradosBloque');
        if (compradosBloque) compradosBloque.style.display = comprados.length > 0 ? 'block' : 'none';

        renderizarLista(carrito, 'carritoLista');
        renderizarLista(comprados, 'compradosLista');
    }

    // ===== FAVORITOS (el corazón, independiente del carrito) =====
    function alternarFavorito(nombre) {
        var favoritos = leer(FAVORITOS_KEY);
        var index = favoritos.indexOf(nombre);
        if (index === -1) {
            favoritos.push(nombre);
        } else {
            favoritos.splice(index, 1);
        }
        escribir(FAVORITOS_KEY, favoritos);
        return favoritos.indexOf(nombre) !== -1;
    }

    function esFavorito(nombre) {
        return leer(FAVORITOS_KEY).indexOf(nombre) !== -1;
    }

    return {
        agregarAlCarrito: agregarAlCarrito,
        quitarDelCarrito: quitarDelCarrito,
        finalizarCompra: finalizarCompra,
        actualizarUI: actualizarUI,
        alternarFavorito: alternarFavorito,
        esFavorito: esFavorito
    };
})();


document.addEventListener('DOMContentLoaded', function () {

    // ===== Corazones de favoritos (solo marcan, no van al carrito) =====
    document.querySelectorAll('.favorito').forEach(function (boton) {
        var tarjeta = boton.closest('.producto');
        if (!tarjeta) return;
        var tituloEl = tarjeta.querySelector('h3');
        if (!tituloEl) return;
        var nombre = tituloEl.textContent.trim();

        if (window.JFCarrito.esFavorito(nombre)) {
            boton.classList.add('favorito-activo');
        }

        boton.addEventListener('click', function (e) {
            e.preventDefault();
            var activo = window.JFCarrito.alternarFavorito(nombre);
            boton.classList.toggle('favorito-activo', activo);
        });
    });

    // ===== Clic en "Ver producto" / "Ver jersey": guarda los datos y navega =====
    document.querySelectorAll('.boton-producto').forEach(function (boton) {
        boton.addEventListener('click', function (e) {
            var tarjeta = boton.closest('.producto');
            if (!tarjeta) return;

            e.preventDefault();

            var tituloEl = tarjeta.querySelector('h3');
            var imgEl = tarjeta.querySelector('.producto-imagen img');
            var precioEl = tarjeta.querySelector('.precio-ahora, .precio-unico');

            var datos = {
                nombre: tituloEl ? tituloEl.textContent.trim() : 'Jersey',
                precio: precioEl ? precioEl.textContent.trim() : '$0',
                img: imgEl ? imgEl.getAttribute('src') : ''
            };

            sessionStorage.setItem('jf_producto_actual', JSON.stringify(datos));
            window.location.href = 'producto.html';
        });
    });

    // ===== Botón flotante: abre/cierra el panel =====
    var botonCarrito = document.getElementById('carritoBoton');
    var panelCarrito = document.getElementById('carritoPanel');
    if (botonCarrito && panelCarrito) {
        botonCarrito.addEventListener('click', function () {
            panelCarrito.classList.toggle('carrito-panel-abierto');
        });
    }

    // ===== Botón "Finalizar compra": abre el método de pago =====
    var finalizarBtn = document.getElementById('finalizarCompraBtn');
    var modalPagoFondo = document.getElementById('modalPagoFondo');
    var cerrarModalPago = document.getElementById('cerrarModalPago');

    if (finalizarBtn && modalPagoFondo) {
        finalizarBtn.addEventListener('click', function () {
            modalPagoFondo.classList.add('modal-pago-abierto');
        });
    }

    if (cerrarModalPago && modalPagoFondo) {
        cerrarModalPago.addEventListener('click', function () {
            modalPagoFondo.classList.remove('modal-pago-abierto');
        });
    }

    document.querySelectorAll('.metodo-pago').forEach(function (boton) {
        boton.addEventListener('click', function () {
            var metodo = boton.getAttribute('data-metodo');
            window.JFCarrito.finalizarCompra(metodo);
            modalPagoFondo.classList.remove('modal-pago-abierto');
            alert('¡Gracias por tu compra! Pagarás con ' + metodo + '.');
        });
    });

    window.JFCarrito.actualizarUI();
});