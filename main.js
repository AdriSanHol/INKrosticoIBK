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

  // Asegurar que la imagen tomada previamente no esté visible
  document.getElementById("fotoTomada").style.display = "none";
  video.style.display = "block"; // Mostrar el video

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

// Tomar foto
function tomarFoto() {
  const video = document.getElementById("camara");
  const canvas = document.getElementById("fotoCanvas");
  const img = document.getElementById("fotoTomada");

  // readyState 4 = HAVE_ENOUGH_DATA
  if (video.readyState !== 4) {
    alert("La cámara no está lista o no fue activada correctamente.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  img.src = canvas.toDataURL("image/png");
  img.style.display = "block";

  // Opcional: Pausar el video después de tomar la foto
  // const tracks = video.srcObject?.getTracks();
  // tracks?.forEach(track => track.stop());
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
