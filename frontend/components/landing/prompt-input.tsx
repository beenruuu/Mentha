import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

// --- Component Variants for the gradient border ---
const promptInputVariants = cva(
    "relative w-full overflow-hidden rounded-2xl p-px shadow-lg transition-shadow duration-300 hover:shadow-emerald-500/20",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-emerald-300/80 via-teal-300/80 to-emerald-400/80",
                magic: "bg-gradient-to-r from-rose-400/80 via-fuchsia-500/80 to-indigo-500/80",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

// --- Prop Interface for type-safety and documentation ---
export interface PromptInputProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onSubmit">,
    VariantProps<typeof promptInputVariants> {
    /** The number of credits remaining for the user. */
    credits?: number;
    /** Function to handle the 'Upgrade' button click. */
    onUpgrade?: () => void;
    /** Function to handle the submission of the prompt. */
    onPromptSubmit?: (value: string) => void;
    /** A boolean to indicate if the component is in a loading state. */
    isLoading?: boolean;
    /** Localized strings passed from parent */
    texts: {
        placeholder: string;
        creditsRemaining: string;
        upgrade: string;
    };
}

/**
 * A comprehensive, theme-adaptive chat input component with a dismissible
 * credit banner, a customizable action toolbar, and engaging animations.
 */
const PromptInput = React.forwardRef<HTMLTextAreaElement, PromptInputProps>(
    ({ className, variant, credits = 3, onUpgrade, onPromptSubmit, isLoading, texts, ...props }, ref) => {
        const [showBanner, setShowBanner] = React.useState(true);
        const [value, setValue] = React.useState("");
        const router = useRouter();

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setValue(e.target.value);
            if (props.onChange) {
                props.onChange(e);
            }
        };

        const handleSubmit = () => {
            if (!value.trim()) return;

            if (onPromptSubmit) {
                onPromptSubmit(value);
            } else {
                // Default behavior: Redirect to signup with URL
                router.push(`/auth/signup?url=${encodeURIComponent(value)}`);
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        };

        return (
            <div className={cn(promptInputVariants({ variant }), className)}>
                <div className="relative flex h-full w-full flex-col rounded-[15px] bg-white dark:bg-black/90">
                    {/* Credits Banner with enter/exit animation */}
                    <AnimatePresence>
                        {showBanner && credits > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center justify-between p-2 px-4 text-xs sm:text-sm bg-gradient-to-r from-emerald-100/30 via-teal-100/20 to-transparent dark:from-emerald-900/20 dark:via-teal-900/10">
                                    <span className="text-muted-foreground mr-2">
                                        <span className="font-semibold text-foreground">{credits}</span> {texts.creditsRemaining}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        {onUpgrade && (
                                            <button onClick={onUpgrade} className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                                                {texts.upgrade}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowBanner(false)}
                                            aria-label="Dismiss banner"
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Input Area */}
                    <div className="flex flex-col p-3 sm:p-4">
                        <TextareaAutosize
                            ref={ref}
                            className="w-full resize-none bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
                            minRows={1}
                            maxRows={8}
                            placeholder={texts.placeholder}
                            value={value}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            style={props.style as any}
                            {...props}
                        />

                        {/* Toolbar and Submit Button */}
                        <div className="mt-3 flex items-center justify-end">
                            <button
                                onClick={handleSubmit}
                                aria-label="Submit prompt"
                                disabled={isLoading || !value.trim()}
                                className={cn(
                                    "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-500 text-white transition-all duration-300 ease-in-out",
                                    "hover:bg-emerald-600 shadow-md hover:shadow-emerald-500/25",
                                    "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
                                    "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                                )}
                            >
                                {/* Loading spinner */}
                                {isLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <ArrowUp size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);
PromptInput.displayName = "PromptInput";

export { PromptInput };
