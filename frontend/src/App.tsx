import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Catalog } from './pages/Catalog';
import { MedicationDetail } from './pages/MedicationDetail';
import { CartPage } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderTracking } from './pages/OrderTracking';

export function App() {
  return (
    <BrowserRouter>
      <div className="announcement">CUIDAMOS DE TI · BIENESTAR Y SALUD A UN CLIC</div>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Afirmative Pill, inicio">
            <span className="brand-mark">✚</span>
            <span className="brand-name">afirmative<span>pill</span></span>
          </Link>
          <nav className="header-nav" aria-label="Navegación principal">
            <Link to="/" className="nav-link">Catálogo</Link>
            <Link to="/cart" className="nav-link"><span aria-hidden="true">🛒</span> Mi carrito</Link>
          </nav>
        </div>
      </header>

      <main className="main-shell">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/medications/:id" element={<MedicationDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:id" element={<OrderTracking />} />
        </Routes>
      </main>
      <footer className="site-footer">Afirmative Pill · Tu bienestar, con cuidado.</footer>
    </BrowserRouter>
  );
}
