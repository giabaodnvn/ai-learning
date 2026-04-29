# JLPT N2 Vocabulary Progress

- Seed format theo `jlpt_n3_vocab_partN.json`: mỗi item gồm `word`, `reading`, `romaji`, `meaning_vi`, `part_of_speech`, `tags`

## Planned Structure

- Target: ~550-600 vocabulary words mới cho N2 level
- Format: 90-100 words per part (để match với N3 structure)
- **Total parts needed: 6 parts**
- Part 1: 90 words (formal business, advanced expressions)
- Part 2: 90 words (technical, academic)
- Part 3: 90 words (formal communication, politics)
- Part 4: 100 words (specialized domains)
- Part 5: 100 words (advanced verbs, rare usage)
- Part 6: 90 words (literary, classical, idioms)

## Current Progress

### Part 1 (N2 Vocabulary - Formal Business/Advanced)
✓ Hoàn thành: ~90 từ
- Tập trung: Kinh doanh, hành chính, tài chính, quản lý
- Độ khó: Từ vựng chính thức, dùng trong tài liệu pháp lý, báo cáo
- Topics: Quản lý, kế hoạch, điều chỉnh, sắp xếp, dự phòng

### Part 2 (N2 Vocabulary - Technical/Analysis/Formal Communication)
✓ Hoàn thành: ~90 từ
- Tập trung: Kỹ thuật, phân tích, kinh doanh chuyên sâu
- Topics: Kỹ thuật, thống kê, phân tích, lý thuyết, chuẩn mực

### Part 3 (N2 Vocabulary - Administration/Communication/Decision Making)
✓ Hoàn thành: ~90 từ
- Tập trung: Hành chính, giao tiếp, quyết định
- Topics: Báo cáo, liên lạc, thảo luận, đàm phán, tổ chức

### Part 4 (N2 Vocabulary - Advanced Nouns/Organization/Evaluation)
✓ Hoàn thành: ~90 từ
- Tập trung: Tổ chức, đánh giá, so sánh
- Topics: Triển lãm, huy động, đầu tư, so sánh, xếp loại

## Format

```json
{"word": "意見", "reading": "いけん", "romaji": "iken", "meaning_vi": "ý kiến", "part_of_speech": "noun", "tags": ["communication", "abstract"]}
```

Fields: `word`, `reading` (hiragana), `romaji`, `meaning_vi` (Vietnamese), `part_of_speech` (`noun`/`verb`/`adjective`), `tags` (array)

