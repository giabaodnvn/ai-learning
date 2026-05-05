# Japanese Learning App — Project Review

**Date**: May 5, 2026  
**Reviewer**: Claude AI  
**Project Type**: Full-stack web app (Rails 7 + Next.js 14 + PostgreSQL + Redis)

---

## 📊 Current Feature Set

### ✅ Core Learning Features

#### 1. **Vocabulary Learning**
- Browse vocabulary lists by JLPT level (N5–N1)
- AI-powered explanations (word → meaning + usage + examples)
- Vocabulary search & filtering
- Integrated with SRS/flashcard system
- **Status**: Fully functional
- **Quality**: Good — explanation streaming works, context-aware

#### 2. **Grammar Points**
- Grammar pattern database (N5–N1)
- Pattern explanations with Vietnamese translations
- Example sentences + grammar checks
- **Status**: Core feature exists
- **Quality**: Basic — no interactive exercises yet

#### 3. **Kanji Learning**
- 6,000+ kanji organized by JLPT level (N5–N1)
- Character detail: meanings, on/kun readings, stroke count
- Vocabulary examples showing usage
- **Status**: Complete data, basic UI
- **Quality**: Data-rich but UI could be more interactive

#### 4. **Reading Comprehension**
- AI-generated reading passages by topic + JLPT level
- Multi-choice comprehension questions
- Word lookup during reading
- Answer feedback with explanations
- **Status**: Fully functional
- **Quality**: Good — real-time generation, immediate feedback

#### 5. **AI Conversation (Role-play)**
- 6 pre-built roles: tutor, convenience store, restaurant, office, hotel, airport
- Stateful conversation sessions
- Difficulty adjusted to user level
- Chat history
- **Status**: Fully functional
- **Quality**: Excellent — realistic role-play scenarios

#### 6. **Spaced Repetition System (SRS)**
- SM-2 algorithm implementation
- Review queue with due dates
- Difficulty ratings (Forgot → Difficult → OK → Easy)
- 7-day accuracy tracking
- **Status**: Fully functional
- **Quality**: Solid implementation

#### 7. **Flashcard Study**
- Learn mode (random cards)
- Quiz generation
- Bulk status updates
- **Status**: Functional
- **Quality**: Basic — needs more polish

#### 8. **JLPT Level Tests**
- Mini exams (20–30 questions)
- Scored results with feedback
- Level progression tracking
- **Status**: Functional
- **Quality**: Good foundation

### 📊 Dashboard & Gamification

#### 9. **User Dashboard**
- Streak counter (consecutive study days)
- Vocabulary stats (learned, due today, 7-day accuracy)
- Activity heatmap (last 30 days)
- JLPT progress bar (words/patterns learned per level)
- Weekly AI report (personalized summary)
- Quick links to all features

**Status**: Fully implemented  
**Quality**: Excellent — attractive, data-rich, motivating

### 🔐 System Features

#### 10. **User Authentication**
- Email/password signup & login
- JWT token-based auth (devise-jwt)
- Profile management
- **Status**: Complete

#### 11. **VIP/Subscription System**
- Multiple tiers with perks
- VIP expiration tracking
- Admin controls
- **Status**: Database support, UI not yet implemented

#### 12. **Admin Panel**
- User management (view, block, reset VIP)
- AI cost tracking (Claude API usage)
- Sidekiq monitoring
- **Status**: Core features present

#### 13. **Text-to-Speech**
- Hook exists (`useTextToSpeech.ts`)
- Not yet fully integrated into all pages
- **Status**: Partially implemented

#### 14. **AI Cost Management**
- Logging all API calls to Claude
- Cost tracking by user
- Usage analytics
- **Status**: Infrastructure in place

---

## 🎯 Assessment

### Strengths ✨

