// Almacenamiento de datos del juego
const compromisos = {};
let letraActiva = null;
let equipoData = {};

function startGame() {
  const rep = document.getElementById('representante').value.trim();
  const eq = document.getElementById('equipo').value.trim();
  const vp = document.getElementById('vp').value;

  if (!rep || !eq) {
    alert("Completa todos los datos.");
    return;
  }
  equipoData = { rep, eq, vp };
  document.getElementById('inicio').style.display = 'none';
  document.getElementById('juego').style.display = 'block';
  document.getElementById('bienvenidaMsg').innerHTML =
    `<strong>${rep}</strong>, completa el compromiso de tu equipo <strong>${eq}</strong> (${vp}).`;

  const btnFinalizar = document.getElementById('btnFinalizar');
  if (btnFinalizar) btnFinalizar.remove();
}

function guardarLetra() {
  if (!letraActiva) return alert("Selecciona una letra.");
  const texto = document.getElementById('textoLetra').value.trim();
  if (!texto) return alert("Escribe un compromiso.");
  
  const letraReal = letraActiva.replace(/[0-9]/g, "").toUpperCase();
  if (!texto.toUpperCase().startsWith(letraReal)) {
    return alert(`Debe empezar con la letra "${letraReal}".`);
  }

  compromisos[letraActiva] = texto;
  const letraDiv = [...document.querySelectorAll('.letra')].find(l => l.dataset.letter === letraActiva);
  if (letraDiv) letraDiv.classList.add('completa');
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
  }
}

function mostrarResumenFinal() {
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

function activarCamara() {
  const video = document.getElementById("camara");
  const fotoDisplay = document.getElementById("fotoDisplay");
  
  // Al entrar, ocultamos la columna del medio (Foto) si no hay foto
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
      .catch(err => alert("Error cámara: " + err));
  }
}

function tomarFoto() {
  const video = document.getElementById("camara");
  const canvas = document.getElementById("fotoCanvas");
  const imgFoto = document.getElementById("fotoTomada");
  const fotoDisplay = document.getElementById("fotoDisplay");

  if (video.readyState !== 4) return;

  // Lógica de recorte cuadrado
  const size = Math.min(video.videoWidth, video.videoHeight);
  const startX = (video.videoWidth - size) / 2;
  const startY = (video.videoHeight - size) / 2;

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

  imgFoto.src = canvas.toDataURL("image/png");
  imgFoto.style.display = 'block'; 
  
  // AL TOMAR LA FOTO, SE HACE VISIBLE LA COLUMNA DEL MEDIO
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

function exportarImagenCompuesta() {
    const resumenHTML = document.getElementById('resultadoFinal').innerHTML;
    const fotoDataURL = document.getElementById('fotoTomada').src;
    
    if (!fotoDataURL || !compromisos['I']) {
        alert("Primero debes completar el acróstico y tomar la foto.");
        return;
    }
    
    // Configuración Canvas Final
    const W_IMG = 550; 
    const H_IMG = 480; 
    const CANVAS_W = 1250;
    const H_FONDO = 800;
    const MARGIN = 40;
    
    // Posición Imagen
    const X_IMG = CANVAS_W - W_IMG - 60; 
    const Y_IMG = 80; 

    const finalCanvas = document.getElementById('finalCanvas');
    finalCanvas.width = CANVAS_W;
    finalCanvas.height = H_FONDO;
    const ctx = finalCanvas.getContext('2d');
    
    // Preparar Texto
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

    // Carga de imágenes
    const imgFoto = new Image(); imgFoto.src = fotoDataURL;
    const imgMarco = new Image(); imgMarco.src = "marcos.png";
    const imgFondo = new Image(); imgFondo.src = "fondo.png";
    
    let loaded = 0;
    const check = () => {
        loaded++;
        if(loaded === 3) {
             // 1. Fondo
             ctx.drawImage(imgFondo, 0, 0, CANVAS_W, H_FONDO);
             
             // 2. Foto + Marco
             ctx.drawImage(imgFoto, X_IMG, Y_IMG, W_IMG, H_IMG);
             ctx.drawImage(imgMarco, X_IMG, Y_IMG, W_IMG, H_IMG);
             
             // 3. Texto
             let y = MARGIN + 100;
             const X_TEXT = MARGIN;
             const FONT_SIZE = 24;
             
             lineas.forEach((line, idx) => {
                 let x = X_TEXT;
                 const LINE_HEIGHT = FONT_SIZE * 1.6;

                 if (!Array.isArray(line)) {
                     // Títulos en Blanco
                     ctx.fillStyle = '#FFFFFF';
                     ctx.font = (idx === 0) ? `bold ${FONT_SIZE + 6}px Arial` : `bold ${FONT_SIZE}px Arial`;
                     ctx.fillText(line, X_TEXT, y);
                 } else {
                     // Acróstico
                     line.forEach(part => {
                         ctx.font = part.style === 'bold' ? `bold ${FONT_SIZE}px Arial` : `${FONT_SIZE}px Arial`;
                         // Letra inicial VERDE, resto BLANCO
                         ctx.fillStyle = part.style === 'bold' ? '#007b37' : '#FFFFFF';
                         ctx.fillText(part.text, x, y);
                         x += ctx.measureText(part.text).width;
                     });
                 }
                 y += LINE_HEIGHT;
             });
             
             // 4. Descargar
             const link = document.createElement('a');
             link.href = finalCanvas.toDataURL('image/png');
             link.download = 'compromiso_final.png';
             link.click();
        }
    };
    
    imgFoto.onload = check;
    imgMarco.onload = check;
    imgFondo.onload = check;
}

function volverAlJuego() {
  document.getElementById('final').style.display = 'none';
  document.getElementById('juego').style.display = 'block';
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