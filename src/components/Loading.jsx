import { useState, useEffect } from "react";

const LETTERS = [
  { char: "L", color: "hsl(155, 55%, 35%)" },
  { char: "R", color: "hsl(90, 50%, 45%)" },
  { char: "F", color: "hsl(155, 55%, 35%)" },
];

const Loading = () => {
  const [showLetters, setShowLetters] = useState(false);
  const [showDots, setShowDots] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowLetters(true), 300);
    setTimeout(() => setShowDots(true), 900);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[hsl(140,60%,95%)] via-[hsl(140,50%,90%)] to-[hsl(80,50%,88%)] overflow-hidden relative px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-15"
            style={{
              width: `${20 + i * 10}px`,
              height: `${20 + i * 10}px`,
              left: `${8 + i * 16}%`,
              bottom: `-${10 + i * 4}px`,
              backgroundColor: i % 2 === 0 ? "hsl(155, 55%, 40%)" : "hsl(90, 50%, 50%)",
              animation: `float-bubble ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="flex gap-2 sm:gap-3">
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className={`text-6xl sm:text-7xl font-extrabold transition-all duration-500 ${
              showLetters ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{
              color: letter.color,
              transitionDelay: `${i * 150}ms`,
              animation: showLetters ? `letter-bounce 0.6s ease-in-out infinite` : "none",
              animationDelay: `${i * 0.15}s`,
              textShadow: "2px 3px 0px rgba(0,0,0,0.1)",
              fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
            }}
          >
            {letter.char}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mt-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`text-2xl transition-all duration-500 ${showDots ? "opacity-100" : "opacity-0"}`}
            style={{
              color: "hsl(155, 55%, 40%)",
              animation: showDots ? `dot-bounce 1.2s ease-in-out infinite` : "none",
              animationDelay: `${i * 0.2}s`,
            }}
          >
            ●
          </span>
        ))}
      </div>

      <p
        className={`mt-3 text-base font-medium tracking-wider transition-all duration-700 ${showDots ? "opacity-100" : "opacity-0"}`}
        style={{
          color: "hsl(155, 35%, 45%)",
          fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
        }}
      >
        Loading...
      </p>

      <style>{`
        @keyframes float-bubble {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-80px) scale(1.1); }
        }
        @keyframes letter-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.1); }
        }
        @keyframes dot-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Loading;