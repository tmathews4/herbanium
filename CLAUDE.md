# Herbanium — working rules

Project instructions, loaded every session. These are rules, not suggestions.

## A mid-turn message is a QUEUE, not an interrupt

**When a new request arrives while work is in flight, write it down and
keep going. Finish the thing in progress, then take the queue in
order.** Say what was queued when acknowledging it, so nothing is
silently dropped.

This is not a preference about tidiness. Switching mid-task leaves the
previous change half-verified — tests unwritten, suites unrun, a fix
measured but not committed — and the half-done state is invisible to
everyone including the person who made it. Two features landed at once
are also one commit that can't be reverted separately.

The exception is a report that the work in flight is WRONG. "That fix
didn't work" is not a new request; it is information about the current
one, and it belongs in the current one.

**Read this file before starting, not after being asked about it.** The
sections here are load-bearing and several were written because
something shipped broken. Skimming it costs a minute; missing the
research rule, the derived-contract rule or the pre-merge gate costs a
session.

## Testing is part of "done"

**Every new piece of functionality ships with a Playwright test in the same change.** Not a follow-up, not "later" — a feature without a test isn't finished.

- Pure logic (scheduling, scoring, geometry, data rules) → a node test in `tests/*.test.mjs`, registered in the `test` script in `package.json`.
- User-facing behaviour → an `e2e/*.spec.ts` spec.
- Both, when a feature has both. The node suite proves the rules; the E2E proves the user can actually reach them.

Aim for smoke-level coverage of the core path over exhaustive edge cases. A test that walks the real flow and asserts one meaningful thing beats five that assert implementation details.

## Never invent an effect or a mood

Every effect, mood and flavour an ingredient claims must be backed by an
entry in its `docs/research/ingredients/<name>.md`, with a source. If a
property should exist and the research doesn't cover it, **the research
gets written first** — then the extraction profile is transcribed from
it. Not the other way round.

This isn't bureaucracy. The app's entire claim is that it teaches real
extraction chemistry; an unsourced effect is the app making something
up while presenting it with the same authority as the sourced ones, and
a user can't tell the difference. An audit found 21 ingredients
asserting `comfort` with no research behind it, which is how that goes
wrong quietly.

Two tools measure this — run both after touching ingredient data:

```
node tools/audit-research-drift.mjs    # shipped vs prescribed, both directions,
                                       # and magnitude, not just presence
node tools/audit-unreachable.mjs       # declared but never visible in a cup
node tools/audit-vocabulary.mjs        # is a WORD invented? census vs the docs
node tools/audit-opposition.mjs        # opposed pairs one ingredient holds at once
node tools/audit-brew-params.mjs       # does the BREWING ADVICE match the research?
node tools/audit-vocabulary-coverage.mjs  # maps that drifted from the list they key on
node tools/audit-claims.mjs --min=2 --list  # PROSE: which sentences assert a checkable fact
node tools/audit-claims.mjs --anchor       # ...and which have NO particular written down anywhere
node tools/audit-claims.mjs --conflict     # the same fact told twice, differently
node tools/audit-confidence.mjs           # is a `verified` marker EARNED?
```

### The prose says things too, and nothing was checking it

Every audit above reads effects, moods and flavours. **None of them
reads a sentence.** The app ships 849 prose items — 53 blurbs, 624
facts, 32 cultural notes, 140 steep-timer facts — and a blurb could
assert any history it liked without a tool noticing. One did:
"Roman empresses paid taxes in peppercorns" shipped in the blurb, the
facts list AND the steep timer, and is wrong on both halves. Its own
research doc had the medieval framing, correctly, the whole time. A
reader found it.

`audit-claims.mjs` **does not know whether anything is true** — that is
a question for sources, not a regex. It ranks the corpus by how badly a
claim would fail if it were wrong: named people, dates, institutions,
superlatives, numbers, clinical language. 314 items carry at least one
of those signals, 50 carry two or more. A sentence with no proper noun,
no date and no number is usually description the extraction docs
already cover; a sentence naming a monarch and a century is a
checkable assertion about the world, which is the shape the pepper
claim had.

**The failure has three distinct sources, and they need different
fixes.** All three turned up in the first pass through the top 50:

- **Copy drifted from a doc that was right.** Assam's steep-timer line
  called Robert Bruce a "British botanist" who "discovered" wild tea —
  the doc marks that framing as colonial flattening and the blurb
  already handles it properly. White tea's "imperial tribute exclusive"
  is marked `folk` in its own doc. Fix the copy.
- **The doc itself was wrong.** Sage's `Capitulare de villis` date of
  812 CE was marked `verified` in the research; the scholarly consensus
  is 771-800 and no proposal has won. Fix the doc, then the copy.
- **No doc covered it at all.** Ceylon's "over 300,000 tonnes" (real:
  ~264,000) and "largest exporter for much of the 20th century" (real:
  from 1965) were written straight into the app. Write the research.

**`--anchor` is the half that does not need a source in hand.** Ranking
tells you where to look; anchoring tells you what nobody wrote down.
For each claim it extracts the hard particulars — years, quantities,
proper nouns, the tokens a claim can be wrong ABOUT — and asks whether
any of them appear in that ingredient's research doc. 486 claims carry
particulars; **43 have not one of them anywhere in their own doc.**
That is not a list of errors. It is the list of sentences whose truth
rests on nothing but the person who typed them, which is the state the
pepper claim lived in for as long as it shipped.

Two design notes worth keeping. It matches PARTICULARS, not sentences —
prose gets reworded constantly and sentence matching would report
nothing but noise, while a year survives rewording and is what a
fact-check would look up anyway. And it tells a name from a
sentence-initial word by CALIBRATING ON THE CORPUS: any word appearing
in lower case anywhere in the 849 items is an ordinary word whatever
case one sentence gives it. That killed "Powdered", "Today's" and
"Despite" while keeping "Tutankhamun", "Mojitos" and "Stradivarius". A
hand-kept stop list was the first attempt and would have gone stale the
first time someone began a sentence with "Pickled".

**The second pass verified 20 more claims against sources and found 8
more wrong** — lavender's lavender-oil-in-Tutankhamun's-tomb (no source
exists; Carter smelled mummification balm), clove oil beating oregano
and cinnamon (comparative studies put cinnamon first and one ranks
clove last of three), the Afo tree described in the present tense when
it was cut up for firewood twenty years ago, oolong as the first tea
brought to Britain, passionflower's Aztec sedative (the plant is North
American and this doc already said so), rooibos's 2014 GI (the
international one is the 2021 EU PDO), yerba mate's flat "carcinogen"
against IARC's 2A, and ginger as ancient Chinese currency.

