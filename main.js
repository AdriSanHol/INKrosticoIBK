// ==========================================
// 1. CONFIGURACIÓN Y ESTADO
// ==========================================
const API_URL = "https://json-server-inkrosticoibk.onrender.com/registros"; // Tu servidor en Render
const compromisos = {};
let letraActiva = null;
let equipoData = {}; // Datos en memoria para la sesión actual

/**
 * Guarda el registro inicial en el servidor (POST)
 */
function guardarRegistroInicial(id, representante, equipo, vp, fecha) {
    const nuevoRegistro = {
        id: id,
        representante: representante,
        equipo: equipo,
        vp: vp, // Agregamos VP al registro
        fecha_ingreso: fecha,
        compromisos: null // Se llenará al final
    };

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRegistro)
    })
    .then(response => response.json())
    .then(data => console.log("✅ Registro guardado en Render:", data))
    .catch(error => console.error("❌ Error al guardar registro:", error));
}

/**
 * Actualiza el registro con los compromisos al finalizar (PATCH)
 */
function actualizarRegistroConCompromisos(id, listaCompromisos) {
    fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compromisos: listaCompromisos })
    })
    .then(response => response.json())
    .then(data => console.log("✅ Compromisos actualizados en Render:", data))
    .catch(error => console.error("❌ Error al actualizar compromisos:", error));
}

// ==========================================
// 2. LÓGICA DEL JUEGO (INPUTS Y VALIDACIÓN)
// ==========================================

function startGame() {
  const rep = document.getElementById('representante').value.trim();
  const eq = document.getElementById('equipo').value.trim();
  const vp = document.getElementById('vp').value;

  if (!rep || !eq) {
    alert("Por favor completa tu nombre de representante y el nombre del equipo antes de continuar.");
    return;
  }

  // Generar ID único (String) y Fecha
  const id = Date.now().toString(); 
  const fechaIngreso = new Date().toLocaleString();

  // Guardar en memoria local del JS
  equipoData = { rep, eq, vp, id };

  // --- GUARDAR EN SERVIDOR ---
  guardarRegistroInicial(id, rep, eq, vp, fechaIngreso);

  // Cambio de Pantalla
  document.getElementById('inicio').style.display = 'none';
  document.getElementById('juego').style.display = 'block';

  document.getElementById('bienvenidaMsg').innerHTML =
    `<strong>${rep}</strong>, completa el compromiso de tu equipo <strong>${eq}</strong> (${vp}).`;

  const btnFinalizar = document.getElementById('btnFinalizar');
  if (btnFinalizar) btnFinalizar.remove();
}

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

  if (!texto.toUpperCase().startsWith(letraReal)) {
    alert(`Tu compromiso debe empezar con la letra "${letraReal}".`);
    return;
  }

  compromisos[letraActiva] = texto;

  const letraDiv = [...document.querySelectorAll('.letra')]
    .find(l => l.dataset.letter === letraActiva);

  if (letraDiv) {
    letraDiv.classList.add('completa');
  }

  document.getElementById('editor').style.display = 'none';

  checkCompleto();
}

function checkCompleto() {
  const orden = ["I", "N1", "T", "E", "R", "B", "A", "N2", "K"];
  const completo = orden.every(l => compromisos[l]);

  let btnFinalizar = document.getElementById('btnFinalizar');

  if (completo && !btnFinalizar) {
    btnFinalizar = document.createElement('button');
    btnFinalizar.id = 'btnFinalizar';
    btnFinalizar.innerText = '¡Todo Listo! Ver Resumen y Foto';
    btnFinalizar.style.marginTop = '25px';
    btnFinalizar.onclick = mostrarResumenFinal;
    document.getElementById('juego').appendChild(btnFinalizar);
  } else if (!completo && btnFinalizar) {
    btnFinalizar.remove();
  }
}