1. **Solid Architecture** — Clean separation: Rails API + Next.js frontend, JSON:API format
2. **AI-Powered Features** — All major learning features leverage Claude API for personalization
3. **Comprehensive JLPT Data** — N1-N5 vocabulary (3,000+), grammar (500+), kanji (2,500+)
4. **Gamification** — Streaks, progress tracking, weekly reports drive engagement
5. **Real-Time Features** — Server-Sent Events (SSE) for streaming explanations & chat
6. **SRS Implementation** — Scientifically-backed spaced repetition (SM-2 algorithm)
7. **Multiple Learning Modes** — Diverse content types (vocab, grammar, reading, speaking, tests)
8. **Caching & Performance** — Redis caching, AI response caching (30-day TTL)

### Gaps & Missing Features 🔴

1. **No Listening Practice**
   - Missing audio input & comprehension exercises
   - No practice with authentic Japanese audio
   - Impact: Major gap for JLPT listening section (25% of test)

2. **No Writing Practice**
   - No kanji stroke practice (handwriting)
   - No essay/composition feedback
   - No particle ordering exercises
   - Impact: Can't practice JLPT writing section (25% of test)

3. **Grammar Exercises Limited**
   - View grammar patterns, but no fill-in-the-blank drills
   - No sentence construction practice
   - Impact: Users can read grammar but not apply it

4. **Kanji Radicals Not Covered**
   - No radical breakdown for kanji learning
   - No etymology/mnemonics system
   - Impact: Harder to remember complex characters

5. **No Pronunciation Audio**
   - Text-to-speech exists but not integrated everywhere
   - No native speaker audio samples
   - Impact: Users uncertain about correct pronunciation

6. **Limited Cultural Content**
   - No context about when/how to use keigo
   - No cultural etiquette lessons
   - No Japanese media (news, manga) integration
   - Impact: Learners miss real-world context

7. **No Community/Social Features**
   - No peer-to-peer language exchange
   - No forums or discussion boards
   - No leaderboards (only personal streak)
   - Impact: Isolated learning experience

8. **Mobile Optimization Weak**
   - Designed for desktop/tablet
   - No mobile app (iOS/Android)
   - No offline capability
   - Impact: Can't study on the go effectively

9. **Vocabulary Export/Integration Missing**
   - Can't export learned words for other apps
   - No Anki deck export
   - Impact: Can't leverage other study tools

10. **Limited Adaptive Learning**
    - No difficulty adjustment based on performance
    - No personalized learning paths
    - No weak area detection/focus
    - Impact: One-size-fits-all approach

---

## 💡 Feature Recommendations (Prioritized)

### Phase 1: High Impact, Medium Effort (Next Quarter)

#### 1. **Listening Practice** 🎧
**Why**: Covers JLPT listening section; differentiates from text-based competitors
- Generate short audio dialogues (TTS or real samples)
- Play audio 1–2 times, user answers multiple-choice
- Difficulty levels: slow/natural/fast
- **Effort**: 3–4 weeks (audio generation, UI, backend)
- **Revenue Impact**: High (core JLPT feature)

#### 2. **Interactive Grammar Exercises** ✍️
**Why**: Users know grammar but can't apply it
- Fill-in-the-blank (drag/type particles, conjugations)
- Sentence ordering (arrange words into correct order)
- Translation practice (Vietnamese → Japanese)
- **Effort**: 2–3 weeks (exercise generation, validation)
- **Revenue Impact**: High (core study feature)

#### 3. **Kanji Stroke Practice** 🖊️
**Why**: Essential for writing section; engage motor memory
- Canvas drawing detection (user traces strokes)
- Stroke order animation
- Radical breakdown cards
- **Effort**: 3 weeks (canvas integration, stroke detection)
- **Revenue Impact**: Medium (niche but valuable)

#### 4. **Integrated Text-to-Speech** 🔊
**Why**: Already coded; easy win
- Add "pronounce" button to all vocabulary
- Pronunciation guide in grammar explanations
- Audio in flashcards
- **Effort**: 1 week (integration across pages)
- **Revenue Impact**: Low (nice-to-have)

