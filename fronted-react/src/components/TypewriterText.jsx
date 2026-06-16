import { useEffect, useState } from "react";
import MarkdownMessage from "./MarkdownMessage";

export default function TypewriterText({ text, speed = 12, onComplete }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;

    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  if (done) {
    return <MarkdownMessage content={text} />;
  }

  return (
    <div className="min-w-0 max-w-full break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
      {displayed}
      {displayed.length < text.length && (
        <span className="ml-0.5 inline-block w-2 animate-pulse bg-neon-cyan">&nbsp;</span>
      )}
    </div>
  );
}
