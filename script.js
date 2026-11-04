/*
 COPACI - Sistema de Gestión Ciudadana
 Los datos se guardan en localStorage.
*/

// ALMACENAMIENTO

const CLAVE_USUARIOS = "copaci_usuarios";
const CLAVE_REPORTES = "copaci_reportes";
const CLAVE_SOLICITUDES = "copaci_solicitudes";
const CLAVE_SESION = "copaci_sesion";


// CUENTA ADMINISTRATIVA PREESTABLECIDA

const ADMIN = {
    nombre: "Administrador COPACI",
    correo: "admin@copaci.mx",
    password: "COPACI2026",
    rol: "admin"
};

let usuarioActual = null;


// FUNCIONES GENERALES

function leerDatos(clave) {
    try {
        return JSON.parse(localStorage.getItem(clave)) || [];
    } catch (error) {
        return [];
    }
}

function guardarDatos(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[caracter]));
}

function folio(prefijo) {
    return prefijo + "-" +
        Date.now().toString().slice(-8) + "-" +
        Math.floor(100 + Math.random() * 900);
}

function fechaActual() {
    return new Date().toLocaleDateString("es-MX");
}


// CAMBIAR ENTRE PANTALLAS

function mostrarPantalla(id) {

    ["pantallaLogin", "pantallaRegistro", "pantallaApp"]
        .forEach(pantalla => {

            document.getElementById(pantalla)
                .classList.toggle("oculto", pantalla !== id);

        });

    document.getElementById("navPublico")
        .classList.toggle("oculto", id === "pantallaApp");

    document.getElementById("navPrivado")
        .classList.toggle("oculto", id !== "pantallaApp");
}


// MENSAJES

function mensaje(id, texto, tipo) {

    const elemento = document.getElementById(id);

    elemento.textContent = texto;

    elemento.className = "mensaje " + (tipo || "");
}


// INICIAR SESIÓN

function iniciarSesion(usuario) {

    usuarioActual = usuario;

    sessionStorage.setItem(
        CLAVE_SESION,
        JSON.stringify(usuario)
    );

    document.getElementById("nombreNav").textContent =
        usuario.nombre;

    // Mostrar menú según el tipo de usuario

    document.getElementById("menuCiudadano")
        .classList.toggle(
            "oculto",
            usuario.rol !== "ciudadano"
        );

    document.getElementById("menuAdmin")
        .classList.toggle(
            "oculto",
            usuario.rol !== "admin"
        );

    document.getElementById("rolEtiqueta").textContent =
        usuario.rol === "admin"
            ? "PANEL ADMINISTRATIVO"
            : "PORTAL CIUDADANO";

    document.getElementById("tituloBienvenida").textContent =
        "Bienvenido, " + usuario.nombre;

    document.getElementById("subtituloBienvenida").textContent =
        usuario.rol === "admin"
            ? "Desde aquí puedes revisar y administrar los reportes y trámites de la comunidad."
            : "Desde aquí puedes realizar reportes, solicitar constancias y consultar su seguimiento.";

    mostrarPantalla("pantallaApp");

    if (usuario.rol === "admin") {
        mostrarVistaAdmin("admin-inicio");
    } else {
        mostrarVistaCiudadano("inicio");
    }
}


// CERRAR SESIÓN

function cerrarSesion() {

    usuarioActual = null;

    sessionStorage.removeItem(CLAVE_SESION);

    document.getElementById("formLogin").reset();

    mostrarPantalla("pantallaLogin");
}


// BOTONES DE NAVEGACIÓN

document.getElementById("irRegistro")
    .addEventListener("click", () => {

        mostrarPantalla("pantallaRegistro");

    });


document.getElementById("volverLogin")
    .addEventListener("click", () => {

        mostrarPantalla("pantallaLogin");

    });


document.getElementById("btnCerrarSesion")
    .addEventListener("click", cerrarSesion);


// ======================================
// REGISTRO DE CIUDADANOS
// ======================================

