import type {
	InstallBannerMode,
	InstallPromptOutcome,
} from "../hooks/useInstallPrompt";
import "../styles/InstallBanner.css";

interface InstallBannerProps {
	isVisible: boolean;
	mode: InstallBannerMode;
	onInstall: () => Promise<InstallPromptOutcome>;
	onDismiss: () => void;
}

export const InstallBanner = ({
	isVisible,
	mode,
	onInstall,
	onDismiss,
}: InstallBannerProps) => {
	if (!isVisible) {
		return null;
	}

	return (
		<div className="install-banner">
			<div className="container install-banner-inner">
				<div className="install-banner-copy">
					<span className="material-symbols-outlined install-banner-icon">
						download
					</span>
					<div>
						<strong>
							Install FilmReel on your
							phone
						</strong>
						<p>
							{mode === "ios-manual"
								? "Tap Share, then choose Add to Home Screen for fast access like a native app."
								: "Add FilmReel to your home screen for faster access and an app-like experience."}
						</p>
					</div>
				</div>
				<div className="install-banner-actions">
					{mode === "prompt" && (
						<button
							type="button"
							className="btn btn-primary install-banner-button"
							onClick={() => {
								void onInstall();
							}}
						>
							Install
						</button>
					)}
					<button
						type="button"
						className="btn btn-glass install-banner-dismiss"
						onClick={onDismiss}
					>
						Not now
					</button>
				</div>
			</div>
		</div>
	);
};
