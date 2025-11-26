import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

/**
 * Header default terlihat, hilang saat scroll, muncul lagi setelah berhenti.
 */
export function useScrollHeader(delay = 900) {
  const anim = useRef(new Animated.Value(0)).current; // 0 visible, 1 hidden
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleScroll = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const headerStyle = {
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -80],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
  };

  return { headerStyle, handleScroll };
}

export default useScrollHeader;
