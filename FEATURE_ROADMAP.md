# Feature Roadmap — Japanese Learning App

**Last Updated**: May 5, 2026  
**Planning Horizon**: 12 months

---

## 🎯 Strategic Goals

1. **Cover all JLPT skill areas** (listening + writing + reading + grammar)
2. **Increase daily active users** (engagement + retention)
3. **Enable monetization** (VIP features, paid courses)
4. **Differentiate from competitors** (Duolingo, Anki, human tutors)

---

## 📅 Roadmap by Quarter

### Q2 2026 (May–July) — Listening & Writing Foundation

#### Sprint 2.1: Listening Practice (Weeks 1–4)
**Objective**: Add JLPT listening comprehension

**Features**:
- [ ] Listening exercise generator (Claude generates dialogue scripts)
- [ ] Audio synthesis (TTS or integrate external audio API)
- [ ] UI: Audio player + multiple choice questions
- [ ] Difficulty tiers: Slow (N5/N4) → Normal (N3/N2) → Fast (N1)
- [ ] Auto-generated lesson difficulty based on user level
- [ ] Listening stats dashboard (% correct by speed)

**Backend Work**:
```ruby
# New model: ListeningExercise
- id, topic, script_ja, script_vi, audio_url, level, created_by
- questions: [{question_ja, options[], correct_index}]

# New controller: listening_exercises_controller.rb
- POST /api/v1/listening/generate  — Generate new exercise
- GET  /api/v1/listening/:id        — Get exercise details
- POST /api/v1/listening/:id/submit — Check answers
```

**Frontend Work**:
```tsx
# New pages:
- /app/listening           — Browse exercises
- /app/listening/[id]      — Exercise player

# New components:
- ListeningPlayer          — Audio + UI
- ListeningResults         — Score & feedback
```

**Effort**: 3–4 weeks | **Priority**: 🔴 Critical | **Blockers**: None

---

#### Sprint 2.2: Grammar Exercise Drills (Weeks 3–6)
**Objective**: Interactive grammar practice

**Features**:
- [ ] Fill-in-the-blank exercises (user types particle/conjugation)
- [ ] Multiple-choice grammar drills
- [ ] Sentence construction (drag particles to build sentence)
- [ ] Translation practice (Vietnamese → Japanese)
- [ ] Grammar drill sets (10–20 exercises per pattern)
- [ ] Streak tracking per grammar pattern
- [ ] Integrated with SRS (learned patterns reviewed)

**Backend Work**:
```ruby
# New model: GrammarExercise
- id, grammar_point_id, exercise_type (fill_blank, choice, construct, translate)
- prompt, correct_answer, explanations

# New controller: grammar_exercises_controller.rb
- POST /api/v1/grammar_points/:id/generate_exercise  — Already exists!
- POST /api/v1/grammar_exercises/:id/submit
```

**Frontend Work**:
```tsx
# Extend existing:
- /app/grammar/[id]  — Add exercises tab
- GrammarExerciseForm — New component for interaction
- ExerciseResult       — Feedback & explanation
```

**Effort**: 2–3 weeks | **Priority**: 🔴 High | **Blockers**: Grammar Point data completeness

---

#### Sprint 2.3: Kanji Stroke Practice (Weeks 4–7)
**Objective**: Handwriting practice for kanji

