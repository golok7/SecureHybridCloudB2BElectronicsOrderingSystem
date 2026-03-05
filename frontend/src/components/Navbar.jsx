import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { logout } = useContext(AuthContext);

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Cloud Order System</Link>
            </div>
            <div className="navbar-links">
                <Link to="/">Dashboard</Link>
                <Link to="/orders">Orders</Link>
                <Link to="/create-order">Create Order</Link>
            </div>
            <div className="navbar-actions">
                <button onClick={logout} className="btn-logout">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
