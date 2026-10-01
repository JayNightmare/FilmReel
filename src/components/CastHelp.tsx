import { useRef } from "react";
import "../styles/CastHelp.css";

export function CastHelp({ className }: { className: string }) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	return (
		<>
			<button
				type="button"
				className={className}
				title="How to mirror FilmReel to a Chromecast"
				aria-label="How to mirror FilmReel to a Chromecast"
				onClick={(event) => {
					event.stopPropagation();
					dialogRef.current?.showModal();
				}}
			>
				<span className="material-symbols-outlined" aria-hidden="true">
					cast
				</span>
				<span className="cast-help-button-label">Cast help</span>
			</button>
			<dialog
				ref={dialogRef}
				className="cast-help-dialog"
				aria-labelledby="cast-help-title"
				onClick={(event) => {
					if (event.target === event.currentTarget) {
						event.currentTarget.close();
					}
				}}
			>
				<div className="cast-help-content">
					<div className="cast-help-header">
						<h2 id="cast-help-title">Watch on Chromecast</h2>
						<button
							type="button"
							className="cast-help-close"
							aria-label="Close casting help"
							onClick={() => dialogRef.current?.close()}
						>
							<span className="material-symbols-outlined" aria-hidden="true">
								close
							</span>
						</button>
					</div>
					<p>
						FilmReel cannot start casting the whole website from a
						web page. The servers&apos; Cast buttons depend on their
						own players, but you can mirror your screen instead.
					</p>
					<h3>Android phone or tablet (no PC needed)</h3>
					<ol>
						<li>Connect your phone and Chromecast to the same Wi-Fi.</li>
						<li>
							Open Google Home, select your Chromecast, then tap
							<strong> Cast my screen</strong> and confirm.
						</li>
						<li>
							Return to FilmReel on your phone and start the
							movie or episode. Keep your phone awake while
							mirroring.
						</li>
					</ol>
					<h3>Computer with Chrome</h3>
					<p>
						Open Chrome&apos;s menu, choose <strong>Cast</strong>, select
						your Chromecast and cast this tab. If needed, choose
						<strong> Sources → Cast tab</strong>.
					</p>
					<p>
						iPhone and iPad cannot natively mirror their whole screen
						to Chromecast. Screen mirroring may also show a black
						video or no audio if a third-party player restricts it;
						FilmReel cannot override those restrictions.
					</p>
				</div>
			</dialog>
		</>
	);
}