That last one is **the pepper error a second time**, and the shape is
worth naming: a MEDIEVAL EUROPEAN commodity-money practice relocated
onto an ancient empire, where it sounds older and more exotic. Roman
empresses and their peppercorns was the same move. When a claim has
that shape, check which continent the practice belongs to.

Confirmed sound, so nobody re-spends the search: Elizabeth I and the
gingerbread men (a real banquet, per Carole Levin), valerian's two-to-
four-week onset, Darjeeling's 87 gardens, Dragonwell's 2001 GI, the
rose as oldest cultivated ornamental, Poivre's 1770 theft, and
peppermint's IBS meta-analysis (Alammar 2019 — 12 trials, 835 patients,
NNT 4).

**Third pass: the unanchored list is now worked off.** Every claim
carrying a signal AND no doc support has been resolved — 43 down to 28,
and all 28 remaining score zero (soft descriptive lines like "pickled
ginger is a palate cleanser"). Resolving one means one of three things,
and which one is a finding in itself:

- **True but unwritten → write the research.** Eleven docs gained
  addenda: Sicilian citrus and the mafia (Dimico, Isopi & Olsson 2017,
  on the 1881-86 Damiani inquiry), vanilla's clonal germplasm and the
  *Fusarium* collapse, vintage sheng auction records, matcha's theanine
  arithmetic, Elizabeth I's gingerbread banquet, valerian's two-to-four-
  week onset, the *Capitulare* contents, spearmint's carvone, gyokuro's
  50°C steep, Pope Francis's gourd.
- **Wrong → correct it.** Hojicha lattes were "a Tokyo cafe
  innovation": the tea is KYOTO, 1920s, and the latte is a mid-2010s
  boom across Japan. Turmeric's supplement fact called bioavailability
  systems "preservative packaging" and Meriva a liposome when it is a
  phytosome. Vanilla's vague "150+ years" became the documented anchor
  it rests on — Albius, 1841.
- **Unverifiable → say so, and keep it.** Dried apple's cultivar claim
  is about what processors buy. No literature settles it either way, so
  the doc records it as `folk` with the reason. Silently deleting it
  and silently keeping it are both worse than writing down that nobody
  knows.

One health claim was hedged rather than corrected: turmeric for liver
complaints cited only the favourable half. Fatty-liver trials do show
improved enzymes, and NIH's LiverTox records dozens of acute liver
injuries from concentrated turmeric products. Both now ship. An app
teaching herbal chemistry does not get to present one side of a safety
literature.

**Know the anchor check's false positive before acting on a hit.**
Cinnamon's coumarin fact reported unanchored on "German Federal
Institute for Risk Assessment" while the doc carried four paragraphs
on cassia's ~1% coumarin and its 25 mg teaspoon — everything but the
name of the body issuing the limit. Substance documented, attribution
floating. Still worth fixing, since a named institution is exactly what
a reader would look up, but it is a citation gap, not an invented
claim.

**`--conflict` catches the shape that bit four times.** Every prose
error found so far that shipped in more than one place shipped
DIFFERENTLY in each: pepper at 408 in the facts list and 410 in the
steep timer; assam's blurb crediting Maniram Dewan while its timer
called Bruce a discovering botanist; ceylon wrong in two distinct ways
across two surfaces. The claims live in different files, no test reads
prose, and nothing compared them. All four were found by a person
reading.

The check is narrow on purpose: two claims about the SAME ingredient
that share a distinctive proper noun but disagree on a year, where the
years are CLOSE. Distance is what separates a contradiction from a
coincidence — two tellings of one event differ by a little (408 against
410), while two different events about one ingredient sit decades apart
(rooibos's 2021 trade protection and its 1968 folk remedy both say
"African" and contradict nothing). It also drops the ingredient's own
name, and any name appearing in four or more of that ingredient's
claims, as background vocabulary: every darjeeling fact says
"Darjeeling", and "Hangzhou" is in four dragonwell claims, while
"Alaric" is in exactly the two that disagreed.

**Getting a year out of prose took three attempts and the middle one
was worse than useless.** "600-2,000m" is an elevation, "3,000 pounds"
hides a thousands separator, "264 million kg" is a magnitude — and
"sacking Rome in 410" is a real year with no era marker. The second
attempt fixed the elevation by requiring BCE/CE on any three-digit
number, which silently dropped the one line the tool existed to find,
and it reported a clean zero while doing it. **A heuristic tuned until
it reports nothing is indistinguishable from a heuristic that works.**
Verify by reintroducing the defect: restore the 410 text and the tool
must name `black-pepper, shares: Rome, years 2 apart`.

It reports PAIRS, NOT VERDICTS, and it stays a hand-run tool rather
than a node test for that reason. Two dates can legitimately differ,
and a hard-failing test on a heuristic would either block real content
or need an exemption list — which is the thing every audit here avoids.
Its finding on the corpus today is zero, which is a real result: the
by-hand corrections caught every instance of a shape nothing was
checking for.

### Is `verified` earned? Mostly nobody has ever checked

The docs mark **608 claims `verified`**, 325 `attested`, 176 `folk`, 136
`established`. Every audit above asks whether a claim is PRESENT in the
research. None asked whether the research can carry it, and the marker
is self-assigned.

**It has been wrong, and how it survived is the mechanical part.** Sage
said Charlemagne ordered sage planted "in his 812 CE *Capitulare de
villis*", marked `verified`, citing `ref-1`. Look at what ref-1 is:

> Hamidpour M et al. "Chemistry, pharmacology, and medicinal property
> of sage ... to prevent and cure illnesses such as obesity, diabetes,
> depression, dementia ..." — type: **review**

A pharmacology review of sage cannot date a Carolingian capitulary. The
row cited a real, resolvable, respectable source that was incapable of
supporting the claim attached to it, and nothing noticed because "has a
ref" was as far as anyone looked. `audit-confidence.mjs` asks three
questions instead, hardest last:

1. Does a `verified` claim cite anything at all? — **14 don't.**
2. Does its ref resolve in §9 Sources? — **0 dangling** (see below).
3. **Can that source bear that claim?** A history or culture claim
   backed only by clinical, analytical or pharmacological refs is a
   category mismatch. — **13 hits, and sage #10 is one of them.**

That last number is the validation worth noting: the tool independently
flags the exact claim that was found wrong by hand, without being told
about it.

**(3) is a SMELL, not a verdict.** A pharmacology review can perfectly
well carry an etymology if its introduction happens to cover one. The
tool cannot read the paper — only that the types don't line up and a
human should look. That is still 608 claims narrowed to 27.

**The headline is the split, not the hits.** Only **67** `verified`
markers sit in claims tables, which are the only structure that records
a citation. **~404 sit in prose blockquotes with no source column at
all** — so for six out of seven confidence markers in the corpus,
questions 2 and 3 cannot even be asked. Those are counted and reported
separately rather than silently passed, because the count IS the
finding.

**No source column is not the same as unsourced, and the difference is
measurable.** Of those 404, **255 (63%) name a year, an era, an author
or a ref inline** — rooibos's PDO paragraph carries "May 2021" in the
sentence itself, which is a perfectly good handle even without a
column to put it in. **149 (37%) name nothing checkable at all.** That
smaller number is the real worklist; quoting the larger one as if it
were all unsourced would be the same overstatement this section exists
to catch.

**One false alarm, recorded so it isn't rediscovered.** The first run
reported three dangling refs in `lions-mane.md` and `reishi.md`. They
were not dangling: those two docs write §9 as a BULLET LIST of full
citations and refer to them by author-year (`ref-lai-2013`), while every
other doc uses a table. The parser knew one shape. A tidy, alarming,
completely wrong finding — the same failure mode as the year regex in
`--conflict`, and the reason both tools now say what they cannot see.

**The worklist is worked off: A, B and C are all zero.** 67 table
`verified` markers became 46, and every survivor cites a resolvable ref
whose TYPE can carry its claim. What it took, in the order the tool
kept correcting me:

- **Two more claims were simply wrong**, and one is the pepper error a
  THIRD time. Orange peel said medieval mulled wine "almost universally"
  included orange or citron peel — medieval *hippocras* was cinnamon,
  ginger, clove and grains of paradise, and fruit-led spiced wines
  appear from the 17th century. A later practice relocated into an
  earlier period, exactly like Roman empresses and Chinese candied
  ginger. Sage said it was "one of the four herbs in the medieval
  *vinaigre des quatre voleurs*" — the FOUR were the thieves, not the
  herbs; early recipes run to a dozen or more, and the legend is
  18th-century plague, not medieval.
- **Ten cultural rows were downgraded, not doubted.** Etymologies,
  folk proverbs and cookbook history cited to pharmacology reviews.
  The facts are fine; `attested` is the honest marker when the source
  in the file cannot settle the claim. Restoring `verified` needs a
  historian, not a phytochemist.
- **Three rows gained real citations** in place of hand-waves.
  "Well-established botanical history" became Ray's *Synopsis
  Methodica* (1696), where peppermint was first described from a plant
  found in Hertfordshire by a Dr Eales. "Well-established Native
  American ethnobotany" became Moerman. Chamomile's Peter Rabbit row
  turned out to be properly sourced already, just in prose.

**"No source named" was three different things and reporting them as
one was the tool's own overstatement.** The first run said 14
`verified` claims cited nothing. Reading them: 3 were real gaps, and 11
were in docs whose §9 is a BULLET LIST with no ref ids — sencha, reishi
and genmaicha all carry genuine sources that simply cannot be cited by
id. That is a doc-format difference, not eleven unsourced claims. Those
three docs now have ref tables.

**40% of the Source column is prose, not citation.** "Tea-industry
convention", "well-established", "processing reality", "content
composition". A category name is not a source, and a cell holding one
reads as cited to anyone skimming. The tool now counts the split every
run. It is acceptable beside `attested`; beside `verified` it was the
whole problem.

**A measurement that moves when you write about it is not a
measurement — and this one moved twice.** The blockquote count jumped
by 14 the moment these addenda were written, because prose ABOUT
`verified` counted as claims marked `verified`. Restricting the count
to blockquote LINES fixed that and then broke the same way again, since
the correction notes are themselves blockquotes that discuss the
marker. The property that actually separates a claim from commentary
is POSITION: a claim ENDS with its marker, while prose mentions one
mid-sentence. Counting only terminal markers took 390 down to 379 —
the missing 11 were this file's own annotations.

"Is not a table row" was never the property. It was a proxy that
happened to work until the corpus grew a paragraph about itself.

**What the blockquote markers ARE, since the number is easy to
misread.** 371 of them sit in one section, §8 "History & cultural
context" — the docs' research NARRATIVE, not the claims tables that
feed the app. §10 is literally headed "Facts for the Steep screen" and
those 46 are all cited now. A blockquote is a paragraph, so it has no
Source column and the two hardest questions cannot be asked of it at
all. 244 name a year or author inline (rooibos's PDO paragraph carries
"May 2021" in the sentence); 135 name nothing checkable, and those are
mostly general botany and interpretive framing — "the plant tolerates
drought and poor soils", "Ayurveda independently arrived at the same
solution". Weak markers there matter less than on a shipped fact, but
that section is where the shipped facts get their authority.

**A retraction is declared, not remembered.** A corrected sentence stays
corrected only until someone reaches for the same nice-sounding line
again. `tests/retracted-claims.test.mjs` reads
`<!-- retracted: phrase -->` markers out of the research docs and fails
if any of them reappears in shipped prose. Put the marker next to the
evidence that killed the claim — the test holds no list of its own, so
retracting something new is one line in the doc a future reader is
already looking at.

`audit-vocabulary-coverage` is the answer to a different question from
the others: not "is this claim sourced" but "does this lookup table
still match the vocabulary it was written against". Two bugs in one day
had that shape — a crystal named "A Jade and **undefined** Swirling
Crystal" because its colour maps still keyed on `warm` and `body` after
the families became `heat`, `comfort`, `digestive` and `immune`; and
four hint flags that were persisted, seeded and threaded to screens
that had stopped reading them.

**The half worth running it for is EXTRA, not MISSING.** A stale key is
what makes a map look covered — every gap found had one sitting next to
it, and the file reads as complete right up until you compare it to the
list. The tool found the second drifted map in `moodCrystal.js` after
the first had just been fixed by hand, in the same file, by someone
looking straight at it.

Not every hit is a bug. Three spellings of the flavour vocabulary are
all legitimate — tokens (`minty`), families (`fresh`), chips (`fruity`)
— and a map may be partial on purpose. Say so in a comment on the map
and the audit skips it; delete the comment and it reports again, which
is why there's no exemption list to go stale.

The drift audit checks flavour at FAMILY level, not leaf level — the
docs write descriptive prose for taste where they use controlled words
for effects, and leaf words are near-synonyms (lapsang's doc says
`smoky`, its profile says `smoked`). The question is whether the
register reaches the cup, not whether both picked the same word.

Brew parameters are the one axis where the app may legitimately depart
from the docs — the research says how an ingredient is conventionally
brewed, and the app also has to serve the blends it ships. Those
departures live in `src/data/brewIntent.js` **with their reason**, not
in an exemption list, because an exemption reads as "not yet fixed" and
these are decisions. Removing an entry makes the audit report that
ingredient again, which is correct if the intent changes.

The last two work word-by-word rather than ingredient-by-ingredient,
which is the gap `comfort` lived in: no single ingredient looked wrong,
but the word shipped on 27 ingredients while 7 docs prescribed it.

Effect vocabulary is judged against **materia medica and TCM**, not
against tea writing. Tea's own sensory lexicons — Lee 2007 for green
tea, the Chinese CTSEM method, QDA — cover flavour, aroma and mouthfeel
and never name effects. So `soothing` is answerable to *demulcent*,
`digestive` to *carminative*, `sleepy` to *sedative*; a word with no
counterpart there is doing lay work and only our own docs constrain it.

### How a claim gets sourced

Three outcomes, all seen in practice — the right one depends on what
the literature says, not on which is least work:

- **Contradicted → remove.** Lemon balm shipped `energy` and `focus`;
  a controlled trial found alertness significantly *reduced*. The app
  was asserting the opposite of its own evidence base. Worse than an
  unsourced claim, because it's confidently wrong.
- **Right effect, wrong register → correct it.** Spearmint's `energy`
  became `focus`: the attention evidence is real and explicitly
  stimulant-free. Same strengths, correct name.
- **Tradition-sourced → keep, and say so.** Cardamom's `energy` has no
  trial behind it but is well documented as traditional use. Recorded
  as tradition, on the same footing as other `sources: traditional`
  entries — never dressed up as clinical.

A finding that applies across every brew point belongs in an addendum
carrying `<!-- sourced-effects: name, name -->`, which the parity guard
reads. Writing the research properly is what clears the guard; editing
the exemption list is not.

Where the docs and the app use different words for one claim, alias in
the audit rather than duplicating the data — `settle` -> `digestive`,
`warming` -> `comfort`. Carrying both made 21 ingredients assert the
same register twice.

## Before merging

Run **all three** locally and report the actual pass/fail counts:

```
npm run typecheck                                          # tsc over the E2E harness
npm test                                                   # node suite
npx playwright test --project=pixel-9 --project=galaxy-s9  # E2E (Chromium only locally)
```

**Two viewports, not one, and galaxy-s9 is the one that earns its
place.** It is the narrowest project CI runs (320 CSS px), and a whole
class of defect is invisible at pixel-9's 360: anything that only
breaks when text WRAPS. A preference label reading
"Container (350 ml)" wrapped to six line boxes there and each line
centred itself, so the label column stopped lining up — measured
`rangeX 20, 20, 30`. Every local run was green and CI was red, on a
spec written the session before precisely to hold that alignment.

It roughly doubles the local gate (~8 minutes). That is the cost of
not learning about the narrow viewport from a red CI run half an hour
after the push, which is also a push that has already deployed.

**Typecheck is not optional and is easy to forget** — it only covers the
TypeScript E2E specs, so a change to `src/` can't break it and it feels
skippable. One mistyped helper parameter in a new spec failed CI three
pushes running: the error was in `e2e/`, every browser passed, and
nothing local complained. `tsc --noEmit` takes seconds.

Check CI after pushing (`gh run list`). A red run that nobody looks at
stays red, and the next push inherits it.

### A flake that repeats is a bug with a bad error message

**If the suite fails more than twice on something already written off as
flaky, stop calling it flaky and open a real investigation.** Put a note
in this file naming the symptom, so the next session inherits the
suspicion rather than the explanation.

This is not general caution. One failure per full run — a different test
each time, every one passing alone — ran for a whole session and was
explained three times: worker contention, then a slow machine, then too
small a budget. All three were wrong, and two of the three "fixes"
would have buried the cause permanently. It was a real bug any user
could hit: brewing earns lodestone charge, a cup that fills the stone
raises a fixed notice at the top of the screen, and that notice covered
the steep screen's minimize button. Tap minimize, nothing happens.

What broke it open, in order, and worth copying:

**`node tools/audit-blind-clicks.mjs` now enforces this, because a
paragraph did not.** The rule below is correct, has been written down
since the elemental-notices investigation, and was broken twice in one
session anyway — 24 tests at 90 seconds each, reporting nothing but
"Test timeout of 90000ms exceeded". Every other recurring failure here
earned a machine check; this one had prose. Asking a reader to
remember harder is the fix with the worst record in this repo.

It is a RATCHET at 97, not a zero gate, and the number came from
measuring rather than from what would have been tidy. 456 actions,
397 with no `expect()` naming the same locator — 88%, which is a wall,
not a gate. Most are fine: clicking the Profile tab without asserting
it exists is not this bug. So the check tiers them. RISKY means the
locator PICKS from several matches (`.first()`, `.nth()`) or is built
from data, so whether it exists depends on earlier state having
worked; both real failures were that shape and neither was a plain
literal. Plain literals are reported for information only.

**The baseline read 23 until the scanner was fixed, and that is the
part worth carrying.** Its receiver regex had no `/` in its character
class, so a regex-literal selector — `getByRole("button", { name:
/lavender/i }).first()` — failed to parse and was silently skipped.
The tool was blindest to exactly the locators most likely to be
missing, while printing a confident low number. A second attempt
sliced the whole line prefix instead and swept in `.first()` from
earlier clauses, reporting 98 the other way. Only a backward scan that
balances delimiters reads the actual expression. **Lower was not
better; lower was wrong** — the same lesson as the year regex in
`--conflict`, arrived at again from the opposite direction.

- **A bare `.click()` has no timeout of its own.** It waits out the
  whole test budget and reports "timeout in beforeEach", which names the
  hook and never the thing that was missing. Assert visibility BEFORE
  clicking and the message changes from "the hook timed out" to "this
  locator never appeared" — or, as here, to "it was visible and the
  click still hung", which is a different bug entirely.
- **A hang scales with whatever budget you give it.** Raising the
  timeout from 30s to 60s moved the failure from 90s to 180s and
  changed nothing else. If a budget increase doesn't fix a timeout, the
  timeout was never the problem — and that result is evidence, so
  revert the raise rather than keeping it.
- **Read the trace.** `test-results/**/trace.zip` records every action;
  the one with a `before` and no `after` is the one that hung, with the
  spec file and line.
- **Measure the geometry, don't reason about it.** `elementFromPoint`
  at the target's own centre names the element actually on top. Reading
  the CSS would not have found this — both elements were correct on
  their own.

Contention and slow machines are real, and neither is the first guess
worth acting on, because both have fixes that hide evidence.

**Closed — `e2e/elemental-notices.spec.ts` under load.** Kept here
because the shape recurs. Tests in this file failed across five full
runs, a different one each time, always passing alone. It read as one
flaky file. It was four separate causes, and calling it "inherently
load-sensitive" delayed finding any of them:

1. A notice card covering the steep screen's minimize button — a real
   bug any user could hit.
2. Notices firing before the lodestone had ever been opened — also
   real, and reported independently.
3. A shared `banner()` locator matching `pulsing|charged`, so a test
   meaning one notice could be satisfied by the other and then fail on
   the body text of the one it wanted. Three failures, three faces,
   one cause. Split into `arrivalBanner` / `chargeBanner`, with
   `banner` kept only for the silence tests where "any notice at all"
   is the actual claim.
4. `fillTheStone` clicking "full" on a stone that could already be
   full. The charge notice fires on a TRANSITION — deliberately, so an
   already-charged stone doesn't greet you with old news — so the test
   was asserting a notice the app was right not to send. Emptying
   first makes the transition real.

Two of the four were app bugs and two were test bugs, and every one of
them looked like flake until it was read properly. Load didn't cause
any of them; it changed the timing enough to expose them.

**CLOSED AGAIN, 2026-08-16 — the FIFTH cause was the app rolling dice
under the test.** Reopened 2026-08-13 with the symptom recorded and a
suspicion attached; the suspicion was wrong, which is why it was
recorded as a guess.

Symptom, as it read for three days: roughly one run in three, one test
in this file fails, a different one each time, and it passes on
immediate re-run. Observed on `:143` ("an elemental arriving announces
itself"), `:187` ("the stone filling while you're on another screen
says so") and `:396` ("dismissing it puts it away and it doesn't come
back"). The `:143` failure read:

```
Error: nothing has arrived yet
Locator: getByText(/your lodestone is (pulsing|charged)/i).first()
Expected: 0   Received: 1
```

— a PRECONDITION assertion, failing because a lodestone notice was
already on screen before the test had done anything to cause one.

**The cause: every action site calls `tryRollOnAction`, which rolls
`Math.random`.** `BASE_CHANCE` is 4.5%, multiplied by 4.0 on a profile
with nothing earned — about 18% per eligible action. Each test makes
two or three tab visits before its silence assertion (`meetTheLodestone`
alone is two), so most runs of the file had a stray arrival somewhere,
and when one landed before a silence check, that test failed. The app
was behaving exactly as designed; the precondition was never guaranteed.

**Why the failing test moved while the assertion shape never did.** Only
a silence assertion can see a stray arrival — a test waiting FOR a
notice cannot fail this way. All three observed failures are silence
assertions. One cause, three faces, for the second time in this file.

What proved it, and it is the same instruction the four earlier causes
ended with: **read the failure's page snapshot, don't reason about it.**
The ribbon on screen in a failing `:143` read "your lodestone is
pulsing / Something stirs in the stone" — the ARRIVAL notice — in a test
that had seeded the charge to 0 and had not yet forced a glimpse. Not a
leftover, not a charge notice: a fresh roll.

The recorded suspicion — seeded profile state leaking between tests —
was wrong, and worth knowing why: each test gets its own browser
context, so nothing survives between them. It fit the evidence
("different test each time") and was still a guess. The note said to
read a trace before believing it. That was the right instruction.

Fixed by seeding `lastElementalRollAt` an hour into the future in the
spec's `boot()`, which holds `rollOnAction`'s own cooldown shut for the
whole run. Not `elementalsDisabled`, which would also switch off the
charge and the dev forcer — the actual subjects. Deliberate arrivals
still fire, which is why `:143` still passes rather than passing
vacuously. `tests/elemental-roll.test.mjs` holds the cooldown property
by name, so removing it fails there instead of quietly restoring the
flake.

Measured: 3 failures in 42 runs before, 0 in 70 after.

Also ruled out along the way, so nobody re-spends it: not the
caffeine/sedative work (reproduced on clean `HEAD`), not load or worker
contention (reproduces running the file ALONE in 15s), and not cause 3
recurring (the combined `pulsing|charged` locator is involved, but as a
silence assertion, which is the usage the split deliberately kept it
for).

**Open, seen once — `e2e/tours.spec.ts:697` ("the spotlight tracks the
strip when it resizes mid-step").** Failed once in a full gate on
2026-08-21, in the run right after the blend hero lost its mood glyph
and descriptor. Passed in the next full gate, in two solo runs of the
whole tours file, and alone. **The trace was lost** — the passing rerun
cleared `test-results/` before it was read, which is a mistake worth
not repeating: copy the failing trace out before re-running anything.

Recorded rather than explained because there is a plausible mechanism
and no evidence for it: that commit shortened the blend header, and
this test is about spotlight geometry tracking a resize. One occurrence
is not a pattern; if it goes twice more, it is a bug with a bad error
message and the note above says how to open it.

**SEEN A SECOND TIME, 2026-08-23, and this time the trace was kept.**
Same test, `galaxy-s9`, in a full gate that otherwise passed (it was
reported as flaky — it passed on retry, so the run exited 0 and the
count was three short of the total, which is the only surface clue a
flake leaves in a truncated log). The measured failure:

```
Error: the cutout's top should stay pinned to the strip's as it resizes
       (offset -15.2px before, 6.0px after; strip 254→27px)
expect(received).toBeLessThanOrEqual(expected)
Expected: <= 2
Received: 21.1875
```

So the assertion is about the CHANGE in offset, not the offset itself:
the cutout sat 15.2px above the strip's top before the resize and 6.0px
below it after, a 21.2px swing against a 2px budget, while the strip
collapsed from 254px to 27px. That is a large, specific, geometric
number — not a timeout, not a missing locator. Whatever it is, it is
not "the machine was busy".

**Occurrence three opens the investigation.** Two things to do first,
both of which cost nothing and were missed last time: copy
`test-results/**` somewhere before re-running anything (the passing
rerun deletes it, which is how the first trace was lost), and check
whether the run reported FLAKY rather than failed — a green exit code
with a passed-count below the total is a flake hiding in plain sight.

**A NEW spec runs against every locally-installed project before it
is pushed, not just the gate's two.** The full gate is pixel-9 +
galaxy-s9 because running everything twice over is slow. That is fine
for a suite that already passed CI once; it is not fine for a spec
nobody has ever run, and `e2e/tap-targets.spec.ts` proved it — written
and verified on pixel-9 and galaxy-s9, red in CI on pixel-fold-open,
iphone-15 and ipad-pro, all three by a single pixel of a threshold
computed from CSS arithmetic rather than measured.

```
npx playwright test e2e/<new>.spec.ts \
  --project=pixel-9 --project=galaxy-s9 --project=pixel-fold-open \
  --project=pixel-fold-cover --project=desktop-chrome
```

Seconds for one file, and it covers five of the nine projects CI runs.
The four it cannot cover are WebKit and Firefox, which is a reason to
be conservative about thresholds, not a reason to skip the five.

**And set a geometric threshold from MEASUREMENT, never from the CSS.**
Insets predict a 42px reach; devices measure 39 to 42 because subpixel
rounding differs. The prediction is not the property. Deriving the
bound from something else on the page is not automatically better
either — the second attempt scaled the expectation with the row pitch,
which sounds principled and is wrong when the inset is a constant: a
device laying rows out on a 55px pitch still reaches 40, and the
"derived" expectation of 47 failed a control that was exactly as big
as everywhere else.

Only Chromium browsers are installed locally — WebKit and Firefox run in CI, and they *do* find real differences (WebKit renders text ~35% taller in places; Firefox panes are shorter). Say so rather than implying full-matrix coverage.

Watch for a stale `vite preview` on `:5173`: `reuseExistingServer` is true locally, so a leftover server silently serves an old `dist/` and makes E2E results meaningless. Check with `ss -lntp | grep 5173` if results look impossible.

## Locators

Assert on stable hooks added to our own markup — `data-tour="..."` for tour anchors, `data-testid="..."` for test-only handles. No brittle absolute paths, no text matching where a hook would do. Add the hook at generation time rather than retrofitting it.

## Lint the files you touched

`npm run lint` reports ~200 findings across `src/`, almost all style, so
a real defect sits invisibly among them. Three undefined references
reached the running app in one session — `jumpNonce`, `useState`,
`revealedSorted` — and **every one was already in eslint's output**.
esbuild does not help: it bundles undefined globals happily, because
resolving them isn't its job. The app crashed; the build was clean.

So: **`npx eslint <the files you changed>` before calling anything
done.** It takes seconds on a handful of files and about two minutes
across `src/`, which is why it isn't in `npm test`.

`npm run lint:crashers` is the enforceable subset — the rules where a
hit throws or silently drops data (`no-undef`, `no-dupe-keys`,
`no-dupe-args`, `no-const-assign`, `no-unreachable`...). Their baseline
is **zero**, so any finding is new and real. It runs in CI beside
typecheck. It found two duplicate object keys the moment it existed,
one of them a width silently overwritten by a later declaration.

Style rules are deliberately excluded from that check. Mixing them back
in is precisely what made the crashes invisible.

## A declared contract beats a written-down one

**Where behaviour is declared in data and honoured somewhere else, the
check derives its expectations from the declaration — it never restates
them.** `e2e/tour-contract.spec.ts` is the worked example and the
reason this section exists.

A guided-tour step declares demo state (`openControls`, `axisMode`,
`demo`) and something four prop-levels away is meant to honour it.
Nothing checked that it did, and two copies of the same fact drifted:

- Six steps declared no `openControls` and silently inherited the
  screen's default. Flipping that default folded the row under steps
  that needed it open, and the tour went on pointing at a slider that
  was no longer rendered.
- `ComposeScreen` kept its own list of which steps run the steep-time
  demo. That list still named the prediction and effects steps after the
  row started folding on them, so the tour drove a control that wasn't
  on screen — measured, the bars swung and the folded row's clock ran
  7:47 to 3:24 with nothing visible causing it.

**Twelve tests failed across four files and not one said "a step didn't
get its state."** They said the callout moved, a slider was missing, a
dock was 37px. One cause wearing twelve faces is what an unchecked
contract does, and it is why the fix is a contract rather than twelve
repairs.

The rule that makes it work, and the one worth not getting wrong:

> **The contract file must not contain the contract.**

`tour-contract.spec.ts` imports `SCREEN_TOURS` and walks whatever is
there. It never lists which steps open the row or which one demos — add
a step, flip a flag, reorder them, and it holds the app to the new
declaration with no edit. A hand-written table of expected states would
be one more copy to drift, which is the exact failure it exists to
catch. **If you find yourself typing the expected values into the test,
stop — you are rebuilding the bug.**

Both halves are verified to fail, and both were checked by breaking them
on purpose:

- **Declaration illegal** — `axisMode` on a step that folds the row is
  reported from the data alone, before a browser starts. The pills are
  rendered inside the row, so binding an axis while it's shut binds
  nothing.
- **Declaration not honoured** — breaking the prop chain reports
  `step 3/13 (blend-graph — "The prediction"): declares demo, but the
  brew sat at 6:00`.

**A contract can encode a mistake, and this one briefly did.** The
illegal-declaration rule was first written as "a step that demos must
open the brew row", reasoning that oscillating the steep time while its
control is put away is motion with an off-screen cause. That is wrong on
the facts — a folded row is CONDENSED, not hidden; it still reads the
temperature and the time, and that clock ticks with the bars. Enforcing
it drove the movement off the two steps where the strips are the lit
subject and left it only on the slider step, where they change dimmed
behind the cutout. Every test passed and the tour got worse. It was
caught by a person watching the tour, not by the suite.

So: **a contract binds what you already know to be true; it does not
settle a design question by being written down.** When adding a rule,
ask what evidence it rests on, and prefer the narrowest rule that
evidence supports. `tests/tour-layout.test.mjs` is the counter-example
worth copying — its rule ("the row folds only at the very end, never
mid-lesson") encodes a defect that was actually reported, and it
correctly rejected the over-broad fix.

The same shape is already in the repo and worth copying: `BREW_WINDOWS`
in `e2e/helpers/brew.ts` names every brew surface and
`tests/brew-surfaces.test.mjs` fails if `src/` grows a fourth that isn't
registered. `src/data/tourBlend.js` + `tests/tour-blend.test.mjs` is the
same idea for the tutorial's seeded pot — it holds the PROPERTIES that
make the blend teach, not the pair, so the blend stays re-pickable.

**A prose doc is the wrong tool here.** It goes stale silently, and
silent staleness is the thing every audit in this file exists to catch.

## State that changes together changes through one path

Follow React's own organisational guidance rather than inventing local
conventions: **if two or more pieces of state always change together,
they change through one function** — merged into a single value, moved
behind a reducer, or at minimum owned by one named operation that every
caller goes through.

This is not a style preference. An audit found four instances, all the
same shape and all of them latent bugs:

- `grantElementals` — an elemental becoming yours wrote three parallel
  stores, hand-rolled at four sites with four different guards.
- `openOverlay` — opening an overlay is set-id + push-history + show,
  hand-rolled at seven sites; one was a verbatim reimplementation of
  `openBlend`.
- `closeSteep` — putting the steep away is four writes, written twice.
- `stepWaitCard` — two functions differing by one character around four
  setters.

**The failure shape is always the same: every copy is correct, nothing
keeps them so, and the symptom surfaces somewhere else.** Miss
`clearOverlayHistory` on one exit path and the exit works fine — the
next Back press walks into a dead overlay. No test fails, because each
individual path is right.

Prefer the lightest form that removes the divergence. A reducer is the
by-the-book answer for a cluster of values, and it is the wrong call
when those values are read independently across a large component —
folding them into one object then touches far more than it fixes. Say
which you chose and why, in a comment.

**Finding them:** grepping for duplicate NAMES only finds duplicated
definitions. This class is duplicated OPERATIONS — no shared name, often
inside one file. Look instead for setters that repeatedly appear within
a few lines of each other across several call sites. Read the results:
`setTab` + `setTabHistory` clusters too, and is correct — push and pop
are inverse operations, not copies.

## Pushing is deploying

**`git push origin main` publishes to herbanium.app.** Vercel builds
from the GitHub integration, so there is no deploy workflow in
`.github/workflows` — that directory holds `ci.yml` and nothing else,
and reading its absence as "pushing is safe" is wrong. It has been
read that way once already.

There is no staging step in between. A push to main is the release, so
both suites pass BEFORE the push, not after.

## Native builds

`npm run cap:sync` (build + `npx cap sync`) before any native build, or
the WebView serves a stale bundle. This is not hypothetical: the iOS
bundle sat three months behind the web app and kept serving a fixed bug
to a real device.

The config is `capacitor.config.json` and **must stay JSON** — the CLI
transpiles a `.ts` config with the TypeScript 5 compiler API, which
`typescript@^7` doesn't provide, and a `.js` config silently falls back
to defaults under `"type": "module"`. Reasoning and per-setting notes
live in `docs/capacitor-config.md`.

## Dev environment

- Vite dev server runs on **5174** (`npx vite --port 5174 --strictPort`). Never 5173 — Playwright's `webServer` owns that port.
- WSL2 doesn't deliver inotify events for `/mnt/c`, so `vite.config.js` polls for changes. Without that the dev server serves whatever it read at startup.

## Persisted state

`src/data/schemaVersion.js` holds `CURRENT_SCHEMA`. **Bumping it wipes every `herbanium.*` key on next load** — journals, saved blends, elementals. It's a reset switch, not a migration. The E2E specs import it rather than hardcoding a value; a stale literal there means the app wipes the seed and the tests quietly run against an empty profile.

## Architecture decisions — settled, don't re-litigate

- **An ingredient's `tempC` / `timeS` range is what we RECOMMEND. How
  far the slider goes is a different question, answered by the DATA.**

  The steep slider now runs to the further of the card's max and the
  profile's last measured row (`PROFILE_TIME_REACH`), so the over-pull
  rows are reachable by the person they describe — chamomile's 420s row
  says "apigenin maxes out but tannins follow", and until this change
  no finger could get there. Fifteen ingredients gained real stretch;
  lavender went 5:15 -> 7:50, hojicha 1:18 -> 2:40.

  **Nothing about the recommendation moved.** The band, the RECOMMENDED
  target and the warnings all still read the card range. Only how far
  you may drag past it changed.

  **No global floor, and this is the part worth not re-deciding.** "Let
  every steep reach 8 minutes" is the obvious version and it is wrong:
  30 of 52 cards cap under 8 minutes and exactly one of those has data
  out that far. Past the last measured row the interpolated curve holds
  its last value, so the FLAVOUR prediction stops moving: the slider
  travels and the bars don't. Measured on eight short-capped
  ingredients — seven returned an identical flavour profile at their
  last row and at 8 minutes.

  (Warnings are the exception, and an earlier version of this note had
  it wrong. They keep responding past the data — lavender 2 -> 3, rose
  4 -> 5, lemon balm 2 -> 3 — because they read dose and time, not only
  the profile rows. So a stretched cup is not un-evaluated; it is
  un-described. Bad enough: the whole point of the stretch is watching
  the cup change.)

  Lengthening those means writing the research and adding the row, not
  widening the control. `tests/brew-reach.test.mjs` fails on a blanket
  floor by design.

  The earlier form of this decision said the over-pull rows were
  deliberately out of reach. That was the right call against the
  proposal on the table at the time — widening the CARD RANGES to cover
  over-pull territory — and it still is: a blend's range is the
  INTERSECTION of its ingredients', so widening every ingredient drags
  the control out of usable proportion the moment a short-steep herb
  shares a pot with a long one. That intersection is untouched, and
  `tests/brew-reach.test.mjs` holds it: a blend is still capped by its
  most delicate lead.

  What changed is that reach and recommendation stopped being the same
  number. Widening the slider alone doesn't widen anything a blend
  intersects, so the objection doesn't reach it.

  Keep over-pull rows in the profiles — they anchor the top of the
  interpolated curve, the warning thresholds read from them, and now
  the slider reaches them. Don't widen a card range to make one
  reachable; add the row instead.


- **A DICTATED POT WEIGHT changes the prediction. A bigger VESSEL does
  not. That asymmetry is the feature, not an inconsistency.**

  `POUR_SIZES` deliberately scales only what you MEASURE OUT: a pot is
  more of the same cup, water and leaf rise together, concentration is
  unchanged, so `gramsFor` always resolves parts against one cup
  whatever the pour. Handing the model three cup-doses because someone
  is making a pot would render it a triple-strength cup, which is the
  bug that whole design removed.

  Letting a user type a total is the opposite case and it took reading
  that note twice to see why it is not the same mistake. The vessel is
  fixed — the water does not move — and the leaf does. That is a real
  concentration change, so `strengthFactor()` feeds it to the model. A
  4g mug and a 12g mug that predict the same cup would be lying.

  Guarded so it cannot become the old bug wearing a text field:
  `TOTAL_BOUNDS` clamps the dial to 0.25x-4x the vessel's standard, the
  override is stored WITH the pour it was set against (so changing
  vessel falls back to standard rather than carrying an 8g override
  onto a pot), and the ratio is untouchable — rescaling multiplies
  every leaf by one factor, because parts are volumetric.

  Verified through the model's OWN OUTPUT rather than the total line:
  a standard chamomile cup raises no palate warnings and a 4x pot
  raises two. Measured with a throwaway probe before the assertion was
  written, because "the weight feeds the calc" is exactly the claim a
  test could pass while being false.

- **Flavour bars saturate above ~25% dose, and the CEILING IS NOT WHY.**
  Measured, not reasoned. Investigated after "peppermint is marking
  menthol max the entire tutorial".

  The pipeline is `raw = strength × loudness × grams`, then
  `clampTo5`. For a 4g cup of peppermint against rooibos:

  | dose | raw `minty` | shown |
  |------|-------------|-------|
  | 6%   | 2.29        | 2.29  |
  | 13%  | 4.29        | 4.29  |
  | 25%  | 7.25        | 5.00  |
  | 50%  | 14.5        | 5.00  |
  | 100% | 29          | 5.00  |

  So the strip cannot tell a mint accent from an all-mint cup. It is
  dose-dependent on loudness: flavours at loudness 2.0 pin on **7 of 7**
  solo cups, loudness ≥1.5 on 41%, loudness <1.5 on 8%. `floral` (0.7)
  never saturates; `apple` (1.0) goes at ~40%.

  **The data is not the problem.** Peppermint's profile honestly
  declares `minty` 3 at 90°C and 4 at 98°C. The ceiling comes from
  `FLAVOR_LOUDNESS`, which is itself sourced — `docs/masking.md`, Eccles
  1994, TRPM8 — so the multiplier is defensible. Note though that mint's
  dominance is ALREADY modelled separately by the masking matrix, so
  loudness is arguably counting it twice.

  **1 PART ALREADY OVERFLOWS, AND DILUTION IS INVISIBLE.** Reported from
  real use: "assam black 5 and peppermint 1, that feels wrong". It is.
  Two facts sharpen the above:

  - Peppermint at 1 part gives raw `minty` 6.3 against a cap of 5. The
    parts UI cannot express less than 1 part, so peppermint can never be
    an accent — it maxes on arrival, always.
  - Raw tracks a leaf's ABSOLUTE dose, not its share (deliberately —
    see the "DOSE, not share" note in `combineFlavors`; a leaf brings
    what's in the pot). So adding assam does not dilute the mint at all:
    9:1 reads 6.30 and 1:1 reads 6.40. Five extra parts of assam change
    nothing the strip can show.

  That cup reads `malty 5.00, bold 5.00, minty 5.00` — three bars
  pinned, so it cannot say assam leads.

  **TWO FIXES ARE RULED OUT BY MEASUREMENT. Don't re-walk them.**

  1. *A genuinely soft ceiling.* The first thing anyone reaches for, and
     it cannot help: raw runs to ~29 against a scale topping at 5, so a
     knee-and-asymptote at 4.5 maps both 7.25 and 29 to 5.00 exactly as
     the clamp does.

  2. *Retuning `FLAVOR_LOUDNESS`.* Also fails, and this one is the
     surprise. Compressing loud values toward 1 buys exactly one step:
     `assam 5 : peppermint 1` improves, and 2 parts is back at 5.00 for
     every coefficient tried. Taken to the limit — loudness forced to
     1.0, no amplification at all — peppermint still caps at 2 parts
     (raw 5.30). **`strength × dose` alone overflows before loudness is
     applied**, so loudness is not what binds. It also barely moved the
     pinning (36 → 28 bars of 630) and flipped MORE leading flavours
     (7–11 blends) than the share-based prototype did.

  A share/relative-loudness prototype DOES work on the reported cup
  (malty 3.64 > minty 3.13, assam leads) and cuts pinning 36 → 5 bars.
  It was not shipped: it buys only one step of mint headroom, drops 14
  bars by more than 2 points including blends named for that very
  flavour (`Lady Grey: citrus 5.0 → 2.9`, `mood:cooling: cool 4.8 →
  2.4`), and couples every bar to whatever else is in the pot — solo
  assam reads `malty 5.00`, but adding one part of mint drops it to
  3.64. The patch is not in the repo; re-deriving it is ~10 lines in
  `combineFlavors`.

  What would actually work is full-range compression
  (`5·(1−e^(−raw/6))`), which restores real discrimination —
  1.59 / 3.51 / 4.55 / 4.96 across that dose sweep. **It also moves every
  reading in the app**: raw 3 shows 1.97 instead of 3.00, raw 5 shows
  2.83 instead of 5.00. Every threshold tuned against today's numbers —
  tannin, overpull, the 0.5 visibility floor, the drift audits — would
  need re-tuning with it. That is a project with its own calibration
  pass, not an edit, and it has not been done.

  **Deliberately left alone for now.** Saturation past a quarter dose is
  arguably perceptually honest — there isn't much "more than maximally
  minty" to taste. The cost is real and specific: the bar stops being
  informative exactly where blending decisions get made. Know that
  before treating a 5.0 as a measurement.

  The tutorial blend works around it rather than fixing it —
  `tests/tour-blend.test.mjs` rejects any pick whose bars sit at the
  ceiling, which is why the seeded pot is elderflower and tulsi.

- **No backend.** Catalogue and extraction profiles ship bundled. Read-mostly reference data; bundling avoids network dependency, latency and hosting cost.
- **Journaling is device-local, deliberately.** Single-purchase app, no subscription revenue, and mood data is sensitive.
- **The algorithm stays in-process.** One client, no other consumers, and extracting it would break offline use.
