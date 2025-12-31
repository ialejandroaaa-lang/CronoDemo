import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import MaintenancePage from './pages/MaintenancePage';
import ClientesList from './pages/clientes/ClientesList';
import ClienteForm from './pages/clientes/ClienteForm';
import ProveedoresList from './pages/proveedores/ProveedoresList';
import ProveedorForm from './pages/proveedores/ProveedorForm';
import ProductosList from './pages/inventario/ProductosList';
import ProductoForm from './pages/inventario/ProductoForm';
import KardexList from './pages/inventario/KardexList';
import CategoriasList from './pages/inventario/CategoriasList';
import CategoriaForm from './pages/inventario/CategoriaForm';
import AjustesList from './pages/inventario/AjustesList';
import AjusteForm from './pages/inventario/AjusteForm';
import TransferenciasList from './pages/inventario/TransferenciasList';
import TransferenciaForm from './pages/inventario/TransferenciaForm';
import VendedoresList from './pages/vendedores/VendedoresList';
import VendedorForm from './pages/vendedores/VendedorForm';
import ErrorBoundary from './components/ErrorBoundary';
import PosPage from './pages/ventas/PosPage';
import VentasDistribucion from './pages/ventas/VentasDistribucion';
import VentasList from './pages/ventas/VentasList';
import ReturnsPage from './pages/ventas/ReturnsPage';
import ReturnsHistory from './pages/ventas/ReturnsHistory';
import CierreCaja from './pages/ventas/CierreCaja';
import ComprasList from './pages/compras/ComprasList';
import CompraForm from './pages/compras/CompraForm';

// Configuration modules
import NcfConfig from './pages/configuracion/NcfConfig';
import ClientConfig from './pages/configuracion/ClientConfig';
import ArticuloConfig from './pages/configuracion/ArticuloConfig';
import MonedasConfig from './pages/configuracion/MonedasConfig';
import ProveedorConfig from './pages/configuracion/ProveedorConfig';
import EmpresaConfig from './pages/configuracion/EmpresaConfig';
import CxpConfig from './pages/configuracion/CxpConfig';
import ReportesCompras from './pages/compras/ReportesCompras';
import TransferenciaConfig from './pages/configuracion/TransferenciaConfig';
import AjusteConfig from './pages/configuracion/AjusteConfig';
import UnidadMedidaPlan from './pages/configuracion/UnidadMedidaPlan';
import Almacenes from './pages/configuracion/Almacenes';
import GruposImpuestos from './pages/configuracion/GruposImpuestos';
import GruposProducto from './pages/configuracion/GruposProducto';
import MotivosAjuste from './pages/configuracion/MotivosAjuste';
import CategoriasArticulos from './pages/configuracion/CategoriasArticulos';
import ListaPrecios from './pages/inventario/ListaPrecios';
import HistorialArticulo from './pages/inventario/HistorialArticulo';
import NivelesPrecioManager from './pages/inventario/NivelesPrecioManager';
import ValoracionInventario from './pages/reportes/ValoracionInventario';
import ReporteTransacciones from './pages/reportes/ReporteTransacciones';
import CompraPrint from './pages/compras/CompraPrint';
import ManagerReport from './pages/reportes/ManagerReport';
import PagoProveedor from './pages/cuentasPorPagar/PagoProveedor';
import CobrosCliente from './pages/cuentasPorCobrar/CobrosCliente';

// CRM modules
import ProspectosList from './pages/crm/ProspectosList';
import CrmDashboard from './pages/crm/CrmDashboard';

