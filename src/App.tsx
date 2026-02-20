import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    useLocation,
} from "react-router-dom";
import { Film, User, Sparkles } from "lucide-react";
import "./index.css";

// Layout Component with Navigation
const Layout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();

    const NavLink = ({
        to,
        icon: Icon,
        label,
    }: {
        to: string;
        icon: React.ElementType;
        label: string;
    }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
                    isActive
                        ? "bg-purple-600/20 text-[#8A2BE2] shadow-[0_0_15px_rgba(138,43,226,0.2)] border border-[#8A2BE2]/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 20px",
                    borderRadius: "100px",
                    color: isActive
                        ? "var(--accent-purple-light)"
                        : "var(--text-secondary)",
                    background: isActive
                        ? "rgba(138, 43, 226, 0.15)"
                        : "transparent",
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                }}
            >
                <Icon size={20} />
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
            {/* Sidebar Navigation */}
            <nav
                className="glass-panel"
                style={{
                    width: "var(--sidebar-width)",
                    height: "calc(100vh - 40px)",
                    margin: "20px",
                    padding: "30px 20px",
                    position: "fixed",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 50,
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        padding: "0 10px",
                        marginBottom: "40px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        style={{
                            background:
                                "linear-gradient(135deg, var(--accent-purple), #d08cff)",
                            padding: "10px",
                            borderRadius: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 20px var(--accent-purple-glow)",
                        }}
                    >
                        <Film size={24} color="white" />
                    </div>
                    <h1
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            background:
                                "linear-gradient(to right, white, #d08cff)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        FilmReel
                    </h1>
                </div>

                {/* Links */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}
                >
                    <NavLink to="/" icon={Film} label="Browser" />
                    <NavLink
                        to="/mood"
                        icon={Sparkles}
                        label="Mood Discovery"
                    />
                </div>

                {/* Bottom Section */}
                <div style={{ marginTop: "auto" }}>
                    <NavLink to="/account" icon={User} label="My Account" />
                </div>
            </nav>

            {/* Main Content Area */}
            <main
                style={{
                    marginLeft: "calc(var(--sidebar-width) + 40px)",
                    flex: 1,
                    padding: "20px 40px 40px 20px",
                    width: "calc(100% - var(--sidebar-width) - 40px)",
                }}
            >
                {children}
            </main>
        </div>
    );
};

// Imported Pages
import Home from "./pages/Home";
import MoodSurvey from "./pages/MoodSurvey";
import Account from "./pages/Account";
import MovieViewer from "./pages/MovieViewer";

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/mood" element={<MoodSurvey />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/movie/:id" element={<MovieViewer />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
