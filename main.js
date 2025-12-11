// Almacenamiento de datos del juego
const compromisos = {};
let letraActiva = null;
let equipoData = {};

function startGame() {
  const rep = document.getElementById('representante').value.trim();
  const eq = document.getElementById('equipo').value.trim();
  const vp = document.getElementById('vp').value;

  if (!rep || !eq) {
    alert("Por favor completa tu nombre de representante y el nombre del equipo antes de continuar.");
    return;
  }

  // Guardar datos del equipo globalmente
  equipoData = { rep, eq, vp };

  // Ocultar inicio y mostrar juego
  document.getElementById('inicio').style.display = 'none';
  document.getElementById('juego').style.display = 'block';

  // Mensaje de bienvenida con HTML válido
  document.getElementById('bienvenidaMsg').innerHTML =
    `<strong>${rep}</strong>, completa el compromiso de tu equipo <strong>${eq}</strong> (${vp}).`;

  // Asegurar que el botón de finalizar no esté visible al inicio del juego
  const btnFinalizar = document.getElementById('btnFinalizar');
  if (btnFinalizar) btnFinalizar.remove();
}

// Guardar el texto del compromiso
function guardarLetra() {
  if (!letraActiva) {
    alert("Primero selecciona una letra del acróstico.");
    return;
  }

  const texto = document.getElementById('textoLetra').value.trim();
  if (!texto) {
    alert("Escribe un compromiso para esta letra.");
    return;
  }

  const letraReal = letraActiva.replace(/[0-9]/g, "").toUpperCase();

  // Validación: verificar que el texto empiece con esa letra
  if (!texto.toUpperCase().startsWith(letraReal)) {
    alert(`Tu compromiso debe empezar con la letra "${letraReal}".`);
    return;
  }

  // Guardar compromiso
  compromisos[letraActiva] = texto;

  // marcar letra como completa visualmente
  const letraDiv = [...document.querySelectorAll('.letra')]
    .find(l => l.dataset.letter === letraActiva);

  if (letraDiv) {
    letraDiv.classList.add('completa');
  }

  document.getElementById('editor').style.display = 'none';

  checkCompleto();
}

// Verificar si todas las letras están completas
function checkCompleto() {
  const orden = ["I", "N1", "T", "E", "R", "B", "A", "N2", "K"];
  const completo = orden.every(l => compromisos[l]);

  let btnFinalizar = document.getElementById('btnFinalizar');

  if (completo && !btnFinalizar) {
    // Crear el botón de finalizar si todas las letras están completas
    btnFinalizar = document.createElement('button');
    btnFinalizar.id = 'btnFinalizar';
    btnFinalizar.innerText = '¡Todo Listo! Ver Resumen y Foto';
    btnFinalizar.style.marginTop = '25px';
    btnFinalizar.onclick = mostrarResumenFinal;
    document.getElementById('juego').appendChild(btnFinalizar);
  } else if (!completo && btnFinalizar) {
    // Eliminar el botón si se borra algún compromiso
    btnFinalizar.remove();
  }
}

// Mostrar pantalla final
function mostrarResumenFinal() {
  document.getElementById('juego').style.display = 'none';
  document.getElementById('final').style.display = 'block';

  // Actualizar datos del equipo en la pantalla final
  document.getElementById('equipoFinal').innerText = equipoData.eq || '';
  document.getElementById('vpFinal').innerText = equipoData.vp || '';

  const orden = ["I", "N1", "T", "E", "R", "B", "A", "N2", "K"];
  let html = "";

  // Generar el resumen del acróstico
  orden.forEach(l => {
    const letraReal = l.replace(/[0-9]/g, "").toUpperCase();
    html += `<strong style="color: #007b37;">${letraReal}</strong>: ${compromisos[l]}<br>`;
  });

  document.getElementById('resultadoFinal').innerHTML = html;

  // Iniciar la cámara
  activarCamara();
}

// Activar cámara
function activarCamara() {
  const video = document.getElementById("camara");
  const fotoDisplay = document.getElementById("fotoDisplay");
  const marco = document.getElementById("marcoOverlay");
  
  // Ocultar la foto tomada (Cuadrado 2) y el marco
  fotoDisplay.style.display = "none";
  marco.style.display = "none"; 
  video.style.display = "block"; // Mostrar el video (Cuadrado 1)

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // Detener cualquier stream anterior (si lo hubiera)
        if (video.srcObject) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
        video.srcObject = stream;
      })
      .catch(err => {
        alert("No se pudo acceder a la cámara. Por favor, asegúrate de haber dado permiso. Error: " + err.name);
        video.style.display = "none"; // Ocultar el reproductor si falla
      });
  } else {
    alert("Tu navegador no soporta el acceso a la cámara.");
    video.style.display = "none";
  }
}

