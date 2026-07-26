import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { track } from "@vercel/analytics";
import "../styles/AdblockCheckerBanner.css";

const DISMISS_KEY = "filmreel_adblock_prompt_dismissed_until";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

async function detectAdblocker(): Promise<boolean> {
	const bait = document.createElement("div");
	bait.className = "adsbox ad-banner ad-container pub_300x250 text-ad";
	bait.setAttribute("aria-hidden", "true");
	bait.style.position = "absolute";
	bait.style.left = "-9999px";
	bait.style.top = "-9999px";
	bait.style.width = "1px";
	bait.style.height = "1px";
	document.body.appendChild(bait);

	await new Promise((resolve) => requestAnimationFrame(resolve));

	const style = window.getComputedStyle(bait);
	const blocked =
		bait.offsetParent === null ||
		bait.offsetHeight === 0 ||
		bait.offsetWidth === 0 ||
		style.display === "none" ||
		style.visibility === "hidden";

	bait.remove();
	return blocked;
}

export const AdblockCheckerBanner = () => {
	const [showBanner, setShowBanner] = useState(false);
	const hasTrackedImpressionRef = useRef(false);

	useEffect(() => {
		const runCheck = async () => {
			const dismissedUntil = Number(
				localStorage.getItem(DISMISS_KEY) || "0",
			);
			if (dismissedUntil > Date.now()) {
				return;
			}

			const hasAdblock = await detectAdblocker();
			if (!hasAdblock) {
				setShowBanner(true);
			}
		};

		void runCheck();
	}, []);

	useEffect(() => {
		if (!showBanner || hasTrackedImpressionRef.current) return;
		track("adblock_banner_impression", {
			surface: "global",
			detectedAdblock: false,
		});
		hasTrackedImpressionRef.current = true;
	}, [showBanner]);

	const dismissForNow = () => {
		track("adblock_banner_dismissed", {
			surface: "global",
			dismissDays: 14,
		});
		localStorage.setItem(
			DISMISS_KEY,
			String(Date.now() + DISMISS_MS),
		);
		setShowBanner(false);
	};

	const handleSetupGuideClick = () => {
		track("adblock_setup_guide_clicked", {
			source: "adblock_banner",
			target: "about#adblock-setup",
		});
	};

	if (!showBanner) return null;

	return (
		<div
			className="adblock-banner glass-panel"
			role="status"
			aria-live="polite"
		>
			<div className="adblock-banner-icon" aria-hidden="true">
				<span className="material-symbols-outlined">
					shield
				</span>
			</div>
			<div className="adblock-banner-content">
				<p className="adblock-banner-title">
					Heads up: playback providers may include
					ads.
				</p>
				<p className="adblock-banner-text">
					FilmReel detected no active adblocker in
					this browser. For a cleaner experience,
					set one up for your device or network.
				</p>
			</div>
			<div className="adblock-banner-actions">
				<Link
					className="btn btn-glass adblock-banner-btn"
					to="/about#adblock-setup"
					onClick={handleSetupGuideClick}
				>
					Setup Guide
				</Link>
				<button
					type="button"
					className="btn btn-glass adblock-banner-btn"
					onClick={dismissForNow}
				>
					Dismiss
				</button>
			</div>
		</div>
	);
};
