import "../styles/ToastNotif.css";

interface ToastNotifProps {
	type?: "success" | "error" | "info";
	message: string;
	isClosing?: boolean;
	durationMs?: number;
}

export const ToastNotif = ({
	type = "info",
	message,
	isClosing = false,
	durationMs = 2600,
}: ToastNotifProps) => {
	return (
		<div
			className={`toast-notif ${type} ${isClosing ? "toast-notif--closing" : ""}`}
		>
			<div className="toast-content">
				<span className="toast-message">{message}</span>
			</div>
			<div
				className="toast-progress-track"
				aria-hidden="true"
			>
				<div
					className="toast-progress-fill"
					style={{
						animationDuration: `${durationMs}ms`,
					}}
				/>
			</div>
		</div>
	);
};
