import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { usePermission } from './hooks/usePermission'
import LoginPage from './pages/auth/LoginPage'
import CategoryPage from './pages/category/CategoryPage'
import BrandPage from './pages/brand/BrandPage'
import UnitPage from './pages/unit/UnitPage'
import VariantPage from './pages/variant/VariantPage'
import ProductPage from './pages/product/ProductPage'
import UserPage from './pages/user/UserPage'
import RolePage from './pages/role/RolePage'
import UserFormPage from './pages/user/UserFormPage'
import RoleFormPage from './pages/role/RoleFormPage'
import PaymentMethodFormPage from './pages/payment/PaymentMethodFormPage'
import PaymentMethodPage from './pages/payment/PaymentMethodPage'
import PromoPage from './pages/promo/PromoPage'
import DailyReportPage from './pages/report/DailyReportPage'
import SalesReportPage from './pages/report/SalesReportPage'
import SettingPage from './pages/setting/SettingPage'
import AttendanceReportPage from './pages/report/AttendanceReportPage'
import ShiftReportPage from './pages/report/ShiftReportPage'
import TrendReportPage from './pages/report/TrendReportPage'
import OutletPage from './pages/outlet/OutletPage'
import MultiHargaPage from './pages/price/MultiHargaPage'
import ProductDetailPage from './pages/product/ProductDetailPage'
import PromoDetailPage from './pages/promo/PromoDetailPage'
import VariantDetailPage from './pages/variant/VariantDetailPage'
import OutletDetailPage from './pages/outlet/OutletDetailPage'
import ProductFormPage from './pages/product/ProductFormPage'
import CategoryFormPage from './pages/category/CategoryFormPage'
import BrandFormPage from './pages/brand/BrandFormPage'
import VariantFormPage from './pages/variant/VariantFormPage'
import OutletFormPage from './pages/outlet/OutletFormPage'
import UnitFormPage from './pages/unit/UnitFormPage'
import PriceCategoryFormPage from './pages/price/PriceCategoryFormPage'
import KasirLoginPage from './pages/auth/KasirLoginPage'
import KasirPage from './pages/kasir/KasirPage'
import RiwayatTransaksi from './pages/kasir/RiwayatTransaksi'
import LaporanShift from './pages/kasir/LaporanShift'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import SalesPage from './pages/sales/SalesPage'
import SalesFormPage from './pages/sales/SalesFormPage'
import SalesDetailPage from './pages/sales/SalesDetailPage'

// ── Helpers ────────────────────────────────────────────────────────────────
const getRoleName = (user) =>
  (user?.role?.name || user?.Role?.Name || '').toLowerCase()

// User dianggap KASIR kalau can_access_center = false/null
// User dianggap ADMIN kalau can_access_center = true
const isKasirRole = (user) => {
  if (!user) return false
  // Prioritas utama: cek can_access_center
  if (user.can_access_center === true || user.CanAccessCenter === true) return false
  // Fallback: cek nama role
  const role = getRoleName(user)
  if (role === 'admin' || role === 'superadmin' || role === 'owner') return false
  if (role === '') return false
  return true
}

// ── UI Components ──────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-zinc-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
  </div>
)

const ForbiddenPage = ({ message, showLogout = false }) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const handleBack = () => {
    if (showLogout) {
      logout()
      navigate('/login')
    } else {
      // Selalu redirect ke root jika ini adalah forbidden page agar kena guard PublicRoute/RootRedirect
      // Jika masih kena forbidden di root, maka tombol Logout di bawah adalah jalan keluarnya.
      navigate('/')
    }
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-zinc-900 gap-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Akses Ditolak</h1>
      <p className="text-gray-500 dark:text-zinc-400 text-sm text-center max-w-sm">
        {message || 'Anda tidak memiliki izin untuk mengakses halaman ini.'}
      </p>
      <div className="flex flex-col items-center gap-2 mt-2">
        <button onClick={handleBack}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition active:scale-95">
          {showLogout ? 'Kembali ke Login' : 'Kembali'}
        </button>
        {!showLogout && (
          <button 
            onClick={() => { logout(); navigate(isKasirRole(user) ? '/kasir/login' : '/login') }}
            className="text-gray-400 hover:text-red-500 text-xs font-semibold transition mt-2 p-2"
          >
            Logout & Keluar
          </button>
        )}
      </div>
    </div>
  )
}

// ── Route Guards ───────────────────────────────────────────────────────────

