import { useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
  randomizeBeforeValue?: boolean; // Thêm prop mới
  randomDuration?: number; // Thời gian chạy số ngẫu nhiên
}

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  onStart,
  onEnd,
  randomizeBeforeValue = false, // Mặc định là false
  randomDuration = 1, // 1 giây chạy số ngẫu nhiên
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);
  const [isRandomizing, setIsRandomizing] = useState(randomizeBeforeValue);
  const [targetValue, setTargetValue] = useState(
    direction === "down" ? from : to
  );

  // Calculate damping and stiffness based on duration
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  // Set initial text content
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = String(direction === "down" ? to : from);
    }
  }, [from, to, direction]);

  // Random number effect before showing actual value
  useEffect(() => {
    if (!isRandomizing || !randomizeBeforeValue) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const startRandomizing = () => {
      intervalId = setInterval(() => {
        if (ref.current) {
          const randomValue = Math.floor(Math.random() * 100);
          ref.current.textContent = separator
            ? randomValue.toLocaleString().replace(/,/g, separator)
            : randomValue.toString();
        }
      }, 100); // Thay đổi số mỗi 100ms

      // Sau khoảng thời gian randomDuration thì dừng và hiển thị giá trị thực
      timeoutId = setTimeout(() => {
        setIsRandomizing(false);
        clearInterval(intervalId);
        motionValue.set(targetValue);
      }, randomDuration * 1000);
    };

    const delayedStart = setTimeout(startRandomizing, delay * 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      clearTimeout(delayedStart);
    };
  }, [
    isRandomizing,
    randomizeBeforeValue,
    delay,
    separator,
    motionValue,
    targetValue,
    randomDuration,
  ]);

  // Start the actual count animation
  useEffect(() => {
    if (!isRandomizing && startWhen) {
      if (typeof onStart === "function") {
        onStart();
      }

      const timeoutId = setTimeout(() => {
        motionValue.set(targetValue);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(() => {
        if (typeof onEnd === "function") {
          onEnd();
        }
      }, delay * 1000 + duration * 1000);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [
    isRandomizing,
    startWhen,
    motionValue,
    targetValue,
    delay,
    onStart,
    onEnd,
    duration,
  ]);

  // Update text content with formatted number
  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current && !isRandomizing) {
        const options = {
          useGrouping: !!separator,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        };

        const formattedNumber = Intl.NumberFormat("en-US", options).format(
          Number(latest.toFixed(0))
        );

        ref.current.textContent = separator
          ? formattedNumber.replace(/,/g, separator)
          : formattedNumber;
      }
    });

    return () => unsubscribe();
  }, [springValue, separator, isRandomizing]);

  // Update target value when 'to' prop changes
  useEffect(() => {
    setTargetValue(direction === "down" ? from : to);
    if (randomizeBeforeValue) {
      setIsRandomizing(true);
    }
  }, [to, from, direction, randomizeBeforeValue]);

  return <span className={`${className}`} ref={ref} />;
}
