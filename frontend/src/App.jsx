import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateOrder from './pages/CreateOrder';
import Orders from './pages/Orders';

function AppLayout() {
  return (
    <>
      <Navbar />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create-order" element={<CreateOrder />} />
              <Route path="/orders" element={<Orders />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;