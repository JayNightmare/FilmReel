import { Link } from "react-router-dom";
import "../styles/NotFound.css";

export default function NotFound() {
    return (
        <div className="not-found-page animate-in fade-in">
            <span className="material-symbols-outlined not-found-icon">
                movie_off
            </span>
            <div className="not-found-code">404</div>
            <h1 className="not-found-title">Scene Not Found</h1>
            <p className="not-found-desc">
                Looks like this reel got lost in the cutting room. The page
                you're looking for doesn't exist.
            </p>
            <div className="not-found-actions">
                <Link to="/" className="btn btn-primary">
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px" }}
                    >
                        home
                    </span>
                    Back to Home
                </Link>
                <Link to="/mood" className="btn btn-glass">
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px" }}
                    >
                        auto_awesome
                    </span>
                    Take a Survey
                </Link>
            </div>
        </div>
    );
}