function mostrarResumenFinal() {
  // --- ACTUALIZAR EN SERVIDOR ---
  if (equipoData.id) {
      actualizarRegistroConCompromisos(equipoData.id, compromisos);
  }

  document.getElementById('juego').style.display = 'none';
  document.getElementById('final').style.display = 'block';

  document.getElementById('equipoFinal').innerText = equipoData.eq || '';
  document.getElementById('vpFinal').innerText = equipoData.vp || '';

  const orden = ["I", "N1", "T", "E", "R", "B", "A", "N2", "K"];
  let html = "";

  orden.forEach(l => {
    const letraReal = l.replace(/[0-9]/g, "").toUpperCase();
    html += `<strong style="color: #007b37;">${letraReal}</strong>: ${compromisos[l]}<br>`;
  });

  document.getElementById('resultadoFinal').innerHTML = html;

  activarCamara();
}

// ==========================================
// 3. CÁMARA Y PROCESAMIENTO DE IMAGEN
// ==========================================

function activarCamara() {
  const video = document.getElementById("camara");
  const fotoDisplay = document.getElementById("fotoDisplay");
  
  fotoDisplay.style.display = 'none'; 

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (video.srcObject) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
        video.srcObject = stream;
      })
      .catch(err => {
        alert("No se pudo acceder a la cámara. Error: " + err.name);
      });
  } else {
    alert("Tu navegador no soporta el acceso a la cámara.");
  }
}

function tomarFoto() {
  const video = document.getElementById("camara");
  const canvas = document.getElementById("fotoCanvas");
  const imgFoto = document.getElementById("fotoTomada");
  const fotoDisplay = document.getElementById("fotoDisplay");

  if (video.readyState !== 4) return;

  const size = Math.min(video.videoWidth, video.videoHeight);
  const startX = (video.videoWidth - size) / 2;
  const startY = (video.videoHeight - size) / 2;

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

  imgFoto.src = canvas.toDataURL("image/png");
  imgFoto.style.display = 'block'; 
  
  fotoDisplay.style.display = 'flex'; 
}

function descargarFotoConMarco() {
    const imgFoto = document.getElementById('fotoTomada');
    const imgMarco = new Image();
    imgMarco.src = "marcos.png";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 600; 
    canvas.width = size;
    canvas.height = size;

    imgMarco.onload = () => {
        ctx.drawImage(imgFoto, 0, 0, size, size);
        ctx.drawImage(imgMarco, 0, 0, size, size);
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'foto_interbank_con_marco.png';
        link.click();
    };
}

// ==========================================
// 4. EXPORTACIÓN DE RESUMEN (CANVAS FINAL)
// ==========================================

function exportarImagenCompuesta() {
    const resumenHTML = document.getElementById('resultadoFinal').innerHTML;
    const fotoDataURL = document.getElementById('fotoTomada').src;
    
    if (!fotoDataURL || !compromisos['I']) {
        alert("Primero debes completar el acróstico y tomar la foto.");
        return;
    }

    const W_IMG = 550; 
    const H_IMG = 550; 
    const CANVAS_W = 1250;
    const H_FONDO = 800;
    const MARGIN = 40;
    
    const X_IMG = CANVAS_W - W_IMG - 60; 
    const Y_IMG = 80; 

    const finalCanvas = document.getElementById('finalCanvas');
    finalCanvas.width = CANVAS_W;
    finalCanvas.height = H_FONDO;
    const ctx = finalCanvas.getContext('2d');
    
    let lineas = [];
    lineas.push("Compromiso 2026"); 
    lineas.push(`Equipo: ${equipoData.eq} (VP ${equipoData.vp})`); 
    lineas.push(`Representante: ${equipoData.rep}`); 
    lineas.push(""); 

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = resumenHTML;
    
    let textoActual = [];
    tempDiv.childNodes.forEach(node => {
        if (node.nodeType === 1 && node.tagName === 'BR') {
            if (textoActual.length > 0) lineas.push(textoActual);
            textoActual = [];
        } else if (node.nodeType === 3) {
            let txt = node.textContent.trim();
            if (txt) textoActual.push({ text: txt, style: 'normal' });
        } else if (node.tagName === 'STRONG') {
            textoActual.push({ text: node.textContent, style: 'bold' });
        }
    });
    if (textoActual.length > 0) lineas.push(textoActual);

    const imgFoto = new Image();
    const imgMarco = new Image();
    const imgFondo = new Image();
    let imagesLoaded = 0;

    const checkLoad = () => {
        imagesLoaded++;
        if (imagesLoaded === 3) {
            drawFinalImage(lineas, imgFoto, imgMarco, imgFondo, ctx, finalCanvas, CANVAS_W, W_IMG, H_IMG, MARGIN, X_IMG, Y_IMG);
        }
    };
    
    imgFoto.onload = checkLoad;
    imgMarco.onload = checkLoad;
    imgFondo.onload = checkLoad; 

    imgFoto.src = fotoDataURL;
    imgMarco.src = "marcos.png";
    imgFondo.src = "fondo.png";
}