document.getElementById("formRegistro")
    .addEventListener("submit", event => {

        event.preventDefault();

        const nombre =
            document.getElementById("regNombre").value.trim();

        const direccion =
            document.getElementById("regDireccion").value.trim();

        const correo =
            document.getElementById("regCorreo")
                .value.trim().toLowerCase();

        const password =
            document.getElementById("regPassword").value;


        // Validar campos

        if (!nombre || !direccion || !correo || !password) {

            mensaje(
                "mensajeRegistro",
                "Completa todos los campos.",
                "error"
            );

            return;
        }


        if (password.length < 6) {

            mensaje(
                "mensajeRegistro",
                "La contraseña debe tener al menos 6 caracteres.",
                "error"
            );

            return;
        }


        const usuarios = leerDatos(CLAVE_USUARIOS);

        const correoExiste =
            usuarios.some(u => u.correo === correo) ||
            correo === ADMIN.correo;


        if (correoExiste) {

            mensaje(
                "mensajeRegistro",
                "Ya existe una cuenta con ese correo electrónico.",
                "error"
            );

            return;
        }


        // Crear nuevo ciudadano

        usuarios.push({

            id: folio("USR"),
            nombre: nombre,
            direccion: direccion,
            correo: correo,
            password: password,
            rol: "ciudadano"

        });


        guardarDatos(CLAVE_USUARIOS, usuarios);

        document.getElementById("formRegistro").reset();

        mensaje(
            "mensajeRegistro",
            "Registro exitoso. Ya puedes iniciar sesión.",
            "exito"
        );

    });


// ======================================
// INICIO DE SESIÓN
// ======================================

document.getElementById("formLogin")
    .addEventListener("submit", event => {

        event.preventDefault();

        const correo =
            document.getElementById("loginCorreo")
                .value.trim().toLowerCase();

        const password =
            document.getElementById("loginPassword").value;


        // Comprobar cuenta administrativa

        if (
            correo === ADMIN.correo &&
            password === ADMIN.password
        ) {

            iniciarSesion(ADMIN);

            mensaje("mensajeLogin", "", "");

            return;
        }


        // Comprobar cuenta ciudadana

        const usuario = leerDatos(CLAVE_USUARIOS).find(u =>
            u.correo === correo &&
            u.password === password
        );


        if (!usuario) {

            mensaje(
                "mensajeLogin",
                "Correo o contraseña incorrectos.",
                "error"
            );

            return;
        }


        iniciarSesion(usuario);

        mensaje("mensajeLogin", "", "");

    });


// ======================================
// MENÚS DE NAVEGACIÓN
// ======================================

document.querySelectorAll("[data-vista]")
    .forEach(boton => {

        boton.addEventListener("click", () => {

            document.querySelectorAll("[data-vista]")
                .forEach(b => b.classList.remove("activo"));

            boton.classList.add("activo");


            if (!usuarioActual) return;


            if (usuarioActual.rol === "admin") {

                mostrarVistaAdmin(boton.dataset.vista);

            } else {

                mostrarVistaCiudadano(boton.dataset.vista);

            }

        });

    });


// ======================================
// INTERFAZ DEL CIUDADANO
// ======================================

