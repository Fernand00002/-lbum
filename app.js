// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://mhhdsvthqwwwwzfumlxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__TEe5ZwJKylH8xLd20F4xA_nSAmQA79';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. FECHA DE INICIO: 11 de Noviembre de 2026 (Mes 10 en JS)
const fechaInicio = new Date(2026, 10, 11); 

function calcularDias() {
    const hoy = new Date();
    const inicioSinHora = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    const diferenciaTiempo = hoySinHora - inicioSinHora;
    const diasTotales = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
    
    document.getElementById('contador-dias').innerText = `${diasTotales} Días`;
}

// 2. FECHA DE HOY POR DEFECTO
function inicializarFechaHoy() {
    const inputFecha = document.getElementById('fecha');
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    inputFecha.value = `${yyyy}-${mm}-${dd}`;
}

// Mostrar cuántos archivos seleccionó el usuario
const inputArchivo = document.getElementById('archivo');
const contadorArchivos = document.getElementById('contador-archivos');
inputArchivo.addEventListener('change', () => {
    const total = inputArchivo.files.length;
    if (total === 0) {
        contadorArchivos.innerText = 'Ningún archivo seleccionado';
    } else if (total === 1) {
        contadorArchivos.innerText = `1 archivo seleccionado (${inputArchivo.files[0].name})`;
    } else {
        contadorArchivos.innerText = `${total} archivos seleccionados`;
    }
});

// 3. NOTIFICACIÓN FLOTANTE PERSONALIZADA
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

// 4. FONDO ANIMADO DE CORAZONES EN SVG
function iniciarFondoCorazones() {
    const contenedor = document.getElementById('corazones-bg');
    const colores = ['#e87a90', '#d45d79', '#f2a6b8', '#b83358'];

    setInterval(() => {
        if (document.hidden) return;

        const corazon = document.createElement('div');
        corazon.className = 'corazon-flotante';

        const tamano = Math.floor(Math.random() * 16) + 12;
        const posicionX = Math.random() * 100;
        const duracion = Math.random() * 6 + 7;
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

function formatearFechaLegible(fechaISO) {
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// 5. CARGAR Y MOSTRAR RECUERDOS CON CARRUSEL MÚLTIPLE
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
        // Obtener lista de archivos (compatible con recuerdos antiguos y nuevos)
        let listaArchivos = [];
        if (Array.isArray(recuerdo.archivos) && recuerdo.archivos.length > 0) {
            listaArchivos = recuerdo.archivos;
        } else if (recuerdo.url_archivo) {
            listaArchivos = [recuerdo.url_archivo];
        }

        const totalArchivos = listaArchivos.length;

        const slidesHTML = listaArchivos.map((url, index) => {
            const esVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
            const mediaTag = esVideo
                ? `<video src="${url}" controls preload="metadata"></video>`
                : `<img src="${url}" alt="${recuerdo.titulo}" loading="lazy">`;
            return `<div class="carrusel-slide ${index === 0 ? 'activo' : ''}">${mediaTag}</div>`;
        }).join('');

        // Controles solo si hay más de 1 archivo
        const controlesHTML = totalArchivos > 1 ? `
            <span class="carrusel-badge">1 / ${totalArchivos}</span>
            <button type="button" class="carrusel-btn prev" aria-label="Anterior">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button type="button" class="carrusel-btn next" aria-label="Siguiente">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <div class="carrusel-puntos">
                ${listaArchivos.map((_, idx) => `<span class="punto ${idx === 0 ? 'activo' : ''}"></span>`).join('')}
            </div>
        ` : '';

        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-recuerdo';
        tarjeta.innerHTML = `
            <div class="carrusel-contenedor">
                ${slidesHTML}
                ${controlesHTML}
            </div>
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

        // Lógica de navegación del carrusel si tiene varios archivos
        if (totalArchivos > 1) {
            let indiceActual = 0;
            const slides = tarjeta.querySelectorAll('.carrusel-slide');
            const puntos = tarjeta.querySelectorAll('.punto');
            const badge = tarjeta.querySelector('.carrusel-badge');
            const btnPrev = tarjeta.querySelector('.prev');
            const btnNext = tarjeta.querySelector('.next');

            const actualizarSlide = (nuevoIndice) => {
                // Pausar video si estaba reproduciéndose al cambiar de slide
                const videoActual = slides[indiceActual].querySelector('video');
                if (videoActual) videoActual.pause();

                slides[indiceActual].classList.remove('activo');
                puntos[indiceActual].classList.remove('activo');

                indiceActual = (nuevoIndice + totalArchivos) % totalArchivos;

                slides[indiceActual].classList.add('activo');
                puntos[indiceActual].classList.add('activo');
                badge.textContent = `${indiceActual + 1} / ${totalArchivos}`;
            };

            btnPrev.addEventListener('click', () => actualizarSlide(indiceActual - 1));
            btnNext.addEventListener('click', () => actualizarSlide(indiceActual + 1));
        }

        galeriaDiv.appendChild(tarjeta);
    });
}

// 6. SUBIR MÚLTIPLES ARCHIVOS EN UN SOLO RECUERDO
const form = document.getElementById('upload-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubir = document.getElementById('btn-subir');
    const archivosSeleccionados = Array.from(document.getElementById('archivo').files);

    if (archivosSeleccionados.length === 0) return;

    btnSubir.disabled = true;

    const titulo = document.getElementById('titulo').value.trim();
    const fecha = document.getElementById('fecha').value;
    const urlsSubidas = [];

    try {
        for (let i = 0; i < archivosSeleccionados.length; i++) {
            const archivo = archivosSeleccionados[i];
            btnSubir.innerText = `Subiendo ${i + 1} de ${archivosSeleccionados.length}...`;

            const extension = archivo.name.split('.').pop();
            const nombreArchivo = `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('fotos')
                .upload(nombreArchivo, archivo);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabaseClient.storage
                .from('fotos')
                .getPublicUrl(nombreArchivo);

            urlsSubidas.push(urlData.publicUrl);
        }

        btnSubir.innerText = 'Guardando recuerdo...';

        const { error: dbError } = await supabaseClient
            .from('recuerdos')
            .insert([{ 
                titulo: titulo, 
                fecha_recuerdo: fecha, 
                url_archivo: urlsSubidas[0],
                archivos: urlsSubidas 
            }]);

        if (dbError) throw dbError;

        form.reset();
        contadorArchivos.innerText = 'Ningún archivo seleccionado';
        inicializarFechaHoy();
        mostrarNotificacion('Recuerdo guardado en nuestra historia');
        cargarRecuerdos();

    } catch (error) {
        mostrarNotificacion('No se pudieron subir los archivos. Intenta de nuevo.', true);
        console.error(error);
    } finally {
        btnSubir.innerText = 'Guardar en nuestro álbum';
        btnSubir.disabled = false;
    }
});

// Inicializar todo
calcularDias();
inicializarFechaHoy();
iniciarFondoCorazones();
cargarRecuerdos();
