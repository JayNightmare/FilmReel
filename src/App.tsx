import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Imported Pages
import Home from "./pages/Home";
import Category from "./pages/Category";
import SearchResults from "./pages/SearchResults";
import MoodSurvey from "./pages/MoodSurvey";
import Account from "./pages/Account";
import MovieViewer from "./pages/MovieViewer";
import TVViewer from "./pages/TVViewer";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { FeedbackProvider } from "./contexts/FeedbackContext";

const Layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<FeedbackProvider>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					minHeight: "100vh",
				}}
			>
				<Navbar />

				<main
					className="container"
					style={{
						flexGrow: 1,
						padding: "32px 24px",
						display: "flex",
						flexDirection: "column",
					}}
				>
					{children}
				</main>

				<Footer />
			</div>
		</FeedbackProvider>
	);
};

function App() {
	return (
		<BrowserRouter>
			<Layout>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route
						path="/mood"
						element={<MoodSurvey />}
					/>
					<Route
						path="/category/:id"
						element={<Category />}
					/>
					<Route
						path="/search"
						element={<SearchResults />}
					/>
					<Route
						path="/account"
						element={<Account />}
					/>
					<Route
						path="/about"
						element={<About />}
					/>
					<Route
						path="/movie/:id"
						element={<MovieViewer />}
					/>
					<Route
						path="/tv/:id"
						element={<TVViewer />}
					/>
					<Route
						path="*"
						element={<NotFound />}
					/>
				</Routes>
			</Layout>
		</BrowserRouter>
	);
}

export default App;
