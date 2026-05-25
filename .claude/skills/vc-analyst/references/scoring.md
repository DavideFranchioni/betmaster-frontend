# Investor Scoring Reference

Detailed criteria and examples for scoring investors using the `vc-analyst` skill.

## Scoring Model

Total score: **0-100**. The "Is Actually Investor" check is a **GATE** — fail it and the score is 0 regardless of other factors.

| Factor | Weight | Max Points |
|--------|--------|------------|
| Is Actually Investor (gate) | — | pass/fail |
| Stage Fit | 25% | 25 |
| Thesis Match | 25% | 25 |
| Portfolio Relevance | 30% | 30 |
| Activity Level | 10% | 10 |
| Network Value | 10% | 10 |

Final score = sum of weighted factors, minus any penalties (e.g., portfolio conflict).

---

## Factor 1: Is Actually Investor (GATE)

**Purpose**: Filter out people whose LinkedIn says "investor-adjacent" but who are actually operators, marketers, or community managers.

### Pass
Title contains one of:
- Partner / General Partner (GP) / Managing Partner
- Founding Partner / Principal
- Angel Investor / Active Angel
- Entrepreneur in Residence (EIR) at a fund
- Venture Partner / Operating Partner
- Solo Capitalist / Fund Manager
- LP (Limited Partner) — context dependent

### Fail (Score = 0)
- Director of [anything] at a non-investment company
- Engineer / Designer / Product Manager
- Marketing / BD / Community at a fund (they don't write checks)
- "Advisor" without any verifiable fund affiliation
- Founder of a company that isn't a fund

### Edge Cases
- **Scout**: Pass if scout for a known fund (e.g., Sequoia Scouts), but note check size is usually small ($25K-$100K).
- **Former Partner**: Fail unless they explicitly run a new fund or angel-invest actively.
- **Family office**: Pass if title is investment-related (e.g., "Investment Director, X Family Office").

---

## Factor 2: Stage Fit (25 points)

Match the investor's typical check size and stage focus to the company's raise.

| Investor stage focus | Pre-Seed | Seed | Series A |
|----------------------|----------|------|----------|
| Pre-seed specialist | 25 | 15 | 0 |
| Seed-focused | 20 | 25 | 10 |
| Series A+ | 0 | 10 | 25 |
| Multi-stage | 18 | 20 | 18 |
| Angel ($25K-$250K) | 25 | 15 | 5 |

### Disqualifier
Series B+ growth fund analyzing a pre-seed company → automatic 0 on stage fit.

---

## Factor 3: Thesis Match (25 points)

Compare investor's stated thesis (from fund website, LinkedIn bio, recent investments) to company's thesis keywords.

| Match level | Points | Example |
|-------------|--------|---------|
| Perfect (1:1 thesis) | 25 | Fund says "AI agent infra"; company is AI agent infra |
| Strong (multiple keyword overlap) | 20 | Fund: "B2B SaaS, dev tools"; company: dev tools for SaaS |
| Adjacent (related vertical) | 12 | Fund: "vertical SaaS"; company: B2B SaaS (horizontal) |
| Weak (broad generalist) | 6 | Fund: "tech investments"; no specific thesis |
| Mismatch | 0 | Fund: "crypto/DeFi"; company: B2B SaaS |

---

## Factor 4: Portfolio Relevance (30 points)

The single strongest signal. Investors back what they understand.

| Signal | Points |
|--------|--------|
| 3+ portfolio companies in same vertical | 30 |
| 1-2 portfolio companies in same vertical | 22 |
| Adjacent portfolio (related buyer / use case) | 15 |
| Generalist portfolio, no overlap | 8 |
| Portfolio in unrelated domains only | 0 |

### How to Verify
1. Check fund website "Portfolio" page.
2. Cross-reference with Crunchbase / PitchBook (if accessible).
3. Search LinkedIn posts for "I'm thrilled to share our investment in...".

---

## Factor 5: Activity Level (10 points)

| Recent activity | Points |
|-----------------|--------|
| 3+ investments in last 12 months | 10 |
| 1-2 investments in last 12 months | 7 |
| Investments 12-18 months ago | 4 |
| No public investments in 18+ months | 0 |

**Why it matters**: Inactive investors may be between funds, winding down, or otherwise unable to deploy capital.

---

## Factor 6: Network Value (10 points)

| Signal | Points |
|--------|--------|
| Ties to top accelerators (YC, Techstars, a16z scout) | 10 |
| Active in founder community (writes, speaks, mentors) | 7 |
| Strong fund network (co-invests with tier-1 funds) | 5 |
| Lone wolf / minimal network | 2 |

---

## Penalties

### Portfolio Conflict (-20)
Investor has backed a direct competitor. Flag prominently as `PORTFOLIO CONFLICT` in output.

How to detect:
- Search fund portfolio for company's named competitors.
- WebSearch: `"[Fund]" "[Competitor]"`.
- Check competitor's funding announcements for investor names.

### Stale Profile (-5)
LinkedIn last updated >2 years ago, no recent activity. Suggests they may not be reachable.

### Conflicting Roles (-10)
Person is both operator at a competitor and angel investor. Risk of information leak.

---

## Score Bands

| Score | Tier | Action |
|-------|------|--------|
| 85-100 | **Strong Fit** | Personalized outreach immediately, warm intro if possible |
| 70-84 | **Good Fit** | Personalized outreach, lower priority |
| 50-69 | **Weak Fit** | Skip unless other batches are exhausted |
| <50 | **Not a Fit** | Do not contact |
| 0 | **Disqualified** | Wrong person, mismatched thesis, or competitor backer |

---

## Worked Examples

### Example A: Strong Fit (Score: 92)
- **Company**: Pre-seed AI agent infra, raising $1.5M
- **Investor**: Partner at AI-focused micro-VC
- Stage fit: 25 (pre-seed specialist)
- Thesis match: 25 (AI agent infra exact)
- Portfolio relevance: 22 (2 AI infra companies)
- Activity: 10 (4 investments in last year)
- Network: 10 (YC partner ties)
- **Total: 92** → Strong Fit

### Example B: Disqualified by Gate (Score: 0)
- **Investor LinkedIn**: "Director of Partnerships at AcmeCorp"
- LinkedIn check reveals they are not an investor despite being on the CSV.
- **Total: 0** → Skip, log as "CSV data error".

### Example C: Portfolio Conflict (Score: 60)
- Raw score: 80
- Investor backed `competitor-X`
- Penalty: -20
- **Total: 60** → Weak Fit, flag conflict prominently.
