import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useFeedback } from "../contexts/FeedbackContext";
import { ToastNotif } from "./ToastNotif";
import "../styles/Footer.css";

export const Footer = () => {
	const { openFeedback } = useFeedback();
	const TOAST_DURATION_MS = 2600;
	const TOAST_EXIT_MS = 220;
	const [toast, setToast] = useState<{
		id: number;
		type: "success" | "error" | "info";
		message: string;
	} | null>(null);
	const [isToastClosing, setIsToastClosing] = useState(false);
	const toastHideTimerRef = useRef<number | null>(null);
	const toastRemoveTimerRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (toastHideTimerRef.current) {
				window.clearTimeout(toastHideTimerRef.current);
			}
			if (toastRemoveTimerRef.current) {
				window.clearTimeout(
					toastRemoveTimerRef.current,
				);
			}
		};
	}, []);

	const closeToast = () => {
		if (toastHideTimerRef.current) {
			window.clearTimeout(toastHideTimerRef.current);
		}
		setIsToastClosing(true);
		if (toastRemoveTimerRef.current) {
			window.clearTimeout(toastRemoveTimerRef.current);
		}
		toastRemoveTimerRef.current = window.setTimeout(() => {
			setToast(null);
			setIsToastClosing(false);
		}, TOAST_EXIT_MS);
	};

	const showToast = (
		type: "success" | "error" | "info",
		message: string,
	) => {
		setToast({ id: Date.now(), type, message });
		setIsToastClosing(false);
		if (toastHideTimerRef.current) {
			window.clearTimeout(toastHideTimerRef.current);
		}
		if (toastRemoveTimerRef.current) {
			window.clearTimeout(toastRemoveTimerRef.current);
		}
		toastHideTimerRef.current = window.setTimeout(
			closeToast,
			TOAST_DURATION_MS,
		);
	};

	return (
		<footer className="footer relative z-10">
			{toast && (
				<ToastNotif
					key={toast.id}
					type={toast.type}
					message={toast.message}
					isClosing={isToastClosing}
					durationMs={TOAST_DURATION_MS}
				/>
			)}
			<div className="container">
				<div className="footer-content">
					<div className="footer-brand">
						<Link
							to="/"
							className="footer-logo"
						>
							<div className="footer-logo-icon">
								<span
									className="material-symbols-outlined"
									style={{
										fontSize: "36px",
									}}
								>
									movie_filter
								</span>
							</div>
							<h2 className="footer-logo-text">
								FilmReel
							</h2>
						</Link>
						<p className="footer-description">
							Your AI-powered cinema
							companion. Stop
							scrolling and start
							watching with
							personalized
							recommendations based on
							your current vibe.
						</p>
					</div>

					<div className="footer-section">
						<h4>Explore</h4>
						<ul className="footer-links">
							<li>
								<Link to="/">
									Home
									Dashboard
								</Link>
							</li>
							<li>
								<Link to="/mood">
									Mood
									Survey
								</Link>
							</li>
							<li>
								<Link to="/category/popular">
									Trending
									Now
								</Link>
							</li>
							<li>
								<Link to="/category/top_rated">
									Top
									Rated
								</Link>
							</li>
							<li>
								<Link to="/about">
									About
									FilmReel
								</Link>
							</li>
						</ul>
					</div>

					<div className="footer-section">
						<h4>Account</h4>
						<ul className="footer-links">
							<li>
								<Link to="/account">
									My
									Profile
								</Link>
							</li>
							<li>
								<Link to="/account">
									Mood
									History
								</Link>
							</li>
							<li>
								<a
									href="#"
									onClick={(
										e,
									) => {
										e.preventDefault();
										openFeedback();
									}}
								>
									Send
									Feedback
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="footer-bottom">
					<p className="footer-copyright">
						&copy;{" "}
						{new Date().getFullYear()}{" "}
						FilmReel. All rights reserved.
						Built for cinema lovers.
					</p>
					<div className="footer-socials">
						{/* Placeholder generic social icons as material symbols */}
						<button
							className="footer-social-link footer-button"
							title="Share FilmReel"
							onClick={() => {
								navigator.clipboard
									.writeText(
										window
											.location
											.href,
									)
									.then(
										() => {
											showToast(
												"success",
												"Link copied to clipboard!",
											);
										},
									)
									.catch(
										() => {
											showToast(
												"error",
												"Failed to copy link.",
											);
										},
									);
							}}
						>
							<span className="material-symbols-outlined">
								share
							</span>
						</button>
						<a
							href="https://github.com/JayNightmare/FilmReel"
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
