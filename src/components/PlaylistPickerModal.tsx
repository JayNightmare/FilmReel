import { useCallback, useEffect, useState } from "react";
import { useStorageSync } from "../hooks/useStorageSync";
import {
	StorageService,
	type Playlist,
	type WatchlistItem,
} from "../services/storage";
import "../styles/PlaylistPickerModal.css";

const PLAYLISTS_KEY = "filmreel_custom_playlists";

interface PlaylistPickerModalProps {
	isOpen: boolean;
	item: Omit<WatchlistItem, "addedAt">;
	onClose: () => void;
	initialMode?: "pick" | "create";
}

export const PlaylistPickerModal = ({
	isOpen,
	item,
	onClose,
	initialMode = "pick",
}: PlaylistPickerModalProps) => {
	const playlists = useStorageSync<Playlist[]>(
		PLAYLISTS_KEY,
		StorageService.getPlaylists,
	);
	const [mode, setMode] = useState<"pick" | "create">(initialMode);
	const [newPlaylistName, setNewPlaylistName] = useState("");
	const [error, setError] = useState<string | null>(null);

	const resetState = useCallback(() => {
		setMode(initialMode);
		setNewPlaylistName("");
		setError(null);
	}, [initialMode]);

	const handleClose = useCallback(() => {
		resetState();
		onClose();
	}, [onClose, resetState]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleClose();
			}
		},
		[handleClose],
	);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		document.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [handleKeyDown, isOpen]);

	if (!isOpen) {
		return null;
	}

	const activePlaylistIds = new Set(
		playlists
			.filter((playlist) =>
				playlist.items.some(
					(playlistItem) =>
						playlistItem.id === item.id,
				),
			)
			.map((playlist) => playlist.id),
	);

	const handleTogglePlaylist = (playlistId: string) => {
		if (activePlaylistIds.has(playlistId)) {
			StorageService.removeFromPlaylist(playlistId, item.id);
			return;
		}

		StorageService.addToPlaylist(playlistId, item);
	};

	const handleCreatePlaylist = () => {
		try {
			const playlist =
				StorageService.createPlaylist(newPlaylistName);
			StorageService.addToPlaylist(playlist.id, item);
			setMode("pick");
			setNewPlaylistName("");
			setError(null);
		} catch (createError) {
			setError(
				createError instanceof Error
					? createError.message
					: "Unable to create playlist.",
			);
		}
	};

	return (
		<div className="playlist-modal-overlay" onClick={handleClose}>
			<div
				className={`playlist-modal ${mode === "create" ? "playlist-modal--create" : ""}`}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="playlist-modal-header">
					<div>
						<p className="playlist-modal-kicker">
							{mode === "create"
								? "Create playlist"
								: "Save to playlist"}
						</p>
						<h2>{item.title}</h2>
					</div>
					<button
						type="button"
						className="playlist-modal-close"
						onClick={handleClose}
						title="Close"
					>
						<span className="material-symbols-outlined">
							close
						</span>
					</button>
				</div>

				<div className="playlist-modal-body">
					{mode === "pick" ? (
						playlists.length === 0 ? (
							<p className="playlist-modal-empty">
								No playlists
								yet. Use the add
								button next to
								the bookmark to
								create one.
							</p>
						) : (
							<div className="playlist-modal-list">
								{playlists.map(
									(
										playlist,
									) => {
										const isActive =
											activePlaylistIds.has(
												playlist.id,
											);

										return (
											<button
												key={
													playlist.id
												}
												type="button"
												className={`playlist-modal-item ${isActive ? "active" : ""}`}
												onClick={() =>
													handleTogglePlaylist(
														playlist.id,
													)
												}
											>
												<span className="playlist-modal-item-name">
													{
														playlist.name
													}
												</span>
												<span className="playlist-modal-item-icon-wrap">
													<span className="playlist-modal-item-count">
														{
															playlist
																.items
																.length
														}
													</span>
													<span className="material-symbols-outlined playlist-modal-item-icon">
														{isActive
															? "check"
															: "add"}
													</span>
												</span>
											</button>
										);
									},
								)}
							</div>
						)
					) : (
						<div className="playlist-modal-create-box">
							<label
								className="playlist-modal-label"
								htmlFor="playlist-name"
							>
								Name your new
								list
							</label>
							<div className="playlist-modal-create-row">
								<input
									id="playlist-name"
									type="text"
									className="playlist-modal-input"
									value={
										newPlaylistName
									}
									onChange={(
										event,
									) =>
										setNewPlaylistName(
											event
												.target
												.value,
										)
									}
									placeholder="Weekend picks"
									maxLength={
										40
									}
									autoFocus
								/>
								<button
									type="button"
									className="btn btn-primary playlist-modal-create-button"
									onClick={
										handleCreatePlaylist
									}
									disabled={
										newPlaylistName.trim()
											.length ===
										0
									}
								>
									Create
								</button>
							</div>
							<button
								type="button"
								className="playlist-modal-back"
								onClick={() => {
									setMode(
										"pick",
									);
									setError(
										null,
									);
								}}
							>
								Back to lists
							</button>
							{error && (
								<p className="playlist-modal-error">
									{error}
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
