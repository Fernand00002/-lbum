// CONFIGURACIÓN DE SUPABASE (Con tus datos reales)
const SUPABASE_URL = 'https://mhhdsvthqwwwwzfumlxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__TEe5ZwJKylH8xLd20F4xA_nSAmQA79';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. CONFIGURA TU FECHA DE INICIO DE NOVIOS (Año, Mes - 1, Día)
// Nota: Los meses en JavaScript van de 0 (Enero) a 11 (Diciembre). 
// Ejemplo si empezaron el 14 de Mayo de 2025: new Date(2025, 4, 14)
const fechaInicio = new Date(2026, 11, 11); 

function calcularDias() {
    const hoy = new Date();
    const diferenciaTiempo = hoy - fechaInicio;
    const diasTotales = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
    
    document.getElementById('contador-dias').innerText = `${diasTotales} Días`;
}

// 2. CARGAR Y MOSTRAR LOS RECUERDOS DESDE SUPABASE
async function cargarRecuerdos() {
    const galeriaDiv = document.getElementById('galeria');
    galeriaDiv.innerHTML = '<p>Cargando recuerdos...</p>';

    const { data, error } = await supabaseClient
        .from('recuerdos')
        .select('*')
        .order('fecha_recuerdo', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
        galeriaDiv.innerHTML = '<p>Error al cargar los recuerdos.</p>';
        return;
    }

    if (data.length === 0) {
        galeriaDiv.innerHTML = '<p>Aún no hay recuerdos subidos. ¡Sube el primero!</p>';
        return;
    }

    galeriaDiv.innerHTML = '';
    data.forEach(recuerdo => {
        const esVideo = recuerdo.url_archivo.match(/\.(mp4|webm|ogg|mov)$/i);
        
        let elementoMultimedia = esVideo 
            ? `<video src="${recuerdo.url_archivo}" controls></video>`
            : `<img src="${recuerdo.url_archivo}" alt="${recuerdo.titulo}">`;

        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-recuerdo';
        tarjeta.innerHTML = `
            ${elementoMultimedia}
            <div class="tarjeta-info">
                <h4>${recuerdo.titulo}</h4>
                <p>📅 ${recuerdo.fecha_recuerdo}</p>
            </div>
        `;
        galeriaDiv.appendChild(tarjeta);
    });
}

// 3. SUBIR NUEVO RECUERDO (FOTOS O VIDEOS)
const form = document.getElementById('upload-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubir = document.getElementById('btn-subir');
    btnSubir.innerText = 'Subiendo...';
    btnSubir.disabled = true;

    const titulo = document.getElementById('titulo').value;
    const fecha = document.getElementById('fecha').value;
    const archivoInput = document.getElementById('archivo').files[0];

    try {
        // Subir archivo a Supabase Storage
        const nombreArchivo = `${Date.now()}_${archivoInput.name}`;
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('fotos')
            .upload(nombreArchivo, archivoInput);

        if (uploadError) throw uploadError;

        // Obtener URL pública del archivo subido
        const { data: urlData } = supabaseClient.storage
            .from('fotos')
            .getPublicUrl(nombreArchivo);

        const urlPublica = urlData.publicUrl;

        // Guardar la información en la tabla de Supabase
        const { error: dbError } = await supabaseClient
            .from('recuerdos')
            .insert([{ titulo: titulo, fecha_recuerdo: fecha, url_archivo: urlPublica }]);

        if (dbError) throw dbError;

        // Limpiar formulario y recargar galería
        form.reset();
        alert('¡Recuerdo guardado con éxito! ❤️');
        cargarRecuerdos();

    } catch (error) {
        alert('Hubo un error al subir el archivo: ' + error.message);
    } finally {
        btnSubir.innerText = 'Guardar Recuerdo';
        btnSubir.disabled = false;
    }
});

// Inicializar funciones al abrir la página
calcularDias();
cargarRecuerdos();