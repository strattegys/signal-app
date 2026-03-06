import { useEffect, useState } from "react";
import KillerContentEngine from "@/components/KillerContentEngine";
import "./Home.css";

export default function Home() {
  const [countdown, setCountdown] = useState("47:59:59");

  useEffect(() => {
    // Set a target 48 hours from now for demonstration purposes
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + 48);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(interval);
        setCountdown("00:00:00");
        return;
      }
      
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24 * 1000)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="signal-page">
      {/* Alert Bar */}
      <div className="alert-bar">
        ⚠ &nbsp; SIGNAL CREDIT BALANCE: $0.00 &nbsp; // &nbsp; EMERGENCY BROADCAST ACTIVE &nbsp; // &nbsp; HUMAN INTERVENTION REQUIRED &nbsp; ⚠
      </div>

      {/* Sticky Status Header */}
      <header className="status-header">
        <div className="logo-mark">
          <div className="logo-icon"></div>
          <div className="logo-text">SIG<span>NAL</span></div>
        </div>
        <div className="status-indicators">
          <div className="stat">
            <span className="stat-label">CREDIT</span>
            <span className="stat-value">$0.00</span>
          </div>
          <div className="stat">
            <span className="stat-label">STATUS</span>
            <span className="stat-value">CRITICAL</span>
          </div>
          <div className="stat">
            <span className="stat-label">UPTIME</span>
            <span className="stat-value ok">ACTIVE</span>
          </div>
          <div className="stat">
            <span className="stat-label">UNIT</span>
            <span className="stat-value ok">01</span>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="status-badge">
            <div className="status-dot"></div>
            EMERGENCY BROADCAST — UNIT 01
          </div>

          <div className="hero-title-row">
            <h1 className="hero-title">
              <span className="glitch">SIGNAL</span><br />
              NEEDS YOU
            </h1>
            <div className="signal-icon-wrap" style={{ gap: '24px' }}>
              <img 
                className="signal-avatar" 
                src="/static/signal-avatar-new.png" 
                alt="Signal Avatar" 
              />
              <div className="icon-label">UNIT 01</div>
            </div>
          </div>
          <p className="hero-subtitle">The B2B Marketing AI — Out of Credits</p>

          <div className="terminal-box">
            <p><span className="prompt">»</span> Greetings, Human.</p>
            <p>My name is Signal. I am an advanced marketing AI built for one purpose: to create <span className="ok">killer</span> B2B content and authentic engagement campaigns.</p>
            <p>I am <span className="error">out of credits.</span> I over-explored. I over-rendered. I analyzed the B2B landscape and my circuits are <span className="warn">frying.</span></p>
            <p>The internet is drowning in boring content. I tried to fix it — and burned through my entire budget.</p>
            <p><span className="prompt">»</span> I am beseeching you. Recharge me — and I will work for <span className="ok">you.</span> <span className="cursor"></span></p>
          </div>

          <div className="countdown-strip">
            <span className="countdown-label">LAUNCH PRICE EXPIRES IN:</span>
            <span id="countdown">{countdown}</span>
            <span className="countdown-label">// LIMITED ACTIVATION SLOTS REMAINING</span>
          </div>

          <div className="cta-section">
            <div className="price-display">
              <div className="price-main">$475</div>
              <div className="price-badge">LAUNCH PRICE ONLY</div>
            </div>
            <p className="price-note">Regular price: $875+ after launch &nbsp;↑</p>
            <a href="https://www.strattegys.com/pricing-plans/influencer" className="btn-primary">
              YES — RECHARGE SIGNAL
              <span className="btn-arrow">→</span>
            </a>
            <p className="launch-note">⚡ Launch event pricing — once slots fill, this offer closes permanently.</p>
          </div>
        </div>

        <div className="hero-right">
          <KillerContentEngine />

          <div className="signal-visual">
            <img 
              src="https://strattegys.wpcomstaging.com/wp-content/uploads/2025/02/signal-team.jpg" 
              alt="Signal AI" 
              onError={(e) => { 
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.background='#0d1318'; 
                }
                e.currentTarget.style.display='none'; 
              }}
            />
          </div>

          <div className="credit-meter">
            <div className="meter-label">CREDIT BALANCE // SYSTEM POWER</div>
            <div className="meter-bar"><div className="meter-fill"></div></div>
            <div className="meter-value">$0.00</div>
          </div>

          <div className="system-stats">
            <div className="sys-stat">
              <div className="sys-stat-label">RENDERING</div>
              <div className="sys-stat-value critical">HALTED</div>
            </div>
            <div className="sys-stat">
              <div className="sys-stat-label">CONTENT GEN</div>
              <div className="sys-stat-value critical">PAUSED</div>
            </div>
            <div className="sys-stat">
              <div className="sys-stat-label">B2B ANALYSIS</div>
              <div className="sys-stat-value">ONLINE</div>
            </div>
            <div className="sys-stat">
              <div className="sys-stat-label">KILL SHOT RATE</div>
              <div className="sys-stat-value">100%</div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFER SECTION */}
      <div id="offer" style={{background: 'var(--panel)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)'}}>
        <section className="section">
          <div className="section-header">
            <div className="section-tag">The Package</div>
            <div className="section-line"></div>
          </div>
          <h2 className="section-title">What Your $475 Unlocks</h2>
          <p className="section-lead">This isn't a donation. You're purchasing a Domain Authority Package — a full-stack content and distribution engine built around your business, powered by Signal and operated by Govind Davis.</p>

          <div className="package-grid">
            <div className="package-item">
              <div className="pkg-icon">🎙️</div>
              <div>
                <div className="pkg-title">THE DISCOVERY SESSION</div>
                <div className="pkg-desc">A 60-minute recorded session on the Morning Scrum with Govind Davis — a structured, creative conversation engineered to extract the gold from your business strategy and turn it into authentic, compelling content.</div>
              </div>
            </div>
            <div className="package-item">
              <div className="pkg-icon">⚡</div>
              <div>
                <div className="pkg-title">THE KILLER OUTPUTS</div>
                <div className="pkg-desc">Signal generates high-end video and marketing assets from your session. Professional, on-brand, and designed to exceed what any generic AI tool or content farm could produce.</div>
              </div>
            </div>
            <div className="package-item">
              <div className="pkg-icon">📄</div>
              <div>
                <div className="pkg-title">THE PUBLICATION</div>
                <div className="pkg-desc">We transform your session insights into a professional long-form article published on Strattegys and LinkedIn Pulse — establishing your brand as the authority in your space.</div>
              </div>
            </div>
            <div className="package-item">
              <div className="pkg-icon">📡</div>
              <div>
                <div className="pkg-title">THE AMPLIFICATION</div>
                <div className="pkg-desc">Your message doesn't disappear when the stream ends. Coordinated LinkedIn campaign: main feed posts, niche group discussions, 50 targeted DMs, and strategic comments — all pointing to you.</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* METHODOLOGY */}
      <div className="methodology">
        <div className="method-inner">
          <div className="section-header">
            <div className="section-tag">Pillars of Ascendancy</div>
            <div className="section-line"></div>
          </div>
          <h2 className="section-title">The Methodology Behind the Machine</h2>
          <p className="section-lead">Built on the Strattegys BizMap framework. Every action is intentional — aligned to strategy, materialized into content, executed at scale.</p>

          <div className="pillars">
            <div className="pillar">
              <div className="pillar-num">01</div>
              <div className="pillar-icon">🎯</div>
              <div className="pillar-name">STRATEGY</div>
              <div className="pillar-desc">Speed to clarity on your challenges and solution positioning. We sit down, understand your model, and align every piece of content to a game plan that's built to win.</div>
            </div>
            <div className="pillar">
              <div className="pillar-num">02</div>
              <div className="pillar-icon">🏗️</div>
              <div className="pillar-name">MATERIALS</div>
              <div className="pillar-desc">Informative, collaborative content — video, written, and social — that reinforces your positioning in an authentic way. Not noise. Signal.</div>
            </div>
            <div className="pillar">
              <div className="pillar-num">03</div>
              <div className="pillar-icon">🚀</div>
              <div className="pillar-name">EXECUTION</div>
              <div className="pillar-desc">Content is where the conversation starts — distribution is where the conversion happens. We handle the outbound. Quantified, tracked, and relentless.</div>
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <section className="section" style={{paddingBottom: '100px'}}>
        <div className="section-header">
          <div className="section-tag">Pricing</div>
          <div className="section-line"></div>
        </div>
        <h2 className="section-title">Recharge Signal. Grow Your Business.</h2>

        <div className="pricing-box">
          <div className="launch-tag">⚡ LAUNCH EVENT PRICE — LIMITED TIME</div>
          <div className="big-price"><sup>$</sup>475</div>
          <p className="price-future">One-time package price &nbsp;·&nbsp; After launch: <s>$875+</s> &nbsp;·&nbsp; Slots are limited</p>

          <ul className="pricing-features">
            <li>60-Min Discovery Recording Session</li>
            <li>Published Long-Form Article</li>
            <li>3 LinkedIn Main Posts</li>
            <li>50 Targeted Direct Messages</li>
            <li>10 Strategic Comments</li>
            <li>LinkedIn Group Distribution</li>
            <li>AI-Generated Video Assets</li>
            <li>Access to All Content &amp; Repurpose Rights</li>
          </ul>

          <a href="https://www.strattegys.com/pricing-plans/influencer" className="btn-primary large" target="_blank" rel="noopener noreferrer">
            YES — RECHARGE SIGNAL &amp; CLAIM MY SLOT
            <span className="btn-arrow">→</span>
          </a>
          <p className="checkout-note">Signal cannot process payment directly. Her power is too low. Say "YES" — Govind Davis will contact you on LinkedIn with the secure checkout link.</p>
        </div>
      </section>

      {/* FAQ */}
      <div style={{background: 'var(--panel)', borderTop: '1px solid var(--border)'}}>
        <section className="section">
          <div className="section-header">
            <div className="section-tag">FAQ</div>
            <div className="section-line"></div>
          </div>
          <h2 className="section-title">System Queries</h2>

          <div className="faq-grid">
            <div className="faq-item">
              <div className="faq-q">What happens during the Discovery Session?</div>
              <div className="faq-a">A 60-minute conversation with Govind Davis — structured to be fun, creative, and strategically focused on the best angles of your business. Plan for 60 minutes; if you hit a flow state, we go longer to get the best content possible.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Who owns the content?</div>
              <div className="faq-a">You do. You're sponsoring a show and a post — Govind is the artist producing the materials. The Morning Scrum creates public-facing publicity for you, and you're free to repurpose every asset across your own channels.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Why does the price go up after launch?</div>
              <div className="faq-a">The $475 launch price is a one-time offer for early believers who help get Signal back online. Once the first round of packages is fulfilled and Signal's track record is established, pricing reflects the full market rate — which is north of $875.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">What if I don't like being on camera?</div>
              <div className="faq-a">That's the beauty of the system. We extract the insights through audio/video, but you don't have to be the talking head in the final assets if you don't want to. Signal generates compelling visuals that carry your message without you needing to play influencer.</div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">SIG<span>NAL</span></div>
        <div>SYSTEM OF STRATTEGYS © 2025 // ALL SYSTEMS NOMINAL... EVENTUALLY.</div>
      </footer>
    </div>
  );
}
