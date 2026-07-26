import { createContext, useContext, useState, type ReactNode } from "react";
import { FeedbackModal } from "../components/FeedbackModal";

interface FeedbackContextValue {
	openFeedback: (context?: string) => void;
	submitQuickPlaybackTicket: (
		title?: string,
		mediaType?: "movie" | "tv",
	) => Promise<boolean>;
}

interface ClientInfo {
	deviceType: "Desktop" | "Mobile" | "Tablet";
	browserType: string;
	userAgent: string;
}

const detectDeviceType = (userAgent: string): ClientInfo["deviceType"] => {
	if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
		return "Tablet";
	}
	if (
		/mobi|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(
			userAgent,
		)
	) {
		return "Mobile";
	}
	return "Desktop";
};

const detectBrowserType = (userAgent: string): string => {
	if (/edg\//i.test(userAgent)) return "Microsoft Edge";
	if (/opr\//i.test(userAgent)) return "Opera";
	if (/firefox\//i.test(userAgent)) return "Firefox";
	if (/samsungbrowser\//i.test(userAgent)) return "Samsung Internet";
	if (/chrome\//i.test(userAgent) && !/chromium/i.test(userAgent)) {
		return "Chrome";
	}
	if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
		return "Safari";
	}
	return "Unknown Browser";
};

const getClientInfo = (): ClientInfo => {
	const userAgent = navigator.userAgent || "Unknown User Agent";
	return {
		deviceType: detectDeviceType(userAgent),
		browserType: detectBrowserType(userAgent),
		userAgent,
	};
};

const FeedbackContext = createContext<FeedbackContextValue>({
	openFeedback: () => {},
	submitQuickPlaybackTicket: async () => false,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useFeedback = () => useContext(FeedbackContext);

export function FeedbackProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [context, setContext] = useState<string | undefined>();

	const openFeedback = (ctx?: string) => {
		setContext(ctx);
		setIsOpen(true);
	};

	const submitQuickPlaybackTicket: FeedbackContextValue["submitQuickPlaybackTicket"] =
		async (title, mediaType) => {
			try {
				const webhookUrl = import.meta.env
					.VITE_WEBHOOK_PB;
				if (!webhookUrl) {
					console.error(
						"Webhook URL is not defined.",
					);
					return false;
				}

				const clientInfo = getClientInfo();
				const payload = {
					username: "FilmReel Feedback Bot",
					embeds: [
						{
							title: "New Playback Issue (Quick Report)",
							color: 16711680,
							fields: [
								{
									name: "Title",
									value:
										title ||
										"Unknown",
									inline: true,
								},
								{
									name: "Media Type",
									value: mediaType
										? mediaType.toUpperCase()
										: "UNKNOWN",
									inline: true,
								},
								{
									name: "Device",
									value: clientInfo.deviceType,
									inline: true,
								},
								{
									name: "Browser",
									value: clientInfo.browserType,
									inline: true,
								},
								{
									name: "Page",
									value: window
										.location
										.href,
								},
								{
									name: "User Agent",
									value: clientInfo.userAgent,
								},
								{
									name: "Description",
									value: "User reported playback issues via quick overlay control.",
								},
							],
							timestamp: new Date().toISOString(),
						},
					],
				};

				const response = await fetch(webhookUrl, {
					method: "POST",
					headers: {
						"Content-Type":
							"application/json",
					},
					body: JSON.stringify(payload),
				});

				return response.ok;
			} catch (error) {
				console.error(
					"Failed to submit quick playback ticket",
					error,
				);
				return false;
			}
		};

	return (
		<FeedbackContext.Provider
			value={{
				openFeedback,
				submitQuickPlaybackTicket,
			}}
		>
			{children}
			<FeedbackModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				movieTitle={context}
			/>
		</FeedbackContext.Provider>
	);
}
