"use client"

import { cn } from "@/lib/utils"
import { motion, Variants } from "framer-motion"
import { useEffect, useState } from "react"

interface TypewriterPart {
    text: string
    className?: string
}

interface TypewriterProps {
    text: string | string[] | TypewriterPart[]
    speed?: number
    initialDelay?: number
    waitTime?: number
    deleteSpeed?: number
    loop?: boolean
    className?: string
    showCursor?: boolean
    hideCursorOnType?: boolean
    cursorChar?: string | React.ReactNode
    cursorAnimationVariants?: {
        initial: Variants["initial"]
        animate: Variants["animate"]
    }
    cursorClassName?: string
}

const Typewriter = ({
    text,
    speed = 50,
    initialDelay = 0,
    waitTime = 2000,
    deleteSpeed = 30,
    loop = true,
    className,
    showCursor = true,
    hideCursorOnType = false,
    cursorChar = "|",
    cursorClassName = "ml-1",
    cursorAnimationVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                duration: 0.01,
                repeat: Infinity,
                repeatDelay: 0.4,
                repeatType: "reverse",
            },
        },
    },
}: TypewriterProps) => {
    const [displayText, setDisplayText] = useState("")
    const [currentPartIndex, setCurrentPartIndex] = useState(0)
    const [currentIndexInPart, setCurrentIndexInPart] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [sequenceIndex, setSequenceIndex] = useState(0)

    // Normalize input to TypewriterPart[][] (an array of sequences, each sequence is an array of parts)
    const sequences: TypewriterPart[][] = Array.isArray(text)
        ? (typeof text[0] === "string"
            ? (text as string[]).map(t => [{ text: t }])
            : [text as TypewriterPart[]])
        : [[{ text: text as string }]]

    useEffect(() => {
        let timeout: NodeJS.Timeout

        const currentSequence = sequences[sequenceIndex % sequences.length]
        const currentPart = currentSequence[currentPartIndex]

        const startTyping = () => {
            if (isDeleting) {
                // Deleting logic (only if multi-sequence)
                if (displayText === "") {
                    setIsDeleting(false)
                    if (sequenceIndex === sequences.length - 1 && !loop) return
                    setSequenceIndex((prev) => (prev + 1) % sequences.length)
                    setCurrentPartIndex(0)
                    setCurrentIndexInPart(0)
                } else {
                    timeout = setTimeout(() => {
                        setDisplayText((prev) => prev.slice(0, -1))
                    }, deleteSpeed)
                }
            } else {
                // Typing logic
                if (currentPart && currentIndexInPart < currentPart.text.length) {
                    timeout = setTimeout(() => {
                        setDisplayText((prev) => prev + currentPart.text[currentIndexInPart])
                        setCurrentIndexInPart((prev) => prev + 1)
                    }, speed)
                } else if (currentPartIndex < currentSequence.length - 1) {
                    // Move to next part in sequence
                    setCurrentPartIndex((prev) => prev + 1)
                    setCurrentIndexInPart(0)
                } else if (sequences.length > 1 || loop) {
                    // Finished current sequence
                    timeout = setTimeout(() => {
                        if (sequences.length > 1) {
                            setIsDeleting(true)
                        } else if (loop) {
                            // If only one sequence and loop, we might want to just stay there or restart
                            // For simplicity, let's just stay if only one sequence unless logic changes
                        }
                    }, waitTime)
                }
            }
        }

        if (displayText === "" && !isDeleting && sequenceIndex === 0 && currentPartIndex === 0 && currentIndexInPart === 0) {
            timeout = setTimeout(startTyping, initialDelay)
        } else {
            startTyping()
        }

        return () => clearTimeout(timeout)
    }, [
        displayText,
        isDeleting,
        sequenceIndex,
        currentPartIndex,
        currentIndexInPart,
        speed,
        deleteSpeed,
        waitTime,
        sequences,
        initialDelay,
        loop,
    ])

    // Render logic: partition the displayText based on part lengths
    const renderedParts = []
    let charsLeft = displayText.length
    const currentSequence = sequences[sequenceIndex % sequences.length]

    for (let i = 0; i < currentSequence.length; i++) {
        const part = currentSequence[i]
        if (charsLeft <= 0) break
        const take = Math.min(charsLeft, part.text.length)
        renderedParts.push(
            <span key={i} className={part.className}>
                {part.text.slice(0, take)}
            </span>
        )
        charsLeft -= take
    }

    return (
        <div className={cn("inline whitespace-pre-wrap tracking-tight", className)}>
            {renderedParts}
            {showCursor && (
                <motion.span
                    variants={cursorAnimationVariants}
                    className={cn(
                        cursorClassName,
                        hideCursorOnType && !isDeleting && displayText.length < currentSequence.reduce((acc, p) => acc + p.text.length, 0)
                            ? "hidden"
                            : ""
                    )}
                    initial="initial"
                    animate="animate"
                >
                    {cursorChar}
                </motion.span>
            )}
        </div>
    )
}

export { Typewriter }
