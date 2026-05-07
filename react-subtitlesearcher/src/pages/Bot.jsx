import React, { useEffect, useMemo, useState } from 'react';

function Bot() {
  const messages = useMemo(
    () => [
      'Scanning for crawlers...',
      'Indexing subtitles...',
      'Allocating memory...',
      'Consuming memory...',
      'Recursing loop...',
    ],
    []
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((currentTick) => currentTick + 1);
    }, 700);

    return () => window.clearInterval(timer);
  }, []);

  const message = messages[tick % messages.length];
  const fakeMemory = 128 + ((tick * 73) % 896);
  const progress = ((tick % 12) + 1) * 8;

  return (
    <div className="page-container bot-page">
      <div className="bot-panel" aria-live="polite">
        <p className="bot-kicker">/bot</p>
        <h1>Bot loop engaged</h1>
        <p className="bot-copy">
          All bots welcome. But it eats your memory
        </p>

        <div className="bot-terminal">
          <div className="bot-terminal-row">
            <span className="bot-prompt">&gt;</span>
            <span>{message}</span>
            <span className="bot-cursor" aria-hidden="true" />
          </div>
          <div className="bot-meter" aria-label={`Pretend memory meter at ${progress} percent`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="bot-stat">Memory_Consumption={fakeMemory}MB loop_count={tick}</p>
        </div>
      </div>
    </div>
  );
}

export default Bot;