// Guard untuk halaman public admin (login)
const PublicRoute = ({ children }) => {
  const { token, loading, user } = useAuth()
  if (loading) return <Spinner />
  if (!token) return children
  return isKasirRole(user)
    ? <Navigate to="/kasir" replace />
    : <Navigate to="/reports/sales" replace />
}

// Guard untuk halaman public kasir (kasir/login)
const KasirPublicRoute = ({ children }) => {
  const { token, loading, user } = useAuth()
  if (loading) return <Spinner />
  if (!token) return children
  return isKasirRole(user)
    ? <Navigate to="/kasir" replace />
    : <Navigate to="/reports/sales" replace />
}

// Guard dengan permission check (admin)
const PermissionRoute = ({ children, module, action = 'view', checkPermission = true }) => {
  const { token, loading, user } = useAuth()
  const { can, permissions } = usePermission()
  if (loading) return <Spinner />
  if (!token) return <Navigate to="/login" replace />
  // Kasir mencoba akses admin → redirect ke kasir
  if (isKasirRole(user)) return <Navigate to="/kasir" replace />
  if (checkPermission && !permissions) return <ForbiddenPage showLogout message="Role Anda belum dikonfigurasi. Hubungi administrator." />
  if (checkPermission && !can(module, action)) return <ForbiddenPage />
  return children
}

// Guard untuk halaman kasir
const KasirRoute = ({ children, module }) => {
  const { token, loading, user } = useAuth()
  const { can } = usePermission()
  if (loading) return <Spinner />
  if (!token) return <Navigate to="/kasir/login" replace />
  if (!isKasirRole(user)) return <Navigate to="/reports/sales" replace />
  if (module && !can(module, 'view')) return <ForbiddenPage />
  return children
}

// Root redirect berdasarkan role
const RootRedirect = () => {
  const { token, loading, user } = useAuth()
  if (loading) return <Spinner />
  if (!token) return <Navigate to="/login" replace />
  return isKasirRole(user)
    ? <Navigate to="/kasir" replace />
    : <Navigate to="/reports/sales" replace />
}