function mostrarVistaCiudadano(vista) {

    const contenido =
        document.getElementById("contenidoApp");


    // PANTALLA PRINCIPAL

    if (vista === "inicio") {

        const reportes = leerDatos(CLAVE_REPORTES)
            .filter(r => r.correo === usuarioActual.correo);

        const solicitudes = leerDatos(CLAVE_SOLICITUDES)
            .filter(s => s.correo === usuarioActual.correo);


        contenido.innerHTML = `

            <div class="panel-grid">

                <div class="tarjeta-resumen">
                    <strong>${reportes.length}</strong>
                    <span>Reportes realizados</span>
                </div>

                <div class="tarjeta-resumen">
                    <strong>${solicitudes.length}</strong>
                    <span>Solicitudes enviadas</span>
                </div>

                <div class="tarjeta-resumen">
                    <strong>
                        ${
                            reportes.filter(r => r.estado !== "Resuelto").length +
                            solicitudes.filter(s => s.estado !== "Resuelto").length
                        }
                    </strong>
                    <span>Registros pendientes o en proceso</span>
                </div>

            </div>

            <div class="panel-card" style="margin-top:22px">

                <h3>Servicios disponibles</h3>

                <p>
                    Utiliza el menú para reportar fallas de luminarias
                    o baches, solicitar una constancia de residencia
                    y consultar el avance de tus registros.
                </p>

            </div>

        `;
    }


    // REGISTRAR REPORTES

    if (vista === "reporte") {

        contenido.innerHTML = `

            <div class="panel-card">

                <h3>Registrar un reporte urbano</h3>

                <p>
                    Selecciona el tipo de problema y proporciona
                    la ubicación para que el COPACI pueda revisarlo.
                </p>

                <form id="formReporte">

                    <label for="tipoReporte">
                        Tipo de reporte
                    </label>

                    <select id="tipoReporte" required>

                        <option value="">
                            Selecciona una opción
                        </option>

                        <option value="Luminarias">
                            Falla de luminaria
                        </option>

                        <option value="Bacheo">
                            Bache o daño en la carpeta asfáltica
                        </option>

                    </select>


                    <label for="ubicacionReporte">
                        Ubicación o dirección
                    </label>

                    <input
                        id="ubicacionReporte"
                        type="text"
                        placeholder="Calle, colonia o referencia"
                        required
                    >


                    <div id="campoEntreCalles" class="oculto">

                        <label for="entreCalles">
                            ¿Entre qué calles se encuentra?
                        </label>

                        <input
                            id="entreCalles"
                            type="text"
                            placeholder="Ej. entre Calle 1 y Calle 2"
                        >

                    </div>


                    <div id="campoGravedad" class="oculto">

                        <label for="gravedadReporte">
                            Nivel de gravedad
                        </label>

                        <select id="gravedadReporte">

                            <option value="">
                                Selecciona la gravedad
                            </option>

                            <option value="Bajo">Bajo</option>
                            <option value="Medio">Medio</option>
                            <option value="Alto">Alto</option>

                        </select>

                    </div>


                    <label for="descripcionReporte">
                        Descripción del problema
                    </label>

                    <textarea
                        id="descripcionReporte"
                        placeholder="Describe lo que sucede"
                        required
                    ></textarea>


                    <button class="boton-principal" type="submit">
                        Enviar reporte
                    </button>

                    <p id="mensajeReporte" class="mensaje"></p>

                </form>

            </div>

        `;


        document.getElementById("tipoReporte")
            .addEventListener("change", actualizarCamposReporte);

    }


    // SOLICITAR CONSTANCIA

    if (vista === "constancia") {

        contenido.innerHTML = `

            <div class="panel-card">

                <h3>Solicitud de constancia comunitaria</h3>

                <p>
                    Completa el formulario para solicitar una
                    constancia de residencia. El comprobante generado
                    es una vista previa escolar y no sustituye un
                    documento oficial emitido y firmado por el COPACI.
                </p>

                <form id="formConstancia">

                    <label for="domicilioConstancia">
                        Domicilio del solicitante
                    </label>

                    <input
                        id="domicilioConstancia"
                        type="text"
                        value="${escapar(usuarioActual.direccion || "")}"
                        required
                    >


                    <label for="motivoConstancia">
                        Motivo de la solicitud
                    </label>

                    <textarea
                        id="motivoConstancia"
                        placeholder="Indica para qué necesitas la constancia"
                        required
                    ></textarea>


                    <button class="boton-principal" type="submit">
                        Generar solicitud
                    </button>

                    <p id="mensajeConstancia" class="mensaje"></p>

                </form>

            </div>

        `;
    }


    // CONSULTAR TRÁMITES Y REPORTES

    if (vista === "mis-registros") {

        const reportes = leerDatos(CLAVE_REPORTES)
            .filter(r => r.correo === usuarioActual.correo);

        const solicitudes = leerDatos(CLAVE_SOLICITUDES)
            .filter(s => s.correo === usuarioActual.correo);


        contenido.innerHTML = `

            <div class="panel-card">

                <h3>Mis reportes</h3>

                ${crearTablaReportes(reportes)}

            </div>


            <div class="panel-card">

                <h3>Mis solicitudes de constancia</h3>

                ${crearTablaSolicitudes(solicitudes)}

            </div>

        `;
    }

}


// ======================================
// CAMPOS DINÁMICOS DE LOS REPORTES
// ======================================

function actualizarCamposReporte() {

    const tipo =
        document.getElementById("tipoReporte").value;


    document.getElementById("campoEntreCalles")
        .classList.toggle("oculto", tipo !== "Luminarias");


    document.getElementById("campoGravedad")
        .classList.toggle("oculto", tipo !== "Bacheo");


    document.getElementById("gravedadReporte").required =
        tipo === "Bacheo";

}


// ======================================
// TABLAS DE CONSULTA CIUDADANA
// ======================================