### Phase 2: High Engagement (Next 6 Months)

#### 5. **Phrasebook & Expressions**
- 500–1,000 common phrases by context (greetings, shopping, business)
- Audio + example usage
- Search by situation

#### 6. **Community & Social**
- Language exchange matching (connect learners to practice together)
- Simple comment/discussion on difficult concepts
- Leaderboard (optional)

#### 7. **Mobile App** 📱
- React Native or Flutter wrapper
- Offline mode for flashcards/vocabulary
- Push notifications for daily reminders

#### 8. **Advanced Analytics**
- Detailed progress history (charts by level/category)
- Weak area detection ("You're struggling with N3 particles")
- Recommended next steps based on performance

### Phase 3: Differentiation (Future)

#### 9. **Cultural & Media Integration**
- Short news articles (with furigana)
- Manga snippet reading
- Video clips (NHK, drama) with subtitles
- Etiquette lessons (keigo, formal writing)

#### 10. **Adaptive Difficulty**
- ML-based difficulty scaling
- Personalized learning paths
- Predict time-to-proficiency

#### 11. **Essay/Composition Feedback**
- User writes Japanese essay → AI reviews grammar/kanji/flow
- Suggestions for improvements
- **Risk**: High cost per request; pricing model needed

---

## 📈 Usage Metrics to Track

To prioritize features, monitor:

1. **Feature Adoption** — % of users using each feature
2. **Daily Active Users (DAU)** — Trend over time
3. **Session Duration** — Time spent per feature type
4. **Drop-off Points** — Where users stop using the app
5. **VIP Conversion** — Are learners willing to pay?
6. **Test Scores** — Do users pass JLPT after using the app?

---

## 🚀 Quick Wins (1–2 Weeks)

If you want fast improvements with minimal effort:

1. **Add "Show Furigana" toggle** to all Japanese text
2. **Expand reading topics** (currently 8; add 20+)
3. **Create preset study plans** by goal (e.g., "Pass N2 in 6 months")
4. **Email reminders** for daily reviews
5. **Export vocabulary as CSV** for user records

---

## ⚡ Technical Debt to Address

1. **Admin panel documentation** — Hard to manage without guide
2. **Error handling** — Some API errors not caught gracefully
3. **Load testing** — Check performance at 1,000+ concurrent users
4. **Accessibility** — Missing some ARIA labels, color contrast
5. **Testing** — No visible test suite; add RSpec + Jest tests

---

## 🎓 Verdict

**Overall Assessment**: **B+ (Good Foundation, Needs Polish)**

### Summary
You have a **solid, functional Japanese learning app** with:
- ✅ Comprehensive content (vocab, grammar, kanji)
- ✅ Smart gamification (streaks, progress)
- ✅ AI-powered features (explanations, generation)
- ✅ Multiple learning modes (5+ ways to study)

**But it's missing critical skill areas:**
- ❌ No listening practice (JLPT listening test)
- ❌ No writing practice (JLPT writing test)
- ❌ No interactive grammar exercises
- ❌ No mobile support
- ❌ No social/community features

**If I were a user**, I'd want:
1. **Listening exercises** (so I can practice what I hear)
2. **Grammar drills** (so I can apply patterns)
3. **Mobile app** (so I can study anywhere)
4. **Peer language exchange** (so I practice with humans, not just AI)

### Next Steps
1. **Survey users** — Which missing features matter most?
2. **Implement listening** — Highest ROI for JLPT coverage
3. **Add grammar exercises** — Transforms passive learning → active
4. **Optimize mobile** — Reach users on-the-go
5. **Build community** — Differentiator vs. Duolingo/Anki

---

**Created by**: Claude AI  
**Reviewed**: Frontend (`/frontend`), Backend (`/ai_learning`), Routes, Models, Controllers  
**Codebase Stats**: ~50 API endpoints, 15+ database models, 12+ frontend pages
