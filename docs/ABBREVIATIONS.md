# List of Symbols and Abbreviations

*DASHH — A Peer-to-Peer zkTLS-Verified Influencer Engagement Platform on Solana*
*SGSITS UG Major Project, 2025–26*

---

## Abbreviations

### Core project / domain

| Abbrev. | Expansion |
| --- | --- |
| DASHH | The project name (brand identifier for this platform) |
| P2P | Peer-to-Peer |
| CPV | Cost Per View |
| CPC | Cost Per Click |
| CPM | Cost Per Mille (thousand impressions) |
| ROI | Return on Investment |
| KPI | Key Performance Indicator |
| T&C | Terms and Conditions |
| TOS | Terms of Service |
| bps | Basis points (1 bps = 0.01%) |
| MVP | Minimum Viable Product |

### Blockchain / Solana

| Abbrev. | Expansion |
| --- | --- |
| SOL | Solana (native cryptocurrency of the Solana blockchain) |
| LAMPORTS | Smallest unit of SOL (1 SOL = 10⁹ lamports) |
| PDA | Program Derived Address |
| SPL | Solana Program Library |
| RPC | Remote Procedure Call |
| SIWS | Sign-In With Solana |
| SIWE | Sign-In With Ethereum (referenced for comparison) |
| KYC | Know Your Customer |
| AML | Anti-Money Laundering |
| NFT | Non-Fungible Token |
| DAO | Decentralized Autonomous Organization |
| DeFi | Decentralized Finance |
| TPS | Transactions Per Second |

### Cryptography / Verification

| Abbrev. | Expansion |
| --- | --- |
| zkTLS | Zero-Knowledge Transport Layer Security |
| ZK | Zero-Knowledge (as in ZK-proof) |
| ZKP | Zero-Knowledge Proof |
| TLS | Transport Layer Security |
| HMAC | Hash-based Message Authentication Code |
| JWT | JSON Web Token |
| JWS | JSON Web Signature |
| SHA | Secure Hash Algorithm |
| ECDSA | Elliptic Curve Digital Signature Algorithm |
| OAuth | Open Authorization |
| OTP | One-Time Password |
| PKI | Public Key Infrastructure |

### Web / Software engineering

| Abbrev. | Expansion |
| --- | --- |
| API | Application Programming Interface |
| REST | Representational State Transfer |
| HTTP | HyperText Transfer Protocol |
| HTTPS | HyperText Transfer Protocol Secure |
| URL | Uniform Resource Locator |
| URI | Uniform Resource Identifier |
| DNS | Domain Name System |
| IP | Internet Protocol |
| JSON | JavaScript Object Notation |
| HTML | HyperText Markup Language |
| CSS | Cascading Style Sheets |
| DOM | Document Object Model |
| SSR | Server-Side Rendering |
| CSR | Client-Side Rendering |
| SPA | Single-Page Application |
| PWA | Progressive Web Application |
| MVC | Model-View-Controller |
| CORS | Cross-Origin Resource Sharing |
| CSRF | Cross-Site Request Forgery |
| XSS | Cross-Site Scripting |
| CDN | Content Delivery Network |
| TTL | Time To Live |
| UUID | Universally Unique Identifier |
| CRUD | Create, Read, Update, Delete |
| UI | User Interface |
| UX | User Experience |

### Database

| Abbrev. | Expansion |
| --- | --- |
| DB | Database |
| RDBMS | Relational Database Management System |
| ORM | Object-Relational Mapping |
| SQL | Structured Query Language |
| ACID | Atomicity, Consistency, Isolation, Durability |
| JSONB | JSON Binary (Postgres column type) |
| PK | Primary Key |
| FK | Foreign Key |

### Tools / Process

| Abbrev. | Expansion |
| --- | --- |
| SDK | Software Development Kit |
| CLI | Command Line Interface |
| IDE | Integrated Development Environment |
| CI/CD | Continuous Integration / Continuous Deployment |
| VCS | Version Control System |
| PR | Pull Request |
| IaC | Infrastructure as Code |
| QR | Quick Response (code) |

### Social / Platform

| Abbrev. | Expansion |
| --- | --- |
| IG | Instagram |
| YT | YouTube |
| X / TW | X (formerly Twitter) |
| TT | TikTok |
| DM | Direct Message |

### Academic / Institutional

