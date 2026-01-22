import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth.js";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import "./NavBar.css";
import logoUrl from "../../img/yarningcircles_logo_transparent.png";

function NavBar() {
    const {auth, setAuth} = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("username");
        setAuth({ token: null, username: null });
        setMobileMenuOpen(false);
    };

    const closeMenu = () => setMobileMenuOpen(false);

    return (
    <div>
        <nav id="navbar">
            <Link to="/" className="logo-link" aria-label="Yarning Circles Home">
                <img src={logoUrl} alt="Yarning Circles" className="navbar-logo" />
            </Link>

            <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <Link to="/about" onClick={closeMenu}>About</Link>
                <Link to="/circles" onClick={closeMenu}>Explore Circles</Link>
                <Link to="/start-circle" className="nav-action" onClick={closeMenu}>Start A Circle</Link>

                {auth.token ? (
                    <>
                        <Link to="/" onClick={handleLogout}>
                            Log Out
                        </Link>
                        <Link
                            to={auth.userId ? `/users/${auth.userId}` : (auth.username ? `/users/${auth.username}` : "/")}
                            className="navbar-user"
                            aria-label="View your profile"
                        >
                            Hello, {auth.username || "User"}
                        </Link>
                    </>
                    ) : (
                                <>
                                    <Link to="/createaccount">Create An Account</Link>
                                    <Link to="/login">Log In</Link>
                                </>
                )}
            </div>
        </nav>
        <Outlet />
    </div>
    );
}

export default NavBar;