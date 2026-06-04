import React, { useMemo, useState } from 'react';

const developers = [
  {
    id: 1,
    name: 'Dasheng Yao',
    role: 'Fullstack Developer',
    focus: 'Search Systems',
    email: 'dashengy@uci.edu',
    phone: '(949) 590-0119',
    tags: ['Search', 'Frontend', 'Architecture'],
  },
  {
    id: 2,
    name: 'Tri Ta',
    role: 'Fullstack Developer',
    focus: 'Frontend Polish',
    email: 'tmta2@uci.edu',
    phone: '(949) 555-0102',
    tags: ['React', 'UI', 'Responsive'],
  },
  {
    id: 3,
    name: 'Scott McCloskey',
    role: 'Fullstack Developer',
    focus: 'Data Flow',
    email: 'mcclosks@uci.edu',
    phone: '(949) 555-0103',
    tags: ['Backend', 'APIs', 'Testing'],
  },
  {
    id: 4,
    name: 'Nora Bukhamseen',
    role: 'Fullstack Developer',
    focus: 'Product Details',
    email: 'Noraessam@uci.edu',
    phone: '(949) 555-0104',
    tags: ['Research', 'QA', 'Product'],
  },
];

const supportSections = [
  { title: 'Quick Contact', body: 'Reach the developer most aligned with your question.' },
  { title: 'Project Support', body: 'Ask about setup, local search behavior, and subtitle indexing.' },
  { title: 'Bug Report', body: 'Share what you searched, what happened, and what you expected.' },
  { title: 'Feature Request', body: 'Suggest new quote, subtitle, or discovery workflows.' },
];

function initials(name) {
  return name.split(' ').map((part) => part[0]).join('');
}

function Contact() {
  const [selectedFocus, setSelectedFocus] = useState('All');
  const [contactMode, setContactMode] = useState('email');
  const [copied, setCopied] = useState('');
  const [activeDeveloperId, setActiveDeveloperId] = useState(developers[0].id);
  const [message, setMessage] = useState('');

  const focusOptions = useMemo(() => ['All', ...developers.map((developer) => developer.focus)], []);
  const visibleDevelopers = developers.filter(
    (developer) => selectedFocus === 'All' || developer.focus === selectedFocus,
  );
  const activeDeveloper = developers.find((developer) => developer.id === activeDeveloperId) || developers[0];

  const copyContact = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(`${label} copied`);
    } catch {
      setCopied('Copy unavailable');
    }
    window.setTimeout(() => setCopied(''), 1600);
  };

  return (
    <div className="cinema-page interior-page contact-page">
      <section className="contact-hero">
        <div>
          <p className="eyebrow">Support Center</p>
          <h1>Get help from the SubtitleSearcher team.</h1>
          <p>
            Route bugs, feature ideas, project questions, and subtitle search feedback to the right developer.
          </p>
        </div>
        <div className="contact-console" aria-live="polite">
          <span className="console-dot" />
          <p>Active contact</p>
          <strong>{activeDeveloper.name}</strong>
          <span>{activeDeveloper.focus}</span>
        </div>
      </section>

      <section className="support-grid" aria-label="Support options">
        {supportSections.map((section) => (
          <article className="info-card" key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.body}</p>
          </article>
        ))}
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

      <section className="profile-grid">
        {visibleDevelopers.map((developer) => {
          const contactValue = contactMode === 'email' ? developer.email : developer.phone;

          return (
            <article
              key={developer.id}
              className={`profile-card contact-profile ${activeDeveloperId === developer.id ? 'is-selected' : ''}`}
            >
              <button type="button" className="profile-select" onClick={() => setActiveDeveloperId(developer.id)}>
                <span className="developer-avatar" aria-hidden="true">{initials(developer.name)}</span>
                <span>
                  <strong>{developer.name}</strong>
                  <small>{developer.role}</small>
                </span>
              </button>
              <div className="tag-row">
                {developer.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => copyContact(contactValue, developer.name)}
              >
                Copy {contactMode === 'email' ? developer.email : developer.phone}
              </button>
            </article>
          );
        })}
      </section>

      <section className="contact-lab">
        <div>
          <p className="eyebrow">Message Draft</p>
          <h2>Prepare a note for {activeDeveloper.name}.</h2>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength="220"
            placeholder="Example: Quote search returns the right line, but the timestamp looks off..."
          />
          <div className="message-tools">
            <span>{message.length}/220</span>
            <button type="button" onClick={() => setMessage('')}>Clear</button>
          </div>
        </div>

        <div className="message-preview">
          <p className="eyebrow">Preview</p>
          <h3>To: {activeDeveloper.name}</h3>
          <p>{message || 'Your message preview will appear here.'}</p>
          <span>{copied || 'Ready to copy contact info'}</span>
        </div>
      </section>
    </div>
  );
}

export default Contact;
