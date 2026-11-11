// Uso: npm run verificar
// Revisa que cada archivo esté en su carpeta. Si encuentra uno en otra ubicación,
// muestra el comando MOVE de CMD para corregirlo.
import fs from 'node:fs';
import path from 'node:path';

const ESPERADOS = [
  'index.html',
  'vite.config.ts',
  'tsconfig.app.json',
  'scripts/extraer-mocks.mjs',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/types/agro.ts',
  'src/config/crops.ts',
  'src/config/nav.ts',
  'src/config/fuentes.ts',
  'src/lib/api.ts',
  'src/lib/format.ts',
  'src/lib/hooks.ts',
  'src/lib/csv.ts',
  'src/lib/paises.ts',
  'src/lib/temporada.ts',
  'src/lib/splash.ts',
  'src/store/filtros.ts',
  'src/mocks/dashboard.mock.ts',
  'src/mocks/busqueda.mock.ts',
  'src/mocks/envios.mock.ts',
  'src/mocks/agro.json',
  'src/mocks/envios.json',
  'src/components/ui/Panel.tsx',
  'src/components/ui/Popover.tsx',
  'src/components/layout/AppShell.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/CropSwitcher.tsx',
  'src/components/layout/PeriodFilter.tsx',
  'src/components/layout/CommandSearch.tsx',
  'src/pages/EnMigracion.tsx',
  'src/features/busqueda/useBusqueda.ts',
  'src/features/dashboard/useDashboard.ts',
  'src/features/dashboard/DashboardPage.tsx',
  'src/features/dashboard/components/Hero.tsx',
  'src/features/dashboard/components/CalendarioCampana.tsx',
  'src/features/dashboard/components/Destinos.tsx',
  'src/features/dashboard/components/Variedades.tsx',
  'src/features/dashboard/components/TablaRanking.tsx',
  'src/features/envios/useEnvios.ts',
  'src/features/envios/useFiltrosEnvios.ts',
  'src/features/envios/exportar.ts',
  'src/features/envios/EnviosPage.tsx',
  'src/features/envios/components/BarraFiltros.tsx',
  'src/features/envios/components/HojaEnvios.tsx',
  'src/features/envios/components/FichaExportador.tsx',
  'src/components/ui/Drawer.tsx',
  'src/features/envios/traza.ts',
  'src/features/envios/components/DetalleEnvio.tsx',
  'src/features/envios/components/ResumenEnvios.tsx',
  'src/mocks/campos.mock.ts',
  'src/mocks/campos.json',
  'src/mocks/importadores.mock.ts',
  'src/mocks/trazabilidad.mock.ts',
  'src/mocks/balance.mock.ts',
  'src/mocks/inteligencia.mock.ts',
  'src/mocks/comercio.mock.ts',
  'src/mocks/acceso.mock.ts',
  'src/mocks/alertas.mock.ts',
  'src/mocks/informe.mock.ts',
  'src/features/campos/useCampos.ts',
  'src/features/campos/useFiltrosCampos.ts',
  'src/features/campos/exportar.ts',
  'src/features/campos/CamposPage.tsx',
  'src/features/campos/components/ResumenCampos.tsx',
  'src/features/campos/components/BarraFiltrosCampos.tsx',
  'src/features/campos/components/TablaCampos.tsx',
  'src/features/campos/components/FichaCampo.tsx',
  'src/components/ui/FiltrosLista.tsx',
  'src/components/ui/MiniMeses.tsx',
  'src/components/ui/Bandera.tsx',
  'src/features/importadores/tendencia.tsx',
  'src/features/importadores/useImportadores.ts',
  'src/features/importadores/useFiltrosImportadores.ts',
  'src/features/importadores/exportar.ts',
  'src/features/importadores/ImportadoresPage.tsx',
  'src/features/importadores/components/ResumenImportadores.tsx',
  'src/features/importadores/components/TablaImportadores.tsx',
  'src/features/importadores/components/FichaImportador.tsx',
  'src/features/trazabilidad/useTrazabilidad.ts',
  'src/features/trazabilidad/TrazabilidadPage.tsx',
  'src/features/trazabilidad/components/HeroTraza.tsx',
  'src/features/trazabilidad/components/Rastreador.tsx',
  'src/features/trazabilidad/components/FlujoSankey.tsx',
  'src/features/trazabilidad/components/TablaTrazaExportadores.tsx',
  'src/features/balance/useBalance.ts',
  'src/features/balance/estado.ts',
  'src/features/balance/BalancePage.tsx',
  'src/features/balance/components/HeroBalance.tsx',
  'src/features/balance/components/AlertasBalance.tsx',
  'src/features/balance/components/ListaBalance.tsx',
  'src/features/inteligencia/useInteligencia.ts',
  'src/features/inteligencia/InteligenciaPage.tsx',
  'src/features/inteligencia/components/VistaOportunidades.tsx',
  'src/features/inteligencia/components/VistaSaturacion.tsx',
  'src/features/inteligencia/components/VistaVariedades.tsx',
  'src/features/comercio/useComercio.ts',
  'src/features/comercio/ComercioPage.tsx',
  'src/features/comercio/components/HeroComercio.tsx',
  'src/features/comercio/components/CalendarioCompetencia.tsx',
  'src/features/comercio/components/TransporteOrganico.tsx',
  'src/features/acceso/useAcceso.ts',
  'src/features/acceso/AccesoPage.tsx',
  'src/features/acceso/components/Niveles.tsx',
  'src/features/alertas/useAlertas.ts',
  'src/features/alertas/config.ts',
  'src/features/alertas/AlertasPage.tsx',
  'src/features/alertas/components/TarjetaAlerta.tsx',
  'src/features/informe/useInforme.ts',
  'src/features/informe/InformePage.tsx',
  'src/features/informe/components/HojaInforme.tsx',
  'src/features/suscripcion/useSuscripcion.ts',
  'src/features/suscripcion/SuscripcionPage.tsx',
  'src/features/suscripcion/components/HeroCuenta.tsx',
  'src/features/suscripcion/components/Planes.tsx',
  'src/features/suscripcion/components/Campanas.tsx',
  'src/features/suscripcion/components/Comparacion.tsx',
  'src/config/acceso.ts',
  'src/lib/acceso.ts',
  'src/store/avisos.ts',
  'src/components/ui/Avisos.tsx',
  'src/components/ui/Logo.tsx',
  'src/components/layout/BloqueoPlan.tsx',
  'src/components/layout/AvisoVencimiento.tsx',
  'src/features/auth/useAuth.ts',
  'src/features/auth/validar.ts',
  'src/features/auth/RequireAuth.tsx',
  'src/features/auth/AuthLayout.tsx',
  'src/features/auth/LoginPage.tsx',
  'src/features/auth/RegistroPage.tsx',
  'src/features/auth/RecuperarPage.tsx',
  'src/features/auth/RestablecerPage.tsx',
  'src/features/auth/components/Campo.tsx',
  'src/features/importadores/components/PodioImportadores.tsx',
  'src/mocks/suscripcion.mock.ts',
  'src/mocks/cuentas.mock.ts',
  'src/mocks/auth.mock.ts',

];

