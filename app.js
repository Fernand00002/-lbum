// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://mhhdsvthqwwwwzfumlxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__TEe5ZwJKylH8xLd20F4xA_nSAmQA79';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. CONFIGURA TU FECHA DE INICIO DE NOVIOS (Año, Mes - 1, Día)
// Recuerda: Enero = 0, Febrero = 1, ..., Noviembre = 10, Diciembre = 11
const fechaInicio = new Date(2025, 4, 14); 

function calcularDias() {
    const hoy = new Date();
    // Normalizar horas para calcular días exactos
    const inicioSinHora = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    const diferenciaTiempo = hoySinHora - inicioSinHora;
    const diasTotales = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
    
    document.getElementById('contador-dias').innerText = `${diasTotales} Días`;
}

// 2. ESTABLECER LA FECHA DE HOY POR DEFECTO EN EL INPUT (Soluciona el campo vacío en celular)
function inicializarFechaHoy() {
    const inputFecha = document.getElementById('fecha');
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    inputFecha.value = `${yyyy}-${mm}-${dd}`;
}

// 3. NOTIFICACIÓN ELEGANTE SIN MOSTRAR EL DOMINIO DE GITHUB
let timeoutNotificacion;
function mostrarNotificacion(mensaje, esError = false) {
    const notif = document.getElementById('notificacion');
    notif.textContent = mensaje;
    notif.className = esError ? 'notificacion error' : 'notificacion';

    clearTimeout(timeoutNotificacion);
    timeoutNotificacion = setTimeout(() => {
        notif.classList.add('oculto');
    }, 3500);
}

// 4. GENERADOR DE CORAZONES ANIMADOS EN SVG (Sin emojis)
function iniciarFondoCorazones() {
    const contenedor = document.getElementById('corazones-bg');
    const colores = ['#e87a90', '#d45d79', '#f2a6b8', '#b83358'];

    setInterval(() => {
        if (document.hidden) return;

        const corazon = document.createElement('div');
        corazon.className = 'corazon-flotante';

        const tamano = Math.floor(Math.random() * 16) + 12; // Entre 12px y 28px
        const posicionX = Math.random() * 100; // 0% a 100% de ancho
        const duracion = Math.random() * 6 + 7; // Entre 7s y 13s
        const color = colores[Math.floor(Math.random() * colores.length)];

        corazon.style.left = `${posicionX}vw`;
        corazon.style.animationDuration = `${duracion}s`;
        corazon.innerHTML = `
            <svg width="${tamano}" height="${tamano}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
        `;

        contenedor.appendChild(corazon);

        setTimeout(() => {
            corazon.remove();
        }, duracion * 1000);
    }, 650);
}

// Formatear fecha legible (ej. 14/11/2026)
function formatearFechaLegible(fechaISO) {
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// 5. CARGAR Y MOSTRAR LOS RECUERDOS DESDE SUPABASE
async function cargarRecuerdos() {
    const galeriaDiv = document.getElementById('galeria');
    galeriaDiv.innerHTML = '<p class="mensaje-vacio">Cargando recuerdos...</p>';

    const { data, error } = await supabaseClient
        .from('recuerdos')
        .select('*')
        .order('fecha_recuerdo', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
        galeriaDiv.innerHTML = '<p class="mensaje-vacio">No se pudieron cargar los recuerdos.</p>';
        return;
    }

    if (data.length === 0) {
        galeriaDiv.innerHTML = '<p class="mensaje-vacio">Aún no hay recuerdos guardados. Suban el primero juntos.</p>';
        return;
    }

    galeriaDiv.innerHTML = '';
    data.forEach(recuerdo => {
        const esVideo = recuerdo.url_archivo.match(/\.(mp4|webm|ogg|mov)$/i);
        
        const elementoMultimedia = esVideo 
            ? `<video src="${recuerdo.url_archivo}" controls preload="metadata"></video>`
            : `<img src="${recuerdo.url_archivo}" alt="${recuerdo.titulo}" loading="lazy">`;

        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-recuerdo';
        tarjeta.innerHTML = `
            ${elementoMultimedia}
            <div class="tarjeta-info">
                <h4>${recuerdo.titulo}</h4>
                <div class="tarjeta-fecha">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${formatearFechaLegible(recuerdo.fecha_recuerdo)}</span>
                </div>
            </div>
        `;
        galeriaDiv.appendChild(tarjeta);
    });
}

// 6. SUBIR NUEVO RECUERDO
const form = document.getElementById('upload-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubir = document.getElementById('btn-subir');
    btnSubir.innerText = 'Guardando recuerdo...';
    btnSubir.disabled = true;

    const titulo = document.getElementById('titulo').value.trim();
    const fecha = document.getElementById('fecha').value;
    const archivoInput = document.getElementById('archivo').files[0];

    try {
        const extension = archivoInput.name.split('.').pop();
        const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('fotos')
            .upload(nombreArchivo, archivoInput);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseClient.storage
            .from('fotos')
            .getPublicUrl(nombreArchivo);

        const { error: dbError } = await supabaseClient
            .from('recuerdos')
            .insert([{ titulo: titulo, fecha_recuerdo: fecha, url_archivo: urlData.publicUrl }]);

        if (dbError) throw dbError;

        form.reset();
        inicializarFechaHoy();
        mostrarNotificacion('Recuerdo guardado en nuestra historia');
        cargarRecuerdos();

    } catch (error) {
        mostrarNotificacion('No se pudo subir el archivo. Intenta de nuevo.', true);
        console.error(error);
    } finally {
        btnSubir.innerText = 'Guardar en nuestro álbum';
        btnSubir.disabled = false;
    }
});

// Inicializar todo al cargar la página
calcularDias();
inicializarFechaHoy();
iniciarFondoCorazones();
cargarRecuerdos();