| Abbrev. | Expansion |
| --- | --- |
| SGSITS | Shri Govindram Seksaria Institute of Technology and Science, Indore |
| UG | Under Graduate |
| B.E. | Bachelor of Engineering |
| RGPV | Rajiv Gandhi Proudyogiki Vishwavidyalaya (the affiliating university) |
| CSE / CS | Computer Science (and Engineering) |
| IT | Information Technology |
| AICTE | All India Council for Technical Education |

---

## Symbols

### Domain-specific symbols

| Symbol | Meaning |
| --- | --- |
| ◎ | SOL (Solana currency) |
| Δ (delta) | View-count delta between two proofs — the amount paid per settlement |
| Σ (sigma) | Summation — used in payout formulas over a set of creators |
| % | Percentage (e.g. 20% platform fee) |
| ₁₀⁹ | 1 SOL = 10⁹ lamports |
| / | Ratio or "per" (e.g. views/creator) |

### Mathematical notation (used in `src/lib/payouts.ts` and the report)

| Symbol | Meaning |
| --- | --- |
| B | Total campaign budget (in SOL) |
| F | Platform fee share (F = B × 0.20) |
| P | Creator pool (P = B − F) |
| v | View count from a single proof |
| v₀ | Baseline view count at the join proof |
| v₁ | Final view count at the final-window proof |
| Δv | v₁ − v₀ (verified new views paid out) |
| r | Per-view rate (SOL per view) in `per_view` mode |
| n | Number of participating creators |
| N | Top-N cut-off for `split_top_n` mode |
| t | Timestamp (Unix seconds or ISO-8601) |
| τ (tau) | Campaign end time |
| W | Final-proof window (fixed at 7 days past τ) |

### UI / status indicators

| Symbol | Meaning |
| --- | --- |
| ✓ | Verified / approved / success |
| ✗ | Rejected / disqualified / failure |
| ● | Live / active (green dot on campaign cards) |
| ○ | Pending / not yet verified |
| ⚠ | Warning — e.g. approaching ban threshold |
| → | Flow / transition (used in `/how-it-works` diagrams) |
| ↗ | Upward trend (analytics) |
| ↘ | Downward trend (analytics) |
| · | Separator in UI captions |

### Brand palette (project design tokens)

| Hex | Used for |
| --- | --- |
| `#9945FF` | **Purple** — Explore mode, primary brand accent |
| `#14F195` | **Mint** — Create mode, success / verified state |
| `#0a0a0a` | **Obsidian** — base background |
| `#ffffff` | **White** — primary text |
| `#a1a1aa` | **Zinc-400** — secondary text |
| `#ef4444` | **Red** — error / disqualification |
| `#f59e0b` | **Amber** — warning / strike |

### Regex / cron symbols that appear in code

| Symbol | Location | Meaning |
| --- | --- | --- |
| `*/30 * * * *` | `vercel.json` (original) | Every 30 minutes (cron) |
| `0 */6 * * *` | `vercel.json` (original) | Every 6 hours |
| `0 3 * * *` | `vercel.json` (current, Hobby tier) | Daily at 03:00 UTC |
| `<regex>` | `src/lib/reclaim/verify.ts` | Required-hashtag / mention matchers |

---

## Units

| Unit | Meaning |
| --- | --- |
| SOL | 1 SOL |
| lamport | 10⁻⁹ SOL |
| bps | 1 / 10 000 (for the 2000 bps = 20% platform fee) |
| s / sec | Seconds (Unix timestamp granularity) |
| ms | Milliseconds |
| KB / MB | Kilobyte / Megabyte |
| d / h / min | Day / hour / minute |

---

## Project-internal acronyms (code-level)

These are identifiers that appear frequently in the codebase and may come up during the viva:

| Term | Meaning |
| --- | --- |
| `deriveMode()` | Function in `src/lib/modes.ts` that decides whether a route is Explore or Create mode |
| `routeProofByWindow()` | Decides whether an incoming proof is a "join" proof or a "final" proof |
| `computePayoutForProof()` | Delta-aware payout math, handles all four payment models |
| `buildTermsMessage()` | Constructs the brand-signed Terms message for SIWS signature |
| `TERMS_VERSION` | Version counter for the T&C — incremented on material changes |
| `PLATFORM_FEE_BPS` | 2000 (= 20%) — the platform fee constant |
| `DISQUALIFICATION_REASONS` | The 13-rule array in `src/lib/terms.ts` |
| `BAN_POLICY` | 3 strikes in a rolling window ⇒ 90-day account ban |
| `NEUTRAL_ROUTES` | Pages that belong to neither mode (notifications, onboarding, terms) |

---

*This list is auto-maintained; add new abbreviations here as the codebase grows.*
