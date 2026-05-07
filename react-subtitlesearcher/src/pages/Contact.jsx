import React, { useMemo, useState } from 'react';

const developers = [
  {
    id: 1,
    name: 'Dasheng Yao',
    role: 'Fullstack Developer',
    focus: 'Search experience',
    email: 'dasheng.yao@example.com',
    phone: '(949) 555-0101',
    status: 'Debugging',
    response: 'Usually replies after one good console.log',
  },
  {
    id: 2,
    name: 'Tri Ta',
    role: 'Fullstack Developer',
    focus: 'Frontend polish',
    email: 'tri.ta@example.com',
    phone: '(949) 555-0102',
    status: 'Designing',
    response: 'Fastest on layout mysteries',
  },
  {
    id: 3,
    name: 'Scott McCloskey',
    role: 'Fullstack Developer',
    focus: 'Data flow',
    email: 'scott.mccloskey@example.com',
    phone: '(949) 555-0103',
    status: 'Reviewing',
    response: 'Best for bug reports with steps',
  },
  {
    id: 4,
    name: 'Nora Bukhamseen',
    role: 'Fullstack Developer',
    focus: 'Product details',
    email: 'nora.bukhamseen@example.com',
    phone: '(949) 555-0104',
    status: 'Shipping',
    response: 'Great for feature questions',
  },
];

function Contact() {
  const [selectedFocus, setSelectedFocus] = useState('All');
  const [contactMode, setContactMode] = useState('email');
  const [copied, setCopied] = useState('');
  const [activeDeveloperId, setActiveDeveloperId] = useState(developers[0].id);
  const [message, setMessage] = useState('');

  const focusOptions = useMemo(
    () => ['All', ...developers.map((developer) => developer.focus)],
    []
  );

  const visibleDevelopers = developers.filter(
    (developer) => selectedFocus === 'All' || developer.focus === selectedFocus
  );

  const activeDeveloper =
    developers.find((developer) => developer.id === activeDeveloperId) || developers[0];

  const copyContact = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('Copy unavailable');
      window.setTimeout(() => setCopied(''), 1600);
    }
  };

  return (
    <div className="page-container contact-page">
      <section className="contact-hero">
        <div>
          <p className="contact-kicker">SubtitleSearcher support desk</p>
          <h1>Ping the dev crew</h1>
          <p>
            Pick a developer, copy a fake contact, or draft a quick project note. These
            contacts are placeholders for the INF 124 demo.
          </p>
        </div>

        <div className="contact-console" aria-live="polite">
          <span className="console-dot" />
          <p>route: /contact</p>
          <strong>{activeDeveloper.name}</strong>
          <span>{activeDeveloper.status} | {activeDeveloper.focus}</span>
        </div>
      </section>

      <section className="contact-toolbar" aria-label="Contact controls">
        <div className="segmented-control">
          {focusOptions.map((focus) => (
            <button
              key={focus}
              type="button"
              className={selectedFocus === focus ? 'is-active' : ''}
              onClick={() => setSelectedFocus(focus)}
            >
              {focus}
            </button>
          ))}
        </div>

        <div className="mode-switch" aria-label="Preferred contact method">
          <button
            type="button"
            className={contactMode === 'email' ? 'is-active' : ''}
            onClick={() => setContactMode('email')}
          >
            Email
          </button>
          <button
            type="button"
            className={contactMode === 'phone' ? 'is-active' : ''}
            onClick={() => setContactMode('phone')}
          >
            Phone
          </button>
        </div>
      </section>

      <section className="developer-contact-grid">
        {visibleDevelopers.map((developer) => {
          const contactValue = contactMode === 'email' ? developer.email : developer.phone;

          return (
            <article
              key={developer.id}
              className={`developer-contact-card ${
                activeDeveloperId === developer.id ? 'is-selected' : ''
              }`}
            >
              <button
                type="button"
                className="card-select"
                onClick={() => setActiveDeveloperId(developer.id)}
              >
                <span className="developer-avatar" aria-hidden="true">
                  {developer.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')}
                </span>
                <span>
                  <strong>{developer.name}</strong>
                  <small>{developer.role}</small>
                </span>
              </button>

              <div className="developer-meta">
                <span>{developer.focus}</span>
                <span>{developer.status}</span>
              </div>

              <p>{developer.response}</p>

              <button
                type="button"
                className="copy-contact"
                onClick={() => copyContact(contactValue, `${developer.name} ${contactMode}`)}
              >
                Copy {contactMode === 'email' ? developer.email : developer.phone}
              </button>
            </article>
          );
        })}
      </section>

      <section className="contact-lab">
        <div>
          <h2>Message lab</h2>
          <p>
            Draft a note for {activeDeveloper.name}. The preview updates as you type, so
            the page feels alive without sending anything anywhere.
          </p>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength="220"
            placeholder="Example: Found a subtitle line that links to the wrong episode..."
          />
          <div className="message-tools">
            <span>{message.length}/220</span>
            <button type="button" onClick={() => setMessage('')}>
              Clear
            </button>
          </div>
        </div>

        <div className="message-preview">
          <p className="contact-kicker">Preview</p>
          <h3>To: {activeDeveloper.name}</h3>
          <p>{message || 'Your message preview will appear here.'}</p>
          <span>{copied || 'Ready to copy contact info'}</span>
        </div>
      </section>
    </div>
  );
}

export default Contact;
