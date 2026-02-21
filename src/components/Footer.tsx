import { Link } from "react-router-dom";
import "../styles/Footer.css";

export const Footer = () => {
    return (
        <footer className="footer relative z-10">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <div className="footer-logo-icon">
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "36px" }}
                                >
                                    movie_filter
                                </span>
                            </div>
                            <h2 className="footer-logo-text">FilmReel</h2>
                        </Link>
                        <p className="footer-description">
                            Your AI-powered cinema companion. Stop scrolling and
                            start watching with personalized recommendations
                            based on your current vibe.
                        </p>
                    </div>

                    <div className="footer-section">
                        <h4>Explore</h4>
                        <ul className="footer-links">
                            <li>
                                <Link to="/">Home Dashboard</Link>
                            </li>
                            <li>
                                <Link to="/mood">Mood Survey</Link>
                            </li>
                            <li>
                                <Link to="/category/popular">Trending Now</Link>
                            </li>
                            <li>
                                <Link to="/category/top_rated">Top Rated</Link>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Account</h4>
                        <ul className="footer-links">
                            <li>
                                <Link to="/account">My Profile</Link>
                            </li>
                            <li>
                                <Link to="/account">Mood History</Link>
                            </li>
                            <li>
                                <a href="#">Settings</a>
                            </li>
                            <li>
                                <a href="#">Help Center</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copyright">
                        &copy; {new Date().getFullYear()} FilmReel. All rights
                        reserved. Built for cinema lovers.
                    </p>
                    <div className="footer-socials">
                        {/* Placeholder generic social icons as material symbols */}
                        <a
                            href="#"
                            className="footer-social-link"
                            title="Twitter"
                        >
                            <span className="material-symbols-outlined">
                                share
                            </span>
                        </a>
                        <a
                            href="#"
                            className="footer-social-link"
                            title="GitHub"
                        >
                            <span className="material-symbols-outlined">
                                code
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
