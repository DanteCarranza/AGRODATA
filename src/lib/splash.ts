/**
 * Retira la pantalla de carga de index.html con un desvanecido.
 * La primera vez en la sesión se deja ver completa (~1,5 s) para que la animación del logo termine;
 * en recargas posteriores dura lo justo para no hacer esperar a quien ya está trabajando.
 */
const CLAVE = 'adc-splash-visto';

export function ocultarSplash() {
  const el = document.getElementById('splash');
  if (!el) return;

  let primeraVez = true;
  try {
    primeraVez = !sessionStorage.getItem(CLAVE);
    sessionStorage.setItem(CLAVE, '1');
  } catch {
    /* almacenamiento bloqueado: se muestra completa */
  }
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const minimo = reducido ? 500 : primeraVez ? 3000 : 900;
  const espera = Math.max(0, minimo - performance.now());

  const quitar = () => {
    el.classList.add('splash-fuera');
    document.body.style.background = '';
    const fin = () => el.remove();
    el.addEventListener('transitionend', fin, { once: true });
    setTimeout(fin, 1400); // por si transitionend no llega
  };
  // dos cuadros: React ya pintó la primera vista cuando se empieza a desvanecer
  setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(quitar)), espera);
}