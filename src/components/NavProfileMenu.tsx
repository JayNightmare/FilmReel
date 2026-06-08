import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UserProfile } from "../services/storage";
import "../styles/NavProfileMenu.css";

const MOBILE_PROFILE_MENU_QUERY = "(max-width: 590px)";

interface NavProfileMenuProps {
	profile: UserProfile;
	onFeedback: () => void;
}

export const NavProfileMenu = ({
	profile,
	onFeedback,
}: NavProfileMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	const isMobileProfileMenu = () =>
		window.matchMedia(MOBILE_PROFILE_MENU_QUERY).matches;

	const closeMenu = useCallback(() => {
		setIsOpen(false);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				closeMenu();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeMenu();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener(
				"mousedown",
				handleClickOutside,
			);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [closeMenu]);

	useEffect(() => {
		const mediaQuery = window.matchMedia(MOBILE_PROFILE_MENU_QUERY);
		const handleViewportChange = () => {
			if (!mediaQuery.matches) {
				closeMenu();
			}
		};

		mediaQuery.addEventListener("change", handleViewportChange);
		return () => {
			mediaQuery.removeEventListener(
				"change",
				handleViewportChange,
			);
		};
	}, [closeMenu]);

	const handleTriggerClick = () => {
		if (!isMobileProfileMenu()) {
			closeMenu();
			navigate("/account");
			return;
		}

		setIsOpen((open) => !open);
	};

	return (
		<div className="nav-profile-menu" ref={menuRef}>
			<button
				type="button"
				className="nav-profile-link group nav-profile-trigger"
				onClick={handleTriggerClick}
				aria-haspopup="menu"
				title="Profile menu"
			>
				<div className="nav-avatar group-hover-border-primary">
					{profile.avatarBase64 ? (
						<img
							alt="User profile"
							src={
								profile.avatarBase64
							}
						/>
					) : (
						<span
							className="material-symbols-outlined"
							style={{
								color: "rgba(255,255,255,0.3)",
								fontSize: "24px",
							}}
						>
							person
						</span>
					)}
				</div>
				<span className="nav-profile-name group-hover-text-primary hidden-md">
					{profile.displayName}
				</span>
				<span className="material-symbols-outlined nav-profile-chevron">
					expand_more
				</span>
			</button>

			{isOpen && isMobileProfileMenu() && (
				<div
					className="nav-profile-dropdown animate-fade-in-up"
					role="menu"
				>
					<Link
						to="/account"
						className="nav-profile-dropdown-item"
						onClick={closeMenu}
						role="menuitem"
					>
						<span className="material-symbols-outlined">
							person
						</span>
						<span>Account</span>
					</Link>
					<Link
						to="/about"
						className="nav-profile-dropdown-item"
						onClick={closeMenu}
						role="menuitem"
					>
						<span className="material-symbols-outlined">
							info
						</span>
						<span>About</span>
					</Link>
					<button
						type="button"
						className="nav-profile-dropdown-item nav-profile-dropdown-button"
						onClick={() => {
							closeMenu();
							onFeedback();
						}}
						role="menuitem"
					>
						<span className="material-symbols-outlined">
							feedback
						</span>
						<span>Leave Feedback</span>
					</button>
				</div>
			)}
		</div>
	);
};