// SmartLists
import SmartList_Facturas from './pages/reportes/smartlists/SmartList_Facturas';
import SmartList_Articulos from './pages/reportes/smartlists/SmartList_Articulos';
import SmartList_Proveedores from './pages/reportes/smartlists/SmartList_Proveedores';
import SmartList_Pagos from './pages/reportes/smartlists/SmartList_Pagos';
import SmartList_StockAlmacen from './pages/reportes/smartlists/SmartList_StockAlmacen';
import SmartList_Cobros from './pages/reportes/smartlists/SmartList_Cobros';
import Dashboard from './pages/dashboard/Dashboard';
import Launchpad from './pages/dashboard/Launchpad';
import PosConfig from './pages/configuracion/PosConfig';
import ComprasConfig from './pages/configuracion/ComprasConfig';
import ReceiptDesigner from './pages/configuracion/ReceiptDesigner';
import LoginPage from './pages/auth/LoginPage';
import SecurityEditor from './pages/configuracion/SecurityEditor';
import UsuariosList from './pages/configuracion/UsuariosList';

// Marketing
import PromotionsList from './pages/marketing/PromotionsList';
import PromotionForm from './pages/marketing/PromotionForm';

import { ThemeProvider } from './theme/ThemeContext';
// import ThemeToggle from './components/ThemeToggle';
import TrialBanner from './components/TrialBanner';