function crearTablaReportes(registros) {

    if (!registros.length) {

        return `
            <div class="vacio">
                Todavía no has realizado reportes.
            </div>
        `;

    }


    return `

        <div class="tabla-contenedor">

            <table>

                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Tipo</th>
                        <th>Ubicación</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                    </tr>
                </thead>

                <tbody>

                    ${registros.map(r => `

                        <tr>

                            <td>${escapar(r.folio)}</td>

                            <td>${escapar(r.tipo)}</td>

                            <td>${escapar(r.ubicacion)}</td>

                            <td>${escapar(r.fecha)}</td>

                            <td>${etiquetaEstado(r.estado)}</td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

    `;
}


function crearTablaSolicitudes(registros) {

    if (!registros.length) {

        return `
            <div class="vacio">
                Todavía no has solicitado constancias.
            </div>
        `;

    }


    return `

        <div class="tabla-contenedor">

            <table>

                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Trámite</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Comprobante</th>
                    </tr>
                </thead>

                <tbody>

                    ${registros.map(s => `

                        <tr>

                            <td>${escapar(s.folio)}</td>

                            <td>${escapar(s.tipo)}</td>

                            <td>${escapar(s.fecha)}</td>

                            <td>${etiquetaEstado(s.estado)}</td>

                            <td>
                                <button
                                    type="button"
                                    class="boton-secundario"
                                    data-comprobante="${escapar(s.folio)}"
                                >
                                    Ver
                                </button>
                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// MOSTRAR ESTADOS

function etiquetaEstado(estado) {

    const clase =
        estado === "Resuelto"
            ? "resuelto"
            : estado === "En proceso"
                ? "en-proceso"
                : "";

    return `
        <span class="estado ${clase}">
            ${escapar(estado)}
        </span>
    `;

}


// ======================================
// ENVÍO DE REPORTES Y SOLICITUDES
// ======================================

document.addEventListener("submit", event => {


    // REGISTRAR REPORTE

    if (event.target.id === "formReporte") {

        event.preventDefault();


        const tipo =
            document.getElementById("tipoReporte").value;

        const ubicacion =
            document.getElementById("ubicacionReporte")
                .value.trim();

        const entreCalles =
            document.getElementById("entreCalles")
                .value.trim();

        const gravedad =
            document.getElementById("gravedadReporte").value;

        const descripcion =
            document.getElementById("descripcionReporte")
                .value.trim();


        if (
            !tipo ||
            !ubicacion ||
            !descripcion ||
            (tipo === "Bacheo" && !gravedad)
        ) {

            document.getElementById("mensajeReporte").textContent =
                "Completa todos los campos obligatorios.";

            return;
        }


        const reportes = leerDatos(CLAVE_REPORTES);


        const nuevo = {

            folio: folio("REP"),

            nombre: usuarioActual.nombre,

            correo: usuarioActual.correo,

            tipo: tipo,

            ubicacion: ubicacion,

            entreCalles:
                tipo === "Luminarias" ? entreCalles : "",

            gravedad:
                tipo === "Bacheo" ? gravedad : "",

            descripcion: descripcion,

            fecha: fechaActual(),

            estado: "Pendiente"

        };


        reportes.push(nuevo);

        guardarDatos(CLAVE_REPORTES, reportes);


        mostrarVistaCiudadano("reporte");


        document.getElementById("mensajeReporte").textContent =
            "Reporte registrado. Tu folio es " + nuevo.folio;

        document.getElementById("mensajeReporte").className =
            "mensaje exito";

    }

// SOLICITAR CONSTANCIA

    if (event.target.id === "formConstancia") {

        event.preventDefault();


        const domicilio =
            document.getElementById("domicilioConstancia")
                .value.trim();

        const motivo =
            document.getElementById("motivoConstancia")
                .value.trim();


        if (!domicilio || !motivo) {
            return;
        }


        const solicitudes = leerDatos(CLAVE_SOLICITUDES);


        const nueva = {

            folio: folio("CON"),

            nombre: usuarioActual.nombre,

            correo: usuarioActual.correo,

            tipo: "Constancia de residencia",

            domicilio: domicilio,

            motivo: motivo,

            fecha: fechaActual(),

            estado: "Pendiente"

        };


        solicitudes.push(nueva);

        guardarDatos(CLAVE_SOLICITUDES, solicitudes);


        mostrarVistaCiudadano("constancia");


        document.getElementById("mensajeConstancia").textContent =
            "Solicitud registrada. Folio: " + nueva.folio +
            ". Puedes consultar su estado en Mis trámites y reportes.";

        document.getElementById("mensajeConstancia").className =
            "mensaje exito";

    }

});

// ======================================
// PANEL DEL ADMINISTRADOR
// ======================================

function mostrarVistaAdmin(vista) {

    const contenido =
        document.getElementById("contenidoApp");


    const reportes = leerDatos(CLAVE_REPORTES);

    const solicitudes = leerDatos(CLAVE_SOLICITUDES);

    const usuarios = leerDatos(CLAVE_USUARIOS);


    // RESUMEN ADMINISTRATIVO

    if (vista === "admin-inicio") {

        const pendientes =
            [...reportes, ...solicitudes]
                .filter(x => x.estado === "Pendiente").length;

        const proceso =
            [...reportes, ...solicitudes]
                .filter(x => x.estado === "En proceso").length;

        const resueltos =
            [...reportes, ...solicitudes]
                .filter(x => x.estado === "Resuelto").length;


        contenido.innerHTML = `

            <div class="panel-grid">

                <div class="tarjeta-resumen">
                    <strong>${usuarios.length}</strong>
                    <span>Ciudadanos registrados</span>
                </div>

                <div class="tarjeta-resumen">
                    <strong>${reportes.length}</strong>
                    <span>Reportes recibidos</span>
                </div>

                <div class="tarjeta-resumen">
                    <strong>${solicitudes.length}</strong>
                    <span>Solicitudes recibidas</span>
                </div>

            </div>


            <div class="panel-grid" style="margin-top:18px">

                <div class="tarjeta-resumen">
                    <strong>${pendientes}</strong>
                    <span>Pendientes</span>
                </div>

                <div class="tarjeta-resumen">
                    <strong>${proceso}</strong>
                    <span>En proceso</span>
                </div>

                <div class="tarjeta-resumen">
                    <strong>${resueltos}</strong>
                    <span>Resueltos</span>
                </div>

            </div>


            <div class="panel-card" style="margin-top:22px">

                <h3>Panel administrativo</h3>

                <p>
                    Selecciona "Gestionar registros" para revisar
                    la información enviada por los ciudadanos
                    y actualizar el estado de cada registro.
                </p>

            </div>

        `;

    }
    
       // GESTIONAR REPORTES Y SOLICITUDES

    if (vista === "admin-registros") {

        contenido.innerHTML = `

            <div class="panel-card">

                <h3>Reportes urbanos</h3>

                ${
                    reportes.length

                    ? `

                    <div class="tabla-contenedor">

                        <table>

                            <thead>

                                <tr>
                                    <th>Folio</th>
                                    <th>Ciudadano</th>
                                    <th>Tipo</th>
                                    <th>Ubicación y descripción</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                </tr>

                            </thead>


                            <tbody>

                                ${reportes.map(r => `

                                    <tr>

                                        <td>${escapar(r.folio)}</td>

                                        <td>
                                            ${escapar(r.nombre)}
                                            <br>
                                            <small>${escapar(r.correo)}</small>
                                        </td>

                                        <td>
                                            ${escapar(r.tipo)}

                                            ${
                                                r.gravedad
                                                ? "<br>Gravedad: " + escapar(r.gravedad)
                                                : ""
                                            }
                                        </td>

                                        <td>
                                            ${escapar(r.ubicacion)}

                                            <br>

                                            ${
                                                r.entreCalles
                                                ? "Entre: " + escapar(r.entreCalles) + "<br>"
                                                : ""
                                            }

                                            ${escapar(r.descripcion)}
                                        </td>

                                        <td>${escapar(r.fecha)}</td>

                                        <td class="acciones-tabla">

                                            <select
                                                data-tipo="reporte"
                                                data-folio="${escapar(r.folio)}"
                                            >

                                                ${opcionesEstado(r.estado)}

                                            </select>

                                        </td>

                                    </tr>

                                `).join("")}

                            </tbody>

                        </table>

                    </div>

                    `

                    : `
                        <div class="vacio">
                            No hay reportes registrados.
                        </div>
                    `
                }

            </div>


            <div class="panel-card">

                <h3>Solicitudes de constancia</h3>

                ${
                    solicitudes.length

                    ? `

                    <div class="tabla-contenedor">

                        <table>

                            <thead>

                                <tr>
                                    <th>Folio</th>
                                    <th>Ciudadano</th>
                                    <th>Domicilio</th>
                                    <th>Motivo</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Comprobante</th>
                                </tr>

                            </thead>


                            <tbody>

                                ${solicitudes.map(s => `

                                    <tr>

                                        <td>${escapar(s.folio)}</td>

                                        <td>
                                            ${escapar(s.nombre)}
                                            <br>
                                            <small>${escapar(s.correo)}</small>
                                        </td>

                                        <td>${escapar(s.domicilio)}</td>

                                        <td>${escapar(s.motivo)}</td>

                                        <td>${escapar(s.fecha)}</td>

                                        <td class="acciones-tabla">

                                            <select
                                                data-tipo="solicitud"
                                                data-folio="${escapar(s.folio)}"
                                            >

                                                ${opcionesEstado(s.estado)}

                                            </select>

                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                class="boton-secundario"
                                                data-comprobante="${escapar(s.folio)}"
                                            >
                                                Ver
                                            </button>

                                        </td>

                                    </tr>

                                `).join("")}

                            </tbody>

                        </table>

                    </div>

                    `

                    : `
                        <div class="vacio">
                            No hay solicitudes registradas.
                        </div>
                    `
                }

            </div>

        `;

    }

}

// ======================================
// OPCIONES DE ESTADO
// ======================================

function opcionesEstado(actual) {

    return [

        "Pendiente",
        "En proceso",
        "Resuelto"

    ].map(estado => `

        <option
            value="${estado}"
            ${estado === actual ? "selected" : ""}
        >
            ${estado}
        </option>

    `).join("");

}

// ======================================
// ACTUALIZAR ESTADOS
// ======================================

document.addEventListener("change", event => {

    const selector = event.target;


    if (!selector.matches("select[data-tipo][data-folio]")) {
        return;
    }


    const clave =
        selector.dataset.tipo === "reporte"
            ? CLAVE_REPORTES
            : CLAVE_SOLICITUDES;


    const registros = leerDatos(clave);


    const registro = registros.find(x =>
        x.folio === selector.dataset.folio
    );


    if (!registro) {
        return;
    }


    registro.estado = selector.value;


    guardarDatos(clave, registros);


    mostrarVistaAdmin("admin-registros");

});

// ======================================
// COMPROBANTE DE CONSTANCIA
// ======================================

document.addEventListener("click", event => {

    const boton = event.target.closest("[data-comprobante]");


    if (!boton) {
        return;
    }


    const folioBuscado = boton.dataset.comprobante;


    const solicitud = leerDatos(CLAVE_SOLICITUDES)
        .find(s => s.folio === folioBuscado);


    if (!solicitud) {
        return;
    }


    const comprobante = `

        COMPROBANTE DE SOLICITUD - COPACI

        ---------------------------------

        Folio: ${solicitud.folio}

        Ciudadano: ${solicitud.nombre}

        Correo: ${solicitud.correo}

        Trámite: ${solicitud.tipo}

        Domicilio: ${solicitud.domicilio}

        Fecha de solicitud: ${solicitud.fecha}

        Estado: ${solicitud.estado}


        Espacio para sello y firma del COPACI.


        AVISO: Esta es una vista previa demostrativa.
        No es una constancia oficial ni acredita residencia.

    `;


    const ventana = window.open(
        "",
        "_blank",
        "width=650,height=650"
    );


    if (!ventana) {

        alert(
            "Permite las ventanas emergentes para ver el comprobante."
        );

        return;
    }


    ventana.document.write(

        "<pre style='font:16px Arial;white-space:pre-wrap;padding:30px'>" +

        escapar(comprobante) +

        "</pre><button onclick='window.print()' style='padding:10px 18px'>Imprimir</button>"

    );


    ventana.document.close();

});


// ======================================
// RECUPERAR SESIÓN
// ======================================

try {

    const sesionGuardada =
        JSON.parse(sessionStorage.getItem(CLAVE_SESION));


    if (
        sesionGuardada &&
        (
            sesionGuardada.rol === "admin" ||
            sesionGuardada.rol === "ciudadano"
        )
    ) {

        iniciarSesion(sesionGuardada);

    } else {

        mostrarPantalla("pantallaLogin");

    }

} catch (error) {

    mostrarPantalla("pantallaLogin");

}