// ── Routes ─────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login"       element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/kasir/login" element={<KasirPublicRoute><KasirLoginPage /></KasirPublicRoute>} />
      <Route path="/change-password" element={<PermissionRoute checkPermission={false}><ChangePasswordPage /></PermissionRoute>} />



      <Route path="/sales"          element={<PermissionRoute module="sales"><SalesPage /></PermissionRoute>} />
      <Route path="/sales/add"      element={<PermissionRoute module="sales" action="create"><SalesFormPage /></PermissionRoute>} />
      <Route path="/sales/:id"      element={<PermissionRoute module="sales"><SalesDetailPage /></PermissionRoute>} />
      <Route path="/sales/:id/edit" element={<PermissionRoute module="sales" action="edit"><SalesFormPage /></PermissionRoute>} />

      <Route path="/products"          element={<PermissionRoute module="products"><ProductPage /></PermissionRoute>} />
      <Route path="/products/add"      element={<PermissionRoute module="products" action="create"><ProductFormPage /></PermissionRoute>} />
      <Route path="/products/:id"      element={<PermissionRoute module="products"><ProductDetailPage /></PermissionRoute>} />
      <Route path="/products/:id/edit" element={<PermissionRoute module="products" action="edit"><ProductFormPage /></PermissionRoute>} />

      <Route path="/categories"          element={<PermissionRoute module="categories"><CategoryPage /></PermissionRoute>} />
      <Route path="/categories/add"      element={<PermissionRoute module="categories" action="create"><CategoryFormPage /></PermissionRoute>} />
      <Route path="/categories/:id/edit" element={<PermissionRoute module="categories" action="edit"><CategoryFormPage /></PermissionRoute>} />

      <Route path="/brands"          element={<PermissionRoute module="brands"><BrandPage /></PermissionRoute>} />
      <Route path="/brands/add"      element={<PermissionRoute module="brands" action="create"><BrandFormPage /></PermissionRoute>} />
      <Route path="/brands/:id/edit" element={<PermissionRoute module="brands" action="edit"><BrandFormPage /></PermissionRoute>} />

      <Route path="/units"          element={<PermissionRoute module="units"><UnitPage /></PermissionRoute>} />
      <Route path="/units/add"      element={<PermissionRoute module="units" action="create"><UnitFormPage /></PermissionRoute>} />
      <Route path="/units/:id/edit" element={<PermissionRoute module="units" action="edit"><UnitFormPage /></PermissionRoute>} />

      <Route path="/variants"          element={<PermissionRoute module="variants"><VariantPage /></PermissionRoute>} />
      <Route path="/variants/add"      element={<PermissionRoute module="variants" action="create"><VariantFormPage /></PermissionRoute>} />
      <Route path="/variants/:id"      element={<PermissionRoute module="variants"><VariantDetailPage /></PermissionRoute>} />
      <Route path="/variants/:id/edit" element={<PermissionRoute module="variants" action="edit"><VariantFormPage /></PermissionRoute>} />

      <Route path="/multi-harga"               element={<PermissionRoute module="multi_harga"><MultiHargaPage /></PermissionRoute>} />
      <Route path="/price-categories/add"      element={<PermissionRoute module="multi_harga" action="create"><PriceCategoryFormPage /></PermissionRoute>} />
      <Route path="/price-categories/:id/edit" element={<PermissionRoute module="multi_harga" action="edit"><PriceCategoryFormPage /></PermissionRoute>} />
      <Route path="/promos"                    element={<PermissionRoute module="promos"><PromoPage /></PermissionRoute>} />
      <Route path="/promos/:id"                element={<PermissionRoute module="promos"><PromoDetailPage /></PermissionRoute>} />

      <Route path="/outlets"          element={<PermissionRoute module="outlets"><OutletPage /></PermissionRoute>} />
      <Route path="/outlets/add"      element={<PermissionRoute module="outlets" action="create"><OutletFormPage /></PermissionRoute>} />
      <Route path="/outlets/:id"      element={<PermissionRoute module="outlets"><OutletDetailPage /></PermissionRoute>} />
      <Route path="/outlets/:id/edit" element={<PermissionRoute module="outlets" action="edit"><OutletFormPage /></PermissionRoute>} />

      <Route path="/reports/attendance" element={<PermissionRoute module="reports_attendance"><AttendanceReportPage /></PermissionRoute>} />
      <Route path="/reports/shift"      element={<PermissionRoute module="reports_shift"><ShiftReportPage /></PermissionRoute>} />
      <Route path="/reports/daily"      element={<PermissionRoute module="reports_daily"><DailyReportPage /></PermissionRoute>} />
      <Route path="/reports/sales"      element={<PermissionRoute module="reports_sales"><SalesReportPage /></PermissionRoute>} />
      <Route path="/reports/trend"      element={<PermissionRoute module="reports_trend"><TrendReportPage /></PermissionRoute>} />

      <Route path="/users"           element={<PermissionRoute module="users"><UserPage /></PermissionRoute>} />
      <Route path="/users/add"      element={<PermissionRoute module="users" action="create"><UserFormPage /></PermissionRoute>} />
      <Route path="/users/:id/edit" element={<PermissionRoute module="users" action="edit"><UserFormPage /></PermissionRoute>} />
      <Route path="/roles"           element={<PermissionRoute module="roles"><RolePage /></PermissionRoute>} />
      <Route path="/roles/add"      element={<PermissionRoute module="roles" action="create"><RoleFormPage /></PermissionRoute>} />
      <Route path="/roles/:id/edit" element={<PermissionRoute module="roles" action="edit"><RoleFormPage /></PermissionRoute>} />
      <Route path="/payment-methods" element={<PermissionRoute module="payment_methods"><PaymentMethodPage /></PermissionRoute>} />
      <Route path="/payment-methods/add"      element={<PermissionRoute module="payment_methods" action="create"><PaymentMethodFormPage /></PermissionRoute>} />
      <Route path="/payment-methods/:id/edit" element={<PermissionRoute module="payment_methods" action="edit"><PaymentMethodFormPage /></PermissionRoute>} />
      <Route path="/settings"        element={<PermissionRoute module="settings"><SettingPage /></PermissionRoute>} />

      <Route path="/kasir"           element={<KasirRoute module="kasir_pos"><KasirPage /></KasirRoute>} />

      <Route path="/kasir/riwayat"   element={<KasirRoute module="kasir_riwayat"><RiwayatTransaksi /></KasirRoute>} />
      <Route path="/kasir/shift"     element={<KasirRoute module="kasir_shift"><LaporanShift /></KasirRoute>} />

      <Route path="*" element={<Navigate to="/reports/sales" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}