function drawFinalImage(lineas, imgFoto, imgMarco, imgFondo, ctx, finalCanvas, CANVAS_W, W_IMG, H_IMG, MARGIN, X_IMG, Y_IMG) {
    ctx.drawImage(imgFondo, 0, 0, CANVAS_W, finalCanvas.height);
    
    ctx.drawImage(imgFoto, X_IMG, Y_IMG, W_IMG, H_IMG);
    ctx.drawImage(imgMarco, X_IMG, Y_IMG, W_IMG, H_IMG);
    
    let y = MARGIN + 100; 
    const X_TEXT = MARGIN;
    const FONT_SIZE = 32;
    
    lineas.forEach((line, index) => {
        let x = X_TEXT;
        const LINE_HEIGHT = FONT_SIZE * 1.6;

        if (!Array.isArray(line)) {
            ctx.fillStyle = '#FFFFFF'; 
            if (index === 0) ctx.font = `bold ${FONT_SIZE + 4}px Arial`;
            else ctx.font = `bold ${FONT_SIZE}px Arial`;
            
            ctx.fillText(line, X_TEXT, y);
        } else {
            line.forEach(part => {
                let text = part.text.trim();
                if (!text) return;

                if (part.style === 'bold') {
                    ctx.font = `bold ${FONT_SIZE}px Arial`;
                    ctx.fillStyle = '#007b37'; 
                } else {
                    ctx.font = `${FONT_SIZE}px Arial`;
                    ctx.fillStyle = '#FFFFFF'; 
                }
                
                ctx.fillText(text, x, y);
                x += ctx.measureText(text).width;
            });
        }
        y += LINE_HEIGHT;
    });

    const link = document.createElement('a');
    link.href = finalCanvas.toDataURL('image/png');
    link.download = `compromiso_interbank_${equipoData.eq}_final.png`;
    link.click();
}

function volverAlJuego() {
  document.getElementById('final').style.display = 'none';
  document.getElementById('juego').style.display = 'block';

  const video = document.getElementById("camara");
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
}

window.startGame = startGame;
window.guardarLetra = guardarLetra;
window.mostrarResumenFinal = mostrarResumenFinal;
window.tomarFoto = tomarFoto;
window.volverAlJuego = volverAlJuego;
window.descargarFotoConMarco = descargarFotoConMarco; 
window.exportarImagenCompuesta = exportarImagenCompuesta; 

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.letra').forEach(l => {
    l.addEventListener('click', () => {
      letraActiva = l.dataset.letter;
      const letraReal = letraActiva.replace(/[0-9]/g, "").toUpperCase();
      document.getElementById('editor').style.display = 'block';
      document.getElementById('editorTitulo').innerText = `Compromiso para "${letraReal}"`;
      document.getElementById('textoLetra').value = compromisos[letraActiva] || "";
      document.getElementById('textoLetra').focus();
    });
  });
});