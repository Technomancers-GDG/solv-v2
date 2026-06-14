import { useState, useEffect } from "react";

export function DemoNarrator({ latestDecision, activityFeed }) {
  const [displayedText, setDisplayedText] = useState("");
  const [targetText, setTargetText] = useState("System initialized. AI Agent monitoring supply chain network for disruptions...");
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const hideTimeout = setTimeout(() => setIsVisible(false), 12000);
    return () => clearTimeout(hideTimeout);
  }, [targetText]);

  useEffect(() => {
    if (latestDecision) {
      let narratorText = `AI Decision Engine evaluated ${(latestDecision.action || "a new route").replace(/_/g, " ").toUpperCase()}. `;
      if (latestDecision.explanation) {
        narratorText += latestDecision.explanation;
      }
      if (targetText !== narratorText) {
        setTargetText(narratorText);
        setDisplayedText("");
      }
    } else if (activityFeed && activityFeed.length > 0) {
      const latest = activityFeed[0];
      const newText = `System update: ${latest.message}`;
      if (targetText !== newText) {
        setTargetText(newText);
        setDisplayedText("");
      }
    }
  }, [latestDecision, activityFeed, targetText]);

  useEffect(() => {
    if (displayedText !== targetText) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        setDisplayedText(targetText.substring(0, displayedText.length + 2)); // type 2 chars at a time
      }, 25);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [displayedText, targetText]);

  if (!isVisible) return null;

  return (
    <div className="demo-narrator">
      <div className={`demo-narrator-dot ${isTyping ? "typing" : "idle"}`} />
      <div className="demo-narrator-text">
        <strong className="demo-narrator-label">NARRATOR: </strong>
        {displayedText}
        {isTyping && <span className="demo-narrator-cursor">▋</span>}
      </div>
    </div>
  );
}