function tomarFoto() {
  const video = document.getElementById("camara");
  const canvas = document.getElementById("fotoCanvas");
  const img = document.getElementById("fotoTomada");
  const fotoDisplay = document.getElementById("fotoDisplay");
  const marco = document.getElementById("marcoOverlay");

  if (video.readyState !== 4) {
    alert("La cámara no está lista.");
    return;
  }

  // Capturar la imagen
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  img.src = canvas.toDataURL("image/png");
  
  // Mostrar el contenedor de la foto tomada (Cuadrado 2) y el marco
  fotoDisplay.style.display = 'flex'; 
  marco.style.display = 'block'; 
}

/**
 * Dibuja la foto tomada con el marco superpuesto en un canvas y la descarga.
 */
function descargarFotoConMarco() {
    const imgFoto = document.getElementById('fotoTomada');
    const imgMarco = document.getElementById('marcoOverlay');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Usar el tamaño de la imagen mostrada
    const size = 600; 
    canvas.width = size;
    canvas.height = size;

    // 1. Dibujar la foto
    ctx.drawImage(imgFoto, 0, 0, size, size);

    // 2. Dibujar el marco
    const marco = new Image();
    marco.onload = () => {
        ctx.drawImage(marco, 0, 0, size, size);
        
        // 3. Descargar el resultado
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'foto_interbank_con_marco.png';
        link.click();
    };
    marco.src = imgMarco.src;
}

/**
 * Genera una imagen compuesta que incluye el resumen del acróstico y la foto con marco.
 */
function exportarImagenCompuesta() {
    // 1. Obtener datos del acróstico y equipo
    const resumenHTML = document.getElementById('resultadoFinal').innerHTML;
    const fotoDataURL = document.getElementById('fotoTomada').src;
    const equipoStr = document.getElementById('equipoFinal').innerText;
    const vpStr = document.getElementById('vpFinal').innerText;
    const repStr = equipoData.rep || 'Representante Desconocido'; 

    if (!fotoDataURL || !compromisos['I']) {
        alert("Primero debes completar el acróstico y tomar la foto.");
        return;
    }

    const W_IMG = 350; // Ancho de la foto final
    const H_IMG = 350; // Alto de la foto final
    const MARGIN = 40;
    const CANVAS_W = 1100; // Ancho total para acomodar el texto largo y la foto
    const W_TEXT_AREA = CANVAS_W - W_IMG - MARGIN * 3; // Ancho disponible para el texto

    const finalCanvas = document.getElementById('finalCanvas');
    const ctx = finalCanvas.getContext('2d');
    
    // --- Preparar datos para el texto ---
    let lineas = [];
    lineas.push(`Compromiso 2026 - Equipo: ${equipoStr} (VP ${vpStr})`);
    lineas.push(`Representante: ${repStr}`);
    lineas.push(""); 
    
    // Convertir el HTML del resumen a líneas de texto, extrayendo los fuertes (STRONG)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = resumenHTML;
    
    let textoActual = [];
    tempDiv.childNodes.forEach(node => {
        if (node.nodeType === 1 && node.tagName === 'BR') { // Separador <br>
            if (textoActual.length > 0) {
                lineas.push(textoActual);
            }
            textoActual = [];
        } else if (node.nodeType === 3) { // TEXT_NODE
            let textContent = node.textContent.trim();
            if (textContent) textoActual.push({ text: textContent, style: 'normal' });
        } else if (node.tagName === 'STRONG') {
            textoActual.push({ text: node.textContent, style: 'bold' });
        }
    });
    if (textoActual.length > 0) {
        lineas.push(textoActual);
    }

    // --- Cargar las imágenes ---
    const imgFoto = new Image();
    const imgMarco = new Image();
    let imagesLoaded = 0;

    const checkLoad = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) {
            drawFinalImage(lineas, imgFoto, imgMarco, ctx, finalCanvas, CANVAS_W, W_IMG, H_IMG, MARGIN, W_TEXT_AREA);
        }
    };
    
    imgFoto.onload = checkLoad;
    imgMarco.onload = checkLoad;

    imgFoto.src = fotoDataURL;
    imgMarco.src = "marcos.png";
}