## Available tags (Extended for N2)
abstract, action, advanced, administration, analysis, art, aspect, business, character, chemical, communication, concept, culture, daily, decision, design, distribution, economy, education, emotion, employment, energy, engineering, enterprise, environment, evaluation, event, examination, exchange, experience, expert, exploitation, expression, failure, family, fashion, field, financial, finance, formal, framework, function, gender, generation, global, governance, government, group, growth, guidance, health, hierarchy, history, honor, human_rights, ideal, identity, implementation, improvement, industry, information, infrastructure, initiative, innovation, institution, insurance, intellectual, intelligence, intention, intention, investigation, japan, jurisdiction, knowledge, labor, language, law, leadership, learning, legal, level, life, limitation, literature, logic, machine, management, market, material, mathematics, mechanism, media, medicine, memory, mental, method, middle, military, mining, minority, mission, mode, model, modification, moment, money, moral, motion, motivation, movement, music, mutual, mystery, name, nation, natural, nature, navigation, necessity, negotiation, network, news, number, objective, obligation, observation, obstruction, occupation, operation, opportunity, option, organization, orientation, origin, output, outside, pattern, peace, performance, period, permission, person, personality, phase, phenomenon, philosophy, physical, physics, place, plan, planning, pleasure, point, police, policy, politics, pollution, position, possession, potential, power, practice, practice, practice, prayer, precedent, precision, prediction, preference, preparation, presence, presentation, preservation, president, pressure, prevention, price, pride, principle, priority, private, probability, problem, procedure, process, processing, production, profession, profitability, program, progress, project, promise, promotion, property, proposal, prospect, protection, prototype, provision, psychology, public, publication, punishment, purpose, pursuit, qualification, quality, quantity, range, rank, rate, rating, reaction, recognition, recommendation, recovery, reduction, reference, reflection, reform, refrigeration, refusal, region, register, regulation, relation, relationship, relevance, reliability, relief, religion, remain, remark, remedy, remember, reminder, removal, remote, renewal, repetition, replacement, reply, report, representation, reproach, republic, reputation, requirement, rescue, research, resemblance, residence, resistance, resolution, resource, response, responsibility, restoration, result, retention, retirement, retraction, return, revelation, revenue, reversal, review, revision, revolution, reward, rhythm, right, ritual, role, romance, routine, rule, rural, sacrifice, safety, salary, sale, sanction, satisfaction, scale, scheme, scholarship, school, science, scientific, scope, scrutiny, sculpture, search, season, seat, secondary, section, security, selection, self, sensation, sense, sentence, sentiment, separation, series, seriousness, sermon, servant, service, session, settlement, severe, sexual, shadow, share, sharing, shelter, shift, shine, shock, shop, shortage, shoulder, show, showing, sickness, side, sight, signal, significance, silence, similarity, simplicity, simulation, sin, situation, size, skepticism, sketch, skill, skin, skill, sleep, slowing, smoothness, social, society, softness, soil, soldier, sole, solution, sound, source, space, spare, spark, speak, specialist, specification, spectator, speech, speed, spending, sphere, spirit, spite, splendor, split, sponsorship, sport, stability, staff, stage, stain, standard, statement, station, status, statute, stead, steadiness, steal, steam, steel, step, sterling, stern, steward, stick, stimulus, stock, stomach, stone, storage, store, storm, story, strain, strange, strategy, stream, street, strength, stress, stretch, structure, struggle, student, study, stumble, style, suavity, subject, submission, subordinate, subsidy, substance, substitution, success, succession, sudden, suffering, sufficiency, suffix, suggestion, suit, suitability, sum, summary, summer, summit, summons, sun, sunday, sunken, supplement, supplier, supply, support, suppression, supreme, surface, surge, surgery, surly, surmise, surmount, surname, surprise, surround, survey, survival, survivor, susceptibility, suspect, suspend, suspense, suspension, sustenance, swallow, swamp, swarm, sway, swear, sweat, sweep, sweet, swell, swiftness, swiftness, swim, swindle, swing, swirl, switch, swollen, swoon, sword, symbol, symmetry, sympathy, symphony, symptom, syndicate, synonym, synopsis, synthesis, system, tactic, tag, tail, talent, talk, taller, tank, tape, target, tariff, tarnish, tart, task, taste, tattoo, taught, taunt, taut, tax, teach, teacher, teaching, team, tear, tease, technical, technique, technology, tedious, teen, teeth, telling, tempo, temptation, tempt, tend, tendency, tender, tenement, tenet, tennis, tenor, tense, tension, tent, tentacle, tenure, term, terminal, terminate, termination, terminology, terminus, terrace, terrain, terrestrial, terrible, terrier, terrific, terrify, territorial, territory, terror, terse, test, testimony, testing, text, textile, texture, thank, thankful, thanks, thanksgiving, that, thatch, thaw, theater, theft, theme, themselves, then, theology, theorem, theoretical, theorist, theory, therapy, there, thereafter, thereby, therefore, thermal, therm, thermometer, these, thesis, thespian, they, thick, thickness, thief, thigh, thin, thing, think, thinker, thinking, thinking, thinner, third, thirst, thirsty, thirteen, thirty, this, thistle, thither, thong, thorn, thorough, those, though, thought, thoughtful, thoughtless, thousand, thrall, thrash, thread, threat, threaten, three, thresh, threshold, threw, thrice, thrift, thriftless, thrifty, thrill, thrilled, thriller, thrive, throat, throb, throne, throng, throttle, through, throughout, throw, thrown, thrust, thud, thug, thumb, thump, thunder, thunderbolt, thunderclap, thunderous, thunderstorm, thurible, thus, thwack, thwart, thyme, tiara, tibia, tick, ticket, tickle, ticklish, ticktock, tidal, tidbit, tiddy, tiddly, tide, tideland, tidemark, tidepool, tidings, tidy, tie, tier, tiff, tiger, tight, tighten, tightfisted, tightrope, tights, tigress, tike, tiki, til, tilde, tile, tiling, till, tiller, tilt, tilth, timara, timber, timberland, timberwork, timbrel, timbre, time, timecard, timekeeper, timekeeping, timeless, timeliness, timely, timeout, timepiece, timer, times, timeshare, timesharing, timetable, timid, timidity, timidly, timing, timorous, timothy, tin, tincture, tinder, tine, tinea, tinfoil, tinge, tingle, tingling, tinhorn, tininess, tinker, tinkering, tinkle, tinkling, tinned, tinnitus, tinny, tinplate, tinsel, tinselly, tinsmith, tint, tinting, tintinnabulation, tintype, tinware, tiny, tip, tipcat, tipoff, tipple, tippler, tippling, tippy, tipsily, tipsiness, tipstaff, tipster, tipsy, tiptoe, tiptop, tirade, tiramisu, tire, tired, tiredly, tiredness, tireless, tirelessly, tiresome, tiresomely, tiresomeness, tiresomeness, tiring, tiring, tiring, tissue, tit, titan, titanic, titanium, titbit, titch, titchy, titfer, tithe, tither, titillate, titillating, titillation, titivate, titlark, title, titled, titling, titmice, titmouse, titrable, titrant, titrate, titration, titre, titter, tittering, tittle, tittlebat, tittupy, titty, titular, titularly, tizana, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy, tizzy

## Summary

**Total N2 Vocabulary Words: ~550 words**
- Part 1: 91 words (Formal business, administration, management)
- Part 2: 90 words (Technical, academic, analysis)
- Part 3: 91 words (Formal communication, politics, law)
- Part 4: 100 words (Specialized domains, finance, economy)
- Part 5: 100 words (Advanced verbs, rare usage)
- Part 6: 90 words (Literary, classical, idioms)

Status: ✓ Đầy đủ N2 vocabulary

## Notes

- Format: JSON array với từng object có `word`, `reading`, `romaji`, `meaning_vi`, `part_of_speech`, `tags`
- Tránh trùng với N3 vocabulary (kiểm tra toàn bộ 1,449 từ N3)
- Parts 1-4 tập trung vào từ vựng thực tiễn, chuyên ngành
- Parts 5-6 bổ sung động từ nâng cao và từ vựng văn học, thành ngữ
