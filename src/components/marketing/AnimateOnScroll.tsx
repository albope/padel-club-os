"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type Animation = "fade-up" | "fade-in" | "fade-left" | "fade-right" | "scale-in"

interface AnimateOnScrollProps {
  children: React.ReactNode
  animation?: Animation
  delay?: number
  threshold?: number
  once?: boolean
  className?: string
}

export default function AnimateOnScroll({
  children,
  animation = "fade-up",
  delay = 0,
  threshold = 0.15,
  once = true,
  className,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={cn("landing-reveal", `anim-${animation}`, className)}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
