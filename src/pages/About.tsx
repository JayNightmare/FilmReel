import { useEffect } from "react";
import { Link } from "react-router";
import { useLocation } from "react-router";
import { useFeedback } from "../contexts/FeedbackContext";
import "../styles/About.css";

export default function About() {
	const { openFeedback } = useFeedback();
	const location = useLocation();

	useEffect(() => {
		if (location.hash !== "#adblock-setup") return;

		const scrollToSection = () => {
			const section =
				document.getElementById("adblock-setup");
			if (!section) return;
			section.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		};

		requestAnimationFrame(scrollToSection);
		setTimeout(scrollToSection, 140);
	}, [location.hash]);

	return (
		<div className="about-page animate-in fade-in">
			<header className="about-hero glass-panel">
				<p className="about-eyebrow">About FilmReel</p>
				<h1 className="about-title">
					I built FilmReel to help you stop
					endless scrolling and actually watch
					something great.
				</h1>
				<p className="about-subtitle">
					This project is my personal take on fast
					movie discovery: mood-driven, simple to
					use, and respectful of your privacy.
				</p>
			</header>

			<section className="about-grid">
				<article className="about-card glass-panel">
					<h2>Privacy First</h2>
					<p>
						I designed FilmReel with a
						privacy-first approach. Profile
						settings, mood history, watch
						progress, and preferences are
						stored locally in your browser
						and are not sent to my own
						servers.
					</p>
					<p>
						Ads shown during playback are
						served by the embedded
						third-party player iframe
						because they provide the
						playback service. That provider
						may process playback context
						like title type, progress, and
						server/player-preference
						behavior in its own iframe
						environment, and related iframe
						data is also stored in browser
						context.
					</p>
				</article>

				<article className="about-card glass-panel">
					<h2>How FilmReel Works</h2>
					<p>
						I built the flow around your
						current vibe. You can run the
						mood survey, jump into curated
						categories, or use smart search
						with filters to find exactly
						what you want.
					</p>
					<ul>
						<li>
							Mood-based
							recommendation flow
						</li>
						<li>
							Fast browsing for movies
							and TV
						</li>
						<li>
							Local watchlist and
							watch progress tracking
						</li>
					</ul>
					<Link
						to="/mood"
						className="btn btn-glass about-cta"
					>
						Take Mood Survey
					</Link>
				</article>

				<article className="about-card glass-panel">
					<h2>About Me</h2>
					<p>
						I’m Jay Nightmare. My background
						is in full stack design with a
						focus on frontend UI design,
						reverse engineering, and open
						source development.
					</p>
					<p>
						I care a lot about making
						interfaces clean, responsive,
						and practical while still
						feeling good to use.
					</p>
					<div className="about-links">
						<a
							title="Jay Nightmare GitHub Profile"
							href="https://github.com/JayNightmare"
							target="_blank"
							rel="noreferrer noopener"
						>
							GitHub Profile
						</a>
						<a
							title="FilmReel Portfolio"
							href="https://github.com/JayNightmare/FilmReel"
							target="_blank"
							rel="noreferrer noopener"
						>
							FilmReel Repository
						</a>
					</div>
				</article>

				<article className="about-card glass-panel">
					<h2>Tech Stack</h2>
					<ul>
						<li>
							React + TypeScript +
							Vite
						</li>
						<li>
							TMDB metadata
							integration for
							discovery
						</li>
						<li>
							Local browser storage
							for profile and history
						</li>
						<li>
							Responsive UI system
							with reusable components
						</li>
					</ul>
				</article>

				<article className="about-card glass-panel">
					<h2>Contributing</h2>
					<p>
						FilmReel is public and open for
						ideas. If you spot a bug or want
						a feature, open an issue or PR
						and I'll take a look.
					</p>
					<a
						className="btn btn-glass about-cta"
						href="https://github.com/JayNightmare/FilmReel"
						target="_blank"
						rel="noreferrer noopener"
					>
						Open Issues / PRs
					</a>
				</article>

				<article className="about-card glass-panel">
					<h2>Contact & Feedback</h2>
					<p>
						If you want to share ideas, UX
						feedback, or report something
						odd, you can send it directly
						from here.
					</p>
					<button
						type="button"
						className="btn btn-glass about-cta"
						onClick={() =>
							openFeedback(
								"About Page",
							)
						}
					>
						Send Feedback
					</button>
					<p>
						Thanks for trying FilmReel and
						supporting an independent open
						source project.
					</p>
				</article>

				<article
					id="adblock-setup"
					className="about-card glass-panel about-card-wide"
				>
					<h2>
						Adblock Setup Guide (Phone + TV
						+ Network)
					</h2>
					<p>
						Because playback is embedded
						from third-party providers, ads
						can appear there. I cannot
						remove those ads server-side,
						but you can reduce them by
						running an adblocker on your
						browser or network.
					</p>
					<div className="about-adblock-grid">
						<div className="about-adblock-item">
							<h3>Android Phones</h3>
							<p>
								Use a browser
								with extension
								support or a
								mobile browser
								with built-in
								ad/tracker
								blocking. Then
								enable a
								reputable filter
								list.
							</p>
						</div>
						<div className="about-adblock-item">
							<h3>iPhone / iPad</h3>
							<p>
								Use Safari
								content blockers
								from the App
								Store and turn
								them on in iOS
								settings for
								Safari.
							</p>
						</div>
						<div className="about-adblock-item">
							<h3>Smart TVs</h3>
							<p>
								If your TV
								browser supports
								extensions,
								install one
								there. If not,
								network-level
								blocking is
								usually the
								easiest route.
							</p>
						</div>
						<div className="about-adblock-item">
							<h3>
								Network-Wide
								Option
							</h3>
							<p>
								NodeVPN can be
								used as a
								network-wide
								blocker setup so
								phones, TVs, and
								other devices
								can benefit from
								ad/tracker
								filtering
								without
								per-device
								browser addons.
							</p>
						</div>
					</div>
					<p className="about-adblock-note">
						Tip: if a player still shows
						ads, check whether private
						DNS/VPN/adblocker is active on
						that specific device and browser
						profile.
					</p>
				</article>
			</section>
		</div>
	);
}