function App() {
  return (
    <ThemeProvider>
      <TrialBanner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                {/* Clientes */}
                <Route path="clientes" element={<ClientesList />} />
                <Route path="clientes/nuevo" element={<ClienteForm />} />
                <Route path="clientes/editar/:id" element={<ClienteForm />} />

                {/* ... all other sub routes under Layout ... */}
                {/* Note: I'm wrapping the entire Layout in ProtectedRoute for efficiency */}

                <Route path="proveedores" element={<ProveedoresList />} />
                <Route path="proveedores/nuevo" element={<ProveedorForm />} />
                <Route path="proveedores/editar/:id" element={<ProveedorForm />} />

                <Route path="vendedores" element={<VendedoresList />} />
                <Route path="vendedores/nuevo" element={<VendedorForm />} />
                <Route path="vendedores/editar/:id" element={<VendedorForm />} />

                <Route path="productos" element={<ProductosList />} />
                <Route path="productos/nuevo" element={<ProductoForm />} />
                <Route path="productos/editar/:id" element={<ProductoForm />} />

                <Route path="inventario/lista-precios" element={<ListaPrecios />} />
                <Route path="inventario/niveles-precios" element={<NivelesPrecioManager />} />
                <Route path="inventario/categorias-articulos" element={<CategoriasArticulos />} />
                <Route path="inventario/unidades-medida" element={<UnidadMedidaPlan />} />
                <Route path="inventario/historial" element={<HistorialArticulo />} />
                <Route path="inventario/historial/:articuloId" element={<HistorialArticulo />} />
                <Route path="inventario/almacenes" element={<Almacenes />} />
                <Route path="inventario/grupos-impuestos" element={<GruposImpuestos />} />
                <Route path="inventario/grupos-producto" element={<GruposProducto />} />
                <Route path="configuracion/motivos-ajuste" element={<MotivosAjuste />} />

                <Route path="ajustes" element={<AjustesList />} />
                <Route path="ajustes/nuevo" element={<AjusteForm />} />
                <Route path="transferencias" element={<TransferenciasList />} />
                <Route path="transferencias/nuevo" element={<TransferenciaForm />} />
                <Route path="transferencias/editar/:id" element={<TransferenciaForm />} />
                <Route path="kardex" element={<KardexList />} />

                <Route path="configuracion/ncf" element={<NcfConfig />} />
                <Route path="configuracion/clientes" element={<ClientConfig />} />
                <Route path="configuracion/articulos" element={<ArticuloConfig />} />
                <Route path="configuracion/monedas" element={<MonedasConfig />} />
                <Route path="configuracion/proveedores" element={<ProveedorConfig />} />
                <Route path="configuracion/compania" element={<EmpresaConfig />} />
                <Route path="configuracion/cxp" element={<CxpConfig />} />
                <Route path="configuracion/pos" element={<PosConfig />} />
                <Route path="configuracion/compras" element={<ComprasConfig />} />
                <Route path="configuracion/receipt-designer" element={<ReceiptDesigner />} />
                <Route path="configuracion/transferencias" element={<TransferenciaConfig />} />
                <Route path="configuracion/ajustes" element={<AjusteConfig />} />

                {/* Security Editor (Only for Admin permission if desired, or group-based) */}
                <Route path="configuracion/security-editor" element={<SecurityEditor />} />
                <Route path="configuracion/usuarios" element={<UsuariosList />} />

                <Route path="ventas/pos" element={<PosPage />} />
                <Route path="ventas/distribucion" element={<VentasDistribucion />} />
                <Route path="ventas/devoluciones" element={<ReturnsPage />} />
                <Route path="ventas/historial-devoluciones" element={<ReturnsHistory />} />
                <Route path="ventas/historial" element={<VentasList />} />
                <Route path="ventas/corte" element={<CierreCaja />} />

                <Route path="compras" element={<ComprasList />} />
                <Route path="compras/nuevo" element={<CompraForm />} />
                <Route path="compras/editar/:id" element={<CompraForm />} />
                <Route path="compras/reportes" element={<ReportesCompras />} />

                <Route path="reportes/ventas" element={<MaintenancePage title="Reporte de Ventas" />} />
                <Route path="reportes/inventario" element={<MaintenancePage title="Reporte de Inventario" />} />
                <Route path="reportes/valoracion-inventario" element={<ValoracionInventario />} />
                <Route path="reportes/compras-multi-moneda" element={<ReporteTransacciones />} />
                <Route path="reportes/manager" element={<ManagerReport />} />
                <Route path="compras/imprimir/:id" element={<CompraPrint />} />
                <Route path="cuentas-por-pagar/pagos" element={<PagoProveedor />} />
                <Route path="cuentas-por-cobrar/cobros" element={<CobrosCliente />} />

                <Route path="reportes/ventas-vendedor" element={<MaintenancePage title="Reporte por Vendedor" />} />
                <Route path="reportes/ventas-cliente" element={<MaintenancePage title="Reporte por Cliente" />} />
                <Route path="reportes/kardex" element={<MaintenancePage title="Movimientos de Artículos" />} />
                <Route path="reportes/clientes" element={<MaintenancePage title="Listado de Clientes" />} />
                <Route path="reportes/proveedores" element={<MaintenancePage title="Listado de Proveedores" />} />

                {/* Marketing & Promotions */}
                <Route path="marketing/promociones" element={<PromotionsList />} />
                <Route path="marketing/promociones/nuevo" element={<PromotionForm />} />
                <Route path="marketing/promociones/editar/:id" element={<PromotionForm />} />

                <Route path="crm/dashboard" element={<CrmDashboard />} />
                <Route path="crm/prospectos" element={<ProspectosList />} />
                <Route path="crm/oportunidades" element={<MaintenancePage title="CRM Oportunidades" />} />
                <Route path="crm/actividades" element={<MaintenancePage title="CRM Actividades" />} />
                <Route path="crm/interacciones" element={<MaintenancePage title="CRM Interacciones" />} />

                <Route path="reportes/smartlist/facturas" element={<SmartList_Facturas />} />
                <Route path="reportes/smartlist/articulos" element={<SmartList_Articulos />} />
                <Route path="reportes/smartlist/proveedores" element={<SmartList_Proveedores />} />
                <Route path="reportes/smartlist/pagos" element={<SmartList_Pagos />} />
                <Route path="reportes/smartlist/inventario" element={<SmartList_StockAlmacen />} />
                <Route path="reportes/ventas-cobros" element={<SmartList_Cobros />} />

                <Route path="utilidades/calculadora" element={<MaintenancePage title="Calculadora" />} />
                <Route path="utilidades/notas" element={<MaintenancePage title="Bloc de Notas" />} />
                <Route path="utilidades/calendario" element={<MaintenancePage title="Calendario" />} />
              </Route>

              <Route path="launchpad" element={<Launchpad />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      {/* <ThemeToggle /> */}
    </ThemeProvider>
  );
}

export default App;

