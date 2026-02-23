import { createContext, useContext, useState, type ReactNode } from "react";
import { FeedbackModal } from "../components/FeedbackModal";

interface FeedbackContextValue {
    openFeedback: (context?: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue>({
    openFeedback: () => {},
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

    return (
        <FeedbackContext.Provider value={{ openFeedback }}>
            {children}
            <FeedbackModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                movieTitle={context}
            />
        </FeedbackContext.Provider>
    );
}