**Features**:
- [ ] Canvas-based stroke drawing
- [ ] Stroke order animation (show correct sequence)
- [ ] Stroke detection (validate user's writing matches correct form)
- [ ] Radical breakdown (show radical + meaning)
- [ ] Handwriting drills (random kanji, 5–10 per session)
- [ ] Difficulty: Show stroke order vs. no hints
- [ ] Progress tracking

**Backend Work**:
```ruby
# No new models needed—extend Kanji model
- Kanji: add stroke_order (JSON array of stroke coordinates)

# New controller: kanji_handwriting_controller.rb
- POST /api/v1/kanjis/:id/validate_stroke  — Check drawing
```

**Frontend Work**:
```tsx
# New library: react-drawing-canvas (or custom canvas)
# New pages:
- /app/kanji/handwriting  — Handwriting drill mode
# New components:
- StrokeCanvas           — Drawing area
- StrokeOrderAnimation   — Show correct sequence
```

**Effort**: 3 weeks | **Priority**: 🟡 Medium | **Blockers**: Stroke data in kanji DB

**Note**: Need to add `stroke_order` data to all kanji (automation script)

---

### Q3 2026 (Aug–Oct) — Mobile & Community

#### Sprint 3.1: Mobile App (Flutter) (Weeks 1–6)
**Objective**: Native iOS/Android learning

**Features**:
- [ ] Mirror core features (vocabulary, grammar, flashcards, reading)
- [ ] Offline mode for flashcards (cache cards locally)
- [ ] Push notifications (daily reminders, review due)
- [ ] Gesture-based navigation (swipe between cards)
- [ ] Better keyboard support (Japanese IME)
- [ ] App store listings (Play Store, App Store)

**Tech Stack**: Flutter + Dart (code-share friendly)

**Effort**: 4–6 weeks | **Priority**: 🟡 High | **Blockers**: API stability

---

#### Sprint 3.2: Community Features (Weeks 4–8)
**Objective**: Peer learning & engagement

**Features**:
- [ ] Language exchange matching (connect learners at similar levels)
- [ ] Simple chat/voice calls (powered by WebRTC or Twilio)
- [ ] Comment threads on difficult concepts
- [ ] User-generated content (tips, mnemonic tricks)
- [ ] Leaderboard (optional; respect privacy)
- [ ] Learning groups (e.g., "N2 March cohort")

**Backend Work**:
```ruby
# New models:
- UserProfile (extended with avatar, bio, goal_level)
- LanguageExchange (matches users, tracks interaction)
- PostComment (threaded comments on grammar/vocab)
- StudyGroup (cohort management)

# New controllers:
- language_exchanges_controller
- community_comments_controller
- study_groups_controller
```

**Frontend Work**:
```tsx
# New pages:
- /app/community          — Explore users & groups
- /app/exchange/[userId] — Exchange profile
- /app/groups            — Browse & join groups
```

**Effort**: 3–4 weeks | **Priority**: 🟡 Medium | **Blockers**: Moderation policy

---

### Q4 2026 (Nov–Jan) — Monetization & Polish

#### Sprint 4.1: VIP Feature Tiers (Weeks 1–4)
**Objective**: Monetize premium features

**Tiers**:
- **Free**: Basics (5 vocabulary explanations/day, limited SRS)
- **VIP Bronze** ($5/mo): Unlimited explanations, advanced analytics
- **VIP Silver** ($10/mo): + Custom learning paths, priority support
- **VIP Gold** ($20/mo): + Grammar exercises, listening drills, essay feedback

**Backend Work**:
- Enforce feature gates (check VIP status before allowing usage)
- Usage limits per tier
- Stripe/PayPal integration (payment processing)

**Frontend Work**:
- Paywall UI (upgrade prompts)
- Feature comparison table
- Settings → Subscription management

**Effort**: 2–3 weeks | **Priority**: 🟡 Medium | **Blockers**: Payment processor setup

---

#### Sprint 4.2: Phrasebook & Expressions (Weeks 2–4)
**Objective**: Contextual phrase learning

**Features**:
- [ ] 1,000+ phrases by situation (greetings, shopping, business, travel)
- [ ] Audio pronunciation
- [ ] Usage notes (formal vs. casual, when to use)
- [ ] Flashcard integration
- [ ] Search & filter by context

**Data**: Pre-populate from open-source JLPT phrase databases

**Effort**: 2 weeks | **Priority**: 🟢 Low | **Blockers**: None

---

#### Sprint 4.3: Advanced Analytics & Insights (Weeks 3–6)
**Objective**: Help users track progress

**Features**:
- [ ] Detailed progress charts (by level, category, skill)
- [ ] Weak area detection ("You're struggling with N3 particles")
- [ ] Time-to-proficiency estimate ("Estimated 6 months to N2")
- [ ] Recommendation engine (suggest next topics)
- [ ] Comparison to cohort (anonymized; optional)
- [ ] Export progress reports (PDF)

**Effort**: 2 weeks | **Priority**: 🟢 Low | **Blockers**: Data aggregation performance

---

### 2027+ (Year 2) — Scale & Differentiation

#### Future Features (Rough Ideas)

1. **Essay/Composition Feedback**
   - User writes Japanese essay → Claude reviews grammar/kanji/flow
   - Suggestions for improvements
   - High cost per request; needs premium tier

2. **Media Integration**
   - Short news articles (with furigana, word lookup)
   - Manga snippet reading (practice with real content)
   - Drama/anime scene clips (with subtitles)
   - Podcast transcripts (listening + reading)

3. **Adaptive Difficulty**
   - ML-based system adjusts difficulty in real-time
   - Personalized learning paths (avoid boredom + frustration)
   - Predict weak areas before user struggles

4. **Teacher Dashboard**
   - Educators manage students
   - Create assignments (target specific grammar/vocab)
   - Track class progress

5. **Partnership Content**
   - Official JLPT practice tests (authentic exams)
   - NHK Easy News integration
   - Licensed manga/anime content

---

## 📊 Success Metrics

Track these to validate feature priorities:

| Metric | Target | Measurement |
|--------|--------|-------------|
| **DAU Growth** | +50% YoY | Google Analytics |
| **Listening Feature Adoption** | 60% within 3 months | Feature flag analytics |
| **VIP Conversion Rate** | 5–10% | Stripe data |
| **Avg. Session Duration** | 30 min | Analytics |
| **Retention (7-day)** | 40%+ | Cohort analysis |
| **User Test Pass Rate** | 70% of N2+ users pass JLPT | Survey |
| **NPS (Net Promoter Score)** | 40+ | Quarterly survey |

---

## 🛠️ Implementation Guidelines

### Engineering Practices
- **Feature flags**: Use for gradual rollout (e.g., 10% → 50% → 100% users)
- **A/B testing**: Compare UI variants for engagement
- **Performance**: Target <3s page load; <500ms API response
- **Testing**: Aim for 70%+ code coverage (unit + integration tests)
- **Monitoring**: Alert on errors, API latency, feature adoption

### Design & UX
- Keep mobile-first (80%+ of learners study on phone)
- Accessibility: WCAG AA compliance (color contrast, screen readers)
- Onboarding: <2 min to first value (explain game immediately)
- Feedback loops: Show results immediately (streak, accuracy %)

### Product Management
- **User interviews**: Monthly conversations with 5–10 users
- **Feedback loop**: In-app feedback widget
- **Analytics**: Track feature adoption, drop-off points
- **Priorities**: User voice > roadmap > engineer ideas

---

## 📝 Implementation Checklist

### Before Starting Any Feature
- [ ] Define success metrics
- [ ] Create JIRA tickets with acceptance criteria
- [ ] Design UI mockups (Figma)
- [ ] Plan data model (ERD)
- [ ] Estimate effort (story points)
- [ ] Identify blockers & dependencies

### During Development
- [ ] Write tests (TDD when possible)
- [ ] Code review (2+ approvers)
- [ ] Performance testing (load test if needed)
- [ ] Accessibility audit (WCAG)
- [ ] Documentation (API docs, UX guide)

### Before Shipping
- [ ] QA testing (dev + staging)
- [ ] Monitoring setup (error tracking, analytics)
- [ ] Feature flag ready (dark launch option)
- [ ] User documentation (help articles, videos)
- [ ] Marketing readiness (social media, emails)

### Post-Launch
- [ ] Monitor adoption & errors (daily)
- [ ] Gather user feedback (weekly surveys)
- [ ] Optimize based on data (weekly sprint)
- [ ] Plan next iteration (bi-weekly retrospective)

---

## 💰 Budget Estimate (Annual)

| Feature | Dev Time | Infrastructure | Total |
|---------|----------|-----------------|-------|
| Listening | 3–4 weeks | $500/mo (TTS API) | $8K |
| Grammar Exercises | 2–3 weeks | — | $4K |
| Kanji Handwriting | 2–3 weeks | — | $4K |
| Mobile App | 4–6 weeks | $200/mo | $6K |
| Community Features | 3–4 weeks | $1K/mo | $8K |
| VIP Monetization | 2–3 weeks | Stripe fees | $4K |
| **Total (Year 1)** | ~4–6 months | ~$2K/mo | **$40–50K** |

*Note: Assumes 2–3 FTE engineers + 1 product manager*

---

## 🎓 Conclusion

**Prioritization Summary**:
1. **Q2 2026**: Listening + Grammar exercises (covers JLPT gaps)
2. **Q3 2026**: Mobile app + Community (increase engagement)
3. **Q4 2026**: VIP monetization + Polish (revenue + retention)
4. **2027+**: Content partnerships + AI adaptive learning (differentiation)

This roadmap balances:
- ✅ User needs (better coverage of JLPT skills)
- ✅ Business goals (monetization, growth)
- ✅ Technical debt (mobile, performance)
- ✅ Competitive positioning (vs. Duolingo, tutors)

**Success = Users who go from N5 → N2 → N1 with confidence & joy** 🎉

---

*Questions? Suggestions? Update this doc as priorities shift.*