// Índice de todo lo que hay en src/ por nombre de archivo
const encontrados = new Map();
(function recorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(p);
    else {
      const lista = encontrados.get(e.name) ?? [];
      lista.push(path.relative('.', p).split(path.sep).join('/'));
      encontrados.set(e.name, lista);
    }
  }
})('src');

const win = (p) => p.split('/').join('\\');
let faltan = 0;

for (const esperado of ESPERADOS) {
  if (fs.existsSync(esperado)) continue;
  faltan++;
  const nombre = path.basename(esperado);
  const otros = (encontrados.get(nombre) ?? []).filter((p) => p !== esperado);
  if (nombre.endsWith('.json') && esperado.startsWith('src/mocks/')) {
    console.log(`FALTA  ${esperado}  ->  ejecuta: npm run mocks -- "ruta\\al\\prototipo.html"`);
  } else if (otros.length) {
    console.log(`MAL UBICADO  ${otros[0]}`);
    console.log(`   mkdir ${win(path.dirname(esperado))} 2>nul & move "${win(otros[0])}" "${win(esperado)}"`);
  } else {
    console.log(`FALTA  ${esperado}`);
  }
}

console.log(faltan ? `\n${faltan} archivo(s) por corregir.` : 'Estructura correcta.');
process.exit(faltan ? 1 : 0);