function drawFinalImage(lineas, imgFoto, imgMarco, ctx, finalCanvas, CANVAS_W, W_IMG, H_IMG, MARGIN, W_TEXT_AREA) {
    const FONT_SIZE = 22;
    const LINE_HEIGHT = FONT_SIZE * 1.5;
    
    // Calcular altura total necesaria para acomodar todo el texto con saltos de línea
    let tempCanvasHeight = MARGIN + LINE_HEIGHT;
    lineas.forEach(line => {
        if (Array.isArray(line)) {
            // Asumiendo que las líneas del acróstico no se envuelven (no hay word-wrap en canvas simple)
            tempCanvasHeight += LINE_HEIGHT;
        } else {
            // Líneas de título, pueden ser largas
            const metrics = ctx.measureText(line);
            // Si la línea es más larga que el área de texto, contamos más líneas. 
            // Esto es una simplificación, ya que word-wrap es complejo en canvas.
            tempCanvasHeight += LINE_HEIGHT; 
        }
    });
    
    // Altura total: Máximo entre la altura calculada para el texto y la altura de la foto + márgenes
    const H_CONTENT = Math.max(tempCanvasHeight, H_IMG + MARGIN * 2);
    const CANVAS_H = H_CONTENT;

    finalCanvas.width = CANVAS_W;
    finalCanvas.height = CANVAS_H;

    // 1. Fondo Blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    
    // 2. Dibujar la Foto con Marco (a la derecha)
    const X_IMG = CANVAS_W - W_IMG - MARGIN;
    const Y_IMG = MARGIN; // Siempre comienza en el margen superior

    ctx.drawImage(imgFoto, X_IMG, Y_IMG, W_IMG, H_IMG);
    ctx.drawImage(imgMarco, X_IMG, Y_IMG, W_IMG, H_IMG);

    // 3. Dibujar el Texto (a la izquierda)
    let y = MARGIN + LINE_HEIGHT;
    const X_TEXT = MARGIN;
    
    // Lógica de dibujo de texto
    lineas.forEach(line => {
        let x = X_TEXT;

        if (!Array.isArray(line)) {
            // Líneas de Título y meta-información (solo la primera y segunda línea, la tercera es un espacio)
            ctx.font = `bold ${FONT_SIZE + (line.includes('Compromiso 2026') ? 4 : 0)}px Arial`;
            ctx.fillStyle = line.includes('Compromiso 2026') ? '#009a44' : '#333';
            ctx.fillText(line, X_TEXT, y);
        } else {
            // Líneas de Acróstico
            line.forEach(part => {
                let text = part.text.trim();
                if (!text) return;

                if (part.style === 'bold') {
                    ctx.font = `bold ${FONT_SIZE}px Arial`;
                    ctx.fillStyle = '#007b37';
                } else {
                    ctx.font = `${FONT_SIZE}px Arial`;
                    ctx.fillStyle = '#333';
                }
                
                // Si el texto excede el área disponible (simplificado, asumiendo que solo la última parte de la frase puede ser larga)
                if (x + ctx.measureText(text).width > X_IMG - MARGIN) {
                    // Si la línea se sale, ajustamos la posición del texto. 
                    // Para evitar esta complejidad, aseguramos que el contenedor del canvas sea lo suficientemente amplio.
                }

                ctx.fillText(text, x, y);
                x += ctx.measureText(text).width;
            });
        }
        
        y += LINE_HEIGHT;
    });

    // 4. Descargar la imagen final
    const link = document.createElement('a');
    link.href = finalCanvas.toDataURL('image/png');
    link.download = `compromiso_interbank_${equipoData.eq}_final.png`;
    link.click();
}

// Volver a editar
function volverAlJuego() {
  document.getElementById('final').style.display = 'none';
  document.getElementById('juego').style.display = 'block';

  // Detener el stream de la cámara al volver a la pantalla de edición
  const video = document.getElementById("camara");
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
}

// Exportar funciones para que sean accesibles desde el HTML
window.startGame = startGame;
window.guardarLetra = guardarLetra;
window.mostrarResumenFinal = mostrarResumenFinal;
window.tomarFoto = tomarFoto;
window.volverAlJuego = volverAlJuego;
window.descargarFotoConMarco = descargarFotoConMarco; 
window.exportarImagenCompuesta = exportarImagenCompuesta; 

// Inicializar event listeners después de cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.letra').forEach(l => {
    l.addEventListener('click', () => {
      letraActiva = l.dataset.letter;
      const letraReal = letraActiva.replace(/[0-9]/g, "").toUpperCase();

      document.getElementById('editor').style.display = 'block';
      document.getElementById('editorTitulo').innerText =
        `Compromiso para la letra "${letraReal}"`;
      document.getElementById('textoLetra').value = compromisos[letraActiva] || "";
      document.getElementById('textoLetra').focus();
    });
  });
});