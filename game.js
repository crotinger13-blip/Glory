
// Keep every player-facing notice and confirmation inside the game. Native
// browser dialogs label themselves with the hosting origin and can expose
// deployment/provider details that the player should never see.
let gameDialogConfirmAction = null;

function showGameDialog(message, options = {}) {
  const overlay = document.getElementById('gameDialogOverlay');
  const title = document.getElementById('gameDialogTitle');
  const body = document.getElementById('gameDialogMessage');
  const confirmButton = document.getElementById('gameDialogConfirmBtn');
  const cancelButton = document.getElementById('gameDialogCancelBtn');
  if (!overlay || !title || !body || !confirmButton || !cancelButton) {
    // Never fall back to a native browser dialog. The ordinary status line
    // is a safe last resort if this custom overlay is unavailable.
    if (typeof setMessage === 'function') setMessage(String(message || ''));
    return;
  }

  title.textContent = String(options.title || 'NOTICE');
  body.textContent = String(message || '');
  confirmButton.textContent = String(options.confirmText || 'OK');
  gameDialogConfirmAction = typeof options.onConfirm === 'function'
    ? options.onConfirm
    : null;

  if (options.cancelText) {
    cancelButton.textContent = String(options.cancelText);
    cancelButton.style.display = '';
  } else {
    cancelButton.style.display = 'none';
  }
  overlay.classList.add('active');
  requestAnimationFrame(() => confirmButton.focus());
}

function dismissGameDialog() {
  const overlay = document.getElementById('gameDialogOverlay');
  if (overlay) overlay.classList.remove('active');
  gameDialogConfirmAction = null;
}

function acceptGameDialog() {
  const action = gameDialogConfirmAction;
  dismissGameDialog();
  if (action) action();
}

// ── SOUND EFFECTS ──
// STANDING RULE (explicitly requested — do not quietly deviate from this):
// every sound EFFECT in the game (the landing sound below, and every one of
// the ~80 planned card/menu-click sounds still to come) must play at exactly
// SFX_VOLUME, never its own one-off number. The whole point is that no
// single effect should ever sound louder or quieter than any other — when
// wiring up a new sound, set `.volume = SFX_VOLUME` and otherwise leave it
// alone rather than tuning it per-sound. Background music is intentionally
// a separate channel (see MUSIC_VOLUME below near the main menu music) since
// music and foreground SFX conventionally sit at different relative levels
// in a mix — but every individual SFX must match every other SFX exactly.
//
// Also worth remembering for whoever records/exports those future sound
// files: setting the same `.volume` here only controls playback level in the
// browser — it can't fix two source recordings that were captured/mastered
// at different loudness to begin with. Loudness-normalizing every sound
// file during export (e.g. `ffmpeg ... -filter:a loudnorm`) to a consistent
// target before it ever gets embedded is what actually guarantees they all
// sound equally loud, not just equally multiplied.
// `let`, not `const` — the new run-start sound-effects on/off toggle works
// by reassigning this shared variable (see applySfxMuteFromState below)
// rather than touching every individual playXSound() function. Every one
// of those functions reads SFX_VOLUME fresh at the moment a sound actually
// plays, so flipping this one value instantly mutes/unmutes all of them.
let SFX_VOLUME = 0.6;

// Reuse decoded audio so embedded WAV parsing never sits on the click path.
const SFX_AUDIO_POOLS = new Map();
function getCachedSfx(url) {
  let pool = SFX_AUDIO_POOLS.get(url);
  if (!pool) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.load();
    pool = [audio];
    SFX_AUDIO_POOLS.set(url, pool);
  }
  let audio = pool.find(item => item.paused || item.ended);
  if (!audio) {
    audio = pool[0].cloneNode(true);
    pool.push(audio);
  }
  try { audio.currentTime = 0; } catch (err) {}
  return audio;
}
function playCachedSfx(url, volume = SFX_VOLUME) {
  try {
    const audio = getCachedSfx(url);
    audio.volume = volume;
    const playback = audio.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  } catch (err) {}
}
const SFX_VOLUME_ON = 0.6; // the real "on" level — restored when unmuting

// Applies state.sfxMuted (set from the run-start toggle, persisted for the
// whole run same as any other state field, and reset back to false whenever
// a run ends via triggerLose — see there) to the actual SFX_VOLUME every
// playXSound() function reads. Call this any time state.sfxMuted changes:
// right after a new run starts, right after a saved run is resumed, and
// right when a run ends.
function applySfxMuteFromState() {
  SFX_VOLUME = (state && state.sfxMuted) ? 0 : SFX_VOLUME_ON;
}

// Plain-movement landing sound: plays only for a normal move/capture the
// PLAYER makes with their own piece (getValidMoves tags these `plainMovement:
// true` — see executeMove). Deliberately does NOT play for any card/ability-
// driven move (Teleport, Side Step, a charge, Catapult, War Horse, etc.),
// and never for the enemy AI, which has its own separate move path
// (actOnePiece) that never touches executeMove at all.








let pieceMoveAudioContext = null;
let pieceMoveNoiseBuffer = null;
function playPieceLandSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || SFX_VOLUME <= 0) return;
    pieceMoveAudioContext = pieceMoveAudioContext || new AudioContextClass();
    const ctx = pieceMoveAudioContext;
    const playUnlocked = () => {
      // A short, low wooden contact sound made only from filtered noise. The
      // former sample contained a light pitched chirp after the piece landed;
      // avoiding oscillators (and the old sample) leaves only the checker move.
      if (!pieceMoveNoiseBuffer || pieceMoveNoiseBuffer.sampleRate !== ctx.sampleRate) {
        const length = Math.max(1, Math.floor(ctx.sampleRate * .105));
        pieceMoveNoiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = pieceMoveNoiseBuffer.getChannelData(0);
        let smoothed = 0;
        for (let i = 0; i < length; i++) {
          smoothed = smoothed * .78 + (Math.random() * 2 - 1) * .22;
          data[i] = smoothed * Math.pow(1 - i / length, 2.4);
        }
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = pieceMoveNoiseBuffer;
      filter.type = 'lowpass';
      filter.frequency.value = 720;
      filter.Q.value = .45;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(Math.max(.0001, SFX_VOLUME * .28), now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .105);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(now);
      source.stop(now + .11);
    };

    // Android WebView commonly begins with a suspended AudioContext. Starting
    // the source before resume() finishes silently drops the movement sound,
    // so wait for the context to be live before scheduling it.
    if (ctx.state === 'suspended') {
      ctx.resume().then(playUnlocked).catch(() => {});
    } else {
      playUnlocked();
    }
  } catch (err) {
    // Never let a sound-effect failure interrupt the actual game logic.
  }
}

// Generic UI click — plays for any button/control click, in-game or not:
// the main menu, level select, name entry, the leaderboard, the card
// collection, the enlarged-card view, AND, inside
// actual gameplay, the card stacks, the carousel cards, Menu, Forfeit, End
// Turn, and the tutorial banner's Next button — every clickable
// control except the board itself. Deliberately a single document-level
// delegated listener rather than one per button, so every current AND
// future control gets this for free with nothing to wire up by hand and
// nothing to forget when new buttons get added later. #board is the one
// and only exclusion — actual piece moves have their own feedback
// (playPieceLandSound for plain movement, card-specific sounds for
// ability-driven moves, or silence), and shouldn't ALSO get a generic
// click on top of that.


function playUIClickSound() {
  try {
    const sfx = getCachedSfx(UI_CLICK_SOUND_URL);
    sfx.volume = SFX_VOLUME; // standing rule — every SFX shares this one level
    sfx.play().catch(() => {});
  } catch (err) {
    // Never let a sound-effect failure interrupt the actual game logic.
  }
}
function initUIClickSound() {
  // MUST be a capture-phase listener (the trailing `true`), not the default
  // bubble phase. A board-cell click's OWN handler (initBoardClickDelegation,
  // attached on #board, bubble phase — see there) runs cellClick() ->
  // render(), which does `boardEl.innerHTML = ''` and rebuilds the board
  // SYNCHRONOUSLY, before the event ever finishes bubbling up to document.
  // That detaches the original clicked .cell from the DOM tree mid-bubble —
  // and `.closest()` on an already-detached node can only search its own
  // orphaned subtree, so by the time a bubble-phase listener here would run,
  // `e.target.closest('#board')` would no longer find #board at all (it's
  // not an ancestor of the orphaned node anymore) and incorrectly fall
  // through to playing the UI click sound during real board taps. Capture
  // phase runs on the way DOWN, before #board's bubble-phase handler gets a
  // chance to tear anything down, so the ancestry check always sees the
  // pre-click, still-attached DOM.
  document.addEventListener('click', (e) => {
    if (e.target.closest('#board')) return; // board taps have their own sound feedback (or intentionally none)
    playUIClickSound();
    const menuVisible = document.getElementById('mainMenu')?.classList.contains('active')
      || document.getElementById('puzzleMenu')?.classList.contains('active');
    if (menuVisible) playMenuMusic();
  }, true);
}

// Charge-hit impact sound — fires once per enemy actually struck during a
// charge (Infantry Charge, Cavalry Charge, and Chariot Charge all share the
// same animateCharge()/knockOffCapturedPiece() sequence — see there), not
// once for the whole charge. animateCharge already animates every hit
// individually in travel order rather than clearing the lane in one batch,
// so this hooks the exact same per-hit function the visuals use, guaranteeing
// the sound and the knockback/flash/shake always fire together, hit for hit,
// on all three charge cards.


// Usurp warp sound — plays the instant the enemy piece being replaced is
// tapped (both the normal cellClick branch and the scripted tutorial's
// step-2 branch share this exact moment), synced with the piece flipping to
// yours right there in the same tap — not a separate confirmation step, so
// one tap = one sound = one piece swapped.


// King Me fanfare — plays the instant a piece is tapped and crowned (both
// the normal cellClick branch and the scripted tutorial's step-2 branch
// share this exact moment), synced with the crown going on right there in
// the same tap.


function playKingMeSound() {
  try {
    const sfx = getCachedSfx(KING_ME_SOUND_URL);
    sfx.volume = SFX_VOLUME; // standing rule — every SFX shares this one level
    sfx.play().catch(() => {});
  } catch (err) {
    // Never let a sound-effect failure interrupt the actual game logic.
  }
}

function playUsurpSound() {
  try {
    const sfx = getCachedSfx(USURP_SOUND_URL);
    sfx.volume = SFX_VOLUME; // standing rule — every SFX shares this one level
    sfx.play().catch(() => {});
  } catch (err) {
    // Never let a sound-effect failure interrupt the actual game logic.
  }
}

function playChargeHitSound() {
  try {
    const sfx = getCachedSfx(CHARGE_HIT_SOUND_URL);
    sfx.volume = SFX_VOLUME; // standing rule — every SFX shares this one level
    sfx.play().catch(() => {});
  } catch (err) {
    // Never let a sound-effect failure interrupt the actual game logic.
  }
}

// Assassinate slice sound — the card's own flow is "mark targets up to its
// mastery-scaled cap, then the final tap commits and all are struck as ONE
// action" (see cellClick's assassinate branch), so this plays exactly ONCE
// per cast, at the moment that strike commits — not once per target, even
// though animateAssassinate() itself gets called once per target to draw
// each individual slash.


function playAssassinateSliceSound() {
  try {
    const sfx = getCachedSfx(ASSASSINATE_SLICE_SOUND_URL);
    sfx.volume = SFX_VOLUME; // standing rule — every SFX shares this one level
    sfx.play().catch(() => {});
  } catch (err) {
    // Never let a sound-effect failure interrupt the actual game logic.
  }
}

// ── MAIN MENU MUSIC ──
// Loops for as long as the main menu is showing, and pauses (not stops — so
// it picks back up where it left off, not from the top, the next time you're
// back at the menu) the instant a run/tutorial actually starts. showMainMenu()
// and enterGame() are the ONLY two places that toggle #mainMenu's visibility
// anywhere in the game (every path into actual play — New Run, New Run Plus,
// Continue, the tutorial — funnels through enterGame()), so hooking exactly
// those two functions is enough to always get this right with no other call
// sites to keep in sync.


























function playTidalWaveSound() {
  try {
    const sfx = getCachedSfx(TIDAL_WAVE_SOUND_URL);
    sfx.volume = SFX_VOLUME;
    sfx.play().catch(() => {});
  } catch (err) {}
}

// Trojan Horse's activation sound — fires the instant the confirming tap
// lands (the literal first statement in its cellClick branch, before
// markCardUsed runs), same zero-delay rule as the other instant-activation
// cards.


function playTrojanHorseSound() {
  try {
    const sfx = getCachedSfx(TROJAN_HORSE_SOUND_URL);
    sfx.volume = SFX_VOLUME;
    sfx.play().catch(() => {});
  } catch (err) {}
}

// War Tax's activation sound — fires the instant the confirming tap lands
// (the literal first statement in its cellClick branch, before
// markCardUsed runs), same zero-delay rule as the other instant-activation
// cards.


function playWarTaxSound() {
  try {
    const sfx = getCachedSfx(WAR_TAX_SOUND_URL);
    sfx.volume = SFX_VOLUME;
    sfx.play().catch(() => {});
  } catch (err) {}
}

// Thor's Hammer — plays once, right when the player taps the first
// target (the only tap they actually make; the rest of the chain is
// decided automatically). Not repeated per bounce.


function playThorsHammerSound() {
  try {
    const sfx = getCachedSfx(THORS_HAMMER_SOUND_URL);
    sfx.volume = SFX_VOLUME;
    sfx.play().catch(() => {});
  } catch (err) {}
}

// Mobile browsers keep a tab's audio playing (and show it in the OS's
// "Now Playing"/media-output notification, exactly like a music app) even
// after the screen locks or the browser is backgrounded — nothing pauses it
// automatically just because the phone's display turned off. So: pause the
// music the instant the page actually goes into the background (screen
// locked, app switched away, tab hidden), and only resume it on return if
// we're still sitting at the main menu (not mid-run) — matches what
// enterGame()/showMainMenu() already track via #mainMenu's 'active' class.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseMenuMusic();
  } else if (document.getElementById('mainMenu').classList.contains('active')) {
    playMenuMusic();
  }
});

// ── CARD DEFINITIONS ──
const CARD_DEFS = {
  // NEW-CARD DEVELOPER ROSTER
  secret_passage: { name: 'Secret Passage', icon: '◎', desc: 'Beneath the castle - Create connected passageways', rarity: 'rare', color: '#0a1a3a' },
  battering_ram: { name: 'Battering Ram', icon: '◀', desc: 'Break their line - Drive one unit through enemy ranks', rarity: 'uncommon', color: '#1a3320' },
  sanctuary: { name: 'Sanctuary', icon: '⌂', desc: 'Holy ground - One space cannot be attacked', rarity: 'rare', color: '#0a1a3a' },
  headsmans_bounty: { name: "Headsman’s Bounty", icon: '⌖', desc: 'Bring me his crown - Mark enemy kings for glory', rarity: 'rare', color: '#0a1a3a' },
  the_masons: { name: 'The Masons', icon: '⚒', desc: 'Rebuild the field - Repair damaged spaces', rarity: 'common', color: '#3a3228' },
  false_king: { name: 'False King', icon: '♛', desc: 'A crowned deception - Deploy black decoy kings', rarity: 'rare', color: '#0a1a3a' },
  war_drums: { name: 'War Drums', icon: '◉', desc: 'March to war - Friendly pawns advance together', rarity: 'uncommon', color: '#1a3320' },
  portcullis: { name: 'Portcullis', icon: '▦', desc: 'Seal the passage - Close an entire row', rarity: 'rare', color: '#0a1a3a' },
  royal_standard: { name: 'Royal Standard', icon: '⚑', desc: 'Raise the colors - Nearby captures earn more glory', rarity: 'white', color: '#3a3a3a' },
  gallows: { name: 'Gallows', icon: '⌖', desc: 'The sentence is passed - Mark enemies for execution', rarity: 'rare', color: '#0a1a3a' },
  // ── COMMON (gray) ──
  vertical_jump:   { name: 'Infantry Charge', icon: '⚔️', desc: 'To arms - Capture every enemy vertically', rarity: 'common',   color: '#3a3228' },
  horizontal_jump: { name: 'Cavalry Charge',  icon: '🐴', desc: 'Saddle up - Capture enemies horizontally', rarity: 'common',   color: '#3a3228' },
  king_me:         { name: 'King Me',        icon: '♛', desc: 'Heavy is the head - Crown one friendly unit',                      rarity: 'common',   color: '#3a3228' },
  revert:          { name: 'Demotion',       icon: '↩',  desc: 'Stripped of rank - Demote an enemy to a pawn',  rarity: 'common',   color: '#3a3228' },
  teleport:        { name: 'Phantom March',  icon: '👁️', desc: 'March unseen - Move anywhere on the field',                 rarity: 'common',   color: '#3a3228' },
  usurp:           { name: 'Usurp',          icon: '👑', desc: 'Seize control - Replace an enemy with your unit',        rarity: 'common',   color: '#3a3228' },
  side_step:       { name: 'Side Step',      icon: '👣', desc: 'Step aside - Move one square in any direction',   rarity: 'common',   color: '#3a3228' },
  once_more:       { name: 'Once More',      icon: '⏳', desc: 'Never surrender - Revive and move one unit', rarity: 'common', color: '#3a3228', plusOnly: true },
  bodyguard:       { name: 'Bodyguard',       icon: '🛡️', desc: 'Stand back - Trade places with a friendly unit', rarity: 'common', color: '#3a3228' },
  retreat:         { name: 'Retreat',         icon: '🏃', desc: 'Fall back - Move one friendly unit backward', rarity: 'common', color: '#3a3228' },
  // ── UNCOMMON (green) — one use per battle, piece reverts after ──
  double_jump:     { name: 'War Horse',      icon: '🐴', desc: 'Leap diagonally - Capture every unit in your path', rarity: 'uncommon', color: '#1a3320' },
  t_strike:        { name: 'Ballista Fire',  icon: '💣', desc: 'Fire the ballista - Clear one row and column',             rarity: 'uncommon', color: '#1a3320' },
  cross_strike:    { name: 'Cross Strike',   icon: '⚔️', desc: 'Swing your saber - Clear both full diagonals',              rarity: 'uncommon', color: '#1a3320' },
  chariot_charge:  { name: 'Chariot Charge', icon: '🛞', desc: 'Terror on wheels - Chariots cross the field', rarity: 'uncommon', color: '#1a3320' },
  catapult:        { name: 'Catapult',       icon: '🪨', desc: 'Fire the catapult - Launch into the enemy', rarity: 'uncommon', color: '#1a3320' },
  bear_trap:       { name: 'Bear Trap',       icon: '🪤', desc: "Mind your step - Set traps across the field", rarity: 'uncommon', color: '#1a3320', plusOnly: true },
  ambush:          { name: 'Ambush',          icon: '🥷', desc: 'Keep quiet - Destroy enemies that approach', rarity: 'uncommon', color: '#1a3320', plusOnly: true },
  // ── RARE (blue) — one use per entire RUN ──
  wrath:           { name: 'Wrath',          icon: '⚡', desc: 'Divine fury - Destroy the board once per run', rarity: 'rare',     color: '#0a1a3a', masteryCost: 500 },
  assassinate:     { name: 'Assassinate',    icon: '🗡️', desc: 'Stick to the shadows - Mark and strike targets', rarity: 'uncommon', color: '#1a3320' },
  plague:          { name: 'Plague',         icon: '☠️', desc: 'Heaven help us - Death comes for us all', rarity: 'rare',     color: '#0a1a3a' },
  blizzard:        { name: 'Blizzard',       icon: '❄️', desc: 'Winter is coming - Freeze every enemy', rarity: 'rare',     color: '#0a1a3a', plusOnly: true, masteryCost: 500 },
  tornado:         { name: 'Tornado',        icon: '🌪️', desc: 'Take cover - A tornado ravages the field', rarity: 'rare',     color: '#0a1a3a' },
  locust_swarm:    { name: 'Locust Swarm',   icon: '🦗', desc: 'Divine judgment - Locusts swarm the field', rarity: 'rare', color: '#0a1a3a' },
  jester:          { name: 'The Jester',     icon: '🎭', desc: 'Distract with laughter - Force enemies back', rarity: 'rare', color: '#0a1a3a', plusOnly: true },
  meteor_strike:   { name: 'Meteor Strike',  icon: '☄️', desc: 'The sky is falling - Meteors strike the field', rarity: 'rare', color: '#0a1a3a', plusOnly: true },
  black_hole:      { name: 'Black Hole',      icon: '◉', desc: 'The endless galaxy - Pull units toward the center', rarity: 'epic', color: '#7a5709', plusOnly: true, minimumRewardLevel: 30 },
  close_ranks:     { name: 'Close Ranks',     icon: '🔱', desc: "They're surrounded - No one escapes the border", rarity: 'epic', color: '#7a5709' },
  lazarus:        { name: 'Lazarus',         icon: '\u2726', desc: 'Rise again - Your fallen army returns once', rarity: 'epic', color: '#7a5709' },
  sands_of_time:  { name: 'Sands of Time',   icon: '⌛', desc: 'Turn back fate - Reset the last three turns', rarity: 'epic', color: '#7a5709', plusOnly: true },
  divine_intervention: { name: 'Divine Intervention', icon: '☀', desc: 'A miracle - Return all fallen units as pawns', rarity: 'epic', color: '#7a5709' },
  wildfire:        { name: 'Wildfire',       icon: '🔥', desc: 'The flames are spreading - Wildfires erupt', rarity: 'rare', color: '#0a1a3a', plusOnly: true, masteryCost: 1000 },
  shield_wall:     { name: 'Shield Wall',    icon: '🛡️', desc: 'Shields up - Protect units from one attack', rarity: 'uncommon', color: '#1a3320', plusOnly: true },
  counter:         { name: 'Counter',        icon: '⚔️', desc: 'Riposte - Counter captures this turn', rarity: 'uncommon', color: '#1a3320', plusOnly: true },
  coup_detat:      { name: "Coup d'État",    icon: '⚜️', desc: 'No throne is safe - Demote enemy kings', rarity: 'rare',     color: '#0a1a3a', plusOnly: true },
  siege:           { name: 'Siege',          icon: '🏰', desc: 'Lock them down - Enemy kings lose long range', rarity: 'rare', color: '#0a1a3a', plusOnly: true },
  earthquake:      { name: 'Earthquake',     icon: '🌋', desc: 'Every piece is displaced, some into the void', rarity: 'rare', color: '#0a1a3a', plusOnly: true },
  mad_cow:         { name: 'Mad Cow',        icon: '🐄', desc: 'Biological warfare - Destroy foes and leave poison', rarity: 'rare', color: '#0a1a3a', plusOnly: true },
  feint:           { name: 'Feint',          icon: '🌀', desc: 'On your toes - Slide a friendly unit any way', rarity: 'common', color: '#3a3228', plusOnly: true },
  conscript:       { name: 'Conscript',      icon: '📯', desc: 'Desperate times - Add a pawn to your back row', rarity: 'common', color: '#3a3228' },
  dead_mans_hand:  { name: "Dead Man's Hand", icon: '🃏', desc: 'Last gamble - Discard your hand and draw again', rarity: 'rare', color: '#0a1a3a', plusOnly: true },
  heros_gambit:    { name: "Hero's Gambit",  icon: '⚔️', desc: 'Sacrifice units for one extra card use', rarity: 'rare', color: '#0a1a3a', plusOnly: true, masteryCost: 500 },
  phalanx:         { name: 'The Phalanx',    icon: '🔱', desc: 'Spear wall - Make your back row impassable', rarity: 'uncommon', color: '#1a3320', plusOnly: true },
  tidal_wave:      { name: 'Tidal Wave',     icon: '🌊', desc: 'The flood - Destroy everything in the back rows', rarity: 'rare', color: '#0a1a3a' },
  trojan_horse:    { name: 'Trojan Horse',   icon: '🐴', desc: 'The gift - Add a friendly unit to the field', rarity: 'uncommon', color: '#1a3320' },
  war_tax:         { name: 'War Tax',        icon: '💰', desc: 'Spoils of war - Draw temporary cards this level', rarity: 'rare', color: '#0a1a3a' },
  puppet_master:   { name: 'Puppet Master',  icon: '🎭', desc: 'Pull the strings - Move chosen enemy pieces', rarity: 'uncommon', color: '#1a3320' },
  scorched_earth:  { name: 'Scorched Earth', icon: '🔥', desc: "Burn it all - Fire follows your units' paths", rarity: 'uncommon', color: '#1a3320', plusOnly: true },
  last_stand:      { name: 'Last Stand',     icon: '⚔️', desc: 'Never surrender - Sometimes one is enough', rarity: 'uncommon', color: '#1a3320' },
  thors_hammer:    { name: "Thor's Hammer",  icon: '⚡', desc: 'Chain lightning - Strike enemies in a chain', rarity: 'uncommon', color: '#1a3320' },
  // ── WHITE (bonus) — not held, applies a permanent one-time effect the
  // moment you get it (reward pick, or Starter Deck at run start) ──
  plus_one:        { name: 'Plus One',           icon: '➕', desc: 'Add one card to every future reward', rarity: 'white', color: '#3a3a3a', masteryCost: 1000 },
  reinforcements:  { name: 'Reinforcements',      icon: '🎖️', desc: 'Rally the men - Add one piece to your army', rarity: 'white', color: '#3a3a3a', masteryCost: 500 },
  veteran:         { name: 'Veteran',             icon: '🪖', desc: 'Decorated hero - One unit starts as a king', rarity: 'white', color: '#3a3a3a', masteryCost: 500 },
  ace_up_the_sleeve: { name: 'Ace up the Sleeve', icon: '🂡', desc: "Cheater - Gain one card action for this run", rarity: 'white', color: '#3a3a3a', masteryCost: 1000, plusOnly: true },
  blood_oath:      { name: 'Blood Oath',         icon: '🩸', desc: "First loss each level - Draw one card", rarity: 'white', color: '#3a3a3a', masteryCost: 500 },
};

// Keep the legacy `white` key for save compatibility, but never expose that
// internal name to players. This tier is called Bonus everywhere in the UI.
function getRarityDisplayName(rarity) {
  if (rarity === 'white') return 'Bonus';
  return rarity ? rarity.charAt(0).toUpperCase() + rarity.slice(1) : 'Common';
}

// Production Glory Edition: normal progression, a level-1 start, and no
// showcase-only unlocked cards or mastered upgrades.
const CARTOON_SHOWCASE_BUILD = false;
const CARTOON_SHOWCASE_START_LEVEL = 10;
// This sandbox contains every newly developed card plus the complete Epic
// roster, allowing their mechanics and interactions to be tested together
// without adding the older Common/Uncommon/Rare catalog to the hand.
const DEVELOPER_NEW_CARD_IDS = Object.freeze([
  'secret_passage','battering_ram','sanctuary','headsmans_bounty','the_masons',
  'false_king','war_drums','portcullis','royal_standard','gallows',
  'black_hole','close_ranks','lazarus','sands_of_time','divine_intervention'
]);
const DEVELOPER_CARD_COPIES = 1;
const DEVELOPER_UNIQUE_LEVELS = Object.freeze({
  31: 'rectangle',
  32: 'cross',
  33: 'swisscheese',
  34: 'firefield',
  35: 'hourglass',
  36: 'diamond',
});
function applyCartoonShowcaseCollection(target) {
  if (!CARTOON_SHOWCASE_BUILD || !target) return target;
  target.unlockedCards = DEVELOPER_NEW_CARD_IDS.slice();
  target.highestLevelBeaten = Math.max(target.highestLevelBeaten || 0, CARTOON_SHOWCASE_START_LEVEL);
  return target;
}

// ── PERSISTENT CARD COLLECTION ──
// Separate from the per-run save (kingme_save_v1) on purpose: this tracks
// progress ACROSS every run — which cards you've ever unlocked, and the
// highest level you've ever beaten — and must survive "New Run".
const COLLECTION_KEY = 'kingme_glory_collection_v1';
const STARTER_DECK_MILESTONES = [10, 20, 30, 40, 50, 60];
// Each Starter Deck slot is locked to a specific rarity — slot 1 is Common,
// slots 2-3 are Uncommon, slots 4-5 are Rare, slot 6 (unlocked at level 60)
// is White — so a full deck can never end up as, say, five copies of the
// same devastating rare card, and the permanent white-card effects (Plus
// One, Reinforcements) stay a late-run reward rather than a day-one pick.
const STARTER_DECK_RARITIES = ['common', 'uncommon', 'uncommon', 'rare', 'rare', 'white'];

function defaultStarterDeckSlots() {
  return STARTER_DECK_MILESTONES.map(() => null);
}

function loadCollection() {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return { unlockedCards: [], highestLevelBeaten: 0, starterDeckSlots: defaultStarterDeckSlots(), masteryShards: 0, masteryShardsBackfilled: false, masteryGloryPointsMigrated: false, cardMastery: {} };
    const parsed = JSON.parse(raw);
    const slots = Array.isArray(parsed.starterDeckSlots)
      ? parsed.starterDeckSlots.slice(0, STARTER_DECK_MILESTONES.length).map(cardId => CARD_DEFS[cardId] ? cardId : null)
      : [];
    while (slots.length < STARTER_DECK_MILESTONES.length) slots.push(null);
    return {
      unlockedCards: Array.isArray(parsed.unlockedCards) ? parsed.unlockedCards.filter(cardId => !!CARD_DEFS[cardId]) : [],
      highestLevelBeaten: typeof parsed.highestLevelBeaten === 'number' ? parsed.highestLevelBeaten : 0,
      starterDeckSlots: slots,
      // Mastery Shards: the grind currency that will fund per-card upgrades
      // (a separate, later feature) — earned 1-per-enemy-capture, so bigger
      // boards deeper into a run naturally pay out faster. Persisted here
      // alongside the rest of New Run's permanent progress.
      masteryShards: typeof parsed.masteryShards === 'number' ? parsed.masteryShards : 0,
      // One-time backfill guard — see backfillMasteryShards() below.
      masteryShardsBackfilled: !!parsed.masteryShardsBackfilled,
      masteryGloryPointsMigrated: !!parsed.masteryGloryPointsMigrated,
      // Per-card mastery levels (0-3), keyed by card id — see
      // getCardMasteryLevel()/upgradeCardMastery(). Sparse: a card with no
      // key here is level 0.
      cardMastery: (parsed.cardMastery && typeof parsed.cardMastery === 'object')
        ? Object.fromEntries(Object.entries(parsed.cardMastery).filter(([cardId]) => !!CARD_DEFS[cardId]))
        : {},
    };
  } catch (err) {
    console.error('loadCollection failed', err);
    return { unlockedCards: [], highestLevelBeaten: 0, starterDeckSlots: defaultStarterDeckSlots(), masteryShards: 0, masteryShardsBackfilled: false, masteryGloryPointsMigrated: false, cardMastery: {} };
  }
}

function saveCollection() {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  } catch (err) {
    console.error('saveCollection failed', err);
  }
}

let collection = applyCartoonShowcaseCollection(loadCollection());

// ── LIFETIME STATS (Card Collection screen header) ──
// Separate from `collection` (which drives unlocks) — this is pure "how much
// have I actually done" bookkeeping, tracked across every run forever.
const STATS_KEY = 'kingme_glory_stats_v1';
function defaultStats() {
  return {
    runsStarted: 0, runsStartedNormal: 0, runsStartedPlus: 0,
    runsLost: 0,
    totalLevelsCleared: 0,
    bestLevelNormal: 0, bestLevelPlus: 0,
    // Scores eligible for retroactive leaderboard submission.
    legitBestLevelNormal: 0, legitBestLevelPlus: 0,
    piecesCaptured: 0, piecesLost: 0,
    cardsPlayed: 0,
    kingsCrowned: 0,
  };
}
function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw);
    const d = defaultStats();
    Object.keys(d).forEach(k => { if (typeof parsed[k] === 'number') d[k] = parsed[k]; });
    // One-time migration: legitBestLevel*/plus didn't exist before this
    // version, so anyone upgrading would otherwise show 0 here even though
    // they already had real progress in the
    // older bestLevel* fields — seed from that instead of losing it.
    if (typeof parsed.legitBestLevelNormal !== 'number' && typeof parsed.bestLevelNormal === 'number') {
      d.legitBestLevelNormal = parsed.bestLevelNormal;
    }
    if (typeof parsed.legitBestLevelPlus !== 'number' && typeof parsed.bestLevelPlus === 'number') {
      d.legitBestLevelPlus = parsed.bestLevelPlus;
    }
    return d;
  } catch (err) {
    console.error('loadStats failed', err);
    return defaultStats();
  }
}
function saveStats() {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }
  catch (err) { console.error('saveStats failed', err); }
}
let stats = loadStats();

// ── NEW PUZZLE: FULLY SEPARATE COLLECTION/STATS ──
// New Puzzle is a standalone sub-game — its own card collection, starter
// deck, and lifetime stats, completely independent from New Run's `collection`
// / `stats` above. Deliberately NOT migrated from the old shared 'normal'-mode
// data — every Puzzle player starts these fresh (see PUZZLE_COLLECTION_KEY /
// PUZZLE_STATS_KEY below, both new keys).
const PUZZLE_COLLECTION_KEY = 'kingme_glory_puzzle_collection_v1';
function loadPuzzleCollection() {
  try {
    const raw = localStorage.getItem(PUZZLE_COLLECTION_KEY);
    if (!raw) return { unlockedCards: [], highestLevelBeaten: 0, starterDeckSlots: defaultStarterDeckSlots(), masteryShards: 0, masteryShardsBackfilled: false, masteryGloryPointsMigrated: false, cardMastery: {} };
    const parsed = JSON.parse(raw);
    const slots = Array.isArray(parsed.starterDeckSlots)
      ? parsed.starterDeckSlots.slice(0, STARTER_DECK_MILESTONES.length).map(cardId => CARD_DEFS[cardId] ? cardId : null)
      : [];
    while (slots.length < STARTER_DECK_MILESTONES.length) slots.push(null);
    return {
      unlockedCards: Array.isArray(parsed.unlockedCards) ? parsed.unlockedCards.filter(cardId => !!CARD_DEFS[cardId]) : [],
      highestLevelBeaten: typeof parsed.highestLevelBeaten === 'number' ? parsed.highestLevelBeaten : 0,
      starterDeckSlots: slots,
      // Mirrors collection's masteryShards — New Puzzle keeps its own
      // completely separate balance, same as its unlocks/stats/starter deck.
      masteryShards: typeof parsed.masteryShards === 'number' ? parsed.masteryShards : 0,
      masteryShardsBackfilled: !!parsed.masteryShardsBackfilled,
      masteryGloryPointsMigrated: !!parsed.masteryGloryPointsMigrated,
      cardMastery: (parsed.cardMastery && typeof parsed.cardMastery === 'object')
        ? Object.fromEntries(Object.entries(parsed.cardMastery).filter(([cardId]) => !!CARD_DEFS[cardId]))
        : {},
    };
  } catch (err) {
    console.error('loadPuzzleCollection failed', err);
    return { unlockedCards: [], highestLevelBeaten: 0, starterDeckSlots: defaultStarterDeckSlots(), masteryShards: 0, masteryShardsBackfilled: false, masteryGloryPointsMigrated: false, cardMastery: {} };
  }
}
function savePuzzleCollection() {
  try {
    localStorage.setItem(PUZZLE_COLLECTION_KEY, JSON.stringify(puzzleCollection));
  } catch (err) {
    console.error('savePuzzleCollection failed', err);
  }
}
let puzzleCollection = applyCartoonShowcaseCollection(loadPuzzleCollection());

const PUZZLE_STATS_KEY = 'kingme_glory_puzzle_stats_v1';
function defaultPuzzleStats() {
  return {
    runsStarted: 0,
    runsLost: 0,
    totalLevelsCleared: 0,
    bestLevel: 0,
    legitBestLevel: 0,
    piecesCaptured: 0, piecesLost: 0,
    cardsPlayed: 0,
    kingsCrowned: 0,
  };
}
function loadPuzzleStats() {
  try {
    const raw = localStorage.getItem(PUZZLE_STATS_KEY);
    if (!raw) return defaultPuzzleStats();
    const parsed = JSON.parse(raw);
    const d = defaultPuzzleStats();
    Object.keys(d).forEach(k => { if (typeof parsed[k] === 'number') d[k] = parsed[k]; });
    return d;
  } catch (err) {
    console.error('loadPuzzleStats failed', err);
    return defaultPuzzleStats();
  }
}
function savePuzzleStats() {
  try { localStorage.setItem(PUZZLE_STATS_KEY, JSON.stringify(puzzleStats)); }
  catch (err) { console.error('savePuzzleStats failed', err); }
}
let puzzleStats = loadPuzzleStats();

// ── ONE-TIME MASTERY SHARDS BACKFILL ──
// Mastery Shards launched after plenty of players already had real
// lifetime capture counts on the books. Rather than starting everyone at
// zero, credit each save its existing piecesCaptured total once — so
// nobody who already put in the grind shows up behind someone brand new.
// Guarded by masteryShardsBackfilled sitting right on the collection
// object, so a save only ever gets this one-time credit once, even across
// repeated reloads/updates.
function backfillMasteryShards(col, statsObj, save) {
  if (col.masteryShardsBackfilled) return;
  col.masteryShards = (col.masteryShards || 0) + (statsObj.piecesCaptured || 0);
  col.masteryShardsBackfilled = true;
  save();
}
backfillMasteryShards(collection, stats, saveCollection);
backfillMasteryShards(puzzleCollection, puzzleStats, savePuzzleCollection);

// Old saves counted this balance in one-shard-per-piece units. Glory Edition
// prices and earnings are expressed in points, so convert every existing
// balance once without taking progress away from returning players.
function migrateMasteryBalanceToGloryPoints(col, save) {
  if (col.masteryGloryPointsMigrated) return;
  col.masteryShards = Math.max(0, Math.round((col.masteryShards || 0) * 100));
  col.masteryGloryPointsMigrated = true;
  save();
}
migrateMasteryBalanceToGloryPoints(collection, saveCollection);
migrateMasteryBalanceToGloryPoints(puzzleCollection, savePuzzleCollection);

// Resolves the correct live stats object / save function for whatever mode
// the CURRENT run (`state.mode`) is — New Run keeps writing to the original
// shared `stats`, New Puzzle writes to its own `puzzleStats`.
function activeStatsObj() {
  return state && state.mode === 'plus' ? stats : puzzleStats;
}
function saveActiveStats() {
  if (state && state.mode === 'plus') saveStats(); else savePuzzleStats();
}

// Crown a friendly piece and record the event at the moment it happens.
// Previously most move/card paths set `king` before render(), causing the
// render-time fallback to see an already-crowned piece and skip the stat.
function crownFriendlyPiece(piece, clearAbility = false) {
  if (!piece || piece.type !== 'yours' || piece.king) return false;
  piece.king = true;
  piece.wasKing = true;
  if (clearAbility) piece.ability = null;
  const liveStats = activeStatsObj();
  liveStats.kingsCrowned = (liveStats.kingsCrowned || 0) + 1;
  saveActiveStats();
  return true;
}

function activeCollectionObj() {
  return state && state.mode === 'plus' ? collection : puzzleCollection;
}
function saveActiveCollection() {
  if (state && state.mode === 'plus') saveCollection(); else savePuzzleCollection();
}

// ── MASTERY SHARDS ──
// The grind currency behind card upgrades (a later feature): 1 shard per
// enemy piece captured, mode-scoped and persisted the same way as
// collection/stats. Deliberately tied to captures rather than level clears
// — bigger, deeper-run boards have more enemies on them, so shard income
// naturally rises the further you push, without needing a separate scaling
// curve of its own.
function awardMasteryShards(amount) {
  if (!amount) return;
  const col = activeCollectionObj();
  col.masteryShards = (col.masteryShards || 0) + amount;
  saveActiveCollection();
}

// ── CARD MASTERY (grind-to-upgrade) ──
// Cards render (and need to resolve mastery orbs) in a lot of different
// contexts — an active run's hand, a reward screen, or the standalone
// Collection screen, which can be opened with no run active at all and
// toggles between New Run's and New Puzzle's own data independently of
// whatever the last run happened to be. This picks the right one for
// whichever context is actually on screen right now, instead of always
// trusting state.mode (which is only meaningful during a live run).
function resolveMasteryMode() {
  const collectionOpen = document.getElementById('collectionScreen')?.classList.contains('active');
  if (collectionOpen) return activeCollectionScreenMode === 'plus' ? 'plus' : 'normal';
  return (state && state.mode) || 'plus';
}

// Cards can be leveled 0-3 by spending Mastery Shards. Rather than one
// global scaling formula, each card gets its own hand-authored 3-tier
// upgrade path (see CARD_MASTERY_TIERS) — cards are being brought back up
// to their original power level tier by tier, one card at a time, instead
// of all 50 changing at once. A card with no entry in CARD_MASTERY_TIERS
// yet just shows 3 hollow orbs it can't upgrade — visually consistent
// with mastered cards, just not functional until it gets its own tuning
// pass.
const MASTERY_MAX_LEVEL = 3;
const MASTERY_COST_BASE = { common: 2500, uncommon: 5000, rare: 10000, white: 100 };

function masteryUpgradeCost(cardId, targetLevel) {
  const def = CARD_DEFS[cardId];
  // Glory Edition standardizes every Common, Uncommon, and Rare upgrade by
  // rarity. Hand-tuned prices remain only for the separate Bonus/white tier.
  if (def && ['common', 'uncommon', 'rare'].includes(def.rarity)) {
    return MASTERY_COST_BASE[def.rarity];
  }
  if (def && Number.isFinite(def.masteryCost)) return def.masteryCost;
  return (def && MASTERY_COST_BASE[def.rarity]) || 50;
}

// Most cards get the standard 3-orb/3-tier upgrade path, but a few (like
// Phantom March) only have a single meaningful upgrade — this returns how
// many orbs/tiers a given card actually has, derived from the length of its
// own CARD_MASTERY_TIERS entry (falling back to the standard 3 for
// not-yet-tuned cards, which still show 3 hollow, non-functional orbs).
function getCardMasteryMaxLevel(cardId) {
  const tiers = CARD_MASTERY_TIERS[cardId];
  return Array.isArray(tiers) && tiers.length ? tiers.length : MASTERY_MAX_LEVEL;
}

function getPermanentCardMasteryLevel(cardId, mode) {
  // Orb-free cards always remain level 0, including legacy saves that may
  // still contain an old Usurp mastery value.
  if (typeof NO_MASTERY_CARDS !== 'undefined' && NO_MASTERY_CARDS.has(cardId)) return 0;
  const col = mode === 'plus' ? collection : puzzleCollection;
  return (col.cardMastery && col.cardMastery[cardId]) || 0;
}

// Every card copy uses the permanent mastery already unlocked for that card.
// The third argument is retained for compatibility with older call sites and
// saves, but it can no longer downgrade a duplicate to its base effect.
function getCardMasteryLevel(cardId, mode, baseOnlyOverride) {
  // Every copy inherits permanent upgrades, regardless of where that
  // duplicate came from or what an older save recorded in `baseOnly`.
  return getPermanentCardMasteryLevel(cardId, mode);
}

function claimRunCardMastery(cardId) {
  if (!state.masteryClaimedCardIds) state.masteryClaimedCardIds = [];
  if (!state.masteryClaimedCardIds.includes(cardId)) state.masteryClaimedCardIds.push(cardId);
  return false;
}

function createRunCard(cardId, extras = {}) {
  // Black Hole is a unique run card. Every draw path that creates a physical
  // card funnels through here, so remember the acquisition even if that copy
  // is temporary, discarded, or later hidden by Dead Man's Hand.
  if (cardId === 'black_hole') state.blackHoleAcquiredThisRun = true;
  if (cardId === 'sands_of_time') state.sandsOfTimeAcquiredThisRun = true;
  if (cardId === 'divine_intervention') state.divineInterventionAcquiredThisRun = true;
  const baseOnly = claimRunCardMastery(cardId);
  return {
    id: cardId,
    used: false,
    uid: state.cardUidCounter++,
    ...extras,
    baseOnly,
  };
}

function migrateRunCardMasteryState() {
  const hadClaimList = Array.isArray(state.masteryClaimedCardIds);
  const claimed = new Set(hadClaimList ? state.masteryClaimedCardIds : []);
  if (!hadClaimList) {
    if ((state.rewardCardBonus || 0) > 0) claimed.add('plus_one');
    if ((state.bonusPieces || 0) > 0) claimed.add('reinforcements');
    if ((state.veteranCount || 0) > 0) claimed.add('veteran');
    if ((state.bonusCardActions || 0) > 0) claimed.add('ace_up_the_sleeve');
    if ((state.bloodOathCount || 0) > 0) claimed.add('blood_oath');
  }
  (state.cards || []).forEach(card => {
    card.baseOnly = false;
    claimed.add(card.id);
  });
  (state.deadMansHandDiscardedCards || []).forEach(card => { card.baseOnly = false; });
  state.masteryClaimedCardIds = [...claimed];
  // Save migration: infer the unique-card locks for runs created before
  // these fields existed. Dead Man's Hand can temporarily hide the card.
  const visibleBlackHole = (state.cards || []).some(card => card.id === 'black_hole');
  const storedBlackHole = (state.deadMansHandDiscardedCards || []).some(card => card.id === 'black_hole');
  if (visibleBlackHole || storedBlackHole) state.blackHoleAcquiredThisRun = true;
  const visibleSands = (state.cards || []).some(card => card.id === 'sands_of_time');
  const storedSands = (state.deadMansHandDiscardedCards || []).some(card => card.id === 'sands_of_time');
  if (visibleSands || storedSands) state.sandsOfTimeAcquiredThisRun = true;
  const visibleDivine = (state.cards || []).some(card => card.id === 'divine_intervention');
  const storedDivine = (state.deadMansHandDiscardedCards || []).some(card => card.id === 'divine_intervention');
  if (visibleDivine || storedDivine) state.divineInterventionAcquiredThisRun = true;
  if (typeof state.divineInterventionUsedThisRun !== 'boolean') state.divineInterventionUsedThisRun = false;
  if (!state.pendingEpicEffect || typeof state.pendingEpicEffect !== 'object') state.pendingEpicEffect = null;
  if (!state.pendingRareEffect || typeof state.pendingRareEffect !== 'object') state.pendingRareEffect = null;
  if (typeof state.blackHoleUsedThisLevel !== 'boolean') {
    state.blackHoleUsedThisLevel = !!state.blackHoleActive;
  }
}

function getWrathMaxUses(mode) {
  return getCardMasteryLevel('wrath', mode) >= 1 ? 2 : 1;
}

function getPlusOneRewardBonus(mode, baseOnly) {
  return getCardMasteryLevel('plus_one', mode, baseOnly) >= 1 ? 2 : 1;
}

const REINFORCEMENT_PIECES_BY_LEVEL = [1, 2, 3];
function getReinforcementPieceBonus(mode, baseOnly) {
  const level = Math.min(getCardMasteryLevel('reinforcements', mode, baseOnly), REINFORCEMENT_PIECES_BY_LEVEL.length - 1);
  return REINFORCEMENT_PIECES_BY_LEVEL[level];
}

const VETERAN_KINGS_BY_LEVEL = [1, 2, 3, Number.MAX_SAFE_INTEGER];
function getVeteranStartingKingCount(mode, baseOnly) {
  const level = Math.min(getCardMasteryLevel('veteran', mode, baseOnly), VETERAN_KINGS_BY_LEVEL.length - 1);
  return VETERAN_KINGS_BY_LEVEL[level];
}

function getAceCardActionBonus(mode, baseOnly) {
  return getCardMasteryLevel('ace_up_the_sleeve', mode, baseOnly) >= 1 ? 2 : 1;
}

const ASSASSINATE_TARGETS_BY_LEVEL = [1, 2, 3, 4];
function getAssassinateTargetCount(mode) {
  const level = Math.min(getCardMasteryLevel('assassinate', mode), ASSASSINATE_TARGETS_BY_LEVEL.length - 1);
  return ASSASSINATE_TARGETS_BY_LEVEL[level];
}

const PLAGUE_DIVISORS_BY_LEVEL = [5, 4, 3, 3];
function getPlagueVictims(mode) {
  const level = Math.min(getCardMasteryLevel('plague', mode), PLAGUE_DIVISORS_BY_LEVEL.length - 1);
  const candidates = [];
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      const piece = state.board[r][c].piece;
      if (!piece) continue;
      // At full mastery the plague keeps its level-2 one-third strength, but
      // friendly pieces are no longer eligible for the random victim pool.
      if (level >= 3 && piece.type === 'yours') continue;
      candidates.push({ row: r, col: c });
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const victimCount = candidates.length
    ? Math.max(1, Math.round(candidates.length / PLAGUE_DIVISORS_BY_LEVEL[level]))
    : 0;
  return candidates.slice(0, victimCount);
}

function getBlizzardFreezeTurns(mode) {
  return getCardMasteryLevel('blizzard', mode) >= 1 ? 2 : 1;
}

const TORNADO_DIVISORS_BY_LEVEL = [5, 4, 3, 3];
function getTornadoVictims(mode) {
  const level = Math.min(getCardMasteryLevel('tornado', mode), TORNADO_DIVISORS_BY_LEVEL.length - 1);
  const candidates = [];
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      const piece = state.board[r][c].piece;
      if (!piece) continue;
      if (level >= 3 && piece.type === 'yours') continue;
      candidates.push({ row: r, col: c, type: piece.type });
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const victimCount = candidates.length
    ? Math.max(1, Math.round(candidates.length / TORNADO_DIVISORS_BY_LEVEL[level]))
    : 0;
  return candidates.slice(0, victimCount);
}

function getLocustSwarmColumns(mode, boardCols) {
  const level = getCardMasteryLevel('locust_swarm', mode);
  const center = Math.floor(boardCols / 2);
  const columns = level <= 0
    ? [center]
    : level === 1
      ? [center, center + 1]
      : [center - 1, center, center + 1];
  return columns.filter(c => c >= 0 && c < boardCols);
}

function locustSwarmSparesFriendly(mode) {
  return getCardMasteryLevel('locust_swarm', mode) >= 3;
}

function getJesterShoveProfile(mode) {
  const level = getCardMasteryLevel('jester', mode);
  if (level <= 0) return { steps: 1, outward: false };
  if (level === 1) return { steps: 2, outward: false };
  if (level === 2) return { steps: 1, outward: true };
  return { steps: 2, outward: true };
}

function wildfireSparesFriendly(mode, baseOnly) {
  return getCardMasteryLevel('wildfire', mode, baseOnly) >= 1;
}

const COUP_DETAT_TARGETS_BY_LEVEL = [2, 4, 8, Infinity];
function getCoupDetatTargetCount(mode) {
  const level = Math.min(getCardMasteryLevel('coup_detat', mode), COUP_DETAT_TARGETS_BY_LEVEL.length - 1);
  return COUP_DETAT_TARGETS_BY_LEVEL[level];
}

function getCoupDetatTargets(mode) {
  const candidates = [];
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      const piece = state.board[r][c].piece;
      if (piece?.type === 'enemy' && piece.king) candidates.push({ row: r, col: c });
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const targetCount = getCoupDetatTargetCount(mode);
  return targetCount === Infinity ? candidates : candidates.slice(0, targetCount);
}

const EARTHQUAKE_DISTANCE_BY_LEVEL = [1, 2, 2];
function getEarthquakeProfile(mode) {
  const level = Math.min(getCardMasteryLevel('earthquake', mode), EARTHQUAKE_DISTANCE_BY_LEVEL.length - 1);
  return {
    distance: EARTHQUAKE_DISTANCE_BY_LEVEL[level],
    spareFriendly: level >= 2,
  };
}

function getEarthquakeDisplacement(mode, randomFn = Math.random) {
  const { distance, spareFriendly } = getEarthquakeProfile(mode);
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const displaced = [];
  const stationaryFriendly = new Set();

  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      const piece = state.board[r][c].piece;
      if (!piece) continue;
      if (spareFriendly && piece.type === 'yours') {
        stationaryFriendly.add(r + ',' + c);
        continue;
      }
      const direction = directions[Math.floor(randomFn() * directions.length) % directions.length];
      const nr = r + direction[0] * distance;
      const nc = c + direction[1] * distance;
      const inBounds = nr >= 0 && nr < bsR && nc >= 0 && nc < bsC;
      const destination = inBounds ? state.board[nr][nc] : null;
      const hitsHazard = inBounds && (piece.type === 'yours'
        ? destination.hazard === 'crater' || isDeadlyHazardForFriendly(destination, mode)
        : !!destination.hazard);
      displaced.push({ r, c, nr, nc, piece, eliminated: !inBounds || hitsHazard });
    }
  }

  // Resolve every landing simultaneously. Multiple displaced pieces aimed at
  // one square collide and are all lost. At level 2, friendly pieces are fixed
  // in place and fully immune, so an enemy thrown onto one is lost by itself.
  const arrivals = new Map();
  displaced.forEach(entry => {
    if (entry.eliminated) return;
    const key = entry.nr + ',' + entry.nc;
    if (stationaryFriendly.has(key)) {
      entry.eliminated = true;
      return;
    }
    if (!arrivals.has(key)) arrivals.set(key, []);
    arrivals.get(key).push(entry);
  });
  arrivals.forEach(entries => {
    if (entries.length > 1) entries.forEach(entry => { entry.eliminated = true; });
  });
  return displaced;
}

function applyEarthquakeDisplacement(displaced) {
  displaced.filter(entry => entry.eliminated && entry.piece?.type === 'yours').forEach(entry => {
    const deathRow = Math.max(0, Math.min(getBoardRows() - 1, entry.nr));
    const deathCol = Math.max(0, Math.min(getBoardCols() - 1, entry.nc));
    recordLazarusFriendlyDeath(entry.piece, deathRow, deathCol);
  });
  displaced.forEach(({ r, c }) => { state.board[r][c].piece = null; });
  displaced.forEach(entry => {
    if (!entry.eliminated) state.board[entry.nr][entry.nc].piece = entry.piece;
  });
}

function getMadCowBlastOffsets(mode) {
  const level = getCardMasteryLevel('mad_cow', mode);
  if (level <= 0) return [[0, 0]];
  if (level === 1) return [[0, 0], [0, 1], [1, 0], [1, 1]];
  const offsets = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) offsets.push([dr, dc]);
  }
  return offsets;
}

function getMadCowBlast(row, col, mode) {
  const captured = [];
  const affected = [];
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  getMadCowBlastOffsets(mode).forEach(([dr, dc]) => {
    const nr = row + dr;
    const nc = col + dc;
    if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) return;
    affected.push({ row: nr, col: nc });
    if (state.board[nr][nc].piece?.type === 'enemy') captured.push({ row: nr, col: nc });
  });
  return { captured, affected };
}

function madCowSparesFriendlyFromPoison(mode, baseOnly) {
  return getCardMasteryLevel('mad_cow', mode, baseOnly) >= 3;
}

function isDeadlyHazardForFriendly(cell, mode) {
  if (!cell) return false;
  if (cell.hazard === 'poison') {
    if (typeof cell.poisonSparesFriendly === 'boolean') return !cell.poisonSparesFriendly;
    return !madCowSparesFriendlyFromPoison(mode);
  }
  if (cell.hazard !== 'fire') return false;
  // Wildfire's mastery immunity applies only to Wildfire/general field fire.
  // Scorched Earth is deliberately dangerous to friendly units at every tier.
  if (cell.fireSource === 'scorched_earth') return true;
  if (typeof cell.fireSparesFriendly === 'boolean') return !cell.fireSparesFriendly;
  return !wildfireSparesFriendly(mode);
}

// Per-card list of exactly 3 short strings describing what each mastery
// tier actually does — shown verbatim in the orb info popup. The card's
// base (level 0) description on the card face itself never changes; this
// is purely what tapping an orb explains about the upgrade path.
const CARD_MASTERY_TIERS = {
  secret_passage: [
    'Dig 2 color-matched tunnels',
  ],
  battering_ram: ['Drive up to 5 spaces','Drive up to 7 spaces','Drive through the entire row'],
  sanctuary: ['Protect a 2x2 area','Protect a 3x3 area'],
  headsmans_bounty: ['Mark 2 enemy Kings','Mark 3 enemy Kings','Mark 4 enemy Kings'],
  the_masons: ['Repair 4 spaces','Repair 5 spaces','Repair 6 spaces'],
  false_king: ['Deploy 2 false Kings','Deploy 3 false Kings','Deploy 4 false Kings'],
  war_drums: ['Advance 2 pawns','Advance 3 pawns','Advance 3 friendly units'],
  portcullis: ['Seal one row for 2 complete rounds'],
  royal_standard: ['One 3x3 banner area','Two 2x2 banner areas','Two 3x3 banner areas'],
  gallows: ['Mark 4 enemies','Mark 5 enemies','Mark 6 enemies'],
  plus_one: [
    'Add two more cards to every future reward screen',
  ],
  reinforcements: [
    'Add 2 pieces',
    'Add 3 pieces',
  ],
  veteran: [
    '2 friendly units start Kinged',
    '3 friendly units start Kinged',
    'All friendly units start Kinged',
  ],
  ace_up_the_sleeve: [
    'Get 2 additional card actions for this run',
  ],
  blood_oath: [
    'Draw 2 random cards',
    'Draw 3 random cards',
    'Draw 2 Uncommon cards and 1 Rare',
  ],
  feint: [
    'Slide up to 2 squares',
    'Slide up to 3 squares',
    'Slide the chosen unit up to 3 squares even after it has moved',
  ],
  conscript: [
    'Add 2 pawns to your back row',
    'Add 1 pawn and 1 King to your back row',
    'Add 2 Kings to your back row',
  ],
  wrath: [
    'Use twice per run',
  ],
  assassinate: [
    'Mark 2 targets',
    'Mark 3 targets',
    'Mark 4 targets',
  ],
  plague: [
    'Death takes 1/4 of the board',
    'Death takes 1/3 of the board',
    'Your pieces are spared',
  ],
  blizzard: [
    'Freeze all enemies for 2 turns',
  ],
  tornado: [
    'Ravage 1/4 of the board',
    'Ravage 1/3 of the board',
    'Your pieces are spared',
  ],
  locust_swarm: [
    'Swarm 2 rows',
    'Swarm 3 rows',
    'Your pieces are spared',
  ],
  jester: [
    'Push enemies back 2 spaces',
    'Push enemies back 1 and outward 1',
    'Push enemies back 2 and outward 2',
  ],
  wildfire: [
    'Fire does not affect your pieces',
  ],
  shield_wall: [
    'Protect 2 units',
    'Protect 3 units',
    'Protect all units',
  ],
  counter: [
    'Prime 2 units',
    'Prime 3 units',
    'Prime all units',
  ],
  coup_detat: [
    'Demote 4 enemy Kings',
    'Demote 8 enemy Kings',
    'Demote all enemy Kings',
  ],
  siege: [
    'Choose 5 enemy Kings for 1 turn',
    'Choose 5 enemy Kings for 2 turns',
    'All enemy Kings for 2 turns',
  ],
  earthquake: [
    'Displace every piece 2 squares',
    'Your pieces are spared',
  ],
  mad_cow: [
    'Destroy enemies in a 2x2 area',
    'Destroy enemies in a 3x3 area',
    'Your units are immune to poison',
  ],
  king_me: [
    'Crown the chosen unit even after it has moved',
  ],
  vertical_jump: [
    'Charge forward 5 spaces',
    'Charge forward 7 spaces',
    'Charge forward the entire row',
  ],
  horizontal_jump: [
    'Charge forward 5 spaces',
    'Charge forward 7 spaces',
    'Charge forward the entire row',
  ],
  revert: [
    'Demote 2 enemies',
    'Demote 3 enemies',
    'Demote 4 enemies',
  ],
  teleport: [
    'Move the chosen unit anywhere, even after it has moved.',
  ],
  side_step: [
    'Move 2 spaces in any direction',
    'Move 3 spaces in any direction',
  ],
  bodyguard: [
    'Trade places using a unit even after it has moved.',
  ],
  retreat: [
    'Move the chosen unit backwards even after it has moved.',
  ],
  double_jump: [
    'Jump up to 3 enemy units',
    'Jump up to 4 enemy units',
  ],
  t_strike: [
    'Strike 5 spaces in every direction',
    'Strike 7 spaces in every direction',
    'Strike the entire row and column',
  ],
  cross_strike: [
    'Strike 5 spaces along each diagonal',
    'Strike 7 spaces along each diagonal',
    'Strike both full diagonals',
  ],
  chariot_charge: [
    'Charge 5 spaces',
    'Charge 7 spaces',
    'Charge the entire row',
  ],
  catapult: [
    'Blast a 2x2 area',
    'Blast a 3x3 area',
    'Launch using a unit even after it has moved',
  ],
  bear_trap: [
    'Set 2 bear traps',
    'Set 3 bear traps',
    'Set 4 bear traps',
  ],
  ambush: [
    'Choose 2 units to arm',
    'Choose 3 units to arm',
    'Arm a unit even after it has moved',
  ],
  phalanx: [
    'Seal your back 2 rows for 1 turn',
    'Seal your back 2 rows for 2 turns',
  ],
  trojan_horse: [
    'Join at the center of the board',
    "Join on the enemy's third row",
    "Join on the enemy's back row as a King",
  ],
  puppet_master: [
    'Move 2 enemy units',
    'Move 3 enemy units',
    'Move 4 enemy units',
  ],
  scorched_earth: [
    'Choose 1 unit; fire lasts 2 turns',
    'Choose 2 units; fire lasts 2 turns',
    'All units; fire lasts 3 turns',
  ],
  last_stand: [
    'Crown your last unit and draw 2 cards',
    'Crown your last unit and draw 3 cards',
    'Crown your last unit and draw 4 cards',
  ],
  thors_hammer: [
    'Chain to 2 enemies; up to 3 kills',
    'Chain to 3 enemies; up to 4 kills',
    'Chain to 4 enemies; up to 5 kills',
  ],
  dead_mans_hand: [
    'Discard and draw 4 random cards',
    'Discard and draw 3 Uncommon cards',
    'Discard and draw 2 Uncommon cards and 1 Rare',
  ],
  heros_gambit: [
    'Sacrifice 1 unit for an extra card use',
  ],
  tidal_wave: [
    'Flood the back row on both sides',
    'Flood the back 2 rows on both sides',
    'Your pieces are spared',
  ],
  war_tax: [
    'Draw 3 random cards',
    'Draw 3 Uncommon cards',
    'Draw 2 Uncommon cards and 1 Rare',
  ],
};

// The cartoon edition is a level-30 visual/gameplay showcase. Every card is
// not only unlocked but mastered to the end of its real upgrade path, so the
// copies placed in the hand below execute their fully-upgraded behavior and
// display every orb as filled. Orb-free cards correctly remain at level 0.
if (CARTOON_SHOWCASE_BUILD) {
  [collection, puzzleCollection].forEach(target => {
    target.unlockedCards = DEVELOPER_NEW_CARD_IDS.slice();
    target.cardMastery = Object.fromEntries(
      DEVELOPER_NEW_CARD_IDS.map(cardId => [cardId, (CARD_MASTERY_TIERS[cardId] || []).length])
    );
    target.highestLevelBeaten = Math.max(target.highestLevelBeaten || 0, CARTOON_SHOWCASE_START_LEVEL);
  });
}

// Cards that can ignore the New Run Plus once-per-turn move lock (see
// getValidMoves) once mastered up to the listed level — Phantom March,
// Bodyguard, and Retreat get the "move anywhere, even after taking a turn"
// upgrade at level 1 (their only tier); Catapult gets the equivalent
// "launch even after taking a turn" upgrade at its final tier (level 3),
// after its first two tiers are spent widening the blast radius.
const CARD_BASE_EFFECTS = {
  secret_passage: 'Choose 2 squares to create 1 two-way tunnel. Entering either end transports the unit and ends that unit\'s movement.',
  battering_ram: 'Drive 1 friendly unit forward up to 3 spaces, pushing enemies ahead.',
  sanctuary: 'Protect 1 chosen square and its occupant for one complete round.',
  headsmans_bounty: 'Mark 1 enemy King. Jumping it earns double Glory.',
  the_masons: 'Repair up to 3 damaged or hazardous spaces. Unspent repairs remain.',
  false_king: 'Randomly deploy 1 black decoy King that cannot capture.',
  war_drums: 'Advance 1 chosen pawn diagonally forward by 1 square.',
  portcullis: 'Seal 1 chosen row for one complete round.',
  royal_standard: 'Plant 1 banner each level. Captures in its 2x2 area earn double Glory.',
  gallows: 'Mark 3 enemies. Any that fail to move next enemy turn are destroyed.',
  wrath: 'Destroy the entire board. 1 use per run.',
  assassinate: 'Destroy 1 chosen enemy.',
  plague: 'Destroy 1/5 of all pieces.',
  blizzard: 'Freeze all enemies for 1 turn.',
  tornado: 'Destroy 1/5 of all pieces.',
  locust_swarm: 'Destroy the center row.',
  jester: 'Push all enemies back 1 space.',
  wildfire: 'Spread fire; friendly units can burn.',
  shield_wall: 'Protect 1 friendly unit.',
  counter: 'Prime 1 friendly unit to counter.',
  coup_detat: 'Demote up to 2 enemy Kings.',
  siege: 'Disable long range for up to 3 enemy Kings for 1 turn.',
  earthquake: 'Move every piece 1 random square.',
  mad_cow: 'Hit 1 square; poison lasts 3 turns.',
  king_me: 'Crown 1 friendly unit before that unit has moved.',
  usurp: 'Replace 1 enemy at any time.',
  vertical_jump: 'Vertical charge up to 3 spaces.',
  horizontal_jump: 'Horizontal charge up to 3 spaces.',
  once_more: 'Reset 1 unit that already moved so it can move again.',
  revert: 'Demote 1 enemy King.',
  teleport: 'Move 1 unmoved friendly unit anywhere.',
  side_step: 'Move 1 space in any direction.',
  bodyguard: 'Trade places using 1 unmoved friendly unit.',
  retreat: 'Move 1 unmoved friendly unit backwards.',
  double_jump: 'Jump up to 2 enemy units.',
  t_strike: 'Strike 3 spaces by row and column.',
  cross_strike: 'Strike 3 spaces on both diagonals.',
  chariot_charge: 'Charge up to 3 spaces.',
  catapult: 'Launch from 1 unmoved friendly unit; hit the landing square.',
  bear_trap: 'Set 1 bear trap.',
  ambush: 'Arm 1 unmoved friendly unit.',
  phalanx: 'Seal your back row for 1 turn.',
  trojan_horse: 'Add 1 friendly unit randomly.',
  puppet_master: 'Move 1 enemy unit.',
  scorched_earth: 'Choose 1 unit; fire lasts 1 turn.',
  last_stand: 'Crown your last unit; draw 1 card.',
  thors_hammer: 'Chain lightning for up to 2 kills.',
  dead_mans_hand: 'Discard hand; draw 3 random cards.',
  heros_gambit: 'Sacrifice 2 units for an extra use.',
  meteor_strike: 'Strike 5 to 25% of the field; all units can be hit.',
  tidal_wave: 'Destroy your back row.',
  war_tax: 'Draw 2 random temporary cards.',
  black_hole: 'Create a 3x3 center void; immediately pull all units inward 1 square, then pull again after every full turn.',
  close_ranks: 'Destroy every friendly and enemy unit on the playable board perimeter.',
  lazarus: 'Passive: when your last unit falls, revive every fallen friendly unit where it was lost. Enemies on those squares are replaced.',
  sands_of_time: 'Reverse every board change from the previous 3 individual turns in under 5 seconds.',
  divine_intervention: 'Revive fallen friendly units as pawns in random available spaces.',
  plus_one: 'Add one more card to every future reward screen.',
  reinforcements: 'Add 1 piece.',
  veteran: '1 friendly unit starts Kinged.',
  ace_up_the_sleeve: 'Get 1 additional card action for this run.',
  blood_oath: 'First friendly loss each level draws 1 random card.',
  feint: 'Slide 1 unmoved friendly unit up to 1 square in any direction.',
  conscript: 'Add 1 pawn to your back row.',
};

function getCardBaseEffectText(cardId) {
  return CARD_BASE_EFFECTS[cardId] || CARD_DEFS[cardId]?.desc || '';
}

function buildFloatingCardRulesHTML(cardId, levelOverride = null, baseOnly = false) {
  const level = levelOverride == null ? getPermanentCardMasteryLevel(cardId, resolveMasteryMode()) : levelOverride;
  const tiers = CARD_MASTERY_TIERS[cardId];
  let rows = `<div class="floating-card-rule reached"><strong>BASE</strong>${getCardBaseEffectText(cardId)}</div>`;
  if (Array.isArray(tiers) && tiers.length) {
    rows += tiers.map((effect, i) => {
      const reached = i < level;
      return `<div class="floating-card-rule${reached ? ' reached' : ''}"><strong>ORB ${i + 1}${reached ? ' ✓' : ''}</strong>${effect}</div>`;
    }).join('');
  } else if (NO_MASTERY_CARDS.has(cardId)) {
    rows += '<div class="floating-card-rule unavailable"><strong>ORBS</strong>No upgrades.</div>';
  } else {
    rows += '<div class="floating-card-rule unavailable"><strong>ORBS</strong>Upgrade effects unavailable.</div>';
  }
  if (baseOnly) rows = '<div class="floating-card-rule unavailable"><strong>DUPLICATE</strong>Base effect only for this run.</div>' + rows;
  return `<div class="floating-card-rules">${rows}</div>`;
}

const MOVE_LOCK_BYPASS_CARDS = { teleport: 1, bodyguard: 1, retreat: 1, catapult: 3, feint: 3 };

function canUpgradeCardMastery(cardId) {
  return Array.isArray(CARD_MASTERY_TIERS[cardId]);
}

function upgradeCardMastery(cardId, mode) {
  if (!canUpgradeCardMastery(cardId) || !isCardUnlockedInMode(cardId, mode)) return false;
  const col = mode === 'plus' ? collection : puzzleCollection;
  const current = getPermanentCardMasteryLevel(cardId, mode);
  if (current >= getCardMasteryMaxLevel(cardId)) return false;
  const cost = masteryUpgradeCost(cardId, current + 1);
  if ((col.masteryShards || 0) < cost) return false;
  col.masteryShards -= cost;
  if (!col.cardMastery) col.cardMastery = {};
  col.cardMastery[cardId] = current + 1;
  if (mode === 'plus') saveCollection(); else savePuzzleCollection();
  return true;
}

function upgradeCardMasteryForTutorial(cardId, mode) {
  if (!canUpgradeCardMastery(cardId) || !isCardUnlockedInMode(cardId, mode)) return false;
  const col = mode === 'plus' ? collection : puzzleCollection;
  const current = getPermanentCardMasteryLevel(cardId, mode);
  if (current >= getCardMasteryMaxLevel(cardId)) return false;
  if (!col.cardMastery) col.cardMastery = {};
  col.cardMastery[cardId] = current + 1;
  if (mode === 'plus') saveCollection(); else savePuzzleCollection();
  return true;
}

// These upgrades apply to the specific friendly unit being targeted, never
// to the turn as a whole. Moving Piece A does not prevent arming a card for
// an unmoved Piece B. Only selecting Piece A itself requires the listed orb.
const POST_MOVE_UNLOCK_LEVELS = { king_me: 1, feint: 3 };
function canUseCardAfterMoving(cardId, mode, card) {
  const requiredLevel = POST_MOVE_UNLOCK_LEVELS[cardId];
  return requiredLevel == null || getCardMasteryLevel(cardId, mode, card?.baseOnly) >= requiredLevel;
}

function canCardTargetFriendlyPiece(cardId, piece, mode) {
  if (!piece || piece.type !== 'yours') return false;
  if (mode !== 'plus' || state.turnPhase !== 'player') return true;
  if (!(state.plusMovedIds || []).includes(piece.id)) return true;
  const activeCard = state.cards.find(card => card.uid === state.activeCardUid);
  return canUseCardAfterMoving(cardId, mode, activeCard);
}

// Cards that never get mastery upgrades at all — no orb row shown for
// these anywhere (hand, Collection, Starter Deck, enlarged view), not even
// hollow ones.
const NO_MASTERY_CARDS = new Set(['once_more', 'meteor_strike', 'usurp', 'black_hole', 'close_ranks', 'lazarus', 'sands_of_time', 'divine_intervention']);

// Renders the 3-orb row shown at the bottom of every card (see
// buildCardElement) — hollow for un-earned levels, filled gold for earned
// ones. Tapping any orb (filled or not) opens the info popup for that
// specific card, regardless of which orb was tapped. Returns '' for cards
// in NO_MASTERY_CARDS, which just render with no orb row at all.
function getMasteryOrbsHTML(cardId, levelOverride = null) {
  if (NO_MASTERY_CARDS.has(cardId)) return '';
  const mode = resolveMasteryMode();
  const level = levelOverride == null ? getPermanentCardMasteryLevel(cardId, mode) : levelOverride;
  let html = '<div class="mastery-orbs" onclick="event.stopPropagation();">';
  for (let i = 0; i < getCardMasteryMaxLevel(cardId); i++) {
    const filled = i < level;
    html += `<div class="mastery-orb${filled ? ' filled' : ''}" onclick="event.stopPropagation(); openMasteryOrbInfo('${cardId}');"></div>`;
  }
  html += '</div>';
  return html;
}

// Popup shown when any mastery orb is tapped — lists the card's 3-tier
// upgrade path (from CARD_MASTERY_TIERS), current level, and — if it isn't
// already maxed and this card actually has a tuned upgrade path yet — a
// button to spend Mastery Shards and fill the next orb right there.
function openMasteryOrbInfo(cardId) {
  const def = CARD_DEFS[cardId];
  if (!def) return;
  const mode = resolveMasteryMode();
  const level = getPermanentCardMasteryLevel(cardId, mode);
  const tiers = CARD_MASTERY_TIERS[cardId];
  const col = mode === 'plus' ? collection : puzzleCollection;
  const shards = col.masteryShards || 0;
  const tutorialFreeUpgrade = tutorial.active && tutorial.step === 18 && tutorial.upgradeCardId === cardId;

  let tiersHTML;
  if (tiers) {
    tiersHTML = tiers.map((text, i) => {
      const reached = i < level;
      return `<div${reached ? ' class="tier-reached"' : ''}>Level ${i + 1}: ${text}${reached ? ' ✓' : ''}</div>`;
    }).join('');
  } else {
    tiersHTML = '<div>This card hasn\'t been tuned for Mastery yet — check back soon.</div>';
  }

  const unlocked = isCardUnlockedInMode(cardId, mode);
  let actionHTML = '';
  if (!unlocked) {
    actionHTML = '<div class="mastery-orb-popup-shards">Unlock this card before upgrading it.</div>';
  } else if (tiers && level < getCardMasteryMaxLevel(cardId)) {
    const cost = masteryUpgradeCost(cardId, level + 1);
    const canAfford = tutorialFreeUpgrade || shards >= cost;
    actionHTML = `
      <div class="mastery-orb-popup-shards">${tutorialFreeUpgrade ? 'Tutorial upgrade — FREE' : `You have ${shards.toLocaleString()} Glory Points`}</div>
      <button ${tutorialFreeUpgrade ? 'id="tutorialFreeUpgradeBtn"' : ''} class="mastery-orb-popup-btn" ${canAfford ? '' : 'disabled'} onclick="confirmUpgradeCardMastery('${cardId}')">
        Upgrade to Level ${level + 1} — ${tutorialFreeUpgrade ? 'FREE' : cost.toLocaleString() + ' Points'}
      </button>`;
  } else if (tiers) {
    actionHTML = `<div class="mastery-orb-popup-shards">Fully mastered!</div>`;
  }

  document.getElementById('masteryOrbPopup').innerHTML = `
    <div class="mastery-orb-popup-title">${def.name}</div>
    <div class="mastery-orb-popup-base"><strong>BASE:</strong> ${getCardBaseEffectText(cardId)}</div>
    <div class="mastery-orb-popup-tiers">${tiersHTML}</div>
    ${actionHTML}
    <div class="mastery-orb-popup-close" onclick="closeMasteryOrbInfo()">Close</div>`;
  document.getElementById('masteryOrbOverlay').classList.add('active');
  if (tutorial.active && tutorial.step === 16 && tutorial.upgradeCardId === cardId) {
    advanceTutorial(17);
  }
}

function closeMasteryOrbInfo() {
  document.getElementById('masteryOrbOverlay').classList.remove('active');
}

function confirmUpgradeCardMastery(cardId) {
  const mode = resolveMasteryMode();
  const tutorialFreeUpgrade = tutorial.active && tutorial.step === 18 && tutorial.upgradeCardId === cardId;
  const upgraded = tutorialFreeUpgrade
    ? upgradeCardMasteryForTutorial(cardId, mode)
    : upgradeCardMastery(cardId, mode);
  if (upgraded) {
    // Re-render whatever's showing this card right now so its orbs update
    // immediately, then refresh the popup to reflect the new level/cost.
    if (document.getElementById('collectionScreen')?.classList.contains('active')) renderCollectionScreen();
    else if (typeof render === 'function' && state) render();
    if (tutorialFreeUpgrade) advanceTutorial(19);
    openMasteryOrbInfo(cardId);
  }
}

// Vertical Jump ("Infantry Charge")'s actual leap distance, driven by its
// mastery level — level 0 (unupgraded) is a deliberately-weakened 3
// spaces; each tier brings it back up, capping at the entire row once
// fully mastered (its original, pre-mastery-system behavior).
const VERTICAL_JUMP_RANGE_BY_LEVEL = [3, 5, 7, Infinity];
function getVerticalJumpRange(mode) {
  const level = getCardMasteryLevel('vertical_jump', mode);
  return VERTICAL_JUMP_RANGE_BY_LEVEL[level];
}

// Horizontal Jump ("Cavalry Charge") gets the exact same treatment as
// Infantry Charge above — same weakened base, same 3-tier ramp back up to
// its original unlimited-row behavior.
const HORIZONTAL_JUMP_RANGE_BY_LEVEL = [3, 5, 7, Infinity];
function getHorizontalJumpRange(mode) {
  const level = getCardMasteryLevel('horizontal_jump', mode);
  return HORIZONTAL_JUMP_RANGE_BY_LEVEL[level];
}

// Side Step's slide distance, driven by its mastery level — base
// (unupgraded) is a single space; level 1 extends it to 2, level 2 (full
// mastery, only 2 tiers for this card) extends it to 3.
const SIDE_STEP_RANGE_BY_LEVEL = [1, 2, 3];
function getSideStepRange(mode) {
  const level = getCardMasteryLevel('side_step', mode);
  return SIDE_STEP_RANGE_BY_LEVEL[level];
}

const FEINT_RANGE_BY_LEVEL = [1, 2, 3, 3];
function getFeintRange(mode) {
  const level = Math.min(getCardMasteryLevel('feint', mode), FEINT_RANGE_BY_LEVEL.length - 1);
  return FEINT_RANGE_BY_LEVEL[level];
}

const CONSCRIPT_KING_FLAGS_BY_LEVEL = [
  [false],
  [false, false],
  [false, true],
  [true, true],
];
function getConscriptKingFlags(mode) {
  const level = Math.min(getCardMasteryLevel('conscript', mode), CONSCRIPT_KING_FLAGS_BY_LEVEL.length - 1);
  return CONSCRIPT_KING_FLAGS_BY_LEVEL[level].slice();
}

// War Horse ("double_jump") is limited by how many enemy units it can jump,
// not by the destination's raw distance. Base captures up to 2 units in one
// diagonal leap; its two mastery tiers raise that limit to 3 and then 4.
const DOUBLE_JUMP_MAX_CAPTURES_BY_LEVEL = [2, 3, 4];
function getDoubleJumpMaxCaptures(mode) {
  const level = getCardMasteryLevel('double_jump', mode);
  return DOUBLE_JUMP_MAX_CAPTURES_BY_LEVEL[level];
}

// Ballista Fire ("t_strike") gets the exact same progression as Infantry
// Charge/Cavalry Charge — base (unupgraded) only reaches 3 spaces out
// along its row and column, tiers extend it to 5 then 7, and full mastery
// removes the cap entirely (wipes the whole row and column, its original
// pre-mastery-system behavior).
const T_STRIKE_RANGE_BY_LEVEL = [3, 5, 7, Infinity];
function getTStrikeRange(mode) {
  const level = getCardMasteryLevel('t_strike', mode);
  return T_STRIKE_RANGE_BY_LEVEL[level];
}

// One source of truth for Ballista Fire's cross-shaped blast. Both click
// paths, the move generator, and the animation use this mastery-scaled area.
function getTStrikePattern(row, col, mode) {
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const range = getTStrikeRange(mode);
  const captured = [];
  const affected = [];
  for (let r = 0; r < bsR; r++) {
    if (r === row || Math.abs(r - row) > range) continue;
    if (state.board[r][col].piece?.type === 'enemy') captured.push({ row: r, col });
    affected.push({ row: r, col });
  }
  for (let c = 0; c < bsC; c++) {
    if (c === col || Math.abs(c - col) > range) continue;
    if (state.board[row][c].piece?.type === 'enemy') captured.push({ row, col: c });
    affected.push({ row, col: c });
  }
  return { captured, affected, range };
}

// Cross Strike gets the exact same progression as Ballista Fire/Infantry
// Charge — base (unupgraded) only reaches 3 spaces out along each
// diagonal, tiers extend it to 5 then 7, and full mastery removes the cap
// entirely (wipes both full diagonals, its original pre-mastery-system
// behavior).
const CROSS_STRIKE_RANGE_BY_LEVEL = [3, 5, 7, Infinity];
function getCrossStrikeRange(mode) {
  const level = getCardMasteryLevel('cross_strike', mode);
  return CROSS_STRIKE_RANGE_BY_LEVEL[level];
}

// Chariot Charge gets the exact same progression as Infantry
// Charge/Cavalry Charge/Ballista Fire/Cross Strike — base (unupgraded)
// only reaches 3 spaces, tiers extend it to 5 then 7, and full mastery
// removes the cap entirely (its original "2x2 across the battlefield"
// behavior).
const CHARIOT_CHARGE_RANGE_BY_LEVEL = [3, 5, 7, Infinity];
function getChariotChargeRange(mode) {
  const level = getCardMasteryLevel('chariot_charge', mode);
  return CHARIOT_CHARGE_RANGE_BY_LEVEL[level];
}

// Catapult's blast footprint (relative [dr,dc] offsets from the landing
// tile), driven by its mastery level — base (unupgraded) is just the
// landing tile itself with no blast at all; level 1 adds a 2x2 area
// (landing tile plus right/down/down-right); level 2 restores the
// original 3x3 blast. Level 3 doesn't change the blast further — its
// upgrade is the move-lock bypass, handled separately in getValidMoves
// (see MOVE_LOCK_BYPASS_CARDS).
// Bear Trap's how-many-traps-can-be-set-at-once count, driven by its
// mastery level — level 0 (unupgraded) only sets a single trap; each tier
// adds one more, up to 4 at full mastery.
const BEAR_TRAP_COUNT_BY_LEVEL = [1, 2, 3, 4];
function getBearTrapCount(mode) {
  const level = getCardMasteryLevel('bear_trap', mode);
  return BEAR_TRAP_COUNT_BY_LEVEL[level];
}

// Ambush's how-many-units-can-be-armed-at-once count, driven by its
// mastery level — level 0 (unupgraded) only arms a single unit; the first
// two tiers add one more each (up to 3); the third tier doesn't add a 4th
// unit, its upgrade is instead letting an already-moved piece be armed
// (see the moved-piece check alongside this in cellClick).
const AMBUSH_COUNT_BY_LEVEL = [1, 2, 3, 3];
function getAmbushCount(mode) {
  const level = getCardMasteryLevel('ambush', mode);
  return AMBUSH_COUNT_BY_LEVEL[level];
}
function ambushCanArmMovedPiece(mode) {
  return getCardMasteryLevel('ambush', mode) >= 3;
}

function getAmbushEligibleFriendlyCells(mode) {
  return getFriendlyCells().filter(({ row, col }) => {
    const piece = state.board[row][col].piece;
    return mode !== 'plus' || state.turnPhase !== 'player' ||
      ambushCanArmMovedPiece(mode) || !(state.plusMovedIds || []).includes(piece.id);
  });
}

const SHIELD_WALL_TARGETS_BY_LEVEL = [1, 2, 3, Infinity];
function getShieldWallTargetCount(mode) {
  const level = Math.min(getCardMasteryLevel('shield_wall', mode), SHIELD_WALL_TARGETS_BY_LEVEL.length - 1);
  return SHIELD_WALL_TARGETS_BY_LEVEL[level];
}

function getFriendlyCells() {
  const cells = [];
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      if (state.board[r][c].piece?.type === 'yours') cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function commitShieldWall(targets) {
  playShieldWallSound();
  state.shieldWallTargets = [];
  markCardUsed('shield_wall');
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  beginUncommonAnimationResolution();
  targets.forEach(({ row, col }) => {
    const piece = state.board[row]?.[col]?.piece;
    if (piece?.type === 'yours') piece.shielded = true;
  });
  saveStagedUncommonResolution();
  animateShieldWall(targets, () => {
    finishUncommonAnimationResolution();
    setMessage('');
    maybeEndPlayerTurn();
  });
}

const COUNTER_TARGETS_BY_LEVEL = [1, 2, 3, Infinity];
function getCounterTargetCount(mode) {
  const level = Math.min(getCardMasteryLevel('counter', mode), COUNTER_TARGETS_BY_LEVEL.length - 1);
  return COUNTER_TARGETS_BY_LEVEL[level];
}

function commitCounter(targets) {
  state.counterTargets = [];
  markCardUsed('counter');
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  beginUncommonAnimationResolution();
  targets.forEach(({ row, col }) => {
    const piece = state.board[row]?.[col]?.piece;
    if (piece?.type === 'yours') piece.countering = true;
  });
  saveStagedUncommonResolution();
  // Counter is already active in gameplay state. Reflect that immediately
  // instead of waiting for the cosmetic animation to finish; otherwise the
  // pieces look unchanged until some unrelated action forces a later render.
  render();
  setMessage('COUNTER ARMED');

  let finished = false;
  let fallbackTimer = null;
  const finishCounterCast = () => {
    if (finished) return;
    finished = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    finishUncommonAnimationResolution();
    setMessage('');
    maybeEndPlayerTurn();
  };

  // A visual failure must never leave the board-resolution lock active or
  // make a successfully applied Counter appear unresponsive.
  fallbackTimer = setTimeout(finishCounterCast, 1300);
  try {
    animateCounterCast(targets, finishCounterCast);
  } catch (err) {
    console.error('Counter cast animation failed:', err);
    finishCounterCast();
  }
}

function handleCounterSelection(row, col) {
  if (state.activeCard !== 'counter') return false;
  const friendlyCells = getFriendlyCells();
  const requested = getCounterTargetCount(state.mode);
  if (requested === Infinity) {
    if (state.board[row]?.[col]?.piece?.type !== 'yours') {
      setMessage('TAP A FRIENDLY UNIT TO ARM COUNTER ON ALL UNITS');
      return true;
    }
    commitCounter(friendlyCells);
    return true;
  }
  const targetCap = Math.min(requested, friendlyCells.length);
  if (!state.counterTargets) state.counterTargets = [];
  if (targetCap <= 0) return true;
  if (state.board[row]?.[col]?.piece?.type !== 'yours') {
    const remaining = targetCap - state.counterTargets.length;
    setMessage(`SELECT ${remaining} FRIENDLY UNIT${remaining === 1 ? '' : 'S'} TO COUNTER`);
    return true;
  }
  const existing = state.counterTargets.findIndex(t => t.row === row && t.col === col);
  if (existing >= 0) {
    state.counterTargets.splice(existing, 1);
    render();
    setMessage(`SELECT ${targetCap - state.counterTargets.length} UNIT${targetCap - state.counterTargets.length === 1 ? '' : 'S'}`);
    return true;
  }
  state.counterTargets.push({ row, col });
  if (state.counterTargets.length >= targetCap) {
    commitCounter(state.counterTargets.slice());
  } else {
    render();
    if ((state.royalStandardPlacementRemaining || 0) > 0) {
      setMessage(state.royalStandardPlacementPreview
        ? 'TAP THE HIGHLIGHTED AREA AGAIN TO PLANT THE ROYAL STANDARD'
        : `PLANT ${state.royalStandardPlacementRemaining} ROYAL STANDARD${state.royalStandardPlacementRemaining === 1 ? '' : 'S'} — TAP A SPACE TWICE TO CONFIRM`);
    }
    setMessage(`SELECT ${targetCap - state.counterTargets.length} MORE`);
  }
  return true;
}

const SIEGE_TARGETS_BY_LEVEL = [3, 5, 5, Infinity];
const SIEGE_TURNS_BY_LEVEL = [1, 1, 2, 2];

const PHALANX_ROWS_BY_LEVEL = [1, 2, 2];
const PHALANX_TURNS_BY_LEVEL = [1, 1, 2];

function getPhalanxEffect(mode) {
  const level = Math.min(getCardMasteryLevel('phalanx', mode), PHALANX_ROWS_BY_LEVEL.length - 1);
  return {
    rows: PHALANX_ROWS_BY_LEVEL[level],
    turns: PHALANX_TURNS_BY_LEVEL[level],
  };
}

function getTrojanHorseSpawn(mode) {
  const level = Math.min(getCardMasteryLevel('trojan_horse', mode), 3);
  const bsR = getBoardRows(), bsC = getBoardCols();
  const openCells = getBoardShape().filter(({ r, c }) =>
    !state.board[r][c].piece && !state.board[r][c].hazard
  );
  if (!openCells.length) return null;

  let candidates = openCells;
  if (level === 1) {
    // Odd boards have one exact center; even boards have four equally central
    // cells. If those are occupied, use the nearest legal cells instead.
    const centerR = (bsR - 1) / 2, centerC = (bsC - 1) / 2;
    const distance = ({ r, c }) => (r - centerR) ** 2 + (c - centerC) ** 2;
    const nearest = Math.min(...openCells.map(distance));
    candidates = openCells.filter(cell => distance(cell) === nearest);
  } else if (level === 2) {
    // The enemy's third row is row 2 when counted from its back edge (row 0).
    // If it is completely full or hazardous, fall back to the nearest row.
    const targetRow = Math.min(2, bsR - 1);
    const nearest = Math.min(...openCells.map(cell => Math.abs(cell.r - targetRow)));
    candidates = openCells.filter(cell => Math.abs(cell.r - targetRow) === nearest);
  } else if (level >= 3) {
    // Enemy back row is row 0. A full/hazardous row falls back toward the
    // nearest enemy-side row so the card still resolves whenever space exists.
    const nearest = Math.min(...openCells.map(cell => cell.r));
    candidates = openCells.filter(cell => cell.r === nearest);
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { r: pick.r, c: pick.c, king: level >= 3 };
}

function getSiegeTargetCount(mode) {
  const level = Math.min(getCardMasteryLevel('siege', mode), SIEGE_TARGETS_BY_LEVEL.length - 1);
  return SIEGE_TARGETS_BY_LEVEL[level];
}

function getSiegeDuration(mode) {
  const level = Math.min(getCardMasteryLevel('siege', mode), SIEGE_TURNS_BY_LEVEL.length - 1);
  return SIEGE_TURNS_BY_LEVEL[level];
}

function getEnemyKingCells() {
  const cells = [];
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      const piece = state.board[r][c].piece;
      if (piece?.type === 'enemy' && piece.king) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function commitSiege(targets) {
  const duration = getSiegeDuration(state.mode);
  playSiegeSound();
  state.siegeTargets = [];
  markCardUsed('siege');
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  targets.forEach(({ row, col }) => {
    const piece = state.board[row]?.[col]?.piece;
    if (piece?.type === 'enemy' && piece.king) piece.siegedTurnsLeft = (piece.siegedTurnsLeft || 0) + duration;
  });
  render();
  setMessage((state.royalStandardPlacementRemaining || 0) > 0
    ? `PLANT ${state.royalStandardPlacementRemaining} ROYAL STANDARD${state.royalStandardPlacementRemaining === 1 ? '' : 'S'} — TAP A SPACE TWICE TO CONFIRM`
    : '');
  maybeEndPlayerTurn();
}

function handleSiegeSelection(row, col) {
  if (state.activeCard !== 'siege') return false;
  const eligibleKings = getEnemyKingCells();
  const requested = getSiegeTargetCount(state.mode);
  if (requested === Infinity) {
    if (state.board[row]?.[col]?.piece?.type !== 'enemy' || !state.board[row][col].piece.king) return true;
    commitSiege(eligibleKings);
    return true;
  }
  // Never require more selections than there are eligible enemy Kings.
  const targetCap = Math.min(requested, eligibleKings.length);
  const tappedPiece = state.board[row]?.[col]?.piece;
  if (targetCap <= 0 || tappedPiece?.type !== 'enemy' || !tappedPiece.king) return true;
  if (!state.siegeTargets) state.siegeTargets = [];
  const existing = state.siegeTargets.findIndex(t => t.row === row && t.col === col);
  if (existing >= 0) {
    state.siegeTargets.splice(existing, 1);
    render();
    setMessage('SELECT ' + (targetCap - state.siegeTargets.length) + ' KING' + (targetCap - state.siegeTargets.length === 1 ? '' : 'S'));
    return true;
  }
  state.siegeTargets.push({ row, col });
  if (state.siegeTargets.length >= targetCap) {
    commitSiege(state.siegeTargets.slice());
  } else {
    render();
    setMessage('SELECT ' + (targetCap - state.siegeTargets.length) + ' MORE');
  }
  return true;
}

function hasBlackHoleThisRun() {
  if (!state) return false;
  if (state.blackHoleAcquiredThisRun) return true;
  if ((state.cards || []).some(card => card.id === 'black_hole')) return true;
  return (state.deadMansHandDiscardedCards || []).some(card => card.id === 'black_hole');
}

function hasSandsOfTimeThisRun() {
  if (!state) return false;
  if (state.sandsOfTimeAcquiredThisRun) return true;
  if ((state.cards || []).some(card => card.id === 'sands_of_time')) return true;
  return (state.deadMansHandDiscardedCards || []).some(card => card.id === 'sands_of_time');
}

function hasDivineInterventionThisRun() {
  if (!state) return false;
  if (state.divineInterventionAcquiredThisRun || state.divineInterventionUsedThisRun) return true;
  if ((state.cards || []).some(card => card.id === 'divine_intervention')) return true;
  return (state.deadMansHandDiscardedCards || []).some(card => card.id === 'divine_intervention');
}

function isCardAvailableForThisRun(cardId) {
  if (cardId === 'black_hole') return !hasBlackHoleThisRun();
  if (cardId === 'sands_of_time') return !hasSandsOfTimeThisRun();
  if (cardId === 'divine_intervention') return !hasDivineInterventionThisRun();
  return true;
}

function shuffleCardIds(ids) {
  const shuffled = [...new Set(ids)];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDeadMansHandDrawIds(mode) {
  const level = Math.min(getCardMasteryLevel('dead_mans_hand', mode), 3);
  const eligible = ids => ids.filter(id =>
    (!CARD_DEFS[id]?.plusOnly || mode === 'plus') &&
    (typeof isCardAvailableForThisRun !== 'function' || isCardAvailableForThisRun(id))
  );
  const common = eligible(CARD_POOL_BY_RARITY.common);
  const uncommon = eligible(CARD_POOL_BY_RARITY.uncommon);
  const rare = eligible(RARE_CARD_POOL);

  if (level <= 1) {
    const count = level === 0 ? 3 : 4;
    // One slot per playable card ID makes this fully random rather than
    // applying the normal reward screen's rarity weights.
    return shuffleCardIds([...common, ...uncommon, ...rare]).slice(0, count);
  }
  if (level === 2) return shuffleCardIds(uncommon).slice(0, 3);
  return [
    ...shuffleCardIds(uncommon).slice(0, 2),
    ...shuffleCardIds(rare).slice(0, 1),
  ];
}

function getWarTaxDrawIds(mode) {
  const level = Math.min(getCardMasteryLevel('war_tax', mode), 3);
  const eligible = ids => ids.filter(id =>
    (!CARD_DEFS[id]?.plusOnly || mode === 'plus') &&
    (typeof isCardAvailableForThisRun !== 'function' || isCardAvailableForThisRun(id))
  );
  const common = eligible(CARD_POOL_BY_RARITY.common);
  const uncommon = eligible(CARD_POOL_BY_RARITY.uncommon);
  const rare = eligible(RARE_CARD_POOL);

  if (level <= 1) {
    const count = level === 0 ? 2 : 3;
    return shuffleCardIds([...common, ...uncommon, ...rare]).slice(0, count);
  }
  if (level === 2) return shuffleCardIds(uncommon).slice(0, 3);
  return [
    ...shuffleCardIds(uncommon).slice(0, 2),
    ...shuffleCardIds(rare).slice(0, 1),
  ];
}

function getBloodOathDrawIds(mode, baseOnly) {
  const level = Math.min(getCardMasteryLevel('blood_oath', mode, baseOnly), 3);
  const eligible = ids => ids.filter(id =>
    (!CARD_DEFS[id]?.plusOnly || mode === 'plus') &&
    (typeof isCardAvailableForThisRun !== 'function' || isCardAvailableForThisRun(id))
  );
  const common = eligible(CARD_POOL_BY_RARITY.common);
  const uncommon = eligible(CARD_POOL_BY_RARITY.uncommon);
  const rare = eligible(RARE_CARD_POOL);

  if (level < 3) {
    return shuffleCardIds([...common, ...uncommon, ...rare]).slice(0, level + 1);
  }
  return [
    ...shuffleCardIds(uncommon).slice(0, 2),
    ...shuffleCardIds(rare).slice(0, 1),
  ];
}

function triggerBloodOathDraw() {
  if (!state || (state.bloodOathCount || 0) <= 0 || state.bloodOathTriggeredThisLevel) return [];
  // A complete wipe is normally terminal. Lazarus is the exception: it
  // immediately restores the army, so Blood Oath must still count this as
  // the first friendly loss of the level.
  if (countPieces('yours') <= 0) {
    const heldLazarus = (state.cards || []).some(card => card.id === 'lazarus' && !card.used);
    if (!heldLazarus || !Array.isArray(state.lazarusGraveyard) || state.lazarusGraveyard.length === 0) return [];
  }
  state.bloodOathTriggeredThisLevel = true;
  const drawnIds = [];
  for (let i = 0; i < (state.bloodOathCount || 0); i++) {
    drawnIds.push(...getBloodOathDrawIds(state.mode, i > 0));
  }
  drawnIds.forEach(id => state.cards.push(createRunCard(id, { temporary: true })));
  return drawnIds;
}

const THORS_HAMMER_MAX_KILLS_BY_LEVEL = [2, 3, 4, 5];

function getThorsHammerMaxKills(mode) {
  const level = Math.min(getCardMasteryLevel('thors_hammer', mode), THORS_HAMMER_MAX_KILLS_BY_LEVEL.length - 1);
  return THORS_HAMMER_MAX_KILLS_BY_LEVEL[level];
}

function getHeroGambitSacrificeCount(mode) {
  return getCardMasteryLevel('heros_gambit', mode) >= 1 ? 1 : 2;
}

function getTidalWaveProfile(mode) {
  const level = Math.min(getCardMasteryLevel('tidal_wave', mode), 3);
  if (level === 0) return { topRows: 0, bottomRows: 1, spareFriendly: false };
  if (level === 1) return { topRows: 1, bottomRows: 1, spareFriendly: false };
  return { topRows: 2, bottomRows: 2, spareFriendly: level >= 3 };
}

function getTidalWaveAffectedRows(profile, boardRows) {
  const rows = [];
  for (let r = 0; r < profile.topRows; r++) rows.push(r);
  for (let offset = 0; offset < profile.bottomRows; offset++) rows.push(boardRows - 1 - offset);
  return [...new Set(rows.filter(r => r >= 0 && r < boardRows))];
}

function getThorsHammerChain(startRow, startCol, mode) {
  if (state.board[startRow]?.[startCol]?.piece?.type !== 'enemy') return [];
  const bsR = getBoardRows(), bsC = getBoardCols();
  const chain = [{ row: startRow, col: startCol }];
  const hit = new Set([startRow + ',' + startCol]);
  let current = chain[0];
  const maxKills = getThorsHammerMaxKills(mode);

  while (chain.length < maxKills) {
    let nearestDistance = Infinity;
    let nearest = [];
    for (let r = 0; r < bsR; r++) {
      for (let c = 0; c < bsC; c++) {
        if (hit.has(r + ',' + c) || state.board[r][c].piece?.type !== 'enemy') continue;
        const distance = (r - current.row) ** 2 + (c - current.col) ** 2;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = [{ row: r, col: c }];
        } else if (distance === nearestDistance) {
          nearest.push({ row: r, col: c });
        }
      }
    }
    if (!nearest.length) break;
    // Only equally-near enemies are randomized; the bolt never skips a
    // closer target in favor of one farther away.
    const next = nearest[Math.floor(Math.random() * nearest.length)];
    chain.push(next);
    hit.add(next.row + ',' + next.col);
    current = next;
  }
  return chain;
}

const LAST_STAND_DRAWS_BY_LEVEL = [1, 2, 3, 4];

function getLastStandDrawCount(mode) {
  const level = Math.min(getCardMasteryLevel('last_stand', mode), LAST_STAND_DRAWS_BY_LEVEL.length - 1);
  return LAST_STAND_DRAWS_BY_LEVEL[level];
}

function getRandomLastStandCardIds(count, mode) {
  // Every playable card ID gets exactly one slot in the pool, so rarity does
  // not weight the result. Fisher-Yates produces a uniform draw without
  // replacement, allowing any mix of Common, Uncommon, and Rare cards.
  const pool = [...new Set([
    ...CARD_POOL_BY_RARITY.common,
    ...CARD_POOL_BY_RARITY.uncommon,
    ...RARE_CARD_POOL,
  ])].filter(id =>
    (!CARD_DEFS[id]?.plusOnly || mode === 'plus') &&
    (typeof isCardAvailableForThisRun !== 'function' || isCardAvailableForThisRun(id))
  );
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

const SCORCHED_EARTH_TARGETS_BY_LEVEL = [1, 1, 2, Infinity];
const SCORCHED_EARTH_TURNS_BY_LEVEL = [1, 2, 2, 3];

function getScorchedEarthEffect(mode) {
  const level = Math.min(getCardMasteryLevel('scorched_earth', mode), SCORCHED_EARTH_TARGETS_BY_LEVEL.length - 1);
  return {
    targets: SCORCHED_EARTH_TARGETS_BY_LEVEL[level],
    turns: SCORCHED_EARTH_TURNS_BY_LEVEL[level],
  };
}

function commitScorchedEarth(targets, allUnits = false) {
  const effect = getScorchedEarthEffect(state.mode);
  state.scorchedEarthTargets = [];
  const previousUnitIds = state.scorchedEarthAllUnits ? [] : (state.scorchedEarthUnitIds || []);
  const selectedUnitIds = targets
    .map(({ row, col }) => state.board[row]?.[col]?.piece?.id)
    .filter(id => id != null);
  // Repeated uses (including Hero's Gambit) add newly selected units instead
  // of replacing the units already carrying Scorched Earth.
  state.scorchedEarthUnitIds = [...new Set([...previousUnitIds, ...selectedUnitIds])];
  state.scorchedEarthAllUnits = state.scorchedEarthAllUnits || allUnits;
  // This counter is consumed after enemy resolution. Include the casting
  // round so a one-turn trail survives the handoff and can affect the enemy.
  state.scorchedEarthTurns = Math.max(state.scorchedEarthTurns || 0, effect.turns + 1);
  markCardUsed('scorched_earth');
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  render();
  const unitText = allUnits ? 'All units' : (state.scorchedEarthUnitIds.length === 1 ? 'One unit' : state.scorchedEarthUnitIds.length + ' units');
  setMessage(unitText + ' will leave fire for ' + effect.turns + ' turn' + (effect.turns === 1 ? '' : 's') + '.');
  maybeEndPlayerTurn();
}

function handleScorchedEarthSelection(row, col) {
  if (state.activeCard !== 'scorched_earth') return false;
  const effect = getScorchedEarthEffect(state.mode);
  const friendlyCells = getFriendlyCells();
  if (effect.targets === Infinity) {
    commitScorchedEarth([], true);
    return true;
  }
  const targetCap = Math.min(effect.targets, friendlyCells.length);
  if (targetCap <= 0 || state.board[row]?.[col]?.piece?.type !== 'yours') return true;
  if (!state.scorchedEarthTargets) state.scorchedEarthTargets = [];
  const existing = state.scorchedEarthTargets.findIndex(t => t.row === row && t.col === col);
  if (existing >= 0) {
    state.scorchedEarthTargets.splice(existing, 1);
    render();
    setMessage('SELECT ' + (targetCap - state.scorchedEarthTargets.length) + ' UNIT' + (targetCap - state.scorchedEarthTargets.length === 1 ? '' : 'S'));
    return true;
  }
  state.scorchedEarthTargets.push({ row, col });
  if (state.scorchedEarthTargets.length >= targetCap) {
    commitScorchedEarth(state.scorchedEarthTargets.slice());
  } else {
    render();
    setMessage('SELECT ' + (targetCap - state.scorchedEarthTargets.length) + ' MORE');
  }
  return true;
}

const PUPPET_MASTER_TARGETS_BY_LEVEL = [1, 2, 3, 4];

function getPuppetMasterTargetCount(mode) {
  const level = Math.min(getCardMasteryLevel('puppet_master', mode), PUPPET_MASTER_TARGETS_BY_LEVEL.length - 1);
  return PUPPET_MASTER_TARGETS_BY_LEVEL[level];
}

const PUPPET_MASTER_DIRECTIONS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function getPuppetAdjacentMoves(row, col) {
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  return PUPPET_MASTER_DIRECTIONS
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(({ row: nr, col: nc }) =>
      nr >= 0 && nr < bsR && nc >= 0 && nc < bsC &&
      !state.board[nr][nc].piece &&
      state.board[nr][nc].hazard !== 'crater'
    )
    .map(move => ({ ...move, type: 'move' }));
}

function getPuppetEligibleEnemyCells() {
  const eligible = [];
  const excludedIds = new Set(state.puppetMovedIds || []);
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      const piece = state.board[r][c].piece;
      if (piece?.type === 'enemy' && !excludedIds.has(piece.id) && getPuppetAdjacentMoves(r, c).length) {
        eligible.push({ row: r, col: c });
      }
    }
  }
  return eligible;
}

function handleShieldWallSelection(row, col) {
  if (state.activeCard !== 'shield_wall') return false;
  const friendlyCells = getFriendlyCells();
  const requested = getShieldWallTargetCount(state.mode);
  if (requested === Infinity) {
    if (state.board[row]?.[col]?.piece?.type !== 'yours') return true;
    commitShieldWall(friendlyCells);
    return true;
  }
  const targetCap = Math.min(requested, friendlyCells.length);
  if (targetCap <= 0 || state.board[row]?.[col]?.piece?.type !== 'yours') return true;
  if (!state.shieldWallTargets) state.shieldWallTargets = [];
  const existing = state.shieldWallTargets.findIndex(t => t.row === row && t.col === col);
  if (existing >= 0) {
    state.shieldWallTargets.splice(existing, 1);
    render();
    setMessage(`SELECT ${targetCap - state.shieldWallTargets.length} UNIT${targetCap - state.shieldWallTargets.length === 1 ? '' : 'S'}`);
    return true;
  }
  state.shieldWallTargets.push({ row, col });
  if (state.shieldWallTargets.length >= targetCap) {
    commitShieldWall(state.shieldWallTargets.slice());
  } else {
    render();
    setMessage(`SELECT ${targetCap - state.shieldWallTargets.length} MORE`);
  }
  return true;
}

function getCatapultBlastOffsets(mode) {
  const level = getCardMasteryLevel('catapult', mode);
  // The scripted tutorial always uses Catapult's full 3x3 blast to kill its
  // last 2 enemies in one throw (see triggerWin()'s tutorial comment),
  // regardless of the brand-new player's (always level 0) actual mastery —
  // it's demonstrating the card's eventual power, not gated by grind.
  if (tutorial.active || level >= 2) {
    const offsets = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) offsets.push([dr, dc]);
    return offsets;
  }
  if (level === 1) return [[0, 0], [0, 1], [1, 0], [1, 1]];
  return [[0, 0]];
}

// Demotion ("revert")'s how-many-enemies-can-be-demoted-at-once count,
// driven by its mastery level — level 0 (unupgraded) only demotes a
// single enemy; each tier adds one more, up to 4 at full mastery.
const REVERT_DEMOTE_COUNT_BY_LEVEL = [1, 2, 3, 4];
function getRevertDemoteCount(mode) {
  const level = getCardMasteryLevel('revert', mode);
  return REVERT_DEMOTE_COUNT_BY_LEVEL[level];
}

// ── FIRST-TIME TUTORIAL ──
// A single scripted 1-vs-3 match shown automatically the very first time the
// game is ever opened. It runs on the REAL game engine (movement, capture,
// king promotion, card activation, Catapult) with a fixed hand-built board
// instead of the normal random level generator, and the enemy "AI" for its
// two turns is hard-scripted rather than the real random AI, so the outcome
// is always exactly the same guided walkthrough.
const TUTORIAL_SEEN_KEY = 'kingme_tutorial_seen_v1';
function hasTutorialBeenSeen() {
  try { return localStorage.getItem(TUTORIAL_SEEN_KEY) === '1'; }
  catch (err) { return true; } // if localStorage is broken, don't force it on someone repeatedly
}
function markTutorialSeen() {
  try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1'); } catch (err) {}
}
let tutorial = { active: false, step: 0, highlightCells: [], advancing: false, upgradeCardId: null };

// ── LEADERBOARD (Firebase Realtime Database) ──
// Fill these in with the values from your Firebase project's web app config
// (Project settings -> General -> Your apps -> SDK setup and configuration).
// databaseURL specifically comes from the top of the Realtime Database page
// in the console (looks like https://<project-id>-default-rtdb.<region>.firebasedatabase.app).
// Everything below degrades gracefully to "leaderboard unavailable" until
// this is filled in — the rest of the game works fine either way.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB5e7FUKJELdCjDrqzAcZl_Yme5KQgySU0",
  authDomain: "king-me-leaderboard.firebaseapp.com",
  databaseURL: "https://king-me-leaderboard-default-rtdb.firebaseio.com",
  projectId: "king-me-leaderboard",
  storageBucket: "king-me-leaderboard.firebasestorage.app",
  messagingSenderId: "323740557173",
  appId: "1:323740557173:web:ce02b7758aca6e1e5c3d3c",
};

let firebaseDb = null;
try {
  if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey.indexOf('PASTE_YOUR') !== 0 &&
      typeof firebase !== 'undefined') {
    firebase.initializeApp(FIREBASE_CONFIG);
    firebaseDb = firebase.database();
  } else {
    console.warn('Leaderboard: FIREBASE_CONFIG is still a placeholder — leaderboard disabled until it\'s filled in.');
  }
} catch (err) {
  console.error('Leaderboard: Firebase init failed', err);
  firebaseDb = null;
}

// Two entirely separate boards — New Run and New Run Plus scores never mix.
// (These are Realtime Database paths, not Firestore collections.)
function leaderboardCollectionName(mode) {
  return mode === 'plus' ? 'leaderboard_plus' : 'leaderboard_puzzle_v2';
}

// One persistent identity per browser/device, generated locally the first
// time the player ever opens the leaderboard — no login, no accounts. Their
// name is attached to this id and can be changed later if we ever add that,
// but the id itself is what keeps re-submitting scores as "the same player"
// (an UPDATE to their personal-best doc) instead of spamming new rows.
const LB_PLAYER_ID_KEY = 'kingme_lb_player_id_v1';
const LB_PLAYER_NAME_KEY = 'kingme_lb_player_name_v1';

function getPlayerId() {
  let id = localStorage.getItem(LB_PLAYER_ID_KEY);
  if (!id) {
    id = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : ('p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2));
    localStorage.setItem(LB_PLAYER_ID_KEY, id);
  }
  return id;
}
function getPlayerName() {
  return localStorage.getItem(LB_PLAYER_NAME_KEY) || null;
}
function setPlayerName(name) {
  localStorage.setItem(LB_PLAYER_NAME_KEY, name);
}

// ── ACTIVE RUN TIMER ──
// Tracks how much wall-clock time a player has actually spent PLAYING a run
// (not just leaving the app open) so it can be shown next to their level on
// the leaderboard — both as a "how much this run really cost" stat and as a
// light deterrent against faked/implausible scores (a level-40 run logged at
// 90 seconds of active time is an obvious tell).
//
// Mechanism: lastActivityAt is stamped to "now" every time a real move
// happens (see markActivity(), called from executeMove() for the player's
// own moves and from the enemy turn's nextPiece() loop for the AI's). A
// ticking interval (activityTick) adds elapsed time to state.runActiveMs
// only when the gap since the last real move is under ACTIVITY_IDLE_TIMEOUT_MS
// — so idly sitting on the board, arming a card without using it, or
// scrolling menus never accrues time, but the count resumes instantly the
// moment the next move lands. This deliberately does NOT hook cellClick or
// card-activation directly — only executeMove/nextPiece, the two places a
// move is actually committed to the board — so merely tapping around the
// board can never keep the clock alive on its own.
let lastActivityAt = Date.now();
function markActivity() {
  lastActivityAt = Date.now();
}
const ACTIVITY_TICK_MS = 500;
const ACTIVITY_IDLE_TIMEOUT_MS = 5000;
let lastActivityTickAt = Date.now();
function activityTick() {
  const now = Date.now();
  const elapsed = now - lastActivityTickAt;
  lastActivityTickAt = now;
  // Only counts while there's a real, live, in-progress run — not on the
  // menus, not mid-tutorial (its scripted board isn't a real run), not on
  // a finished run's win/lose overlay.
  if (!state || !Array.isArray(state.board) || state.board.length === 0) return;
  if (tutorial.active || state.gameOver) return;
  if (typeof state.runActiveMs !== 'number') return;
  if (now - lastActivityAt > ACTIVITY_IDLE_TIMEOUT_MS) return; // idle too long — paused
  state.runActiveMs += elapsed;
}
let activityTimer = null;

// Formats an active-time value for leaderboard display — "1h 05m", "12m 34s",
// or "45s". Returns an em dash for missing/invalid data (older leaderboard
// entries written before this feature existed never recorded a time).
function formatActiveTime(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

// Called once a run definitively ends (see triggerLose). Writes your new
// personal best for that board if it beats your previous one, then reports
// back your rank IF it's inside the top 50 — otherwise null, so nothing is
// shown.
async function submitScoreIfEligible(mode, level, activeMs) {
  if (!firebaseDb) return null;          // leaderboard not configured yet
  // Reaching zero cleared levels is not a leaderboard score. Reject it for
  // both New Run and New Puzzle so new zero records are never created.
  const scoreLevel = Number.isFinite(Number(level)) ? Math.max(0, Math.floor(Number(level))) : 0;
  if (scoreLevel === 0) return null;
  const name = getPlayerName();
  if (!name) return null;                // player has never opted into the leaderboard
  const playerId = getPlayerId();
  const path = leaderboardCollectionName(mode);
  const entryRef = firebaseDb.ref(path + '/' + playerId);
  try {
    const snap = await entryRef.once('value');
    const prevBest = snap.exists() ? (snap.val().level || 0) : 0;
    // Zero-level runs were rejected above. For qualifying scores, write a
    // player's first record or replace it only when their personal best rises.
    if (!snap.exists() || scoreLevel > prevBest) {
      // activeMs is the ACTIVE time (see the run-timer block above) this
      // particular run took to reach `level` — paired with the score so the
      // leaderboard can show "how long that run actually took", not just the
      // level. Retroactive submissions (submitNameEntry, for runs played
      // before this feature existed) have no real value to give here and
      // pass null/undefined — stored as null rather than guessing, so
      // formatActiveTime() renders it as "—" instead of a false "0s".
      const timeMs = Number.isFinite(activeMs) ? Math.max(0, Math.round(activeMs)) : null;
      await entryRef.set({
        name: String(name).slice(0, 20),
        level: scoreLevel,
        timeMs,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
      });
    }
    const bestLevel = Math.max(scoreLevel, prevBest);
    // RTDB has no direct "count where greater than" query — pull everyone at
    // or above bestLevel (a small slice of the board, not the whole thing)
    // and count strictly-greater ones client-side to get an exact rank.
    const geSnap = await firebaseDb.ref(path).orderByChild('level').startAt(bestLevel).once('value');
    let higherCount = 0;
    geSnap.forEach(child => {
      if ((child.val().level || 0) > bestLevel) higherCount++;
    });
    const rank = higherCount + 1;
    return rank <= 50 ? rank : null;
  } catch (err) {
    console.error('submitScoreIfEligible failed', err);
    return null;
  }
}

let currentLeaderboardTab = 'plus'; // "New Run" (formerly New Run Plus) is the primary mode now

// Which mode's Collection screen is currently showing — set right before
// opening it from either the main menu (New Run) or the New Puzzle hub, so
// the same shared screen/markup can render either standalone game's own
// collection/starter deck/stats without them ever mixing.
let activeCollectionScreenMode = 'plus';
function getScreenCollection() { return activeCollectionScreenMode === 'plus' ? collection : puzzleCollection; }
function getScreenStats() { return activeCollectionScreenMode === 'plus' ? stats : puzzleStats; }
function isCardUnlockedInMode(cardId, mode) {
  const col = mode === 'plus' ? collection : puzzleCollection;
  return !!(col && Array.isArray(col.unlockedCards) && col.unlockedCards.includes(cardId));
}
function saveScreenCollection() {
  if (activeCollectionScreenMode === 'plus') saveCollection(); else savePuzzleCollection();
}

// Set right before opening the name-entry overlay as part of the mandatory
// first-launch gate (see the boot sequence at the bottom of the file) — lets
// submitNameEntry() know it should continue booting the app afterward
// instead of just refreshing the Leaderboard screen underneath it.
let firstRunNameGate = false;

// Set whenever the Leaderboard screen is opened — both entry points now
// restrict it to their own single board (main menu -> 'plus', the New
// Puzzle hub -> 'normal') and hide the New Run / New Puzzle tab switcher
// entirely, since New Puzzle is a fully separate game with its own
// leaderboard button, not a tab inside New Run's.
let leaderboardRestrictMode = null;

// Opens the Leaderboard screen. Name entry is now mandatory on first-ever
// app launch (see boot sequence), so by the time anyone can reach this
// screen they should already have a name — this check is kept only as a
// safety net in case that gate is ever bypassed somehow.
function openLeaderboardScreen(restrictToMode) {
  leaderboardRestrictMode = restrictToMode || null;
  document.getElementById('leaderboardScreen').classList.add('active');
  const tabRow = document.getElementById('lbTabRow');
  if (tabRow) tabRow.style.display = leaderboardRestrictMode ? 'none' : '';
  const name = getPlayerName();
  if (!name) {
    openNameEntryModal();
  } else {
    document.getElementById('leaderboardPlayerName').textContent = name;
    setLeaderboardTab(leaderboardRestrictMode || currentLeaderboardTab);
  }
}

function openNameEntryModal() {
  document.getElementById('nameEntryOverlay').classList.add('active');
  const input = document.getElementById('nameEntryInput');
  input.value = '';
  setTimeout(() => input.focus(), 50);
}

// Mandatory first-launch gate — no cancel/skip button exists on this
// overlay at all, and nothing else (tutorial, main menu) is shown until
// submitNameEntry() below actually succeeds with a non-empty name.
function openFirstRunNameEntryModal() {
  firstRunNameGate = true;
  openNameEntryModal();
}

function submitNameEntry() {
  const input = document.getElementById('nameEntryInput');
  const val = input.value.trim().slice(0, 20);
  if (!val) return; // no name, no dismissing — the overlay just stays up
  setPlayerName(val);
  document.getElementById('nameEntryOverlay').classList.remove('active');
  const lbNameEl = document.getElementById('leaderboardPlayerName');
  if (lbNameEl) lbNameEl.textContent = val;

  // Never block local game startup on the online leaderboard. In file-based
  // and offline builds a Firebase request may remain pending indefinitely.
  if (firstRunNameGate) {
    firstRunNameGate = false;
    continueBootAfterNameEntry();
  } else {
    setLeaderboardTab(leaderboardRestrictMode || currentLeaderboardTab);
  }

  // Naming yourself for the first time shouldn't wipe out progress you made
  // BEFORE you ever opened the Leaderboard — push your best-ever legit run
  // on each board retroactively, so someone who reached level 30 ten runs
  // ago doesn't lose that the moment they finally register a name.
  void Promise.allSettled([
    submitScoreIfEligible('normal', puzzleStats.legitBestLevel || 0),
    submitScoreIfEligible('plus', stats.legitBestLevelPlus || 0),
  ]);
}

function setLeaderboardTab(mode) {
  currentLeaderboardTab = mode;
  const normalBtn = document.getElementById('lbTabNormal');
  const plusBtn = document.getElementById('lbTabPlus');
  normalBtn.classList.toggle('primary', mode === 'normal');
  plusBtn.classList.toggle('primary', mode === 'plus');
  renderLeaderboardList();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

async function renderLeaderboardList() {
  const listEl = document.getElementById('leaderboardList');
  if (!listEl) return;
  if (!firebaseDb) {
    listEl.innerHTML = '<div style="color:var(--gray-light);text-align:center;padding:2rem 0;">Leaderboard is not set up yet.</div>';
    return;
  }
  listEl.innerHTML = '<div style="color:var(--gray-light);text-align:center;padding:2rem 0;">Loading...</div>';
  const mode = currentLeaderboardTab;
  try {
    const path = leaderboardCollectionName(mode);
    // orderByChild always comes back ascending in RTDB, so limitToLast(50)
    // gets the top 50 by level — just reverse the array before display.
    const snap = await firebaseDb.ref(path).orderByChild('level').limitToLast(50).once('value');
    if (mode !== currentLeaderboardTab) return; // tab changed again while this was loading
    if (!snap.exists()) {
      listEl.innerHTML = '<div style="color:var(--gray-light);text-align:center;padding:2rem 0;">No scores yet — be the first!</div>';
      return;
    }
    const entries = [];
    // Older builds did write zero-level records. Keep those legacy rows in
    // Firebase harmlessly, but omit them from every leaderboard view so the
    // change applies immediately without requiring a database migration.
    snap.forEach(child => {
      const value = child.val() || {};
      const entryLevel = Number.isFinite(Number(value.level))
        ? Math.max(0, Math.floor(Number(value.level)))
        : 0;
      if (entryLevel > 0) entries.push({ id: child.key, ...value, level: entryLevel });
    });
    entries.reverse(); // now highest level first
    if (entries.length === 0) {
      listEl.innerHTML = '<div style="color:var(--gray-light);text-align:center;padding:2rem 0;">No scores yet - be the first!</div>';
      return;
    }
    const myId = getPlayerId();
    let html = '';
    entries.forEach((d, i) => {
      const rank = i + 1;
      const isMe = d.id === myId;
      // d.level comes straight from Firebase. The client only ever writes a
      // number here (submitScoreIfEligible), but nothing server-side stops a
      // crafted direct write from putting arbitrary HTML/script in this
      // field — coerce to a safe integer before it ever touches innerHTML,
      // same defense-in-depth reasoning as escapeHtml(d.name) just above.
      const safeLevel = Number.isFinite(Number(d.level)) ? Math.max(0, Math.floor(Number(d.level))) : 0;
      // Same defense-in-depth coercion as safeLevel above — d.timeMs is
      // client-written data too, and formatActiveTime already treats
      // anything non-finite/non-positive as "no data" (renders "—").
      const safeTimeMs = Number.isFinite(Number(d.timeMs)) ? Number(d.timeMs) : null;
      html += `<div style="display:flex;justify-content:space-between;padding:0.4rem 0.6rem;border-radius:4px;${isMe ? 'background:rgba(232,184,75,0.15);' : ''}">
        <span style="color:${isMe ? 'var(--gold)' : 'var(--gray-light)'};">#${rank} ${escapeHtml(d.name || '???')}</span>
        <span style="color:${isMe ? 'var(--gold)' : 'var(--gray-light)'};text-align:right;">Level ${safeLevel}<br/><span style="font-size:0.75em;opacity:0.75;">${formatActiveTime(safeTimeMs)}</span></span>
      </div>`;
    });
    listEl.innerHTML = html;
  } catch (err) {
    console.error('renderLeaderboardList failed', err);
    if (mode === currentLeaderboardTab) {
      listEl.innerHTML = '<div style="color:#e88;text-align:center;padding:2rem 0;">Could not load the leaderboard.</div>';
    }
  }
}

// One-way cleanup for saves left by obsolete internal test builds. This is
// migration-only: there is no test-mode switch or runtime test behavior.
const RETIRED_TEST_PREFERENCE_KEY = 'kingme_devmode_v1';
let retiredTestPreferenceFound = false;
try {
  retiredTestPreferenceFound = localStorage.getItem(RETIRED_TEST_PREFERENCE_KEY) === '1';
  localStorage.removeItem(RETIRED_TEST_PREFERENCE_KEY);
} catch (err) { console.error('Retired test preference cleanup failed', err); }

// Every real card — including white ones — counts toward the Collection
// screen now: you can see and unlock Plus One / Reinforcements there, you
// just can't slot them into the Starter Deck until the white slot unlocks
// (see STARTER_DECK_MILESTONES/RARITIES). This list stays correct
// automatically as new cards are added later.
const COLLECTIBLE_CARD_IDS = CARTOON_SHOWCASE_BUILD
  ? DEVELOPER_NEW_CARD_IDS.slice()
  : Object.keys(CARD_DEFS);

// White-rarity cards are never actually HELD in your hand; they resolve
// instantly the moment you get them (reward pick or Starter Deck at run
// start). Use this narrower list anywhere that hands out playable copies.
const HAND_HOLDABLE_CARD_IDS = COLLECTIBLE_CARD_IDS.filter(id => CARD_DEFS[id].rarity !== 'white');

// (playPieceLandSound/playUIClickSound are generic, not per-card, so they
// deliberately aren't in this map — everything else here still wires up a
// card's sound effect and is kept for playCardSound() lookups.)
function playShieldWallSound() {
  // This card currently has no dedicated audio asset.
  // A harmless callback keeps card activation independent from optional audio.
}

function playEarthquakeSound() {
  // This card currently has no dedicated audio asset.
  // A harmless callback keeps card activation independent from optional audio.
}

function playSiegeSound() {
  // This card currently has no dedicated audio asset.
  // A harmless callback keeps card activation independent from optional audio.
}

function playJesterSound() {
  // This card currently has no dedicated audio asset.
  // A harmless callback keeps card activation independent from optional audio.
}

function playFeintSound() {
  // This card currently has no dedicated audio asset.
  // A harmless callback keeps card activation independent from optional audio.
}

function playConscriptSound() {
  // This card currently has no dedicated audio asset.
  // A harmless callback keeps card activation independent from optional audio.
}

function playDeadMansHandSound() {
  // This card currently has no dedicated audio asset.
  // A harmless callback keeps card activation independent from optional audio.
}

// Card sounds restored from the original mastered recordings.
function playPhantomMarchSound() { playCachedSfx(PHANTOM_MARCH_SOUND_URL); }
function playOnceMoreSound() { playCachedSfx(ONCE_MORE_SOUND_URL); }
function playWarHorseSound() { playCachedSfx(WAR_HORSE_SOUND_URL); }
function playBallistaSound() { playCachedSfx(BALLISTA_SOUND_URL); }
function playCrossStrikeSound() { playCachedSfx(CROSS_STRIKE_SOUND_URL); }
function playCatapultLaunchSound() { playCachedSfx(CATAPULT_LAUNCH_SOUND_URL); }
function playMadCowLaunchSound() { playCachedSfx(MAD_COW_LAUNCH_SOUND_URL); }
function playBearTrapSound() { playCachedSfx(BEAR_TRAP_SOUND_URL); }
function playWrathSound() { playCachedSfx(WRATH_SOUND_URL); }
function playPlagueSound() { playCachedSfx(PLAGUE_SOUND_URL, SFX_VOLUME * 0.5); }
function playBlizzardSound() { playCachedSfx(BLIZZARD_SOUND_URL); }
function playTornadoSound() { playCachedSfx(TORNADO_SOUND_URL); }
function playLocustSwarmSound() { playCachedSfx(LOCUST_SWARM_SOUND_URL); }
function playBlackHoleSound() { playCachedSfx(BLACK_HOLE_SOUND_URL); }





function playCloseRanksSound() { playCachedSfx(CLOSE_RANKS_SOUND_URL); }
function playMeteorStrikeSound() { playCachedSfx(METEOR_STRIKE_SOUND_URL); }



function playPhalanxSound() {
  try {
    const sfx = getCachedSfx(PHALANX_SOUND_URL);
    // The source recording is louder than the rest of the sound library.
    sfx.volume = SFX_VOLUME * 0.70;
    sfx.play().catch(() => {});
  } catch (err) {}
}


function playWildfireSound() {
  playCachedSfx(WILDFIRE_SOUND_URL);
}


function playHerosGambitSound() {
  try {
    const sfx = getCachedSfx(HEROS_GAMBIT_SOUND_URL);
    sfx.volume = SFX_VOLUME * 0.25;
    const playback = sfx.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  } catch (err) {}
}

let mainMenuMusic = null;
function playMenuMusic() {
  try {
    if (!mainMenuMusic) {
      mainMenuMusic = new Audio(MENU_MUSIC_URL);
      mainMenuMusic.loop = true;
      mainMenuMusic.volume = 0.18;
      mainMenuMusic.preload = 'auto';
    }
    const playback = mainMenuMusic.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  } catch (err) {}
}

function pauseMenuMusic() {
  if (mainMenuMusic) mainMenuMusic.pause();
}

const CARD_SOUND_FX = {
  king_me:        playKingMeSound,
  usurp:          playUsurpSound,
  teleport:       playPhantomMarchSound,
  once_more:      playOnceMoreSound,
  double_jump:    playWarHorseSound,
  t_strike:       playBallistaSound,
  cross_strike:   playCrossStrikeSound,
  catapult:       playCatapultLaunchSound,
  chariot_charge: playChargeHitSound,
  side_step:      playChargeHitSound,
  bodyguard:      playChargeHitSound,
  puppet_master:  playChargeHitSound,
  assassinate:    playAssassinateSliceSound,
  mad_cow:        playMadCowLaunchSound,
  bear_trap:      playBearTrapSound,
  wrath:          playWrathSound,
  plague:         playPlagueSound,
  blizzard:       playBlizzardSound,
  tornado:        playTornadoSound,
  locust_swarm:   playLocustSwarmSound,
  meteor_strike:  playMeteorStrikeSound,
  wildfire:       playWildfireSound,
  shield_wall:    playShieldWallSound,
  earthquake:     playEarthquakeSound,
  siege:          playSiegeSound,
  jester:         playJesterSound,
  feint:          playFeintSound,
  conscript:      playConscriptSound,
  dead_mans_hand: playDeadMansHandSound,
  heros_gambit:   playHerosGambitSound,
  phalanx:        playPhalanxSound,
  tidal_wave:     playTidalWaveSound,
  trojan_horse:   playTrojanHorseSound,
  war_tax:        playWarTaxSound,
  thors_hammer:   playThorsHammerSound,
};
// The signature of obsolete internal-test saves is retained only so those
// saves can be deleted instead of leaking unlocked content into production.
const RETIRED_TEST_CARD_IDS = [...Object.keys(CARD_MASTERY_TIERS), ...NO_MASTERY_CARDS];

function isRetiredTestSave(saved, mode) {
  if (!saved || !Array.isArray(saved.cards)) return false;
  if (saved.devModeTainted === true) return true;
  const expectedIds = RETIRED_TEST_CARD_IDS.filter(id => {
    const def = CARD_DEFS[id];
    return def && (mode === 'plus' || !def.plusOnly);
  });
  const actualIds = saved.cards.map(card => card && card.id).filter(Boolean);
  if (actualIds.length !== expectedIds.length) return false;
  const actualSet = new Set(actualIds);
  return actualSet.size === expectedIds.length && expectedIds.every(id => actualSet.has(id));
}

function unlockCard(cardId, mode) {
  if (!COLLECTIBLE_CARD_IDS.includes(cardId)) return;
  const col = mode === 'plus' ? collection : puzzleCollection;
  if (!col.unlockedCards.includes(cardId)) {
    col.unlockedCards.push(cardId);
    if (mode === 'plus') saveCollection(); else savePuzzleCollection();
  }
}

function recordLevelBeaten(level, mode) {
  const col = mode === 'plus' ? collection : puzzleCollection;
  if (level > col.highestLevelBeaten) {
    col.highestLevelBeaten = level;
    if (mode === 'plus') saveCollection(); else savePuzzleCollection();
  }
}

// ── PLAYING PIECE ART ──
// Real cropped photo art (from a hand-distressed medieval checkers-piece
// reference sheet) instead of the old inline SVG medallions — dramatically
// smaller file size, and lets each piece on the board look a little
// different instead of all being the same stamped-out icon. Each piece
// object gets a random `variant` index at creation time (see setupLevel /
// usurp) so its look is picked once and stays stable across renders, rather
// than re-randomizing every redraw.
const PIECE_ART_BASE = '';








// Fetch and decode each piece texture once. The board markup is rebuilt
// frequently, so this keeps remote image loading off the interaction path.
const PIECE_ART_PRELOADS = [...YOUR_PIECE_VARIANT_URLS, ...ENEMY_PIECE_VARIANT_URLS, YOUR_KING_PIECE_URL, ENEMY_KING_PIECE_URL].map(url => {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  return image;
});
function pieceArtUrl(piece) {
  // Kinged pieces keep their own variant art — status is shown with a glow
  // (see .piece.king) instead of swapping to separate king artwork.
  const variants = piece.type === 'yours' ? YOUR_PIECE_VARIANT_URLS : ENEMY_PIECE_VARIANT_URLS;
  const idx = ((piece.variant || 0) % variants.length + variants.length) % variants.length;
  return variants[idx];
}


const RARITY_WEIGHTS = {
  common:   60,
  uncommon: 35,
  rare:     0,
  epic:     0,
};

const CARD_POOL_BY_RARITY = {
  common:   ['vertical_jump', 'horizontal_jump', 'king_me', 'revert', 'teleport', 'usurp', 'side_step', 'once_more', 'bodyguard', 'retreat', 'feint', 'conscript'],
  uncommon: ['double_jump', 't_strike', 'catapult', 'cross_strike', 'assassinate', 'chariot_charge', 'shield_wall', 'counter', 'bear_trap', 'ambush', 'phalanx', 'trojan_horse', 'puppet_master', 'scorched_earth', 'last_stand', 'thors_hammer'],
  rare:     [], // rares handled separately via RARE_CARD_POOL below
  epic:     [],
};

// Rare-tier cards, picked randomly whenever the rare slot rolls true.
const RARE_CARD_POOL = ['wrath', 'plague', 'blizzard', 'tornado', 'locust_swarm', 'jester', 'meteor_strike', 'wildfire', 'coup_detat', 'siege', 'earthquake', 'mad_cow', 'dead_mans_hand', 'heros_gambit', 'tidal_wave', 'war_tax'];

// Epic cards have their own gold tier and cannot enter the reward pool until
// their minimum level. Black Hole is intentionally the only Epic card today.
const EPIC_CARD_POOL = ['black_hole', 'close_ranks', 'lazarus', 'sands_of_time', 'divine_intervention'];

// Every white (bonus, not-held) card shares ONE combined roll and ONE combined
// taper — "all white cards have the same percentage chance of appearing" means
// there's a single "does a white card show up" check, and if it hits, which
// white card fills that slot is a straight coinflip between them, not each
// card getting its own independent percentage.
const WHITE_CARD_POOL = ['plus_one', 'reinforcements', 'veteran', 'ace_up_the_sleeve', 'blood_oath'];

function getWeightedCardChoices(count = 3) {
  const choices = [];
  const used = new Set();

  // Puzzle mode strips plusOnly cards from every pool.
  const isPlus = state.mode === 'plus';
  const filterPlusOnly = ids => isPlus ? ids : ids.filter(id => !CARD_DEFS[id] || !CARD_DEFS[id].plusOnly);

  // Black Hole remains visually/mechanically Epic, but once level 30 makes
  // it eligible it joins the same reward pool as every Rare card. Selection
  // within that pool is uniform, so its per-card chance exactly matches a Rare.
  const uniqueRunEligible = ids => ids.filter(id =>
    (id !== 'black_hole' && id !== 'divine_intervention') ||
    typeof isCardAvailableForThisRun !== 'function' || isCardAvailableForThisRun(id)
  );
  // Each Epic obeys its own minimum. Black Hole remains level 30+, while
  // Close Ranks and Lazarus are eligible from the beginning of a run.
  const eligibleEpicCards = EPIC_CARD_POOL.filter(id =>
    state.level >= (CARD_DEFS[id].minimumRewardLevel || 1)
  );
  const rareWhiteEpicPool = uniqueRunEligible(filterPlusOnly([
    ...RARE_CARD_POOL,
    ...eligibleEpicCards,
    ...WHITE_CARD_POOL,
  ]));
  const commonPool    = uniqueRunEligible(filterPlusOnly(CARD_POOL_BY_RARITY.common));
  const uncommonPool  = uniqueRunEligible(filterPlusOnly(CARD_POOL_BY_RARITY.uncommon));

  // Each slot rolls independently:
  //   0–44  → common   (45%)
  //  45–79  → uncommon (35%)
  //  80–99  → rare, eligible Epic, or white (20%)
  // No duplicates within the same reward screen.
  let attempts = 0;
  while (choices.length < count && attempts < 200) {
    attempts++;
    const roll = Math.random() * 100;
    const pool = roll < 45 ? commonPool : roll < 80 ? uncommonPool : rareWhiteEpicPool;
    if (!pool || !pool.length) continue;
    const card = pool[Math.floor(Math.random() * pool.length)];
    if (!card || !CARD_DEFS[card]) continue;
    if (!used.has(card)) { used.add(card); choices.push(card); }
  }
  return choices;
}

const STARTER_CARDS = []; // real starting deck is empty — you earn every card by playing

// GLORY EDITION — isolated scoring layer for this third build only.
// Stable piece IDs let every card and board effect score consistently without
// changing the combat, progression, card, or victory rules underneath it.
let gloryAudioContext = null;

function ensureGloryState() {
  if (!state) return;
  if (!Number.isFinite(state.glory)) state.glory = 0;
  if (state.gloryMultiplierRuleVersion !== 2) {
    state.gloryMultiplier = .5;
    state.gloryMultiplierRuleVersion = 2;
  }
  if (!Number.isFinite(state.gloryMultiplier)) state.gloryMultiplier = .5;
  if (!Number.isFinite(state.gloryLevelStart)) state.gloryLevelStart = state.glory;
  if (!Number.isFinite(state.gloryLevelEarned)) state.gloryLevelEarned = 0;
  if (!Number.isFinite(state.gloryLevelCaptures)) state.gloryLevelCaptures = 0;
  if (!Number.isFinite(state.gloryLevelCrowns)) state.gloryLevelCrowns = 0;
  if (!Number.isFinite(state.gloryLevelFriendlyLosses)) state.gloryLevelFriendlyLosses = 0;
  if (!Number.isFinite(state.gloryLevelCardKills)) state.gloryLevelCardKills = 0;
  if (!Number.isFinite(state.gloryLevelVoidKills)) state.gloryLevelVoidKills = 0;
  if (!Number.isFinite(state.gloryTarget)) state.gloryTarget = 0;
  if (!state.gloryPieceSnapshot || typeof state.gloryPieceSnapshot !== 'object') state.gloryPieceSnapshot = {};
  if (!Array.isArray(state.gloryScoredEnemyIds)) state.gloryScoredEnemyIds = [];
  if (!Array.isArray(state.gloryPendingSkillCaptureIds)) state.gloryPendingSkillCaptureIds = [];
  if (!state.gloryPendingCaptureBonuses || typeof state.gloryPendingCaptureBonuses !== 'object') state.gloryPendingCaptureBonuses = {};
  if (typeof state.gloryTargetReached !== 'boolean') state.gloryTargetReached = false;
  if (typeof state.gloryLevelFinalized !== 'boolean') state.gloryLevelFinalized = false;
}

function collectGloryPieceSnapshot() {
  const snapshot = {};
  if (!state || !Array.isArray(state.board)) return snapshot;
  for (let r = 0; r < state.board.length; r++) {
    for (let c = 0; c < state.board[r].length; c++) {
      const piece = state.board[r][c]?.piece;
      if (!piece || piece.id == null) continue;
      snapshot[String(piece.id)] = { type: piece.type, king: !!piece.king, row: r, col: c,
        headsmansBounty: !!piece.headsmansBounty, royalStandardBonus: isRoyalStandardCell(r,c), falseKing: !!piece.falseKing };
    }
  }
  return snapshot;
}

function updateGloryHud() {
  if (!state) return;
  ensureGloryState();
  const value = document.getElementById('gloryValue');
  const multiplier = document.getElementById('gloryMultiplier');
  if (value) value.textContent = Math.max(0, Math.round(state.glory)).toLocaleString();
  const remaining = Math.max(0, state.gloryTarget - state.glory);
  if (multiplier) {
    multiplier.textContent = `×${state.gloryMultiplier.toFixed(1)}`;
    multiplier.title = `${remaining.toLocaleString()} Glory to the level target`;
  }
}

function playGlorySound(points, multiplierChanged = false, multiplierLevel = null) {
  if (points <= 0 || !SFX_VOLUME) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    gloryAudioContext = gloryAudioContext || new AudioContextClass();
    if (gloryAudioContext.state === 'suspended') gloryAudioContext.resume().catch(() => {});
    const now = gloryAudioContext.currentTime;
    // Every half-step of multiplier raises the chime by one musical semitone.
    // A long capture chain therefore audibly climbs instead of repeating the
    // same generic multiplier sound over and over.
    const audibleMultiplier = Number.isFinite(multiplierLevel)
      ? multiplierLevel
      : (state?.gloryMultiplier || 1.5);
    const riseSteps = Math.max(0, Math.round((audibleMultiplier - 1.5) / .5));
    const risingBase = 523.25 * Math.pow(2, riseSteps / 12);
    const notes = multiplierChanged
      ? [risingBase, risingBase * 1.25, risingBase * 1.5]
      : [587.33, 739.99];
    notes.forEach((frequency, index) => {
      const osc = gloryAudioContext.createOscillator();
      const gain = gloryAudioContext.createGain();
      osc.type = index === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(frequency, now + index * .055);
      gain.gain.setValueAtTime(.0001, now + index * .055);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001, .055 * SFX_VOLUME), now + index * .055 + .018);
      gain.gain.exponentialRampToValueAtTime(.0001, now + index * .055 + .19);
      osc.connect(gain); gain.connect(gloryAudioContext.destination);
      osc.start(now + index * .055); osc.stop(now + index * .055 + .2);
    });
  } catch (err) {}
}

function playGloryMultiplierLostSound() {
  if (!SFX_VOLUME) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    gloryAudioContext = gloryAudioContext || new AudioContextClass();
    if (gloryAudioContext.state === 'suspended') gloryAudioContext.resume().catch(() => {});
    const now = gloryAudioContext.currentTime;
    [392, 293.66, 196].forEach((frequency, index) => {
      const start = now + index * .09;
      const osc = gloryAudioContext.createOscillator();
      const gain = gloryAudioContext.createGain();
      osc.type = index === 2 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(frequency, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * .72), start + .2);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001, .045 * SFX_VOLUME), start + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .24);
      osc.connect(gain); gain.connect(gloryAudioContext.destination);
      osc.start(start); osc.stop(start + .25);
    });
  } catch (err) {}
}

let gloryNoticeTimer = null;
let gloryMultiplierStepTimers = [];
function clearGloryMultiplierStepTimers() {
  gloryMultiplierStepTimers.forEach(timer => clearTimeout(timer));
  gloryMultiplierStepTimers = [];
}
function restartGloryNoticeAnimation(notice, multiplier = false) {
  if (!notice) return;
  notice.classList.toggle('multiplier', multiplier);
  notice.style.animation = 'none';
  void notice.offsetWidth;
  notice.style.animation = '';
  if (gloryNoticeTimer) clearTimeout(gloryNoticeTimer);
  gloryNoticeTimer = setTimeout(() => {
    notice.remove();
    gloryNoticeTimer = null;
  }, 1120);
}

function showGloryFlyout(points, label = '', penalty = false) {
  const hud = document.getElementById('gloryStatus');
  if (!hud) return;
  hud.classList.remove('glory-bump');
  void hud.offsetWidth;
  hud.classList.add('glory-bump');

  // Reuse one notice beside the Glory score. Black Hole can consume several
  // units in the same pulse; accumulating those awards here prevents a stack
  // of point labels and a multiplier badge from covering one another.
  let flyout = hud.querySelector('.glory-flyout');
  if (!flyout) {
    flyout = document.createElement('div');
    hud.appendChild(flyout);
  }
  const sameLabel = flyout.dataset.label === label;
  const previousPoints = sameLabel ? Number(flyout.dataset.points || 0) : 0;
  const totalPoints = previousPoints + Math.round(points);
  const pointText = `${totalPoints > 0 ? '+' : ''}${totalPoints.toLocaleString()}${label ? `  ${label}` : ''}`;
  flyout.className = `glory-flyout${penalty || totalPoints < 0 ? ' penalty' : ''}`;
  flyout.dataset.points = String(totalPoints);
  flyout.dataset.label = label;
  flyout.dataset.pointsDisplay = pointText;
  flyout.textContent = pointText;
  restartGloryNoticeAnimation(flyout, false);
}

function showGloryMultiplier(level) {
  const hud = document.getElementById('gloryStatus');
  const multiplier = document.getElementById('gloryMultiplier');
  if (multiplier) {
    multiplier.textContent = `×${level.toFixed(1)}`;
    multiplier.classList.remove('multiplier-jiggle');
    void multiplier.offsetWidth;
    multiplier.classList.add('multiplier-jiggle');
    setTimeout(() => multiplier.classList.remove('multiplier-jiggle'), 680);
  }
  if (!hud) return;
  let notice = hud.querySelector('.glory-flyout.multiplier');
  if (!notice) {
    notice = document.createElement('div');
    hud.appendChild(notice);
  }
  notice.className = 'glory-flyout multiplier';
  notice.textContent = `×${level.toFixed(1)}!`;
  restartGloryNoticeAnimation(notice, true);
}

function showGloryMultiplierLost() {
  const hud = document.getElementById('gloryStatus');
  if (!hud) return;
  clearGloryMultiplierStepTimers();
  hud.querySelector('.glory-flyout')?.remove();
  const notice = document.createElement('div');
  notice.className = 'glory-flyout multiplier-lost';
  notice.textContent = 'MULTIPLIER LOST';
  hud.appendChild(notice);
  restartGloryNoticeAnimation(notice, false);
  playGloryMultiplierLostSound();
}

let gloryPointCellRects = null;
let gloryPointRectResetQueued = false;
function getGloryPointCellRect(row, col) {
  const boardEl = document.getElementById('board');
  if (!boardEl) return null;
  if (!gloryPointCellRects) {
    gloryPointCellRects = new Map();
    boardEl.querySelectorAll('.cell').forEach((cell, index) => {
      const cellRow = Number(cell.dataset.row ?? Math.floor(index / (state.board?.[0]?.length || 1)));
      const cellCol = Number(cell.dataset.col ?? index % (state.board?.[0]?.length || 1));
      gloryPointCellRects.set(`${cellRow},${cellCol}`, cell.getBoundingClientRect());
    });
  }
  if (!gloryPointRectResetQueued) {
    gloryPointRectResetQueued = true;
    setTimeout(() => {
      gloryPointCellRects = null;
      gloryPointRectResetQueued = false;
    }, 0);
  }
  return gloryPointCellRects.get(`${row},${col}`) || null;
}

function showGloryPiecePoints(row, col, points) {
  if (!Number.isFinite(row) || !Number.isFinite(col) || !points) return;
  const rect = getGloryPointCellRect(row, col);
  if (!rect) return;
  const marker = document.createElement('div');
  marker.className = `glory-piece-points${points < 0 ? ' penalty' : ''}`;
  marker.textContent = `${points > 0 ? '+' : ''}${Math.round(points).toLocaleString()}`;
  marker.style.left = `${rect.left + rect.width / 2}px`;
  marker.style.top = `${rect.top + Math.max(3, rect.height * .2)}px`;
  document.body.appendChild(marker);
  setTimeout(() => marker.remove(), 1280);
}

function showGlorySeal(text) {
  const lane = document.getElementById('message');
  if (!lane) return;
  lane.querySelector('.glory-seal')?.remove();
  const seal = document.createElement('div');
  seal.className = 'glory-seal';
  seal.textContent = text;
  lane.appendChild(seal);
  setTimeout(() => seal.remove(), 1500);
}

function awardGlory(points, label, options = {}) {
  ensureGloryState();
  const requested = Math.round(points || 0);
  if (!requested) return;
  const before = state.glory;
  state.glory = Math.max(0, state.glory + requested);
  const rounded = state.glory - before;
  if (!rounded) return;
  state.gloryLevelEarned += rounded;
  updateGloryHud();
  if (Number.isFinite(options.row) && Number.isFinite(options.col)) {
    showGloryPiecePoints(options.row, options.col, rounded);
  }
  if (!options.silent) playGlorySound(rounded, options.multiplierChanged === true);
  if (!state.gloryTargetReached && state.gloryTarget > 0 && before < state.gloryTarget && state.glory >= state.gloryTarget) {
    state.gloryTargetReached = true;
    showGlorySeal('GLORY TARGET REACHED!');
    playGlorySound(500, true);
  }
}

function isGloryVoidPosition(piece) {
  if (!piece || !state?.board?.length) return false;
  const rows = state.board.length;
  const cols = state.board[0]?.length || 0;
  if (piece.row === 0 || piece.col === 0 || piece.row === rows - 1 || piece.col === cols - 1) return true;
  if (state.blackHoleActive && typeof getBlackHoleBounds === 'function') {
    const bounds = getBlackHoleBounds();
    return piece.row >= bounds.startRow && piece.row <= bounds.endRow && piece.col >= bounds.startCol && piece.col <= bounds.endCol;
  }
  return false;
}

function noteGlorySkillCapture(move) {
  if (!move?.plainMovement || !move?.over || !state?.board) return;
  ensureGloryState();
  const squares = [];
  if (move.over) squares.push(move.over);
  if (move.over2) squares.push(move.over2);
  if (move.over3) squares.push(move.over3);
  if (Array.isArray(move.captured)) squares.push(...move.captured);
  squares.forEach(square => {
    const piece = state.board[square.row]?.[square.col]?.piece;
    if (piece?.type === 'enemy' && piece.id != null) {
      const id = String(piece.id);
      if (!state.gloryPendingSkillCaptureIds.includes(id)) state.gloryPendingSkillCaptureIds.push(id);
      // Lock the card bonuses in at the instant the jump happens. The piece
      // disappears before the next board snapshot, so deriving this later can
      // miss a newly planted Standard or a newly marked Bounty king.
      state.gloryPendingCaptureBonuses[id] =
        (piece.headsmansBounty ? 2 : 1) *
        (isRoyalStandardCell(square.row, square.col) ? 2 : 1);
    }
  });
}

function syncGloryScore(options = {}) {
  if (!state || !Array.isArray(state.board)) return;
  ensureGloryState();
  const current = collectGloryPieceSnapshot();
  const previous = state.gloryPieceSnapshot || {};
  if (options.suppress || sandsReversing || !Object.keys(previous).length) {
    state.gloryPieceSnapshot = current;
    updateGloryHud();
    return;
  }

  const currentIds = new Set(Object.keys(current));
  const scored = new Set(state.gloryScoredEnemyIds.map(String));
  const skillIds = new Set(state.gloryPendingSkillCaptureIds.map(String));
  const captureBonuses = state.gloryPendingCaptureBonuses || {};
  const recentCard = state.gloryLastCardAt && Date.now() - state.gloryLastCardAt < 8000;
  let cardPoints = 0, cardKills = 0, friendlyLosses = 0;
  let multiplierChanged = false;
  const multiplierLevelsEarned = [];

  // Ordinary card, hazard, and void kills award points at the live multiplier
  // but do not build the multiplier themselves. Royal Standard is the one
  // deliberate exception: any enemy removed inside its marked area adds x0.5,
  // including non-jump card kills. This prevents cards such as Battering Ram
  // and Close Ranks from manufacturing a chain merely by clearing enemies.
  const nonSkillRemovedEnemies = Object.entries(previous).filter(([id, oldPiece]) =>
    !currentIds.has(id) && oldPiece.type === 'enemy' && !scored.has(id) && !skillIds.has(id));
  const nonSkillBatchBaseMultiplier = nonSkillRemovedEnemies.length
    ? Math.max(1, state.gloryMultiplier)
    : state.gloryMultiplier;
  if (nonSkillRemovedEnemies.length) {
    const multiplierGain = nonSkillRemovedEnemies.reduce((sum, [, piece]) =>
      sum + (piece.royalStandardBonus ? .5 : 0), 0);
    if (multiplierGain > 0) {
      state.gloryMultiplier = Math.min(100, state.gloryMultiplier + multiplierGain);
      multiplierChanged = true;
      multiplierLevelsEarned.push(state.gloryMultiplier);
    }
  }

  Object.entries(previous).forEach(([id, oldPiece]) => {
    if (currentIds.has(id)) return;
    if (oldPiece.type === 'enemy' && !scored.has(id)) {
      scored.add(id);
      const base = 100;
      if (skillIds.has(id)) {
        const stackedCardBonus = Number(captureBonuses[id]) ||
          ((oldPiece.headsmansBounty ? 2 : 1) * (oldPiece.royalStandardBonus ? 2 : 1));
        // Ordinary jumps add half a step. Royal Standard and Headsman's
        // Bounty instead multiply the live chain itself: Standard x2,
        // Bounty x2, or x4 when both apply to the same king.
        state.gloryMultiplier = Math.min(100, stackedCardBonus > 1
          ? state.gloryMultiplier * stackedCardBonus
          : state.gloryMultiplier + .5);
        const earned = Math.round(base * state.gloryMultiplier);
        state.gloryLevelCaptures++;
        awardGlory(earned, oldPiece.king ? 'KING CAPTURED' : 'CAPTURE', { row: oldPiece.row, col: oldPiece.col });
        multiplierChanged = true;
        multiplierLevelsEarned.push(state.gloryMultiplier);
      } else if (!recentCard && state.turnPhase === 'player' && isGloryVoidPosition(oldPiece)) {
        const earned = 200 * nonSkillBatchBaseMultiplier * (oldPiece.royalStandardBonus ? 2 : 1);
        state.gloryLevelVoidKills++;
        awardGlory(earned, 'INTO THE VOID', { row: oldPiece.row, col: oldPiece.col });
      } else {
        const earned = base * nonSkillBatchBaseMultiplier * (oldPiece.royalStandardBonus ? 2 : 1);
        cardPoints += earned;
        cardKills++;
        awardGlory(earned, oldPiece.king ? 'KING CARD KILL' : 'CARD KILL', {
          row: oldPiece.row,
          col: oldPiece.col,
          silent: true
        });
      }
      delete captureBonuses[id];
    } else if (oldPiece.type === 'yours' && !oldPiece.falseKing) {
      friendlyLosses++;
      state.gloryLevelFriendlyLosses++;
      awardGlory(-1000, 'UNIT LOST', { row: oldPiece.row, col: oldPiece.col, silent: true });
    }
  });

  Object.entries(current).forEach(([id, piece]) => {
    const oldPiece = previous[id];
    if (piece.type === 'yours' && piece.king && oldPiece?.type === 'yours' && !oldPiece.king) {
      state.gloryLevelCrowns++;
      awardGlory(300, 'CROWNED', { row: piece.row, col: piece.col });
    }
  });

  if (cardKills) {
    state.gloryLevelCardKills += cardKills;
    playGlorySound(cardPoints, false);
  }
  if (friendlyLosses > 0) {
    // Any friendly loss breaks the chain immediately, regardless of whether
    // it came from an enemy capture, a card, a hazard, or the void.
    state.gloryMultiplier = .5;
    state.gloryPendingSkillCaptureIds = [];
    state.gloryPendingCaptureBonuses = {};
    multiplierChanged = false;
    multiplierLevelsEarned.length = 0;
    updateGloryHud();
    showGloryMultiplierLost();
  } else if (multiplierChanged) {
    updateGloryHud();
    clearGloryMultiplierStepTimers();
    multiplierLevelsEarned.forEach((level, index) => {
      const timer = setTimeout(() => {
        showGloryMultiplier(level);
        playGlorySound(100, true, level);
      }, index * 140);
      gloryMultiplierStepTimers.push(timer);
    });
  }
  state.gloryScoredEnemyIds = Array.from(scored);
  state.gloryPendingSkillCaptureIds = state.gloryPendingSkillCaptureIds.filter(id => currentIds.has(String(id)));
  state.gloryPendingCaptureBonuses = friendlyLosses > 0 ? {} : captureBonuses;
  state.gloryPieceSnapshot = current;
  // Do not clear this marker during a card's preliminary render. Delayed
  // effects such as Close Ranks animate first and remove pieces afterward.
  // Clearing early made their border kills look like void kills.
  if (cardKills || friendlyLosses || (state.gloryLastCardAt && Date.now() - state.gloryLastCardAt >= 8000)) {
    state.gloryLastCardAt = 0;
  }
}

function resetGloryMultiplier() {
  if (!state) return;
  ensureGloryState();
  clearGloryMultiplierStepTimers();
  state.gloryMultiplier = .5;
  state.gloryPendingSkillCaptureIds = [];
  state.gloryPendingCaptureBonuses = {};
  updateGloryHud();
}

function initializeGloryLevel() {
  ensureGloryState();
  state.gloryMultiplier = .5;
  state.gloryLevelStart = state.glory;
  state.gloryLevelEarned = 0;
  state.gloryLevelCaptures = 0;
  state.gloryLevelCrowns = 0;
  state.gloryLevelFriendlyLosses = 0;
  state.gloryLevelCardKills = 0;
  state.gloryLevelVoidKills = 0;
  state.gloryTargetReached = false;
  state.gloryLevelFinalized = false;
  state.gloryPendingSkillCaptureIds = [];
  state.gloryPendingCaptureBonuses = {};
  state.gloryLastCardAt = 0;
  state.gloryPieceSnapshot = collectGloryPieceSnapshot();
  const enemies = Object.values(state.gloryPieceSnapshot).filter(piece => piece.type === 'enemy');
  const enemyValue = enemies.length * 100;
  state.gloryTarget = state.glory + Math.max(1000, Math.ceil((enemyValue * .72 + state.level * 100 + 650) / 100) * 100);
  updateGloryHud();
}

function finalizeGloryLevel() {
  ensureGloryState();
  if (state.gloryLevelFinalized) return;
  syncGloryScore();
  state.gloryLevelFinalized = true;
  awardGlory(1000 + state.level * 100, 'LEVEL CLEARED');
  if (state.gloryLevelFriendlyLosses === 0) awardGlory(500, 'FLAWLESS');
  if (state.mode === 'plus') {
    const movesLeft = Math.max(0, (state.plusTurnPieceCount || 0) - (state.plusMovedIds?.length || 0));
    const cardsLeft = Math.max(0, 3 + (state.bonusCardActions || 0) - (state.plusCardsUsed || 0));
    const efficiency = movesLeft * 75 + cardsLeft * 50;
    if (efficiency) awardGlory(efficiency, 'EFFICIENCY');
  }
}

function renderGlorySummary(targetId, levelCleared = false) {
  const el = document.getElementById(targetId);
  if (!el || !state) return;
  ensureGloryState();
  el.style.display = '';
  el.innerHTML = levelCleared
    ? `LEVEL GLORY <strong>${Math.max(0, state.gloryLevelEarned).toLocaleString()}</strong> &nbsp;•&nbsp; RUN TOTAL <strong>${state.glory.toLocaleString()}</strong><br>` +
      `${state.gloryLevelCaptures} tactical capture${state.gloryLevelCaptures === 1 ? '' : 's'} &nbsp;•&nbsp; ${state.gloryLevelCardKills} card kill${state.gloryLevelCardKills === 1 ? '' : 's'} &nbsp;•&nbsp; ${state.gloryLevelCrowns} crowned`
    : `FINAL GLORY <strong>${state.glory.toLocaleString()}</strong> &nbsp;•&nbsp; LEVELS CLEARED <strong>${state.levelsCompleted || 0}</strong>`;
}

// ── CARD CHOICE POOL ──
function getCardChoices() {
  return getWeightedCardChoices(3 + (state.rewardCardBonus || 0));
}

// ── STATE ──
let state = {};

// ── SAVE / LOAD ──
// The game is a plain in-memory object with no backing server, so without
// this it forgets everything the instant the app/tab is closed — including
// which level you were on. Every render() call snapshots the whole state to
// localStorage; on boot we restore it if present.
// Two entirely separate save slots — New Run and New Puzzle each resume
// independently and can never clobber one another. Glory Edition also uses
// its own namespace so opening this experiment cannot modify a regular
// Cartoon Edition save.
// v3 intentionally retires the previous level-30 showcase saves so an APK
// update cannot offer Continue Run on the old test board.
// v4 starts the pack economy cleanly; an older save cannot identify which
// hand cards came from the retired Starter Deck versus rewards earned in-run.
const SAVE_KEY_PLUS = 'kingme_glory_save_v4';
const SAVE_KEY_NORMAL = 'kingme_glory_puzzle_save_v4';

function saveGame() {
  // The scripted tutorial's fake 1-vs-3 board/state must never overwrite a
  // real in-progress run, or get offered back via "Continue Run" if the
  // player quits mid-tutorial.
  if (tutorial.active) return;
  // `state` starts as `{}` at page load and ONLY gets populated by clicking
  // Continue Run (loadOrInitState) or New Run (initState) — loadOrInitState
  // is never called automatically on boot. So sitting on the main menu
  // right after opening the app (before tapping anything) leaves `state` in
  // that empty shape, even though a real save may already exist in
  // localStorage. The visibilitychange handler below still fires if the app
  // gets backgrounded during that window — even briefly, a notification or
  // app-switch — and used to blindly persist whatever `state` currently was,
  // silently overwriting a perfectly good saved run with `{}`. That's what
  // surfaces later as "Continue Run — Level undefined", destroying real
  // progress with no warning. Never persist something that doesn't actually
  // look like a real run in progress.
  if (!state || !Array.isArray(state.board) || state.board.length === 0 || typeof state.level !== 'number') return;
  try {
    const key = state.mode === 'plus' ? SAVE_KEY_PLUS : SAVE_KEY_NORMAL;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.error('saveGame failed', err);
  }
}

// render() calls this instead of saveGame() directly. JSON-serializing the
// whole state and writing it to localStorage is real synchronous work, and
// render() itself fires once per enemy action during the enemy turn — with
// a busy board (50+ pieces) that could mean 50+ full saves in a couple of
// seconds, which was a big chunk of the lag on crowded boards. Collapsing a
// burst of renders down to one save after a genuine idle pause avoids
// colliding with the player's next tap. visibilitychange/beforeunload still
// flush a pending save immediately when the app backgrounds or closes.
let saveGameDebounceTimer = null;
function scheduleSaveGame() {
  if (tutorial.active) return;
  if (saveGameDebounceTimer) clearTimeout(saveGameDebounceTimer);
  saveGameDebounceTimer = setTimeout(() => {
    saveGameDebounceTimer = null;
    saveGame();
  }, 1500);
}
// Belt-and-suspenders: if the tab is closed/reloaded while a save is still
// pending, flush it immediately instead of losing that last bit of progress.
window.addEventListener('beforeunload', () => {
  if (saveGameDebounceTimer) {
    clearTimeout(saveGameDebounceTimer);
    saveGameDebounceTimer = null;
    saveGame();
  }
});

// Android TWA doesn't reliably fire beforeunload when the app is killed or
// backgrounded. visibilitychange (hidden) maps to Android's onPause() and
// fires much more reliably — flush any pending save immediately.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !tutorial.active) {
    if (saveGameDebounceTimer) {
      clearTimeout(saveGameDebounceTimer);
      saveGameDebounceTimer = null;
    }
    saveGame();
  }
});

function loadGame(mode) {
  try {
    const key = mode === 'plus' ? SAVE_KEY_PLUS : SAVE_KEY_NORMAL;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Reject obsolete internal-test saves before normal play can resume.
    if (saved.devModeTainted === true || (retiredTestPreferenceFound && isRetiredTestSave(saved, mode))) {
      localStorage.removeItem(key);
      return null;
    }
    return saved;
  } catch (err) {
    console.error('loadGame failed', err);
    return null;
  }
}

function clearSave(mode) {
  try {
    const key = mode === 'plus' ? SAVE_KEY_PLUS : SAVE_KEY_NORMAL;
    localStorage.removeItem(key);
  } catch (err) {
    console.error('clearSave failed', err);
  }
}

// Called once on boot instead of initState() — resumes a saved run if one
// exists, otherwise starts fresh exactly like initState() always did.
function loadOrInitState(mode) {
  const saved = loadGame(mode);
  if (!saved) {
    initState(mode);
    return;
  }
  state = saved;
  ensureGloryState();
  if (CARTOON_SHOWCASE_BUILD) {
    // Old developer saves may still carry the former 54-card test hand.
    // Strip it on resume so this sandbox contains only cards introduced
    // from Secret Passage onward, exactly like a fresh developer run.
    const existingById = new Map((state.cards || []).map(card => [card.id, card]));
    state.cards = DEVELOPER_NEW_CARD_IDS.map((id, index) => {
      const existing = existingById.get(id);
      return existing || { id, used: false, uid: Number(state.cardUidCounter || 0) + index, baseOnly: false };
    });
    state.cardUidCounter = Math.max(Number(state.cardUidCounter || 0), ...state.cards.map(card => Number(card.uid || 0) + 1));
    if (!Array.isArray(state.secretPassageTunnels)) state.secretPassageTunnels = [];
    if (!Array.isArray(state.secretPassagePlacements)) state.secretPassagePlacements = [];
  }
  if (state.forcedJumpPieceId === undefined) state.forcedJumpPieceId = null;
  migrateRunCardMasteryState();
  if (state.openingRewardPending) {
    state.cardPackOpening = false;
    state.openingPackOpened = !!state.openingPackOpened;
    state.lastPackCardId = CARD_DEFS[state.lastPackCardId] ? state.lastPackCardId : null;
    showOpeningRewardChoice();
    return;
  }
  // Self-heal any bear trap caught mid-"snap" animation when the app was
  // closed/reloaded — the setTimeout that would normally finish removing
  // that piece a moment later is gone now, so just resolve it immediately
  // instead of leaving the piece permanently stuck invisible.
  if (state.board && state.board.length) {
    const rowsN = state.board.length;
    const colsN = state.board[0] ? state.board[0].length : 0;
    for (let r = 0; r < rowsN; r++) {
      for (let c = 0; c < colsN; c++) {
        const bc = state.board[r][c];
        if (bc && bc.trapSnapping) {
          bc.piece = null;
          bc.trap = false;
          bc.trapSnapping = false;
        }
      }
    }
  }
  const recoveredEpic = recoverPendingEpicEffect();
  const recoveredRare = recoverPendingRareEffect();
  if (recoveredEpic || recoveredRare) saveGame();
  if (state.gameOver) {
    // The app was closed while the win/lose overlay was up. We don't persist
    // which overlay or the reward-choice UI, so the safest resume is to
    // silently regenerate a fresh board for the same level rather than
    // guess — the player keeps their level, cards, and counters either way.
    state.gameOver = false;
    state.selected = null;
    state.validMoves = [];
    state.activeCard = null;
    state.activeCardUid = null;
    setupLevel();
  } else {
    render();
    if (recoveredEpic || recoveredRare) {
      if (countPieces('enemy') === 0) { triggerWin(); return; }
      if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
    }
    try {
      fitBoardToViewport();
    } catch (err) {
      console.error('fitBoardToViewport failed', err);
      showDebugError(`Board-fit error: ${err.message}`);
    }
    // Enemy actions are paced by callbacks that disappear when the app is
    // closed. Resume the saved queue instead of leaving the board permanently
    // locked in the enemy phase (or restarting enemies that already acted).
    if (state.mode === 'plus' && state.turnPhase === 'enemy') {
      setTimeout(() => startEnemyTurn(true), 0);
    }
  }
}

function initState(mode, startLevel, sfxMuted) {
  let startingCards;
  let uidCounter;
  // A white card sitting in the (new) white Starter Deck slot isn't held —
  // same as picking one from a reward screen mid-run, it applies its
  // permanent run-start effect immediately instead of adding a hand card.
  let starterWhiteCardCount = 0;
  let starterRewardCardBonus = 0;
  let starterBonusPieces = 0;
  let starterVeteranCount = 0;
  let starterBonusCardActions = 0;
  let starterBloodOathCount = 0;
  let starterRoyalStandardCount = 0;
  const masteryClaimedCardIds = [];
  const makeStartingCard = (id, uid) => {
    if (!masteryClaimedCardIds.includes(id)) masteryClaimedCardIds.push(id);
    return { id, used: false, uid, baseOnly: false };
  };
  const claimStartingPassive = id => {
    if (!masteryClaimedCardIds.includes(id)) masteryClaimedCardIds.push(id);
    return false;
  };

  // Glory Edition has no permanent Starter Deck. The Level 1 Common pack
  // supplies the first card of each run.
  startingCards = [];
    uidCounter = 0;

    // Starter Deck slots you've unlocked (by beating level milestones) and put
    // a card in add exactly one extra copy of that card to the real starting
    // hand of every run from here on — not just a collection-screen preview.
    // New Puzzle has its own fully separate starter deck (puzzleCollection),
    // never New Run's.
    const runCollection = mode === 'plus' ? collection : puzzleCollection;
    [].forEach((cardId, idx) => {
      const levelReq = STARTER_DECK_MILESTONES[idx];
      const def = CARD_DEFS[cardId];
      if (!cardId || !def || !runCollection.unlockedCards.includes(cardId) || runCollection.highestLevelBeaten < levelReq) return;
      // Plus-only cards (Blizzard, etc.) sitting in a starter deck slot only
      // actually get granted when the run being started IS New Run Plus —
      // same rule as picking one from a reward screen.
      if (def.plusOnly && mode !== 'plus') return;
      if (def.rarity === 'white') {
        const baseOnly = claimStartingPassive(cardId);
        starterWhiteCardCount++;
        if (cardId === 'plus_one') starterRewardCardBonus += getPlusOneRewardBonus(mode, baseOnly);
        if (cardId === 'reinforcements') starterBonusPieces += getReinforcementPieceBonus(mode, baseOnly);
        if (cardId === 'veteran') starterVeteranCount += getVeteranStartingKingCount(mode, baseOnly);
        if (cardId === 'ace_up_the_sleeve') starterBonusCardActions += getAceCardActionBonus(mode, baseOnly);
        if (cardId === 'blood_oath') starterBloodOathCount++;
        if (cardId === 'royal_standard') starterRoyalStandardCount++;
        return;
      }
      startingCards.push(makeStartingCard(cardId, uidCounter++));
    });

  // The developer sandbox carries the new-card roster plus every Epic card.
  // Every included card with an upgrade path is fully mastered above.
  if (CARTOON_SHOWCASE_BUILD) {
    masteryClaimedCardIds.length = 0;
    startingCards = DEVELOPER_NEW_CARD_IDS.flatMap((id, cardIndex) =>
      Array.from({ length: DEVELOPER_CARD_COPIES }, (_, copyIndex) =>
        makeStartingCard(id, cardIndex * DEVELOPER_CARD_COPIES + copyIndex)
      )
    );
    uidCounter = startingCards.length;
    const showcaseWhiteIds = DEVELOPER_NEW_CARD_IDS.filter(id => CARD_DEFS[id].rarity === 'white');
    showcaseWhiteIds.forEach(id => {
      for (let copy = 0; copy < DEVELOPER_CARD_COPIES; copy++) claimStartingPassive(id);
    });
    starterWhiteCardCount = showcaseWhiteIds.length * DEVELOPER_CARD_COPIES;
    starterRewardCardBonus = getPlusOneRewardBonus(mode, false) * DEVELOPER_CARD_COPIES;
    starterBonusPieces = getReinforcementPieceBonus(mode, false) * DEVELOPER_CARD_COPIES;
    starterVeteranCount = getVeteranStartingKingCount(mode, false) * DEVELOPER_CARD_COPIES;
    starterBonusCardActions = getAceCardActionBonus(mode, false) * DEVELOPER_CARD_COPIES;
    starterBloodOathCount = DEVELOPER_CARD_COPIES;
    starterRoyalStandardCount = DEVELOPER_CARD_COPIES;
  }

  const effectiveStartLevel = CARTOON_SHOWCASE_BUILD
    ? CARTOON_SHOWCASE_START_LEVEL
    : (startLevel || 1);
  state = {
    level: effectiveStartLevel,
    board: [],
    selected: null,
    validMoves: [],
    cards: startingCards,
    activeCard: null,
    activeCardUid: null,
    lastUsedCard: null,
    usedCardsThisBattle: [],
    shieldedPiece: null,
    pieceIdCounter: 0,
    cardUidCounter: uidCounter,
    masteryClaimedCardIds,
    activeCardMasteryId: null,
    activeCardMasteryLevel: null,
    // Starting from an unlocked level seeds the number of earlier levels
    // already cleared so progress and leaderboard scoring remain accurate.
    levelsCompleted: effectiveStartLevel - 1,
    boardSize: 6,
    gameOver: false,
    // Every real new run begins with a three-card choice before its first
    // board is generated. The tutorial remains scripted and skips this.
    openingRewardPending: CARTOON_SHOWCASE_BUILD ? false : !tutorial.active,
    cardPackOpening: false,
    cardPackPurchasedThisReward: false,
    openingPackOpened: false,
    lastPackCardId: null,
    // Run-start sound-effects on/off toggle (see the level-select overlay
    // and applySfxMuteFromState) — sticks for this whole run, including
    // across a save/resume since it's just a normal field on `state`, and
    // gets reset back to false (sound back on) whenever the run ends; see
    // triggerLose.
    sfxMuted: !!sfxMuted,
    whiteCardCount: starterWhiteCardCount, // total white cards this run (any kind, combined) — controls the shared white-card odds
    rewardCardBonus: starterRewardCardBonus, // extra reward-screen choices this run, one per Plus One
    bonusPieces: starterBonusPieces,         // extra starting piece every level, one per Reinforcements
    veteranCount: starterVeteranCount,       // stacks — that many pieces start each level as a king, one per Veteran picked
    bonusCardActions: starterBonusCardActions, // extra card uses per turn, one per Ace up the Sleeve
    bloodOathCount: starterBloodOathCount,     // Blood Oath cards picked this run
    royalStandardCount: starterRoyalStandardCount, // Royal Standard must be owned before its banner placement begins
    bloodOathTriggeredThisLevel: false,        // has it drawn a card this level yet?
    blackHoleAcquiredThisRun: startingCards.some(card => card.id === 'black_hole'),
    sandsOfTimeAcquiredThisRun: startingCards.some(card => card.id === 'sands_of_time'),
    divineInterventionAcquiredThisRun: startingCards.some(card => card.id === 'divine_intervention'),
    divineInterventionUsedThisRun: false,
    blackHoleUsedThisLevel: false,
    lazarusGraveyard: [], // fallen friendly snapshots for the current Lazarus life-cycle
    lazarusFriendlySnapshot: [], // live friendly locations/status from the previous settled board state
    lazarusReviving: false,
    pendingEpicEffect: null, // interruption-safe transaction for delayed Epic animations
    pendingRareEffect: null, // interruption-safe transaction for delayed Rare animations
    deadMansHandDiscardedCards: [], // permanent hand hidden until the next level
    // New Run Plus (Beta): enemies actually take a turn instead of sitting
    // still. mode is 'normal' (default, static enemies, unchanged behavior)
    // or 'plus' (turn-based, enemies move/capture/king themselves).
    mode: mode || 'normal',
    turnPhase: 'player',   // 'player' or 'enemy' — only meaningful in plus mode
    plusMovedIds: [],      // ids of YOUR pieces that already acted this player turn (plus mode only)
    forcedJumpPieceId: null, // a capture chain must continue with this exact piece until no jump remains
    plusCardsUsed: 0,      // how many cards you've played THIS player turn (plus mode only) — capped at your piece count
    lastCardPlayedId: null,  // permits an immediate second copy without treating the first card as a board move
    assassinateTargets: [], // marked enemy squares; mastery scales the simultaneous strike from 1 to 4 targets
    demotionTargets: [],    // enemy squares marked so far while Demotion is active (up to 3, demoted simultaneously)
    bearTrapTargets: [], // open squares marked so far while Bear Trap is active (up to its mastery-scaled cap, placed simultaneously)
    ambushTargets: [],   // your own pieces marked so far while Ambush is active (up to its mastery-scaled cap, armed simultaneously)
    shieldWallTargets: [], // friendly pieces selected for Shield Wall's mastery-scaled protection
    counterTargets: [],    // friendly pieces selected for Counter's mastery-scaled riposte
    siegeTargets: [],      // enemy Kings selected for Siege's mastery-scaled movement restriction
    madCowTarget: null, // {row, col, captured:[]} while Mad Cow is armed waiting for second tap
    madCowTargetSparesFriendly: false,
    phalanxTurnsLeft: 0, // enemy turns remaining where the back row is sealed (The Phalanx)
    phalanxRows: 0,      // frozen at cast time so the active effect remains stable
    doubleCardNext: false, // Hero's Gambit: next markCardUsed call is free (card stays in hand)
    heroGambitBonusCardUid: null, // exact card retained for Hero's Gambit's second activation
    heroGambitReservedCardUid: null, // selected-but-not-yet-used card; survives ending the turn
    heroGambitSacrifices: [], // friendly squares selected for sacrifice while Hero's Gambit is armed
    puppetTarget: null,   // {row,col} of the enemy piece currently grabbed by Puppet Master
    puppetMoved: 0,       // how many enemies have been moved so far this Puppet Master activation
    puppetMovedIds: [],    // enemy IDs already moved; each unit can only be chosen once per activation
    puppetMoveTarget: 0,  // mastery-scaled move count, capped to enemies that have a legal destination
    scorchedEarthTurns: 0,   // player turns remaining where selected movement burns its path
    scorchedEarthTargets: [], // friendly squares being selected before the card commits
    scorchedEarthUnitIds: [], // selected friendly IDs whose movement leaves fire
    scorchedEarthAllUnits: false, // full mastery: every friendly unit leaves fire
    scorchedEarthSquares: [], // board squares set on fire by Scorched Earth — cleared when turns expire
    // Mad Cow's leftover poison field — a list of {r, c, turnsLeft} instead
    // of one shared countdown (like Scorched Earth's), since Mad Cow can be
    // cast more than once with overlapping 3x3 zones that expire at
    // different times; each square tracks and ticks down independently. See
    // finishEnemyTurn() for the countdown and the 'poison' hazard checks
    // alongside every existing 'fire' check for the kill-on-landing rule.
    poisonSquares: [],
    secretPassageTunnels: [], // persistent color-matched endpoint pairs for this level
    secretPassagePlacements: [], // in-progress endpoint choices while the card is armed
    blackHoleActive: false, // permanent 3x3 center void for the current level
    enemyStuckTurns: 0,    // consecutive enemy turns where no enemy piece moved at all
    enemyMovedThisTurn: false, // set to true the first time any enemy physically moves this turn
    enemyFrozenThisTurn: false, // set true if Blizzard is why an enemy sat out — excludes that turn from the stuck-enemy auto-win entirely
    enemyTurnRemainingIds: [], // persisted enemy queue for interrupted AI turns
    blackHolePulseResolvedThisEnemyTurn: false, // prevents a recovered pulse from firing twice
    noCaptureStreak: 0,    // consecutive turns with no piece eliminated on either side
    noCaptureSnapEnemy: 0, // enemy count at the start of the current turn cycle
    noCaptureSnapYours: 0, // player count at the start of the current turn cycle
    // Total ACTIVE milliseconds spent on this run — ticks up only while
    // moves are actually being made, pauses after 5s of no move, resumes the
    // instant the next move happens. See markActivity()/activityTick() below.
    // Persists across levels within this run (never reset by nextLevel()),
    // only zeroed here at the true start of a brand-new run, and submitted
    // to the leaderboard alongside the level score in triggerLose().
    runActiveMs: 0,
    // Wrath is the only card whose charge count spans the entire run. The
    // base card has one charge; its single mastery upgrade raises that to two.
    wrathUsesThisRun: 0,
    // Glory Edition run score. These fields are ignored by every combat and
    // progression rule and persist naturally with the ordinary run save.
    glory: 0,
    gloryMultiplier: .5,
    gloryMultiplierRuleVersion: 2,
    gloryLevelStart: 0,
    gloryLevelEarned: 0,
    gloryLevelCaptures: 0,
    gloryLevelCrowns: 0,
    gloryLevelFriendlyLosses: 0,
    gloryLevelCardKills: 0,
    gloryLevelVoidKills: 0,
    gloryTarget: 0,
    gloryTargetReached: false,
    gloryLevelFinalized: false,
    gloryPieceSnapshot: {},
    gloryScoredEnemyIds: [],
    gloryPendingSkillCaptureIds: [],
    gloryPendingCaptureBonuses: {},
    gloryLastCardAt: 0,
  };
  applySfxMuteFromState();
  if (state.openingRewardPending) showOpeningRewardChoice();
  else setupLevel();
}

// Every 3 levels cleared lines up exactly with a reward screen (see
// `earnCard = state.levelsCompleted % 3 === 0` in triggerWin/nextLevel) —
// this gives the player a real, felt step up in challenge right as they
// cash that reward in, on top of (not instead of) the existing smooth
// per-level curves. Capped so it stays a meaningful nudge rather than a
// wall — by level 100 this alone would otherwise pile up to +40%.
function getRewardMilestoneBump() {
  const milestonesReached = Math.floor((state.level - 1) / 3);
  return Math.min(milestonesReached * 0.012, 0.12);
}

function getBoardSize() {
  // Same shape as the original 1-10 curve, stretched 10x for the full 1-100
  // level range (levels 1-10 in the old scale === levels 1-100 here).
  // NOTE: this curve feeds the level 20+ TALL/rectangle roll in setupLevel
  // (BS +/- a few, capped at 18) — that formula is left untouched on
  // purpose, so it still stays exactly as calibrated before. Square boards
  // use the separate, faster-ramping getSquareBoardSize() below instead.
  if (state.level <= 10) return 6;
  if (state.level <= 20) return 7;
  if (state.level <= 30) return 8;
  if (state.level <= 40) return 9;
  if (state.level <= 60) return 10;
  if (state.level <= 70) return 11;
  if (state.level <= 80) return 12;
  if (state.level <= 90) return 13;
  return 14;
}

// Square-board size curve (levels 1-19's always-square boards, and the 50%
// "stayed square" roll from level 20 on in setupLevel). Ramps faster than
// getBoardSize() above so a 14x14 board is already showing up around level
// 50, and caps out at a new 16x16 ceiling — up from the old 14x14 ceiling —
// instead of flattening at level 90+. Deliberately separate from
// getBoardSize() so the tall/rectangle roll's sizing is left completely
// alone.
function getSquareBoardSize() {
  // Keep the introductory campaign on one readable 6x6 board. Level 13
  // hands control back to the established size curve below.
  if (state.level <= 12) return 6;
  if (state.level <= 20) return 8;
  if (state.level <= 30) return 10;
  if (state.level <= 40) return 12;
  if (state.level <= 50) return 14;
  if (state.level <= 60) return 15;
  return 16;
}

// Levels 1-12 use a deliberately readable baseline matchup. Permanent run
// bonuses can still add friendly pieces, but the normal starting force is
// always three and enemy pressure rises only once every three levels.
function getIntroEnemyCount(level = state.level) {
  if (level <= 0 || level > 12) return null;
  if (level <= 3) return 3;
  if (level <= 6) return 4;
  if (level <= 9) return 5;
  return 6;
}

// Scale factor for the fixed "unique" board layouts (Cross/Hourglass/
// Diamond), normalized to 1.0 at level 30 — the earliest level any of them
// can appear — and growing at exactly the same rate as the square-board
// curve from there on, so the unique boards grow the same percentage as
// the regular square/rectangle boards do as a run progresses.
// getSquareBoardSize() returns exactly 10 at level 30, so dividing by 10
// anchors this scale to 1.0 right at that level; it only grows from there
// since the unique-board roll never happens before level 30.
function uniqueBoardScale() {
  return getSquareBoardSize() / 10;
}

function getDarkSquares() {
  const bs = getBoardSize();
  const squares = [];
  for (let r = 0; r < bs; r++) {
    for (let c = 0; c < bs; c++) {
      if ((r + c) % 2 === 1) squares.push({ r, c });
    }
  }
  return squares;
}

// Actual grid dimensions for the CURRENT level. Levels 1-19 are always a
// plain square (rows === cols === getBoardSize()). From level 20 on,
// setupLevel() rolls a real rectangle — sometimes wide, sometimes tall,
// sometimes still square, always 4 straight edges — and stores it here so
// it stays fixed for the rest of that level (including across a
// save/resume). getBoardSize() itself is untouched and keeps meaning what
// it always has: the level's difficulty-scale number, used by the fill%/
// light-square-rate/etc. curves below, NOT necessarily the grid's actual
// width or height anymore.
function getBoardRows() {
  return state.boardRows || getBoardSize();
}
function getBoardCols() {
  return state.boardCols || getBoardSize();
}

function getBoardShape() {
  const rows = getBoardRows();
  const cols = getBoardCols();
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push({ r, c });
  return cells;
}

// LEVEL 30 — fixed "Cross" board. A solid NxN square with a crater block
// carved into the interior of each corner, but a corridor of width PW left
// open along the outer edge through every corner — so the four arms of the
// cross (top/bottom/left/right) always stay connected around the rim, never
// fully sealed off. CS controls how deep each corner cut goes; PW controls
// how wide the pass-through corridor hugging the board's outer edge is.
const CROSS_BOARD_SIZE = 12;
const CROSS_BOARD_CORNER_CUT = 5;
const CROSS_BOARD_CORRIDOR_WIDTH = 2;

// LEVEL 31 — fixed "Hourglass" board. A tall rectangle with two full-width
// rooms at the top and bottom, stepping inward symmetrically in stages as
// you approach the middle, down to one narrow waist held for the center few
// rows — the single chokepoint connecting the two halves of the board.
const HOURGLASS_BOARD_ROWS = 14;
const HOURGLASS_BOARD_COLS = 12;
const HOURGLASS_FULL_WIDTH = 12;   // how wide the top/bottom rooms are (== HOURGLASS_BOARD_COLS, i.e. no cut at all up there)
const HOURGLASS_WAIST_WIDTH = 4;   // how wide the narrowest point is
const HOURGLASS_WAIST_ROWS = 2;    // how many rows are held at the minimum width, dead center
const HOURGLASS_TAPER_ROWS = 4;    // how many step-down rows on EACH side between a full room and the waist

// LEVEL 33 — fixed "Diamond" board. A solid NxN square cratered down to an
// Aztec diamond: widest across the exact middle row/column, tapering
// symmetrically to single-square tips at the very top, bottom, left, and
// right. Unlike the Cross or Hourglass, this is one single convex region
// with no separate rooms to reconnect, so there's no corridor to carve —
// it's naturally never cut off.
const DIAMOND_BOARD_SIZE = 13;
const DIAMOND_RADIUS = 6;

// "Swiss Cheese" and "Firestorm" boards. Neither is a fixed shape/size like
// Cross/Hourglass/Diamond — both keep whatever board dimensions the normal
// random square/rectangle roll produces, and scatter a hazard across ~15%
// of the squares using the exact same placement algorithm (see
// tryScatteredHazardLayout/generateScatteredHazardLayout below): no two
// hazard squares ever share an edge (orthogonal adjacency), and no
// non-hazard square may have all 4 diagonal neighbors blocked (off-board or
// hazardous) — a piece can still be trapped by other pieces, just never by
// the terrain alone. If a layout can't be found clean after MAX_ATTEMPTS
// retries, it falls back to no hazards rather than risk a broken board.
// Swiss Cheese uses 'crater' (impassable rubble); Firestorm uses 'fire'
// (the same lethal-but-enterable hazard Wildfire drops mid-game, complete
// with its flame animation) — same layout algorithm, different hazard.
const SWISS_CHEESE_CRATER_RATE = 0.15;
const FIRE_FIELD_RATE = 0.15;
const SCATTERED_HAZARD_MAX_ATTEMPTS = 60;

// Hourglass and Diamond both have a severe kinging chokepoint — Diamond's
// top/bottom rows taper to a single square, and Hourglass forces everything
// through its narrow 4-wide waist before reaching the (otherwise wide) top/
// bottom rows. Below this level, enemies still need to physically reach
// that row to get kinged, so they jam up and pile onto that one narrow
// crossing instead of spreading out. This matches the level at which
// enemyStartKingChance (see the enemy-placement block in setupLevel) hits
// 1.0 — every enemy piece already starts the level kinged, so the
// chokepoint is a non-issue: nobody needs to fight their way through it to
// get crowned anymore. Below level 80, these two are excluded from the
// random unique-board roll entirely.
const HOURGLASS_DIAMOND_MIN_LEVEL = 80;

// Attempts one random scattered-hazard layout for a boardRows x boardCols
// board at the given density (0-1). Returns a Set of "r,c" keys on success,
// or null if this attempt produced a layout that traps a square by terrain
// alone (caller retries). Shared by Swiss Cheese (craters) and Firestorm
// (fire) — the hazard type itself is applied by the caller, not here.
function tryScatteredHazardLayout(boardRows, boardCols, rate) {
  const inBounds = (r, c) => r >= 0 && r < boardRows && c >= 0 && c < boardCols;
  const total = boardRows * boardCols;
  const targetCount = Math.round(total * rate);
  const coords = [];
  for (let r = 0; r < boardRows; r++) for (let c = 0; c < boardCols; c++) coords.push({ r, c });
  // Fisher-Yates shuffle
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }

  const hazardSet = new Set();
  for (const { r, c } of coords) {
    if (hazardSet.size >= targetCount) break;
    // Rule 1: never place a hazard orthogonally adjacent to another one.
    const orthNeighbors = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
    const touchesHazard = orthNeighbors.some(([nr,nc]) => hazardSet.has(`${nr},${nc}`));
    if (touchesHazard) continue;
    hazardSet.add(`${r},${c}`);
  }

  // Rule 2: no non-hazard square may have every diagonal neighbor blocked
  // (off-board or hazardous) — that would trap a piece there by terrain
  // alone, regardless of any other piece on the board.
  for (let r = 0; r < boardRows; r++) {
    for (let c = 0; c < boardCols; c++) {
      if (hazardSet.has(`${r},${c}`)) continue;
      const diagNeighbors = [[r-1,c-1],[r-1,c+1],[r+1,c-1],[r+1,c+1]];
      const hasEscape = diagNeighbors.some(([nr,nc]) => inBounds(nr,nc) && !hazardSet.has(`${nr},${nc}`));
      if (!hasEscape) return null; // this layout traps a square — reject it
    }
  }
  return hazardSet;
}

// Retries tryScatteredHazardLayout up to SCATTERED_HAZARD_MAX_ATTEMPTS
// times, falling back to an empty (no hazards) layout if none come back
// clean.
function generateScatteredHazardLayout(boardRows, boardCols, rate) {
  for (let attempt = 0; attempt < SCATTERED_HAZARD_MAX_ATTEMPTS; attempt++) {
    const result = tryScatteredHazardLayout(boardRows, boardCols, rate);
    if (result) return result;
  }
  return new Set();
}

// Returns how many columns should stay open for board row `r` of the fixed
// Hourglass layout — widest at the very top/bottom, narrowing one step per
// row toward the center, then held at HOURGLASS_WAIST_WIDTH for the
// HOURGLASS_WAIST_ROWS rows dead center. Centered symmetrically for column
// placement, so it always tapers toward the middle of the board.
function hourglassOpenWidthForRow(r) {
  // Reads the scaled per-run dimensions applySpecialBoardType() stashed on
  // state (see uniqueBoardScale()), falling back to the original fixed
  // constants if called with none set (shouldn't happen in practice, since
  // this is only ever called while state.specialBoardType === 'hourglass').
  const rows = state.hourglassRows || HOURGLASS_BOARD_ROWS;
  const fullWidth = state.hourglassFullWidth || HOURGLASS_FULL_WIDTH;
  const waistWidth = state.hourglassWaistWidth || HOURGLASS_WAIST_WIDTH;
  const waistRows = state.hourglassWaistRows || HOURGLASS_WAIST_ROWS;
  const taperRows = state.hourglassTaperRows || HOURGLASS_TAPER_ROWS;
  const center = (rows - 1) / 2;
  const d = Math.abs(r - center);
  const halfWaist = waistRows / 2;
  if (d <= halfWaist) return waistWidth;
  const step = (fullWidth - waistWidth) / taperRows;
  const level = Math.ceil(d - halfWaist);
  return Math.min(fullWidth, waistWidth + level * step);
}

function setupLevel() {
  const BS = getBoardSize(); // feeds ONLY the tall/rectangle roll below — left untouched
  const squareBS = getSquareBoardSize(); // feeds every square board (up to 16x16 now)
  const minSide = 3;
  const maxSide = 18; // keep even the long axis of a tall board reasonable

  // Rolls the tall/rectangle dimensions (never wide: columns never exceed
  // rows, so the board always renders portrait or square, not landscape,
  // which distorted card art and piece layout). Sizing formula
  // intentionally untouched — still based on the original BS.
  function rollTallRectangle() {
    state.boardRows = Math.min(maxSide, BS + 2 + Math.floor(Math.random() * 5));
    state.boardCols = Math.max(minSide, BS - 2 - Math.floor(Math.random() * 3));
  }

  // Rolls the original tall/rectangle-vs-square split (30% tall, 70%
  // square) and applies it to state.boardRows/state.boardCols. Used for
  // levels 20-29 unchanged, and reused by the level-30+ Swiss Cheese outcome
  // below to decide what size board to scatter its craters over.
  function rollRectangleOrSquare() {
    const roll = Math.random();
    if (roll < 0.30) {
      rollTallRectangle();
    } else {
      // Square — rows === cols, on the faster-ramping squareBS curve.
      state.boardRows = squareBS;
      state.boardCols = squareBS;
    }
  }

  // Applies one named unique-board outcome.
  function applySpecialBoardType(type) {
    if (type === 'rectangle') {
      rollTallRectangle();
    } else if (type === 'cross') {
      // Scale the fixed Cross layout by the same percentage the regular
      // square/rectangle boards grow by (see uniqueBoardScale()). Rounded to
      // the nearest even number so the corner-block math (which assumes a
      // perfectly symmetric NxN square) stays exact, and the corner-cut
      // depth is scaled proportionally right along with it. The corridor
      // width is left fixed — it's a minimum passable width, not something
      // that needs to grow.
      const scale = uniqueBoardScale();
      const size = Math.max(CROSS_BOARD_SIZE, Math.round((CROSS_BOARD_SIZE * scale) / 2) * 2);
      state.boardRows = size;
      state.boardCols = size;
      state.crossCornerCut = Math.max(2, Math.round(CROSS_BOARD_CORNER_CUT * scale));
    } else if (type === 'hourglass') {
      // Scale every Hourglass dimension (rows, cols, waist width, waist
      // rows, taper rows) proportionally, storing the derived values on
      // state so hourglassOpenWidthForRow() and the carving loop below use
      // the scaled numbers instead of the original fixed constants. Full
      // width is derived directly from the scaled column count so it always
      // exactly matches the board's actual width.
      const scale = uniqueBoardScale();
      const rows = Math.max(HOURGLASS_BOARD_ROWS, Math.round(HOURGLASS_BOARD_ROWS * scale));
      const cols = Math.max(HOURGLASS_BOARD_COLS, Math.round(HOURGLASS_BOARD_COLS * scale));
      state.boardRows = rows;
      state.boardCols = cols;
      state.hourglassRows = rows;
      state.hourglassFullWidth = cols;
      state.hourglassWaistWidth = Math.max(2, Math.round(HOURGLASS_WAIST_WIDTH * scale));
      state.hourglassWaistRows = Math.max(2, Math.round(HOURGLASS_WAIST_ROWS * scale));
      state.hourglassTaperRows = Math.max(1, Math.round(HOURGLASS_TAPER_ROWS * scale));
    } else if (type === 'swisscheese') {
      rollRectangleOrSquare(); // Swiss Cheese scatters craters over whatever size comes up
    } else if (type === 'firefield') {
      rollRectangleOrSquare(); // Firestorm scatters fire over whatever size comes up, same as Swiss Cheese
    } else if (type === 'diamond') {
      // Scale the Diamond's size, rounding to the nearest ODD integer so the
      // radius = (size-1)/2 relationship stays an exact integer — that's
      // what keeps the diamond's tips touching the board edges exactly, with
      // no off-by-one gap or overhang.
      const scale = uniqueBoardScale();
      let size = Math.max(DIAMOND_BOARD_SIZE, Math.round(DIAMOND_BOARD_SIZE * scale));
      if (size % 2 === 0) size += 1;
      state.boardRows = size;
      state.boardCols = size;
      state.diamondRadius = (size - 1) / 2;
    }
    state.specialBoardType = type;
  }

  // Starting level 20, every level rolls its own rectangle instead of
  // always being a plain squareBSxsquareBS square — still always 4 straight
  // edges, just not necessarily equal width/height. Rolled once here and
  // stored on state so getBoardRows()/getBoardCols() (which everything
  // else in the game uses for actual grid bounds) stay fixed for the whole
  // level.
  //
  // Starting level 30, there's a flat 30% chance of getting one of the
  // eligible "unique" boards — the tall Rectangle, Cross, Swiss Cheese, and
  // Firestorm are always eligible; Hourglass and Diamond only join the pool
  // once enemyStartKingChance hits 1.0 at HOURGLASS_DIAMOND_MIN_LEVEL (see
  // that constant's comment for why). Whatever's eligible is picked with
  // equal odds within that 30% slot. The other 70% of the time it's just a
  // plain square, same as any other level's common case. state.specialBoardType
  // records which unique board (if any) was picked, so the hazard-carving
  // step below knows what to carve; null means a plain square (or the plain
  // rolled rectangle) with no hazards.
  //
  state.specialBoardType = null;
  const forcedDeveloperBoard = CARTOON_SHOWCASE_BUILD
    ? DEVELOPER_UNIQUE_LEVELS[state.level]
    : null;
  if (forcedDeveloperBoard) {
    applySpecialBoardType(forcedDeveloperBoard);
  } else if (state.level >= 30) {
    const roll = Math.random();
    if (roll < 0.30) {
      const eligibleTypes = ['rectangle', 'cross', 'swisscheese', 'firefield'];
      if (state.level >= HOURGLASS_DIAMOND_MIN_LEVEL) {
        eligibleTypes.push('hourglass', 'diamond');
      }
      const pick = Math.floor(Math.random() * eligibleTypes.length);
      applySpecialBoardType(eligibleTypes[pick]);
    } else {
      // 70% — plain square, same as any other level's common case.
      state.boardRows = squareBS;
      state.boardCols = squareBS;
    }
  } else if (state.level >= 20) {
    rollRectangleOrSquare();
  } else {
    state.boardRows = squareBS;
    state.boardCols = squareBS;
  }
    const boardRows = getBoardRows();
    const boardCols = getBoardCols();
    state.board = [];
    for (let r = 0; r < boardRows; r++) {
      state.board.push([]);
      for (let c = 0; c < boardCols; c++) {
        state.board[r].push({ piece: null });
      }
    }

    // Carve the Cross board's corner craters now, before any piece placement
    // pool is built below, so pieces (and card effects that need to find an
    // open square) never consider these squares in play.
    if (state.specialBoardType === 'cross') {
      const CS = state.crossCornerCut || CROSS_BOARD_CORNER_CUT, PW = CROSS_BOARD_CORRIDOR_WIDTH;
      for (let r = 0; r < boardRows; r++) {
        for (let c = 0; c < boardCols; c++) {
          const inTopBlock = r < CS, inBottomBlock = r >= boardRows - CS;
          const inLeftBlock = c < CS, inRightBlock = c >= boardCols - CS;
          if (!((inTopBlock || inBottomBlock) && (inLeftBlock || inRightBlock))) continue; // not in any corner block
          const nearVerticalEdge = inTopBlock ? r < PW : (boardRows - 1 - r) < PW;
          const nearHorizontalEdge = inLeftBlock ? c < PW : (boardCols - 1 - c) < PW;
          // Anything in a corner block that ISN'T within PW of an outer edge
          // is the inner chunk of that corner — cratered. The PW-wide rim
          // stays open, forming the pass-through corridor.
          if (!nearVerticalEdge && !nearHorizontalEdge) {
            state.board[r][c].hazard = 'crater';
          }
        }
      }
    }

    // Carve the Hourglass board's tapered sides the same way — every row
    // outside its centered open window (see hourglassOpenWidthForRow) is
    // cratered, so the board reads as two rooms funneling into one waist.
    if (state.specialBoardType === 'hourglass') {
      for (let r = 0; r < boardRows; r++) {
        const width = hourglassOpenWidthForRow(r);
        const startCol = Math.floor((boardCols - width) / 2);
        const endCol = startCol + width - 1;
        for (let c = 0; c < boardCols; c++) {
          if (c < startCol || c > endCol) {
            state.board[r][c].hazard = 'crater';
          }
        }
      }
    }

    // Carve the Diamond board the same way — any cell whose Manhattan
    // distance from dead center exceeds DIAMOND_RADIUS is cratered, leaving
    // an Aztec-diamond shape: full-width across the middle row/column,
    // tapering to single-square tips at the top, bottom, left, and right.
    if (state.specialBoardType === 'diamond') {
      const center = (boardRows - 1) / 2; // boardRows === boardCols === the scaled diamond size here
      const radius = state.diamondRadius != null ? state.diamondRadius : DIAMOND_RADIUS;
      for (let r = 0; r < boardRows; r++) {
        for (let c = 0; c < boardCols; c++) {
          if (Math.abs(r - center) + Math.abs(c - center) > radius) {
            state.board[r][c].hazard = 'crater';
          }
        }
      }
    }

    // Carve the Swiss Cheese board's scattered craters — unlike Cross/
    // Hourglass/Diamond, this doesn't force a fixed board size; it just
    // scatters craters across whatever boardRows x boardCols the rectangle/
    // square roll above already produced for this pick.
    if (state.specialBoardType === 'swisscheese') {
      const craterSet = generateScatteredHazardLayout(boardRows, boardCols, SWISS_CHEESE_CRATER_RATE);
      craterSet.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        state.board[r][c].hazard = 'crater';
      });
    }

    // Carve the Firestorm board's scattered fire — same algorithm and
    // spacing rules as Swiss Cheese, just tagged 'fire' instead of 'crater'.
    // Fire doesn't block movement the way a crater does — a piece can still
    // slide onto it, and is destroyed doing so, exactly like Wildfire's
    // card-driven fire (see the hazard === 'fire' checks throughout
    // getValidMoves/getEnemyMoves/executeMove) — so this is purely a
    // battlefield-hazard board, not a maze/chokepoint board like Swiss
    // Cheese. Starting pieces still never spawn directly on one (see the
    // shapeCells filter just below), same as craters.
    if (state.specialBoardType === 'firefield') {
      const fireSet = generateScatteredHazardLayout(boardRows, boardCols, FIRE_FIELD_RATE);
      fireSet.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        state.board[r][c].hazard = 'fire';
      });
    }

    // getBoardShape() itself still returns the full rectangle (so the Cross/
    // Hourglass/Diamond/Swiss Cheese/Firestorm boards' hazards render as
    // visible squares, same as a Meteor Strike crater or Wildfire burn,
    // rather than blank gaps) — but any pre-existing hazard (only ever these
    // fixed layouts today) is excluded here so piece-placement pools below
    // never try to spawn a starting piece directly on top of one.
    const shapeCells = getBoardShape().filter(({r, c}) => !state.board[r][c].hazard);
    const shapeSet = new Set(shapeCells.map(({r,c}) => `${r},${c}`));

    // Count available cards — use actual hand or starter cards for level 1
    const cardList = (state.cards && state.cards.length > 0)
      ? state.cards.filter(c => !c.used)
      : STARTER_CARDS.map(id => ({ id }));
    const availCardIds = new Set(cardList.map(c => c.id));
    const freePlacement = state.level >= 40;
    // Level 10+: your starting pieces scatter across the ENTIRE board with
    // no rhyme or reason — not just the back 3 rows, any legal square at
    // all. Takes priority over the back-3-rows freePlacement pool below.
    const fullyRandomPlacement = state.level >= 13;
    // Light ("brown") squares open up gradually instead of flipping on all at
    // once partway through. Levels 1-10 stay pure dark-square checkers; from
    // level 11 on, each light square has a rising CHANCE of being in play —
    // noticeably more by level 30, and essentially the whole board by level
    // 100. This is what carries the difficulty curve, not board size alone.
    const lightSquareRate = state.level <= 10 ? 0 : Math.min(Math.sqrt((state.level - 10) / 90), 1);

    // YOUR pieces — Reinforcements permanently raises this from the base 3,
    // one extra piece per copy picked this run (see state.bonusPieces). A
    // single back row usually doesn't have room for the extra body, so
    // having any bonus pieces spreads placement across the back 3 rows
    // early, same relaxed pool level 40+ already uses for everyone.
    const bonusPieces = state.bonusPieces || 0;
    const minYourPieces = 3 + bonusPieces;
    let yourPool;
    if (fullyRandomPlacement) {
      yourPool = shapeCells.slice();
    } else if (freePlacement || bonusPieces > 0) {
      yourPool = shapeCells.filter(({r}) => r >= boardRows - 3);
    } else {
      yourPool = shapeCells.filter(({r,c}) => r === boardRows - 1 && (r+c)%2 === 1);
      // A single back row only has room for HALF its squares under the
      // alternating-square rule above (the other half are the "wrong" color
      // for a starting piece) — on a narrow board (3-4 wide, rolled at level
      // 20+) that pool can come up short of the 3 guaranteed starting
      // pieces. Fall back to the same relaxed "whole back 3 rows" pool
      // Reinforcements/free-placement levels already use whenever the
      // strict pool can't fill the minimum.
      if (yourPool.length < minYourPieces) {
        yourPool = shapeCells.filter(({r}) => r >= boardRows - 3);
      }
    }
    for (let i = yourPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [yourPool[i], yourPool[j]] = [yourPool[j], yourPool[i]];
    }
    const yourSquares = yourPool.slice(0, 3 + bonusPieces);
    // Veteran stacks — every copy picked this run crowns one more friendly
    // unit at the start of every level. Always the first N pieces placed
    // (capped at however many you actually have), so it's consistent and
    // predictable level to level instead of random.
    const veteranCount = Math.min(state.veteranCount || 0, yourSquares.length);
    yourSquares.forEach(({r,c}, idx) => {
      const startsKing = idx < veteranCount;
      state.board[r][c].piece = { type:'yours', king:startsKing, id:state.pieceIdCounter++, ability:null, wasKing:startsKing, variant: Math.floor(Math.random() * 18) };
    });

    const occupiedByYours = new Set(yourSquares.map(({r,c}) => `${r},${c}`));

    // Enemy placement. Levels 1-10: the whole outer edge ring is off-limits.
    // Players start with zero cards, so these levels have to be solvable with
    // nothing but a basic diagonal jump — and an edge square (row 0, the
    // bottom row, or either side column) is the one place a piece is
    // geometrically IMPOSSIBLE to capture via a diagonal jump, since the
    // landing square (or the attacking square) would fall off the board.
    // From level 11 on, the gloves come off completely — corners, the back
    // row, every edge is fair game with no cap and no regard for what cards
    // you're holding. You're meant to fail sometimes past this point; that's
    // what teaches you which cards you'll actually need going into the next run.
    const newPlayerPhase = state.level <= 12;
    const introEnemyCount = getIntroEnemyCount();
    // New Run Plus only: enemies now advance toward you every turn instead of
    // sitting still, so starting them right next to your pieces gives you no
    // room to breathe. For the first 10 levels, keep them confined to the far
    // side of the board (well away from your row BS-1 starting squares).
    const plusPushback = state.mode === 'plus' && newPlayerPhase && introEnemyCount == null;

    let enemyPool = shapeCells.filter(({r,c}) => {
      if (occupiedByYours.has(`${r},${c}`)) return false;
      // During the twelve-level introduction, enemies remain in their own
      // back three rows. This pool is shuffled below on every setup, so its
      // exact formation changes every level and between new runs.
      if (introEnemyCount != null) {
        return r < Math.min(3, boardRows) && (r + c) % 2 === 1;
      }
      const isEdge = r === 0 || r === boardRows - 1 || c === 0 || c === boardCols - 1;
      if (newPlayerPhase && isEdge) return false;
      if ((r+c) % 2 === 0 && Math.random() >= lightSquareRate) return false;
      return true;
    });

    for (let i = enemyPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [enemyPool[i], enemyPool[j]] = [enemyPool[j], enemyPool[i]];
    }

    // New Run Plus push-back: don't shrink the pool (that broke the level
    // 1-10 enemy-count ramp entirely, since the shrunk pool capped count at
    // 4 no matter what). Instead keep the full pool so count still ramps
    // exactly like New Run, but bias fill order toward the far side of the
    // board (away from the player's starting row) — enemies spread toward
    // the player only as the count grows, instead of ever losing squares.
    //
    // A pure ascending sort by row used to do this, but that's a hard,
    // deterministic ordering — the interior dark-square pool on a level
    // 1-10 board only has a handful of cells per row, so the sort exhausted
    // the exact same nearest-to-far row(s) first on literally every restart,
    // which read as "enemies always start in the same spot." Weighted random
    // sampling (Efraimidis-Spirakis: draw U~Uniform(0,1) per cell, raise it
    // to 1/weight, sort descending) keeps the same soft push toward the far
    // side on average — rows closer to the far side carry more weight, so
    // they're still statistically more likely to fill first — without ever
    // being a fixed order. Verified by simulation: ~85% unique layouts across
    // repeated rolls of the same level, versus effectively 1 layout before.
    if (plusPushback) {
      const rowWeight = (r) => 1 / (1 + r);
      enemyPool = enemyPool
        .map(cell => ({ cell, key: Math.pow(Math.random(), 1 / rowWeight(cell.r)) }))
        .sort((a, b) => b.key - a.key)
        .map(x => x.cell);
    }

    // Aggressive scaling: level 1=50%, level 100=85%. Levels 1-10 get their
    // own steeper ramp (also 50%->85%, but over just 9 steps instead of 99) —
    // the interior dark-square pool on the 6x6 board is small enough (~8
    // squares) that the old slow 1-100 curve rounded down to the same 4
    // enemies for the entire first 10 levels, so early levels never actually
    // got harder, just slower to click through.
    const targetFillBase = state.level <= 10
      ? 0.50 + (state.level - 1) * (0.35 / 9)
      : Math.min(0.50 + (state.level - 1) * 0.004, 0.85);
    // Every 3rd level cleared is a reward screen — give the player a real,
    // noticeable "this just got harder" beat right as they cash that reward
    // in, layered on top of the smooth per-level ramp above rather than
    // replacing it. getRewardMilestoneBump() is shared with
    // mandatoryCaptureChance() below so both step up together.
    const targetFill = Math.min(0.92, targetFillBase + getRewardMilestoneBump());
    const enemyCount = introEnemyCount != null
      ? Math.min(introEnemyCount, enemyPool.length)
      : Math.max(4, Math.min(Math.round(enemyPool.length * targetFill), enemyPool.length));

    // Random does not technically guarantee a different formation. If an
    // introductory level rolled the exact same occupied squares as the last
    // one in its three-level band, swap in one unselected back-row square.
    if (introEnemyCount != null && Array.isArray(state.lastIntroEnemyLayout) &&
        state.lastIntroEnemyLayout.length === enemyCount && enemyPool.length > enemyCount) {
      const previous = new Set(state.lastIntroEnemyLayout);
      const repeatsExactly = enemyPool.slice(0, enemyCount)
        .every(({r, c}) => previous.has(`${r},${c}`));
      if (repeatsExactly) {
        const replacementIndex = enemyPool.findIndex(({r, c}, index) =>
          index >= enemyCount && !previous.has(`${r},${c}`));
        if (replacementIndex >= enemyCount) {
          [enemyPool[enemyCount - 1], enemyPool[replacementIndex]] =
            [enemyPool[replacementIndex], enemyPool[enemyCount - 1]];
        }
      }
    }

    // Enemy pieces starting the level already kinged — this ramps up
    // independently of anything a piece does in-game (the normal
    // reach-the-back-row promotion still applies on top of this). No
    // plateau before it starts: it begins climbing right away, is already
    // putting noticeably more kings on the board by level 40, and reaches
    // every single enemy starting kinged by level 80 and beyond. This is a
    // per-piece coin flip, not tied to row — a freshly-placed enemy can be
    // kinged sitting right on its own back row just as easily as anywhere
    // else on the board.
    const enemyStartKingChance = introEnemyCount != null
      ? 0
      : Math.min(1, Math.max(0, (state.level - 5) / 75));

    let placed = 0;
    const introLayout = [];
    for (let i = 0; i < enemyPool.length && placed < enemyCount; i++) {
      const {r, c} = enemyPool[i];
      if (!state.board[r][c].piece) {
        const startsKing = Math.random() < enemyStartKingChance;
        state.board[r][c].piece = { type:'enemy', king:startsKing, id:state.pieceIdCounter++, ability:null, variant: Math.floor(Math.random() * 18) };
        if (introEnemyCount != null) introLayout.push(`${r},${c}`);
        placed++;
      }
    }
    if (introEnemyCount != null) state.lastIntroEnemyLayout = introLayout;

    // Guarantee each piece has at least one valid first move
    // A valid move requires ACTUAL empty space — not just card existence
    yourSquares.forEach(({r, c}) => {
      let hasMove = false;

      // 1. Standard diagonal — empty square ahead
      for (const dc of [-1, 1]) {
        const nr = r - 1, nc = c + dc;
        if (nr < 0 || nc < 0 || nc >= boardCols) continue;
        if (!state.board[nr][nc].piece) { hasMove = true; break; }
        // Capture: enemy with empty landing
        const lr = nr-1, lc = nc+dc;
        if (lr >= 0 && lc >= 0 && lc < boardCols &&
            state.board[nr][nc].piece?.type === 'enemy' &&
            !state.board[lr][lc].piece) { hasMove = true; break; }
      }

      // 2. Infantry — needs at least one EMPTY square in column (not just enemies)
      if (!hasMove) {
        for (let rr = 0; rr < boardRows; rr++) {
          if (rr !== r && !state.board[rr][c].piece) { hasMove = true; break; }
        }
      }

      // 3. Cavalry — needs at least one EMPTY square in row
      if (!hasMove) {
        for (let cc = 0; cc < boardCols; cc++) {
          if (cc !== c && !state.board[r][cc].piece) { hasMove = true; break; }
        }
      }

      // 4. Cannon always works — fires in place, no empty space needed
      if (!hasMove) {
        for (let rr = 0; rr < boardRows; rr++)
          if (rr !== r && state.board[rr][c].piece?.type === 'enemy') { hasMove = true; break; }
        if (!hasMove) for (let cc = 0; cc < boardCols; cc++)
          if (cc !== c && state.board[r][cc].piece?.type === 'enemy') { hasMove = true; break; }
      }

      if (!hasMove) {
        // Force clear the two forward diagonal squares so piece can always move
        for (const dc of [-1, 1]) {
          const nr = r - 1, nc = c + dc;
          if (nr < 0 || nc < 0 || nc >= boardCols) continue;
          if (state.board[nr][nc].piece?.type === 'enemy') {
            state.board[nr][nc].piece = null;
            placed--;
          }
        }
      }
    });

  state.selected = null;
  state.validMoves = [];
  state.activeCard = null;
  state.activeCardUid = null;
  state.usedCardsThisBattle = [];
  // New Run Plus: every fresh level starts back on the player's turn with
  // nothing marked as having acted yet.
  state.turnPhase = 'player';
  state.plusMovedIds = [];
  state.enemyStuckTurns = 0;
  state.enemyTurnRemainingIds = [];
  state.blackHolePulseResolvedThisEnemyTurn = false;
  state.plusCardsUsed = 0;
  // Move/card budgets are locked in for the whole turn based on your piece
  // count at the moment the turn STARTS — gaining a piece mid-turn (e.g. via
  // Usurp) shouldn't retroactively hand you extra moves/cards to spend that
  // same turn. See updatePlusTurnUI / endPlayerTurn / activateCard.
  state.plusTurnPieceCount = countPieces('yours');
  state.assassinateTargets = []; state.demotionTargets = [];
  state.bearTrapTargets = [];
  state.ambushTargets = [];
  state.heroGambitSacrifices = [];
  state.doubleCardNext = false;
  state.heroGambitBonusCardUid = null;
  state.heroGambitReservedCardUid = null;
  state.madCowTarget = null;
  state.madCowTargetSparesFriendly = false;
  state.shieldedPiece = null;
  // Blood Oath resets each level so the first piece lost this level re-arms it
  state.bloodOathTriggeredThisLevel = false;
  // Scorched Earth must NOT carry into a new level — this used to only
  // clear the ignited-squares list, but never reset the turns-remaining
  // counter itself. A fresh board has no ignited squares to show, but with
  // the counter still >0, the very next move on the new level would start
  // igniting squares all over again as if nothing had happened, making the
  // effect silently outlive the level it was cast in. Both must reset together.
  state.scorchedEarthTurns = 0;
  state.scorchedEarthTargets = [];
  state.scorchedEarthUnitIds = [];
  state.scorchedEarthAllUnits = false;
  state.scorchedEarthSquares = [];
  state.phalanxTurnsLeft = 0;
  state.phalanxRows = 0;
  state.blackHoleActive = false;
  state.blackHoleUsedThisLevel = false;
  state.pendingEpicEffect = null;
  state.pendingRareEffect = null;
  state.noCaptureStreak = 0;
  state.poisonSquares = []; // fresh board each level — stale poison coordinates mean nothing here
  state.secretPassageTunnels = [];
  state.secretPassagePlacements = [];
  state.sanctuaryZones = [];
  state.sanctuaryPreview = null;
  state.portcullisRows = [];
  state.portcullisPreviewRow = null;
  state.headsmansTargets = [];
  state.gallowsTargets = [];
  state.warDrumsTargets = [];
  state.royalStandardBanners = [];
  state.royalStandardPlacementPreview = null;
  // Royal Standard is a passive Bonus card. Only a run that actually acquired
  // it places banners; the developer roster receives it through the same
  // state counter instead of bypassing production ownership rules.
  state.royalStandardPlacementRemaining = (state.royalStandardCount || 0) > 0
    ? (newCardLevel('royal_standard') >= 2 ? 2 : 1) : 0;
  // Pre-seed the no-capture snapshots so the stalemate and Blood Oath
  // detectors work correctly from the very first enemy turn of each level.
  state.noCaptureSnapEnemy = countPieces('enemy');
  state.noCaptureSnapYours = countPieces('yours');
  // Dead Man's Hand draws temporary cards that only last one level — strip
  // them before resetting the rest of the hand for the new level.
  // Dead Man's Hand only replaces the hand for the current level. Restore
  // the permanent run cards it hid, then discard all temporary draws.
  if (Array.isArray(state.deadMansHandDiscardedCards) && state.deadMansHandDiscardedCards.length) {
    const existingUids = new Set(state.cards.map(c => c.uid));
    state.deadMansHandDiscardedCards.forEach(card => {
      if (!existingUids.has(card.uid)) state.cards.push(card);
    });
  }
  state.deadMansHandDiscardedCards = [];
  state.cards = state.cards.filter(c => !c.temporary);
  state.cards = state.cards.map(c => ({...c, used:false}));
  // A new battlefield starts a new resurrection history. Lazarus itself
  // remains in hand across levels until it actually triggers.
  state.lazarusGraveyard = [];
  state.lazarusReviving = false;
  initializeLazarusFriendlySnapshot();
  initializeSandsHistory();
  // Baseline for the piece-count-delta capture tracker in render() — a fresh
  // level starts with zero captures against it, so reset both counts here.
  state.lastEnemyCount = countPieces('enemy');
  state.lastYoursCount = countPieces('yours');
  initializeGloryLevel();

  render();
  setMessage((state.royalStandardPlacementRemaining || 0) > 0
    ? `PLANT ${state.royalStandardPlacementRemaining} ROYAL STANDARD${state.royalStandardPlacementRemaining === 1 ? '' : 'S'} — TAP A SPACE TWICE TO CONFIRM`
    : '');
  try {
    fitBoardToViewport();
  } catch (err) {
    console.error('fitBoardToViewport failed', err);
    showDebugError(`Board-fit error: ${err.message}`);
  }
  // Save immediately after level setup — this captures the card hand and
  // board layout so a force-close right after a level transition doesn't
  // roll back to the previous level's state.
  saveGame();
}

// The CSS width formula (min(96vw, 96vh - 280px)) is a static guess at how much
// vertical room the header/message/cards/buttons take up — it doesn't actually
// know their real rendered height. On some devices that guess is short, so at
// higher levels (bigger boards, same guess) the layout overflows and the Rare
// stack ends up pushed out of view. This measures the ACTUAL space everything
// else takes and sizes the board to whatever's truly left, every time the level
// (and therefore the board size) changes, and on resize/orientation change.
function fitBoardToViewport() {
  const appEl = document.querySelector('.app');
  const boardWrap = document.querySelector('.board-wrap');
  if (!appEl || !boardWrap) return;

  // Reset any previous explicit sizing so we measure everyone's natural height.
  boardWrap.style.width = '';
  boardWrap.style.height = '';

  const appStyle = getComputedStyle(appEl);

  // A phone held in LANDSCAPE has almost no spare vertical space once the
  // header/status bar/cards/buttons are all stacked above and below the
  // board (portrait's layout) — that's what made wide rectangular boards
  // (level 20+, few rows/many columns) render with tiny, hard-to-tap cells
  // even though the phone actually has plenty of width to spare. The CSS
  // media query switches .app to a two-column grid in that case (board gets
  // its own tall column instead of sharing the short one with everything
  // else) — this branch measures THAT layout instead of the stacked one.
  const isLandscapePhone = window.matchMedia('(orientation: landscape) and (max-height: 550px)').matches;

  let availableW, availableH;
  if (isLandscapePhone) {
    const sidebarEl = document.querySelector('.status-bar') || document.querySelector('header');
    const sidebarWidth = sidebarEl ? sidebarEl.getBoundingClientRect().width : window.innerWidth * 0.28;
    const colGap = parseFloat(appStyle.columnGap || appStyle.gap) || 0;
    const hPadding = (parseFloat(appStyle.paddingLeft) || 0) + (parseFloat(appStyle.paddingRight) || 0);
    const vPadding = (parseFloat(appStyle.paddingTop) || 0) + (parseFloat(appStyle.paddingBottom) || 0);
    availableW = window.innerWidth - sidebarWidth - colGap - hPadding - 8;
    availableH = window.innerHeight - vPadding - 8;
  } else {
    const siblings = Array.from(appEl.children).filter(el => el !== boardWrap);
    const usedHeight = siblings.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
    const gap = parseFloat(appStyle.rowGap || appStyle.gap) || 0;
    const vPadding = (parseFloat(appStyle.paddingTop) || 0) + (parseFloat(appStyle.paddingBottom) || 0);
    availableH = window.innerHeight - usedHeight - gap * appEl.children.length - vPadding - 8;
    availableW = window.innerWidth * 0.96;
  }

  // Cells must stay square even when the board itself isn't (level 20+ can
  // roll a wide or tall rectangle) — so the fit is driven by whichever axis
  // is more constrained: compute the largest per-cell size that keeps BOTH
  // width (cols * cell) and height (rows * cell) inside the available box,
  // then derive width/height from that shared cell size and the board's
  // actual row/col counts (falls back to a plain square if rows/cols aren't
  // available yet, e.g. before the first setupLevel() call).
  const rows = (typeof getBoardRows === 'function' && state && state.board && state.board.length) ? getBoardRows() : 1;
  const cols = (typeof getBoardCols === 'function' && state && state.board && state.board.length) ? getBoardCols() : 1;

  // .board-wrap has a fixed 14px padding on every side (see its CSS — fixed
  // px specifically so it doesn't distort on a non-square board). That
  // padding eats into the wrap's own box (box-sizing: border-box), so the
  // actual playable grid area is smaller than the wrap's outer box by
  // FRAME_PADDING*2 on each axis. Size the CELLS to the space left over
  // after that padding, then add the padding back on to get the wrap's
  // outer (border-box) width/height — that keeps the checkered grid itself
  // exactly cell*cols by cell*rows, with perfectly square cells, no matter
  // how the board's row/col counts roll.
  const BOARD_PADDING = 2;
  const CELL_GAP = 2;
  const horizontalChrome = BOARD_PADDING * 2 + CELL_GAP * Math.max(0, cols - 1);
  const verticalChrome = BOARD_PADDING * 2 + CELL_GAP * Math.max(0, rows - 1);

  const maxCellFromW = (availableW - horizontalChrome) / cols;
  const maxCellFromH = (availableH - verticalChrome) / rows;
  // The flat 520px sanity cap (originally sized for a portrait square board)
  // is exactly what would undo the landscape fix above — it would still
  // shrink a wide board's cells down to fit a "520px-long-side" box even
  // though the phone now has a whole tall column of real screen to give it.
  // Only apply that cap outside landscape-phone mode.
  const maxCellFromCap = isLandscapePhone
    ? Infinity
    : Math.min(
        (520 - horizontalChrome) / cols,
        (520 - verticalChrome) / rows
      );
  const cell = Math.max(160 / Math.max(rows, cols), Math.min(maxCellFromW, maxCellFromH, maxCellFromCap));

  const width = cell * cols + horizontalChrome;
  const height = cell * rows + verticalChrome;

  boardWrap.style.width = width + 'px';
  boardWrap.style.height = height + 'px';
}

window.addEventListener('resize', fitBoardToViewport);
window.addEventListener('orientationchange', fitBoardToViewport);

// ── WINNABILITY ALGORITHM ──
// For every enemy, check if it can actually be captured — not just reached
function isBoardWinnable() {
  const bs = getBoardSize();
  const anySquareMode = state.level >= 20;

  const cardCounts = {};
  (state.cards && state.cards.length > 0
    ? state.cards.filter(c => !c.used)
    : STARTER_CARDS.map(id => ({id}))
  ).forEach(c => { cardCounts[c.id] = (cardCounts[c.id] || 0) + 1; });

  const hasInfantry = (cardCounts['vertical_jump'] || 0) > 0;
  const hasCavalry = (cardCounts['horizontal_jump'] || 0) > 0;
  // Chariot Charge covers everything Infantry Charge does (same-column
  // vertical clear) plus more — safe to treat as equivalent here.
  const hasChariot = (cardCounts['chariot_charge'] || 0) > 0;
  const hasCannon = (cardCounts['t_strike'] || 0) > 0;
  const cannonRange = getTStrikeRange(state.mode);
  const hasCrossStrike = (cardCounts['cross_strike'] || 0) > 0;
  const hasAssassinate = (cardCounts['assassinate'] || 0) > 0;
  let assassinatesLeft = cardCounts['assassinate'] || 0;
  let usurpsLeft = cardCounts['usurp'] || 0;
  let phantomsLeft = cardCounts['teleport'] || 0;

  // Collect pieces and enemies
  const pieces = [];
  const enemies = [];
  for (let r = 0; r < bs; r++) {
    for (let c = 0; c < bs; c++) {
      const p = state.board[r][c].piece;
      if (p?.type === 'yours') pieces.push({r, c});
      if (p?.type === 'enemy') enemies.push({r, c});
    }
  }

  // Check 1: at least one piece has a valid first move
  let hasFirstMove = false;
  for (const {r, c} of pieces) {
    if (hasFirstMove) break;
    // Standard diagonal
    for (const dc of [-1, 1]) {
      const nr = r-1, nc = c+dc;
      if (nr < 0 || nc < 0 || nc >= bs) continue;
      const t = state.board[nr][nc].piece;
      if (!t) { hasFirstMove = true; break; }
      if (t.type === 'enemy') {
        const lr=nr-1, lc=nc+dc;
        if (lr>=0 && lc>=0 && lc<bs && !state.board[lr][lc].piece) { hasFirstMove=true; break; }
      }
    }
    // Infantry (or Chariot, which covers at least as much) — any empty square in column
    if (!hasFirstMove && (hasInfantry || hasChariot)) {
      for (let rr=0; rr<bs; rr++) {
        if (rr!==r && !state.board[rr][c].piece) { hasFirstMove=true; break; }
      }
    }
    // Cavalry — any empty square in row
    if (!hasFirstMove && hasCavalry) {
      for (let cc=0; cc<bs; cc++) {
        if (cc!==c && !state.board[r][cc].piece) { hasFirstMove=true; break; }
      }
    }
    // Cannon — fires from current position
    if (!hasFirstMove && hasCannon) {
      for (let rr=0; rr<bs; rr++) if(rr!==r && Math.abs(rr-r)<=cannonRange && state.board[rr][c].piece?.type==='enemy') { hasFirstMove=true; break; }
      if (!hasFirstMove) for (let cc=0; cc<bs; cc++) if(cc!==c && Math.abs(cc-c)<=cannonRange && state.board[r][cc].piece?.type==='enemy') { hasFirstMove=true; break; }
    }
    if (!hasFirstMove && usurpsLeft > 0) hasFirstMove = true;
    if (!hasFirstMove && phantomsLeft > 0) hasFirstMove = true;
  }
  if (!hasFirstMove) return false;

  // Check 2: every enemy must be reachable
  // Key insight: Cannon wipes entire row+col from any piece position — no movement, no landing
  // So any enemy sharing a row OR column with ANY piece is always clearable by Cannon
  const pieceRows = new Set(pieces.map(p => p.r));
  const pieceCols = new Set(pieces.map(p => p.c));

  for (const {r: er, c: ec} of enemies) {
    const angles = countCaptureAngles(er, ec, bs);
    const isLight = (er+ec)%2===0;

    // Standard diagonal capture possible
    if (angles > 0 && !isLight) continue;

    // Cannon only covers enemies within its current mastery-scaled range.
    if (hasCannon && pieces.some(({ r: pr, c: pc }) =>
      (pr === er && Math.abs(pc - ec) <= cannonRange) ||
      (pc === ec && Math.abs(pr - er) <= cannonRange))) continue;
    // Cross Strike covers diagonals from piece positions
    if (hasCrossStrike) {
      let onDiagonal = false;
      for (const {r: pr, c: pc} of pieces) {
        if (Math.abs(pr - er) === Math.abs(pc - ec)) { onDiagonal = true; break; }
      }
      if (onDiagonal) continue;
    }

    // Infantry (or Chariot) covers same column
    if ((hasInfantry || hasChariot) && pieceCols.has(ec)) continue;

    // Cavalry covers same row
    if (hasCavalry && pieceRows.has(er)) continue;

    // Phantom March can reach any square
    if (phantomsLeft > 0) { phantomsLeft--; continue; }

    // Usurp can replace any enemy
    if (usurpsLeft > 0) { usurpsLeft--; continue; }

    return false;
  }

  return true;
}

function countCaptureAngles(r, c, bs) {
  let angles = 0;
  for (const dr of [-1,1]) for (const dc of [-1,1]) {
    const lr = r+dr, lc = c+dc, ar = r-dr, ac = c-dc;
    if (lr>=0&&lr<bs&&lc>=0&&lc<bs&&ar>=0&&ar<bs&&ac>=0&&ac<bs) angles++;
  }
  return angles;
}

function canCaptureEnemy(er, ec, yourPieces, availableCards, bs) {
  for (const {r, c, piece} of yourPieces) {

    // 1. USURP — replace any enemy, no movement needed
    if (availableCards.has('usurp')) return true;

    // 2. TELEPORT — move to any square, then capture diagonally next move
    //    Only valid if there's a diagonal attack square adjacent to the enemy
    if (availableCards.has('teleport')) {
      for (const dr of [-1, 1]) {
        for (const dc of [-1, 1]) {
          const ar = er - dr; // attack from this square
          const ac = ec - dc;
          if (ar < 0 || ar >= bs || ac < 0 || ac >= bs) continue;
          if (state.board[ar][ac].piece) continue; // must be empty to land on
          const lr = er + dr; // landing after capture
          const lc = ec + dc;
          if (lr >= 0 && lr < bs && lc >= 0 && lc < bs && !state.board[lr][lc].piece) {
            return true;
          }
        }
      }
    }

    // 3. VERTICAL JUMP (card or ability) — same column, need empty landing square beyond
    if (piece.ability === 'vertical_jump' || availableCards.has('vertical_jump')) {
      if (c === ec) {
        // Can slide into same column and capture — need landing square above or below enemy
        for (const dr of [-1, 1]) {
          const lr = er + dr;
          if (lr >= 0 && lr < bs && !state.board[lr][ec].piece) {
            return true;
          }
        }
      }
    }

    // 4. HORIZONTAL JUMP (card or ability) — same row, need empty landing square beyond
    if (piece.ability === 'horizontal_jump' || availableCards.has('horizontal_jump')) {
      if (r === er) {
        for (const dc of [-1, 1]) {
          const lc = ec + dc;
          if (lc >= 0 && lc < bs && !state.board[er][lc].piece) {
            return true;
          }
        }
      }
    }

    // 5. KING ME — crowns piece, then it can reach enemy diagonally from any angle
    //    BUT king still needs a landing square beyond the enemy to capture
    if (availableCards.has('king_me') || piece.king) {
      // Check all 4 diagonal approaches to this enemy
      for (const dr of [-1, 1]) {
        for (const dc of [-1, 1]) {
          const lr = er + dr;
          const lc = ec + dc;
          if (lr >= 0 && lr < bs && lc >= 0 && lc < bs && !state.board[lr][lc].piece) {
            // There's a valid landing square — king can reach enemy from opposite side
            return true;
          }
        }
      }
    }

    // 6. DOUBLE JUMP — 2 side-by-side enemies, not useful for isolated corner enemy
    //    Skip — handled by standard diagonal check

    // 7. T-STRIKE — same row or column, wipes all enemies in line
    if (availableCards.has('t_strike')) {
      const range = getTStrikeRange(state.mode);
      if ((c === ec && Math.abs(r - er) <= range) ||
          (r === er && Math.abs(c - ec) <= range)) return true;
    }

    // 8. STANDARD DIAGONAL — BFS capture check
    if (canCaptureViaDiagonal(r, c, er, ec, bs)) return true;
  }
  return false;
}

// BFS: can piece at (fromR, fromC) reach and CAPTURE enemy at (toR, toC)?
// Capture requires: land adjacent, enemy there, empty square beyond
function canCaptureViaDiagonal(fromR, fromC, toR, toC, bs) {
  // First check: can the enemy even be captured at all?
  // Need at least one diagonal approach: attack square on one side, landing on the other
  let hasLanding = false;
  for (const dr of [-1, 1]) {
    for (const dc of [-1, 1]) {
      // Attack from (toR-dr, toC-dc), land at (toR+dr, toC+dc)
      const ar = toR - dr;
      const ac = toC - dc;
      const lr = toR + dr;
      const lc = toC + dc;
      const attackValid = ar >= 0 && ar < bs && ac >= 0 && ac < bs;
      const landValid = lr >= 0 && lr < bs && lc >= 0 && lc < bs && !state.board[lr][lc].piece;
      if (attackValid && landValid) {
        hasLanding = true;
        break;
      }
    }
    if (hasLanding) break;
  }
  if (!hasLanding) return false;

  // BFS from piece position to any attack square adjacent to enemy
  const visited = new Set();
  const queue = [{r: fromR, c: fromC, depth: 0}];
  visited.add(`${fromR},${fromC}`);

  while (queue.length > 0) {
    const {r, c, depth} = queue.shift();
    if (depth > bs * 2) continue;

    // Check if current position can attack the enemy
    for (const dr of [-1, 1]) {
      for (const dc of [-1, 1]) {
        if (r + dr === toR && c + dc === toC) {
          // We are adjacent to the enemy — can we capture?
          const lr = toR + dr;
          const lc = toC + dc;
          if (lr >= 0 && lr < bs && lc >= 0 && lc < bs && !state.board[lr][lc].piece) {
            return true;
          }
        }
      }
    }

    // Move to adjacent empty squares
    for (const dr of [-1, 1]) {
      for (const dc of [-1, 1]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= bs || nc < 0 || nc >= bs) continue;
        const cell = state.board[nr][nc].piece;
        if (!cell && !visited.has(`${nr},${nc}`)) {
          visited.add(`${nr},${nc}`);
          queue.push({r: nr, c: nc, depth: depth + 1});
        }
      }
    }
  }
  return false;
}


// ── MOVEMENT RULES ──
function getVerticalMoves(row, col) {
  const bs = getBoardRows(); // scans up/down within one column — row bound only
  const moves = [];
  // Infantry Charge's leap distance is now mastery-gated (see
  // getVerticalJumpRange/CARD_MASTERY_TIERS): a fresh, unupgraded copy
  // only reaches 3 squares; each mastery level pushes that out further,
  // capping at Infinity (the entire row, its original behavior) once
  // fully mastered.
  const range = getVerticalJumpRange(state.mode);

  // UP — destroy all enemies above, land at furthest empty square not
  // occupied by own piece (or at the edge of its mastery range, whichever
  // comes first). A crater stops the charge exactly like a friendly piece
  // would — it's solid rubble, not something to slide through — so the
  // charge lands just short of it instead of past it.
  if (row > 0) {
    const capturedUp = [];
    const minRow = Number.isFinite(range) ? Math.max(0, row - range) : 0;
    let landRow = minRow;
    for (let r = row - 1; r >= minRow; r--) {
      const cell = state.board[r][col];
      if (cell.hazard === 'crater') { landRow = r + 1; break; }
      const p = cell.piece;
      if (p && p.type === 'enemy') capturedUp.push({ row: r, col });
      else if (p && p.type === 'yours') { landRow = r + 1; break; }
    }
    if (landRow !== row) {
      // Every square the charge actually passes through, not just where it
      // lands — this is what lets the board preview the whole lane before
      // you commit, instead of only showing the landing square.
      const affected = [];
      for (let r = row - 1; r >= landRow; r--) affected.push({ row: r, col });
      moves.push({ row: landRow, col, type: 'infantry_charge', captured: capturedUp, affected, direction: 'up' });
    }
  }

  // DOWN — destroy all enemies below, land at furthest empty square (or
  // the edge of its mastery range). Same crater-stops-the-charge rule as
  // UP.
  if (row < bs - 1) {
    const capturedDown = [];
    const maxRow = Number.isFinite(range) ? Math.min(bs - 1, row + range) : bs - 1;
    let landRow = maxRow;
    for (let r = row + 1; r <= maxRow; r++) {
      const cell = state.board[r][col];
      if (cell.hazard === 'crater') { landRow = r - 1; break; }
      const p = cell.piece;
      if (p && p.type === 'enemy') capturedDown.push({ row: r, col });
      else if (p && p.type === 'yours') { landRow = r - 1; break; }
    }
    if (landRow !== row) {
      const affected = [];
      for (let r = row + 1; r <= landRow; r++) affected.push({ row: r, col });
      moves.push({ row: landRow, col, type: 'infantry_charge', captured: capturedDown, affected, direction: 'down' });
    }
  }

  return moves;
}

function getHorizontalMoves(row, col) {
  const bs = getBoardCols(); // scans left/right within one row — column bound only
  const moves = [];
  // Cavalry Charge's leap distance is mastery-gated exactly like Infantry
  // Charge (see getHorizontalJumpRange/CARD_MASTERY_TIERS): a fresh,
  // unupgraded copy only reaches 3 squares; each mastery level pushes that
  // out further, capping at Infinity (the entire row, its original
  // behavior) once fully mastered.
  const range = getHorizontalJumpRange(state.mode);

  // LEFT — a crater stops the charge exactly like a friendly piece would
  // (or the edge of its mastery range, whichever comes first).
  if (col > 0) {
    const capturedLeft = [];
    const minCol = Number.isFinite(range) ? Math.max(0, col - range) : 0;
    let landCol = minCol;
    for (let c = col - 1; c >= minCol; c--) {
      const cell = state.board[row][c];
      if (cell.hazard === 'crater') { landCol = c + 1; break; }
      const p = cell.piece;
      if (p && p.type === 'enemy') capturedLeft.push({ row, col: c });
      else if (p && p.type === 'yours') { landCol = c + 1; break; }
    }
    if (landCol !== col) {
      const affected = [];
      for (let c = col - 1; c >= landCol; c--) affected.push({ row, col: c });
      moves.push({ row, col: landCol, type: 'cavalry_charge', captured: capturedLeft, affected, direction: 'left' });
    }
  }

  // RIGHT — same crater-stops-the-charge rule as LEFT (and the same
  // mastery-range cap).
  if (col < bs - 1) {
    const capturedRight = [];
    const maxCol = Number.isFinite(range) ? Math.min(bs - 1, col + range) : bs - 1;
    let landCol = maxCol;
    for (let c = col + 1; c <= maxCol; c++) {
      const cell = state.board[row][c];
      if (cell.hazard === 'crater') { landCol = c - 1; break; }
      const p = cell.piece;
      if (p && p.type === 'enemy') capturedRight.push({ row, col: c });
      else if (p && p.type === 'yours') { landCol = c - 1; break; }
    }
    if (landCol !== col) {
      const affected = [];
      for (let c = col + 1; c <= landCol; c++) affected.push({ row, col: c });
      moves.push({ row, col: landCol, type: 'cavalry_charge', captured: capturedRight, affected, direction: 'right' });
    }
  }

  return moves;
}

// CHARIOT CHARGE — same as Infantry Charge (vertical, destroys everything in
// the piece's own column, lands at the furthest empty square before hitting
// a piece of yours or the board edge), except a second column is swept for
// enemies over that exact same traveled distance: the column to the right
// of the piece, UNLESS the piece is already in the rightmost column, in
// which case it's the column to the left instead. The piece itself always
// only ever travels within its own column — the second column never
// affects landing distance, it just also gets cleared of enemies alongside.
function getChariotMoves(row, col) {
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const moves = [];
  const col2 = col === bsC - 1 ? col - 1 : col + 1;
  // Chariot Charge's leap distance is mastery-gated exactly like Infantry
  // Charge/Cavalry Charge (see getChariotChargeRange/CARD_MASTERY_TIERS): a
  // fresh, unupgraded copy only reaches 3 squares; each mastery level
  // pushes that out further, capping at Infinity (the entire row, its
  // original "2x2 across the battlefield" behavior) once fully mastered.
  const range = getChariotChargeRange(state.mode);

  // A crater in the second lane blocks that lane the same way it blocks the
  // main one — stop sweeping (and capturing) past it, same as running into
  // a piece.
  function sweepSecondCol(fromR, toR, dir) {
    const caps = [];
    if (dir < 0) {
      for (let r = fromR; r >= toR; r--) {
        const cell = state.board[r][col2];
        if (!cell) continue;
        if (cell.hazard === 'crater') break;
        if (cell.piece && cell.piece.type === 'enemy') caps.push({ row: r, col: col2 });
      }
    } else {
      for (let r = fromR; r <= toR; r++) {
        const cell = state.board[r][col2];
        if (!cell) continue;
        if (cell.hazard === 'crater') break;
        if (cell.piece && cell.piece.type === 'enemy') caps.push({ row: r, col: col2 });
      }
    }
    return caps;
  }

  // Every square in BOTH lanes the charge passes through, not just the
  // landing square — this is what lets the board preview the full 2-wide
  // corridor before you commit.
  function laneRange(fromR, toR, dir) {
    const cells = [];
    if (dir < 0) {
      for (let r = fromR; r >= toR; r--) { cells.push({ row: r, col }); cells.push({ row: r, col: col2 }); }
    } else {
      for (let r = fromR; r <= toR; r++) { cells.push({ row: r, col }); cells.push({ row: r, col: col2 }); }
    }
    return cells;
  }

  // UP — a crater in the main lane stops the charge exactly like a friendly
  // piece would.
  if (row > 0) {
    const capturedUp = [];
    const minRow = Number.isFinite(range) ? Math.max(0, row - range) : 0;
    let landRow = minRow;
    for (let r = row - 1; r >= minRow; r--) {
      const cell = state.board[r][col];
      if (cell.hazard === 'crater') { landRow = r + 1; break; }
      const p = cell.piece;
      if (p && p.type === 'enemy') capturedUp.push({ row: r, col });
      else if (p && p.type === 'yours') { landRow = r + 1; break; }
    }
    if (landRow !== row) {
      // Start sweep from row (not row-1) so an enemy sitting in col2 at the
      // same row as the chariot is also caught in the charge.
      const captured = [...capturedUp, ...sweepSecondCol(row, landRow, -1)];
      const affected = laneRange(row - 1, landRow, -1);
      moves.push({ row: landRow, col, type: 'chariot_charge', captured, affected, direction: 'up' });
    }
  }

  // DOWN — same crater-stops-the-charge rule as UP.
  if (row < bsR - 1) {
    const capturedDown = [];
    const maxRow = Number.isFinite(range) ? Math.min(bsR - 1, row + range) : bsR - 1;
    let landRow = maxRow;
    for (let r = row + 1; r <= maxRow; r++) {
      const cell = state.board[r][col];
      if (cell.hazard === 'crater') { landRow = r - 1; break; }
      const p = cell.piece;
      if (p && p.type === 'enemy') capturedDown.push({ row: r, col });
      else if (p && p.type === 'yours') { landRow = r - 1; break; }
    }
    if (landRow !== row) {
      // Same fix for DOWN — start from row so the adjacent-column same-row
      // enemy is included.
      const captured = [...capturedDown, ...sweepSecondCol(row, landRow, 1)];
      const affected = laneRange(row + 1, landRow, 1);
      moves.push({ row: landRow, col, type: 'chariot_charge', captured, affected, direction: 'down' });
    }
  }

  return moves;
}

const SECRET_PASSAGE_COLORS = Object.freeze([
  { key: 'gray',  label: 'GRAY',  color: '#343a40' },
  { key: 'green', label: 'GREEN', color: '#174d35' },
  { key: 'blue',  label: 'BLUE',  color: '#173f68' },
]);

function getSecretPassageTunnelCount(mode = state?.mode) {
  return Math.min(2, 1 + getCardMasteryLevel('secret_passage', mode));
}

function getSecretPassageEndpoint(row, col) {
  const tunnels = Array.isArray(state?.secretPassageTunnels) ? state.secretPassageTunnels : [];
  for (const tunnel of tunnels) {
    if (tunnel.a?.row === row && tunnel.a?.col === col) return { tunnel, side: 'a' };
    if (tunnel.b?.row === row && tunnel.b?.col === col) return { tunnel, side: 'b' };
  }
  return null;
}

function getSecretPassageExit(row, col) {
  const endpoint = getSecretPassageEndpoint(row, col);
  if (!endpoint) return null;
  return endpoint.side === 'a' ? endpoint.tunnel.b : endpoint.tunnel.a;
}

function canLandOnSecretPassage(row, col) {
  const exit = getSecretPassageExit(row, col);
  if (!exit) return true;
  const exitCell = state.board?.[exit.row]?.[exit.col];
  return !!exitCell && !exitCell.piece && exitCell.hazard !== 'crater';
}

function filterSecretPassageMoves(moves) {
  return (moves || []).filter(move => move.stayInPlace || canLandOnSecretPassage(move.row, move.col));
}
function crossesPortcullis(fromRow,toRow) {
  return (state.portcullisRows||[]).some(g => g.turns>0 && fromRow!==g.row &&
    ((fromRow<g.row&&toRow>=g.row)||(fromRow>g.row&&toRow<=g.row)));
}

// Called only after a legal move has placed a piece on a tunnel endpoint.
// The paired endpoint is guaranteed open by filterSecretPassageMoves. The
// piece emerges on the matching color and may not continue a jump chain.
function transportThroughSecretPassage(row, col, piece) {
  const endpoint = getSecretPassageEndpoint(row, col);
  if (!endpoint || !piece) return { row, col, usedTunnel: false };
  const exit = endpoint.side === 'a' ? endpoint.tunnel.b : endpoint.tunnel.a;
  const exitCell = state.board?.[exit.row]?.[exit.col];
  if (!exitCell || exitCell.piece || exitCell.hazard === 'crater') {
    return { row, col, usedTunnel: false, blocked: true };
  }
  state.board[row][col].piece = null;
  exitCell.piece = piece;
  return { row: exit.row, col: exit.col, usedTunnel: true, colorKey: endpoint.tunnel.colorKey };
}

function newCardLevel(id) { return getCardMasteryLevel(id, state?.mode); }
function newCardTargetCount(id, base) { return base + newCardLevel(id); }
function getSquareArea(anchorRow, anchorCol, size) {
  const rows = getBoardRows(), cols = getBoardCols();
  const startRow = Math.max(0, Math.min(rows - size, anchorRow - Math.floor((size - 1) / 2)));
  const startCol = Math.max(0, Math.min(cols - size, anchorCol - Math.floor((size - 1) / 2)));
  const cells = [];
  for (let r = startRow; r < startRow + size; r++) for (let c = startCol; c < startCol + size; c++) cells.push({row:r,col:c});
  return cells;
}
function sanctuaryCells() { return (state.sanctuaryZones || []).flatMap(z => z.cells || []); }
function isSanctuaryCell(row,col) { return sanctuaryCells().some(p => p.row===row && p.col===col); }
function royalStandardCells() { return (state.royalStandardBanners || []).flatMap(z => z.cells || []); }
function isRoyalStandardCell(row,col) { return royalStandardCells().some(p => p.row===row && p.col===col); }
function royalStandardPreviewCells() { return state.royalStandardPlacementPreview?.cells || []; }
function isRoyalStandardPreviewCell(row,col) { return royalStandardPreviewCells().some(p => p.row===row && p.col===col); }
function getAreaEdgeClasses(cells,row,col,prefix='royal-standard') {
  const has=(r,c)=>cells.some(p=>p.row===r&&p.col===c);
  const classes=[];
  if(!has(row-1,col)) classes.push(`${prefix}-top`);
  if(!has(row,col+1)) classes.push(`${prefix}-right`);
  if(!has(row+1,col)) classes.push(`${prefix}-bottom`);
  if(!has(row,col-1)) classes.push(`${prefix}-left`);
  return classes;
}
function getRoyalStandardEdgeClasses(row,col) { return getAreaEdgeClasses(royalStandardCells(),row,col); }
function getRoyalStandardPreviewEdgeClasses(row,col) { return getAreaEdgeClasses(royalStandardPreviewCells(),row,col); }
function getRepairableCells() {
  const out=[];
  for(let r=0;r<getBoardRows();r++) for(let c=0;c<getBoardCols();c++) {
    const cell=state.board[r][c];
    if(cell.hazard || cell.trap || cell.trapSnapping) out.push({row:r,col:c});
  }
  return out;
}
function repairBoardCell(row,col) {
  const cell=state.board[row][col];
  cell.hazard=null; cell.trap=false; cell.trapSnapping=false;
  delete cell.fireSource; delete cell.fireSparesFriendly; delete cell.poisonSparesFriendly;
  state.poisonSquares=(state.poisonSquares||[]).filter(p=>p.row!==row||p.col!==col);
  state.scorchedEarthSquares=(state.scorchedEarthSquares||[]).filter(p=>p.row!==row||p.col!==col);
}
function deployFalseKings(count) {
  const open=[];
  for(let r=0;r<getBoardRows();r++) for(let c=0;c<getBoardCols();c++) {
    const cell=state.board[r][c]; if(!cell.piece && !cell.hazard && !cell.trap && !isBlackHoleCell(r,c)) open.push({row:r,col:c});
  }
  for(let i=0;i<count && open.length;i++) {
    const pick=open.splice(Math.floor(Math.random()*open.length),1)[0];
    state.board[pick.row][pick.col].piece={id:`false-${Date.now()}-${i}`,type:'yours',king:true,falseKing:true,moved:false};
  }
}
function executeBatteringRam(row,col) {
  const piece=state.board[row][col].piece; if(!piece||piece.type!=='yours') return false;
  const fromRow=row;
  const impactRows=[];
  const impactedEnemies=new Set();
  const level=newCardLevel('battering_ram');
  const range=level>=3?getBoardRows():[3,5,7][level];
  let cur=row;
  for(let step=0;step<range && cur>0;step++) {
    const next=cur-1, target=state.board[next][col];
    if(target.hazard==='crater'||target.trap||isSanctuaryCell(next,col)) break;
    if(target.piece?.type==='yours') break;
    if(target.piece?.type==='enemy') {
      let end=next; while(end>0 && state.board[end-1][col].piece?.type==='enemy') end--;
      if(end>0 && state.board[end-1][col].piece) break;
      // A pushed enemy can remain immediately ahead of the ram for several
      // squares. Record each actual enemy once at its first contact position,
      // instead of replaying an impact on every square it is shoved through.
      for(let r=end;r<=next;r++) {
        const struck=state.board[r][col].piece;
        if(!struck||struck.type!=='enemy') continue;
        const impactKey=struck.id!=null?`id:${struck.id}`:struck;
        if(!impactedEnemies.has(impactKey)) {
          impactedEnemies.add(impactKey);
          impactRows.push(r);
        }
      }
      for(let r=end;r<=next;r++) {
        const pushed=state.board[r][col].piece; if(!pushed) continue;
        state.board[r][col].piece=null;
        if(r>0) state.board[r-1][col].piece=pushed;
      }
    }
    state.board[cur][col].piece=null; state.board[next][col].piece=piece; cur=next;
  }
  if(cur===0 && !piece.king) crownFriendlyPiece(piece,true);
  return cur!==row ? {pieceId:piece.id,fromRow,toRow:cur,col,impactRows} : false;
}
function advanceWarDrumPiece(row,col) {
  const piece=state.board[row][col].piece; if(!piece) return false;
  const choices=[-1,1].map(dc=>({row:row-1,col:col+dc})).filter(p=>p.row>=0&&p.col>=0&&p.col<getBoardCols()&&!state.board[p.row][p.col].piece&&state.board[p.row][p.col].hazard!=='crater');
  if(!choices.length) return false; const to=choices[Math.floor(Math.random()*choices.length)];
  state.board[row][col].piece=null; state.board[to.row][to.col].piece=piece; if(to.row===0&&!piece.king)crownFriendlyPiece(piece,true); plusMarkPieceMoved(piece.id); return true;
}

function getValidMoves(row, col) {
  const piece = state.board[row][col].piece;
  if (!piece || piece.type !== 'yours') return [];
  const ability = state.activeCard || piece.ability;
  // New Run Plus: a piece that already acted this turn is done until the next
  // player turn — EXCEPT a card mastered up to its listed bypass level (e.g.
  // Phantom March / Bodyguard / Retreat at level 1, Catapult at its final
  // level 3), whose upgrade is bypassing this exact restriction ("Move/Launch
  // anywhere, even after taking a turn"). See MOVE_LOCK_BYPASS_CARDS.
  const bypassLevel = MOVE_LOCK_BYPASS_CARDS[ability];
  const bypassesMoveLock = bypassLevel != null && getCardMasteryLevel(ability, state.mode) >= bypassLevel;
  if (state.mode === 'plus' && state.turnPhase === 'player' && state.plusMovedIds.includes(piece.id) && !bypassesMoveLock) return [];

  const bsR = getBoardRows();
  const bsC = getBoardCols();

  // False Kings are mobile decoys. They move with the same long diagonal
  // range as a real king, but an occupied square ends the lane and never
  // generates a capture. Card abilities cannot turn a decoy into an attacker.
  if (piece.falseKing) {
    const moves = [];
    const bsMax = Math.max(bsR, bsC);
    [-1, 1].forEach(dr => {
      [-1, 1].forEach(dc => {
        for (let steps = 1; steps < bsMax; steps++) {
          const nr = row + dr * steps, nc = col + dc * steps;
          if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) break;
          const targetCell = state.board[nr][nc];
          if (targetCell.piece || targetCell.hazard === 'crater') break;
          moves.push({ row: nr, col: nc, type: 'move', plainMovement: true });
        }
      });
    });
    return filterSecretPassageMoves(moves);
  }

  // BODYGUARD — swap this piece with any other one of your own pieces
  // anywhere on the board. Every other friendly square is a valid "target"
  // for the swap (handled as a distinct move type since nothing is
  // captured/moved-through — both pieces just trade squares).
  if (ability === 'bodyguard') {
    const moves = [];
    for (let r = 0; r < bsR; r++) {
      for (let c = 0; c < bsC; c++) {
        if (r === row && c === col) continue;
        if (state.board[r][c].piece?.type === 'yours') {
          moves.push({ row: r, col: c, type: 'swap' });
        }
      }
    }
    return moves;
  }

  // RETREAT — one step backward (diagonally, toward your own back row)
  // into an empty square. Only useful for regular pieces since a king can
  // already move any diagonal direction on its own.
  if (ability === 'retreat') {
    const moves = [];
    [-1, 1].forEach(dc => {
      const nr = row + 1, nc = col + dc;
      if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) return;
      if (!state.board[nr][nc].piece && state.board[nr][nc].hazard !== 'crater') moves.push({ row: nr, col: nc, type: 'move' });
    });
    return filterSecretPassageMoves(moves);
  }

  if (ability === 'vertical_jump') return filterSecretPassageMoves(getVerticalMoves(row, col));
  if (ability === 'horizontal_jump') return filterSecretPassageMoves(getHorizontalMoves(row, col));
  if (ability === 'chariot_charge') return filterSecretPassageMoves(getChariotMoves(row, col));

  // SIDE STEP — slide up to N squares in any of the 8 directions, empty
  // squares only. Base is 1 space; mastery extends the slide distance (see
  // getSideStepRange/CARD_MASTERY_TIERS). Sliding through an occupied
  // square or crater blocks any further squares in that direction, same as
  // Feint.
  if (ability === 'side_step') {
    const moves = [];
    const range = getSideStepRange(state.mode);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        for (let step = 1; step <= range; step++) {
          const nr = row + dr * step, nc = col + dc * step;
          if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) break;
          if (state.board[nr][nc].piece || state.board[nr][nc].hazard === 'crater') break;
          moves.push({ row: nr, col: nc, type: 'move' });
        }
      }
    }
    return filterSecretPassageMoves(moves);
  }

  // FEINT — slide UP TO the mastery-scaled range in any of the 8 directions.
  // Every open square along the path is a valid destination, so a player can
  // always stop after 1 square even when the card reaches 2- or 3-square range.
  // Occupied squares and craters block that direction; Feint never captures.
  if (ability === 'feint') {
    const moves = [];
    const range = getFeintRange(state.mode);
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of dirs) {
      for (let step = 1; step <= range; step++) {
        const nr = row + dr * step, nc = col + dc * step;
        if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) break;
        if (state.board[nr][nc].piece || state.board[nr][nc].hazard === 'crater') break;
        moves.push({ row: nr, col: nc, type: 'move' });
      }
    }
    return filterSecretPassageMoves(moves);
  }

  // TELEPORT — any empty square on the board
  if (ability === 'teleport') {
    const moves = [];
    for (let r = 0; r < bsR; r++)
      for (let c = 0; c < bsC; c++)
        if (!state.board[r][c].piece && state.board[r][c].hazard !== 'crater') moves.push({ row: r, col: c, type: 'move' });
    return filterSecretPassageMoves(moves);
  }

  // CATAPULT — launch piece anywhere on the board; the blast area around
  // whichever tile you actually pick as the landing spot is mastery-scaled
  // (see getCatapultBlastOffsets/CARD_MASTERY_TIERS): base has no blast at
  // all (only the landing tile itself), the first orb adds a 2x2 blast
  // (landing tile plus right/down/down-right), the second orb restores the
  // original 3x3 blast, and the third orb (see MOVE_LOCK_BYPASS_CARDS) lets
  // it fire even on a piece that already acted this turn.
  if (ability === 'catapult') {
    const moves = [];
    const blastOffsets = getCatapultBlastOffsets(state.mode);
    for (let r = 0; r < bsR; r++) {
      for (let c = 0; c < bsC; c++) {
        if (state.board[r][c].piece?.type === 'yours' || state.board[r][c].hazard === 'crater') continue;
        const captured = [];
        const affected = [];
        blastOffsets.forEach(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) return;
          affected.push({ row: nr, col: nc });
          if (state.board[nr][nc].piece?.type === 'enemy') captured.push({ row: nr, col: nc });
        });
        moves.push({ row: r, col: c, type: 'catapult', captured, affected });
      }
    }
    return filterSecretPassageMoves(moves);
  }

  // WAR HORSE — jump up to 2/3/4 enemy units in one diagonal leap. The
  // landing distance is one square beyond the mastery-scaled capture limit,
  // so base can pass over 2 units, orb 1 can pass over 3, and orb 2 can pass
  // over 4. Every
  // square in the path can be empty, an enemy (captured on landing), or a
  // Meteor Strike crater (impassable rubble that blocks a normal step, but
  // War Horse hops clean over it same
  // as anything else) — any mix, in any order. A friendly piece anywhere in
  // the path still blocks the jump (you can't hop your own piece), and
  // landing still can't be off the board, on a crater, or on an occupied
  // square. It's a real move in its own right now, not just a capture move —
  // it works exactly the same whether there are empty spaces or enemies along
  // the way; whatever enemies ARE in the path still get captured on landing.
  if (ability === 'double_jump') {
    const moves = [];
    const maxCaptures = getDoubleJumpMaxCaptures(state.mode);
    const maxLeapDistance = maxCaptures + 1;
    const diagonals = [[-1,-1],[-1,1],[1,-1],[1,1]];
    diagonals.forEach(([dr, dc]) => {
      // Try every landing from 2 squares away through the square immediately
      // beyond the maximum number of units this mastery tier can capture.
      // direction.
      for (let count = 1; count <= maxLeapDistance - 1; count++) {
        const over = []; // only the actual enemies along the path — empty squares/craters aren't captured
        let valid = true;
        for (let i = 1; i <= count; i++) {
          const er = row + dr*i, ec = col + dc*i;
          if (er < 0 || er >= bsR || ec < 0 || ec >= bsC) { valid = false; break; }
          const cell = state.board[er][ec];
          const p = cell.piece;
          if (p && p.type === 'enemy') {
            over.push({ row: er, col: ec });
          } else if (p && p.type === 'yours') {
            valid = false; break; // can't hop over your own piece
          }
          // else: empty square or crater — both fine to hop clean over
        }
        // A structurally broken path (ran off the board, or hit a friendly
        // piece) can never work for a LONGER count either, since count+1
        // just extends this same prefix — stop trying this direction
        // entirely.
        if (!valid) break;
        const landR = row + dr*(count+1), landC = col + dc*(count+1);
        if (landR < 0 || landR >= bsR || landC < 0 || landC >= bsC) break;
        // A blocked 2-jump landing square must NOT abort the whole direction —
        // when the path is 3 squares long, the 2-jump's landing square is
        // exactly where the 3rd square sits (whether that's empty, an enemy,
        // or a crater), so it's often occupied/impassable in that case.
        // That's not a dead end, it's the setup for the 3-jump: skip this
        // count and keep going instead of bailing out of the loop entirely.
        // Landing itself can never be on a crater or occupied square either.
        if (state.board[landR][landC].piece || state.board[landR][landC].hazard === 'crater') continue;
        moves.push({
          row: landR, col: landC,
          type: 'double_capture',
          captured: over.slice(),
          over:  over[0] || null,
          over2: over[1] || null,
          over3: over[2] || null,
          over4: over[3] || null
        });
      }
    });
    return filterSecretPassageMoves(moves);
  }

  // T-STRIKE — piece stays in place, wipes its row AND column out to a
  // mastery-scaled range (see getTStrikeRange/CARD_MASTERY_TIERS) — base
  // reaches 3 spaces, tiers extend it to 5/7, full mastery wipes the
  // entire row and column with no cap.
  // Returns a special "detonate" move at current position
  if (ability === 't_strike') {
    const { captured } = getTStrikePattern(row, col, state.mode);
    if (captured.length > 0) {
      return [{ row, col, type: 't_detonate', captured, stayInPlace: true }];
    }
    return [];
  }

  // KING ME card — handled in cellClick directly
  if (ability === 'king_me') return [];

  // CROSS STRIKE — wipe both diagonal axes from piece position (handled in cellClick)
  if (ability === 'cross_strike') return [];

  // ASSASSINATE — target any enemy (handled in cellClick)
  if (ability === 'assassinate') return [];

  // BEAR TRAP — target any open square (handled in cellClick)
  if (ability === 'bear_trap') return [];

  // AMBUSH — tap one of your own pieces to arm it (handled in cellClick)
  if (ability === 'ambush') return [];

  // KING — bishop movement. Only reached with no active card/ability, so
  // this counts as "plain movement" for Meteor Strike/Wildfire purposes —
  // every move generated here is tagged `plainMovement: true`. A crater
  // blocks the slide outright, same as running into any other piece; fire
  // doesn't block line of sight (the king can still slide past/through an
  // empty burning square to reach what's beyond it) but IS a valid — if
  // fatal — place to stop.
  if (piece.king) {
    const moves = [];
    const bsMax = Math.max(bsR, bsC);
    [-1, 1].forEach(dr => {
      [-1, 1].forEach(dc => {
        for (let steps = 1; steps < bsMax; steps++) {
          const nr = row + dr * steps;
          const nc = col + dc * steps;
          if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) break;
          const target = state.board[nr][nc].piece;
          if (!target) {
            if (state.board[nr][nc].hazard === 'crater') break; // solid rubble — slide stops here
            moves.push({ row: nr, col: nc, type: 'move', plainMovement: true });
          } else if (target.type === 'enemy') {
            if (state.shieldedPiece && state.shieldedPiece.row === nr && state.shieldedPiece.col === nc) break;
            const lr = nr + dr, lc = nc + dc;
            if (lr >= 0 && lr < bsR && lc >= 0 && lc < bsC && !state.board[lr][lc].piece && state.board[lr][lc].hazard !== 'crater') {
              moves.push({ row: lr, col: lc, type: 'capture', over: { row: nr, col: nc }, plainMovement: true });
            }
            break;
          } else break;
        }
      });
    });
    return filterSecretPassageMoves(moves);
  }

  // Standard diagonal movement (normal piece, no card, no ability) — same
  // "plain movement" hazard rules as the king block above.
  const moves = [];
  [-1].forEach(dr => {
    [-1, 1].forEach(dc => {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) return;
      const target = state.board[nr][nc].piece;
      if (!target) {
        if (state.board[nr][nc].hazard === 'crater') return; // blocked
        moves.push({ row: nr, col: nc, type: 'move', plainMovement: true });
      } else if (target.type === 'enemy') {
        if (state.shieldedPiece && state.shieldedPiece.row === nr && state.shieldedPiece.col === nc) return;
        const lr = nr + dr, lc = nc + dc;
        if (lr >= 0 && lr < bsR && lc >= 0 && lc < bsC && !state.board[lr][lc].piece && state.board[lr][lc].hazard !== 'crater') {
          moves.push({ row: lr, col: lc, type: 'capture', over: { row: nr, col: nc }, plainMovement: true });
        }
      }
    });
  });
  return filterSecretPassageMoves(moves);
}


// ── NEW RUN PLUS (BETA): ENEMY AI TURN ──
// Mirror of getValidMoves(), but for an enemy piece. Enemies move DOWN the
// board (toward row bs-1, your home row) instead of up, and king themselves
// once they get there — same rule as your pieces, just flipped. Enemies
// never get cards; this is pure movement + mandatory capture.
function getEnemyMoves(row, col) {
  const piece = state.board[row][col].piece;
  const empty = { captures: [], moves: [] };
  if (!piece || piece.type !== 'enemy') return empty;
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const captures = [];
  const moves = [];

  // Siege applies only to the enemy Kings chosen by the player. While its
  // per-piece timer is active, that King keeps ordinary moves and captures
  // but loses its long-range diagonal slide.
  const underSiege = piece.king && (piece.siegedTurnsLeft || 0) > 0;
  // Phalanx — the player's mastery-scaled back row zone is a solid wall:
  // enemies can neither step on it nor slide through it, and captures that
  // would land there are also blocked. Kings stop when they reach the zone.
  const underPhalanx = (state.phalanxTurnsLeft || 0) > 0;
  const phalanxFirstRow = underPhalanx ? bsR - (state.phalanxRows || getPhalanxEffect(state.mode).rows) : bsR;
  const isPhalanxRow = (r) => underPhalanx && r >= phalanxFirstRow && r < bsR;
  if (piece.king) {
    // Siege caps the selected enemy King's diagonal slide to 1 step.
    const bsMax = underSiege ? 2 : Math.max(bsR, bsC);
    [-1, 1].forEach(dr => {
      [-1, 1].forEach(dc => {
        for (let steps = 1; steps < bsMax; steps++) {
          const nr = row + dr * steps, nc = col + dc * steps;
          if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) break;
          // Phalanx: back row is an impassable wall for enemy kings
          if (isPhalanxRow(nr)) break;
          const target = state.board[nr][nc].piece;
          if (!target) {
            if (state.board[nr][nc].hazard === 'crater') break;
            moves.push({ row: nr, col: nc, type: 'move' });
            continue;
          }
          if (target.type === 'yours') {
            if ((state.shieldedPiece && state.shieldedPiece.row === nr && state.shieldedPiece.col === nc) || target.shielded) break;
            const lr = nr + dr, lc = nc + dc;
            // Phalanx: can't land on back row even after a capture
            if (lr >= 0 && lr < bsR && lc >= 0 && lc < bsC && !isPhalanxRow(lr) &&
                !state.board[lr][lc].piece && state.board[lr][lc].hazard !== 'crater') {
              captures.push({ row: lr, col: lc, type: 'capture', over: { row: nr, col: nc } });
            }
          }
          break;
        }
      });
    });
  } else {
    [-1, 1].forEach(dc => {
      const nr = row + 1, nc = col + dc;
      if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) return;
      // Phalanx: back row is sealed — normal pieces can't step there
      if (isPhalanxRow(nr)) return;
      const target = state.board[nr][nc].piece;
      if (!target) {
        if (state.board[nr][nc].hazard === 'crater') return;
        moves.push({ row: nr, col: nc, type: 'move' });
        return;
      }
      if (target.type === 'yours') {
        if ((state.shieldedPiece && state.shieldedPiece.row === nr && state.shieldedPiece.col === nc) || target.shielded) return;
        if (!underSiege) {
          const lr = nr + 1, lc = nc + dc;
          // Phalanx: can't land on back row after a capture either
          if (lr >= 0 && lr < bsR && lc >= 0 && lc < bsC && !isPhalanxRow(lr) &&
              !state.board[lr][lc].piece && state.board[lr][lc].hazard !== 'crater') {
            captures.push({ row: lr, col: lc, type: 'capture', over: { row: nr, col: nc } });
          }
        }
      }
    });
  }
  return {
    captures: filterSecretPassageMoves(captures).filter(m =>
      !crossesPortcullis(row,m.row) && !isSanctuaryCell(m.row,m.col) &&
      !(m.over && isSanctuaryCell(m.over.row,m.over.col))),
    moves: filterSecretPassageMoves(moves).filter(m => !crossesPortcullis(row,m.row) && !isSanctuaryCell(m.row,m.col)),
  };
}

// Called every time one of YOUR pieces finishes acting during your turn in
// New Run Plus. Marks that piece as spent, then checks whether every piece
// has either moved or has nothing left to do — if so, the enemy goes.
function plusMarkPieceMoved(pieceId) {
  if (state.mode !== 'plus' || state.turnPhase !== 'player') return;
  if (pieceId != null && !state.plusMovedIds.includes(pieceId)) state.plusMovedIds.push(pieceId);
  // A real board move breaks any immediate same-card sequence.
  state.lastCardPlayedId = null;
  maybeEndPlayerTurn();
}

// Turns no longer end themselves — the player advances to the enemy turn by
// pressing the End Turn button (see endPlayerTurn below). This just keeps the
// moves/cards-remaining readout and the End Turn button's enabled state in
// sync after every action.
function maybeEndPlayerTurn() {
  if (state.mode !== 'plus' || state.turnPhase !== 'player') return;
  if (state.gameOver) return;
  updatePlusTurnUI();
}

// Your move budget AND card-use budget each equal your current piece count,
// as two independent pools — moving 3 pieces doesn't cost you card charges,
// and using 3 cards doesn't cost you moves. Movement is capped for real by
// the fact each piece can only act once per turn (state.plusMovedIds), so
// "moves remaining" here is just that same cap surfaced for the player to
// see. Card uses are tracked separately in state.plusCardsUsed.
function updatePlusTurnUI() {
  const movesStatus = document.getElementById('plusMovesStatus');
  const cardsStatus = document.getElementById('plusCardsStatus');
  const endBtn = document.getElementById('endTurnBtn');
  if (!movesStatus || !cardsStatus || !endBtn) return;

  if (state.mode !== 'plus') {
    movesStatus.style.display = 'none';
    cardsStatus.style.display = 'none';
    endBtn.style.display = 'none';
    return;
  }
  movesStatus.style.display = '';
  cardsStatus.style.display = '';
  endBtn.style.display = '';

  const pieceCount = state.plusTurnPieceCount != null ? state.plusTurnPieceCount : countPieces('yours');
  // Card uses per turn are a flat baseline of 3 — NOT scaled by how many
  // pieces you have. Having more pieces already gets you more moves (see
  // movesLeft below); it should never also inflate your card budget. The
  // only thing that raises this ceiling is bonusCardActions, granted
  // permanently by the white card Ace up the Sleeve (+1, or +2 when mastered).
  const cardBudget = 3 + (state.bonusCardActions || 0);
  const movesUsed = state.plusMovedIds ? state.plusMovedIds.length : 0;
  const movesLeft = Math.max(0, pieceCount - movesUsed);
  const cardsUsed = state.plusCardsUsed || 0;
  const cardsLeft = Math.max(0, cardBudget - cardsUsed);
  document.getElementById('plusMovesCount').textContent = `${movesLeft}/${pieceCount}`;
  document.getElementById('plusCardsCount').textContent = `${cardsLeft}/${cardBudget}`;

  // A player must use every available move. If no legal move remains, End
  // Turn opens immediately so a blocked position never traps the run. An
  // active capture chain is always mandatory and cannot be passed.
  const mustFinishJump = state.forcedJumpPieceId != null;
  const mustKeepMoving = movesLeft > 0 && hasAnyValidMove();
  const tutorialEndTurnStep = tutorial.active && (tutorial.step === 2 || tutorial.step === 5);
  const tutorialBlocksEndTurn = tutorial.active && !tutorialEndTurnStep;
  // These two scripted prompts intentionally advance the lesson even if the
  // demonstration position still has a theoretical move. This exception is
  // tutorial-only; mandatory moves and mandatory jump chains remain intact in
  // every normal run.
  endBtn.disabled = state.gameOver || state.turnPhase !== 'player' || tutorialBlocksEndTurn ||
    (!tutorialEndTurnStep && (mustFinishJump || mustKeepMoving));
}

// Advance only after every available move is spent. A genuinely blocked
// player may still end the turn (and always retains the Forfeit option).
function endPlayerTurn() {
  if (state.mode !== 'plus' || state.turnPhase !== 'player' || state.gameOver || (typeof blackHoleAnimationRunning !== 'undefined' && blackHoleAnimationRunning)) return;
  if (state.forcedJumpPieceId != null) {
    setMessage('ANOTHER CAPTURE IS AVAILABLE — YOU MUST KEEP JUMPING');
    return;
  }
  if ((state.royalStandardPlacementRemaining || 0) > 0) {
    setMessage(state.royalStandardPlacementPreview
      ? 'TAP THE HIGHLIGHTED AREA AGAIN TO PLANT THE ROYAL STANDARD'
      : 'PLANT THE ROYAL STANDARD — TAP A SPACE TWICE TO CONFIRM');
    return;
  }
  const pieceCount = state.plusTurnPieceCount != null ? state.plusTurnPieceCount : countPieces('yours');
  const movesUsed = state.plusMovedIds ? state.plusMovedIds.length : 0;
  const movesLeft = Math.max(0, pieceCount - movesUsed);
  if (movesLeft > 0 && hasAnyValidMove()) {
    setMessage('YOU STILL HAVE A LEGAL MOVE — YOU MUST MOVE');
    return;
  }
  // The chain belongs only to the turn in which it was earned. Reset at the
  // exact successful handoff point—not on rejected End Turn attempts—so the
  // player never carries a multiplier into the enemy phase or next turn.
  resetGloryMultiplier();
  startEnemyTurn();
}

// Called at the start of every player turn in New Run Plus. Having no legal
// moves never ends or auto-advances the run: End Turn stays enabled and the
// player can choose to pass to the enemy or use the permanent Forfeit option.
function checkPlusTurnStart() {
  if (state.mode !== 'plus' || state.gameOver) return;
  state.forcedJumpPieceId = null;
  state.plusCardsUsed = 0; // fresh card-use budget every player turn
  state.lastCardPlayedId = null;
  state.plusTurnPieceCount = countPieces('yours'); // lock in budgets for this turn
  // Snapshot piece counts so finishEnemyTurn can detect whether any
  // captures happened this cycle (player OR enemy).
  state.noCaptureSnapEnemy = countPieces('enemy');
  state.noCaptureSnapYours = countPieces('yours');
  updatePlusTurnUI();
  if ((state.royalStandardPlacementRemaining || 0) > 0) {
    setMessage(state.royalStandardPlacementPreview
      ? 'TAP THE HIGHLIGHTED AREA AGAIN TO PLANT THE ROYAL STANDARD'
      : `PLANT ${state.royalStandardPlacementRemaining} ROYAL STANDARD${state.royalStandardPlacementRemaining === 1 ? '' : 'S'} — TAP A SPACE TWICE TO CONFIRM`);
    return;
  }
  if (state.doubleCardNext || state.heroGambitBonusCardUid != null) {
    const reservedUid = state.heroGambitBonusCardUid ?? state.heroGambitReservedCardUid;
    const reservedCard = reservedUid != null ? state.cards.find(c => c.uid === reservedUid) : null;
    const cardName = reservedCard ? CARD_DEFS[reservedCard.id]?.name : null;
    setMessage(cardName
      ? `HERO'S GAMBIT READY — ${cardName.toUpperCase()} STILL HAS ITS EXTRA USE`
      : `HERO'S GAMBIT READY — YOUR EXTRA CARD USE IS STILL AVAILABLE`);
    return;
  }
  if (hasAnyValidMove()) {
    setMessage('');
    return;
  }
  setMessage('NO VALID MOVES — END TURN OR FORFEIT');
}

function isEnemyBlackHoleDanger(row, col) {
  if (!state.blackHoleActive) return false;
  const bounds = getBlackHoleBounds();
  const inside = (r, c) => r >= bounds.startRow && r <= bounds.endRow && c >= bounds.startCol && c <= bounds.endCol;
  if (inside(row, col)) return true;
  // The pull happens after the full enemy turn. A landing immediately beside
  // the 3x3 void is also fatal because its next inward square is inside it.
  const nextRow = row + Math.sign(bounds.centerRow - row);
  const nextCol = col + Math.sign(bounds.centerCol - col);
  return inside(nextRow, nextCol);
}

function preferEnemyBlackHoleAvoidance(list) {
  if (!state.blackHoleActive || list.length < 2) return list;
  const bounds = getBlackHoleBounds();
  const distance = mv => Math.max(Math.abs(mv.row - bounds.centerRow), Math.abs(mv.col - bounds.centerCol));
  const farthest = Math.max(...list.map(distance));
  return list.filter(mv => distance(mv) === farthest);
}

// Runs every enemy piece's action for the turn, one at a time. Mandatory
// capture: any enemy that can capture MUST (and keeps chaining captures from
// its landing square until it runs out); enemies with no capture take a
// simple step if one exists. The whole turn is paced to finish inside ~3
// seconds no matter how many enemies are on the board — the more enemies,
// the faster each individual step happens.
function startEnemyTurn(resumeSavedTurn = false) {
  if (state.mode !== 'plus' || state.gameOver) return;
  // The tutorial's 3 enemies never use the real random AI — their two turns
  // are fully scripted so the guided walkthrough plays out identically every
  // time (enemy wanders into jump range, then one reaches the king row).
  if (tutorial.active) { runScriptedTutorialEnemyTurn(); return; }
  const resuming = resumeSavedTurn && state.turnPhase === 'enemy';
  if (!resuming) beginSandsTurn('enemy');
  state.turnPhase = 'enemy';
  state.forcedJumpPieceId = null;
  state.selected = null;
  state.validMoves = [];
  // Ending the turn may cancel the card's targeting UI, but it must not
  // cancel the extra use already purchased with Hero's Gambit sacrifices.
  if (state.doubleCardNext && state.activeCardUid != null) {
    state.heroGambitReservedCardUid = state.activeCardUid;
  }
  state.activeCard = null;
  state.activeCardUid = null;
  if (!resuming) state.enemyMovedThisTurn = false; // will be set true if any enemy actually moves
  // Blizzard's stationary-but-frozen enemies must never look like a genuine
  // stalemate to the auto-win check below — see actOnePiece's frozen branch
  // and finishEnemyTurn.
  if (!resuming) state.enemyFrozenThisTurn = false;
  render();
  setMessage('Enemy turn...');

  const bsR = getBoardRows();
  const bsC = getBoardCols();
  let enemyIds = resuming && Array.isArray(state.enemyTurnRemainingIds)
    ? state.enemyTurnRemainingIds.slice()
    : [];
  if (!resuming || !Array.isArray(state.enemyTurnRemainingIds)) {
    for (let r = 0; r < bsR; r++) {
      for (let c = 0; c < bsC; c++) {
        const p = state.board[r][c].piece;
        if (p && p.type === 'enemy') enemyIds.push(p.id);
      }
    }
    for (let i = enemyIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [enemyIds[i], enemyIds[j]] = [enemyIds[j], enemyIds[i]];
    }
    state.enemyTurnRemainingIds = enemyIds.slice();
    state.blackHolePulseResolvedThisEnemyTurn = false;
    saveGame();
  }

  const stepDelay = Math.max(15, Math.min(220, Math.floor(2800 / Math.max(1, enemyIds.length))));
  // A crowded late-game board can contain 150-200 enemies. Rebuilding every
  // board cell, piece image, hazard, and all four card carousels after EACH
  // enemy action caused hundreds of full DOM rebuilds in under three seconds.
  // Keep every AI action and rule exactly the same, but cap intermediate visual
  // updates. The final state is always rendered in full at the end of the turn.
  const ENEMY_VISUAL_UPDATE_BUDGET = 16;
  const enemyVisualStride = Math.max(1, Math.ceil(enemyIds.length / ENEMY_VISUAL_UPDATE_BUDGET));
  let enemyActionsSinceVisual = 0;
  let enemyVisualUpdates = 0;
  function renderEnemyProgress(force = false) {
    enemyActionsSinceVisual++;
    if (!force && enemyVisualUpdates >= ENEMY_VISUAL_UPDATE_BUDGET) return;
    if (!force && enemyActionsSinceVisual < enemyVisualStride) return;
    enemyActionsSinceVisual = 0;
    enemyVisualUpdates++;
    render({ fastEnemyFrame: true });
  }

  function findPieceById(id) {
    for (let r = 0; r < bsR; r++) {
      for (let c = 0; c < bsC; c++) {
        if (state.board[r][c].piece?.id === id) return { row: r, col: c };
      }
    }
    return null;
  }

  // How sharp the enemy plays ramps up with the level, mirroring every other
  // difficulty knob in this game (light-square rate, board size, fill %).
  // Starts ramping immediately from level 1 (no flat "dumb" plateau anymore)
  // and hits 100% mandatory-capture-with-chaining right at level 20, staying
  // there for every level after. This only controls whether an available
  // capture MUST be taken (and chained) — it doesn't make the enemy smarter
  // about setting up captures in the first place, just relentless about
  // finishing off ones that are already there.
  function mandatoryCaptureChance() {
    return Math.min(1, (state.level - 1) / 19);
  }

  // Trap awareness — a landing square that's on fire, poisoned, or holding
  // a set Bear Trap kills ANY piece that plain-moves onto it, friend or foe
  // (see the hazard checks below). The enemy shouldn't blindly wander onto
  // these when it has a choice: given a list of candidate moves/captures,
  // prefer whichever ones DON'T land somewhere lethal, and only fall back to
  // the full list (including deadly landings) if every option is deadly.
  function isDeadlyLanding(row, col) {
    const cell = state.board[row][col];
    return cell.hazard === 'fire' || cell.hazard === 'poison' || !!cell.trap || isEnemyBlackHoleDanger(row, col);
  }
  function preferSafeLandings(list) {
    const safe = list.filter(mv => !isDeadlyLanding(mv.row, mv.col));
    let candidates = safe.length > 0 ? safe : list;
    const decoys=[];
    for(let r=0;r<bsR;r++)for(let c=0;c<bsC;c++)if(state.board[r][c].piece?.falseKing)decoys.push({row:r,col:c});
    if(decoys.length&&candidates.length>1){
      const dist=mv=>Math.min(...decoys.map(d=>Math.max(Math.abs(mv.row-d.row),Math.abs(mv.col-d.col))));
      const nearest=Math.min(...candidates.map(dist)); candidates=candidates.filter(mv=>dist(mv)===nearest);
    }
    // Among equally legal choices, move as far from the gravity well as
    // possible. Mandatory captures remain mandatory; this only chooses the
    // safest landing among the captures the rules already require.
    return preferEnemyBlackHoleAvoidance(candidates);
  }

  // Ambush only triggers when an enemy actually finishes a move next to an
  // armed unit. Checking the landing square here prevents enemies that were
  // already adjacent before their turn from being destroyed by render().
  function enemyApproachedAmbush(row, col) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) continue;
        const neighbor = state.board[nr][nc].piece;
        if (neighbor?.type === 'yours' && neighbor.ambushed) {
          state.board[row][col].piece = null;
          return true;
        }
      }
    }
    return false;
  }

  function actOnePiece(id, done) {
    let pos = findPieceById(id);
    if (!pos) { done(); return; } // already captured earlier this same turn
    const activePiece = state.board[pos.row][pos.col].piece;
    if (activePiece && activePiece.frozen) {
      // Blizzard — this enemy is iced over and sits out the mastery-scaled
      // number of enemy turns, then thaws automatically. frozenTurnsLeft
      // tracks how many sit-out turns remain and clears the effect at 0.
      // Flagged separately from enemyMovedThisTurn so the stuck-enemy
      // auto-win below can tell "frozen by Blizzard" apart from "genuinely
      // has no legal moves" — a frozen turn must never count toward that
      // win condition, no matter how many Blizzards get chained back-to-back
      // (see finishEnemyTurn).
      state.enemyFrozenThisTurn = true;
      activePiece.frozenTurnsLeft = (activePiece.frozenTurnsLeft || 1) - 1;
      if (activePiece.frozenTurnsLeft <= 0) {
        activePiece.frozen = false;
        delete activePiece.frozenTurnsLeft;
      }
      renderEnemyProgress();
      setTimeout(done, stepDelay);
      return;
    }
    const forceCaptures = Math.random() < mandatoryCaptureChance();
    let didCapture = false;

    function step() {
      if (state.gameOver) return;
      const { captures, moves } = getEnemyMoves(pos.row, pos.col);

      if (!forceCaptures) {
        // Basic AI: captures and simple moves are just options, not
        // obligations, and a piece never chains a second jump in one turn.
        const options = preferSafeLandings(captures.concat(moves));
        if (options.length === 0) { done(); return; }
        const mv = options[Math.floor(Math.random() * options.length)];
        const piece = state.board[pos.row][pos.col].piece;
        // Counter — riposte. If whatever this piece is about to jump is
        // primed to counter, IT destroys the attacker instead: no landing,
        // no victim removed, this piece's turn just ends there.
        if (mv.over) {
          const victim = state.board[mv.over.row][mv.over.col].piece;
          // Ambush shares Counter's riposte mechanism: an armed/ambushed
          // piece being jumped destroys the attacker instead of itself.
          if (victim && (victim.countering || victim.ambushed)) {
            animateCounterClash(mv.over.row, mv.over.col, () => {
              state.board[pos.row][pos.col].piece = null;
              renderEnemyProgress();
              setTimeout(done, stepDelay);
            });
            return;
          }
        }
        state.board[pos.row][pos.col].piece = null;
        if (mv.over) state.board[mv.over.row][mv.over.col].piece = null;
        state.board[mv.row][mv.col].piece = piece;
        const passageTransit = transportThroughSecretPassage(mv.row, mv.col, piece);
        const landingRow = passageTransit.row;
        const landingCol = passageTransit.col;
        state.enemyMovedThisTurn = true;
        piece.movedByEnemyThisTurn = true;
        if (enemyApproachedAmbush(landingRow, landingCol)) {
          renderEnemyProgress();
          if (countPieces('enemy') === 0) { renderEnemyProgress(true); triggerWin(); return; }
          setTimeout(done, stepDelay);
          return;
        }
        // Wildfire/Mad Cow — enemies never have cards/abilities, so every
        // enemy move is "plain movement" and always respects hazards:
        // stepping onto a burning or poisoned square destroys this piece
        // instantly.
        if (state.board[landingRow][landingCol].hazard === 'fire' || state.board[landingRow][landingCol].hazard === 'poison') {
          state.board[landingRow][landingCol].piece = null;
          renderEnemyProgress();
          if (countPieces('enemy') === 0) { renderEnemyProgress(true); triggerWin(); return; }
          setTimeout(done, stepDelay);
          return;
        }
        if (landingRow === bsR - 1) piece.king = true;
        renderEnemyProgress(!!state.board[landingRow][landingCol].trap);
        if (countPieces('yours') === 0) {
          renderEnemyProgress(true); // records every fallen unit before Lazarus/loss resolution
          setTimeout(() => triggerLose('wiped_out'), 3000);
          return;
        }
        setTimeout(done, stepDelay);
        return;
      }

      if (captures.length > 0) {
        const safeCaptures = preferSafeLandings(captures);
        const mv = safeCaptures[Math.floor(Math.random() * safeCaptures.length)];
        const piece = state.board[pos.row][pos.col].piece;
        // Counter — same riposte check, but this piece was in the middle of
        // a mandatory-capture chain: getting countered kills it outright and
        // ends the chain right here instead of continuing to step().
        const victim = state.board[mv.over.row][mv.over.col].piece;
        if (victim && (victim.countering || victim.ambushed)) {
          animateCounterClash(mv.over.row, mv.over.col, () => {
            state.board[pos.row][pos.col].piece = null;
            renderEnemyProgress();
            setTimeout(done, stepDelay);
          });
          return;
        }
        didCapture = true;
        state.board[pos.row][pos.col].piece = null;
        state.board[mv.over.row][mv.over.col].piece = null;
        state.board[mv.row][mv.col].piece = piece;
        const passageTransit = transportThroughSecretPassage(mv.row, mv.col, piece);
        const landingRow = passageTransit.row;
        const landingCol = passageTransit.col;
        state.enemyMovedThisTurn = true;
        piece.movedByEnemyThisTurn = true;
        if (enemyApproachedAmbush(landingRow, landingCol)) {
          renderEnemyProgress();
          if (countPieces('enemy') === 0) { renderEnemyProgress(true); triggerWin(); return; }
          setTimeout(done, stepDelay);
          return;
        }
        if (state.board[landingRow][landingCol].hazard === 'fire' || state.board[landingRow][landingCol].hazard === 'poison') {
          state.board[landingRow][landingCol].piece = null;
          renderEnemyProgress();
          if (countPieces('enemy') === 0) { renderEnemyProgress(true); triggerWin(); return; }
          setTimeout(done, stepDelay);
          return;
        }
        if (landingRow === bsR - 1) piece.king = true;
        pos = { row: landingRow, col: landingCol };
        renderEnemyProgress(!!state.board[landingRow][landingCol].trap);
        if (countPieces('yours') === 0) {
          renderEnemyProgress(true); // records every fallen unit before Lazarus/loss resolution
          setTimeout(() => triggerLose('wiped_out'), 3000);
          return;
        }
        // Entering a passage always ends this unit's action, even if the
        // move that reached it was a capture with another jump available.
        setTimeout(passageTransit.usedTunnel ? done : step, stepDelay);
        return;
      }
      if (!didCapture && moves.length > 0) {
        const safeMoves = preferSafeLandings(moves);
        const mv = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        const piece = state.board[pos.row][pos.col].piece;
        state.board[pos.row][pos.col].piece = null;
        state.board[mv.row][mv.col].piece = piece;
        const passageTransit = transportThroughSecretPassage(mv.row, mv.col, piece);
        const landingRow = passageTransit.row;
        const landingCol = passageTransit.col;
        // This is the mandatory-capture roll's fallback path — this piece
        // had no capture available, so it just makes a plain move instead.
        // That still counts as the enemy moving; forgetting this flag here
        // was the actual bug behind "random" auto-wins at any enemy count —
        // if every enemy piece happened to land in this exact branch for
        // three consecutive turns, enemyStuckTurns below would hit 3 and
        // triggerWin() would fire even though the enemies were moving fine.
        state.enemyMovedThisTurn = true;
        piece.movedByEnemyThisTurn = true;
        if (enemyApproachedAmbush(landingRow, landingCol)) {
          renderEnemyProgress();
          if (countPieces('enemy') === 0) { renderEnemyProgress(true); triggerWin(); return; }
          setTimeout(done, stepDelay);
          return;
        }
        if (state.board[landingRow][landingCol].hazard === 'fire' || state.board[landingRow][landingCol].hazard === 'poison') {
          state.board[landingRow][landingCol].piece = null;
          renderEnemyProgress();
          if (countPieces('enemy') === 0) { renderEnemyProgress(true); triggerWin(); return; }
          setTimeout(done, stepDelay);
          return;
        }
        if (landingRow === bsR - 1) piece.king = true;
        renderEnemyProgress(!!state.board[landingRow][landingCol].trap);
        setTimeout(done, stepDelay);
        return;
      }
      done();
    }
    step();
  }

  function nextPiece() {
    if (state.gameOver) return;
    // Keeps the run timer's activity window alive through a long enemy
    // turn on a busy board — without this, a turn with enough pieces to run
    // past ACTIVITY_IDLE_TIMEOUT_MS (5s) would falsely look "idle" and pause
    // the clock mid-animation, even though the game is actively playing
    // itself out as a direct result of the player's own last move.
    markActivity();
    if (enemyIds.length === 0) {
      state.enemyTurnRemainingIds = [];
      finishEnemyTurn();
      return;
    }
    const id = enemyIds.shift();
    state.enemyTurnRemainingIds = enemyIds.slice();
    actOnePiece(id, nextPiece);
  }

  function finishEnemyTurn(skipBlackHolePulse = false) {
    if (state.gameOver) return;
    // One gravitational pulse follows every complete player+enemy turn.
    // The callback re-enters only the ordinary end-turn cleanup, preventing
    // the same turn from pulsing twice.
    if (state.blackHoleActive && !skipBlackHolePulse && !state.blackHolePulseResolvedThisEnemyTurn) {
      // Make sure the DOM reflects the final sampled AI state before the pull
      // animation reads piece positions from it.
      renderEnemyProgress(true);
      const pulsePlan = getBlackHolePullPlan();
      state.pendingEpicEffect = { type: 'black_hole_turn', plan: cloneSandsValue(pulsePlan) };
      saveGame();
      // Recovery-safe equivalent of: performBlackHolePulse(() => finishEnemyTurn(true))
      performBlackHolePulse(() => {
        state.pendingEpicEffect = null;
        state.blackHolePulseResolvedThisEnemyTurn = true;
        saveGame();
        finishEnemyTurn(true);
      });
      return;
    }
    // Gallows resolves after every marked unit has had its chance to act.
    // Those that moved survive and lose the mark; stationary targets fall.
    for (let r=0;r<bsR;r++) for (let c=0;c<bsC;c++) {
      const piece=state.board[r][c].piece;
      if(piece?.type==='enemy'&&piece.gallowsMarked){
        if(!piece.movedByEnemyThisTurn) state.board[r][c].piece=null;
        else { delete piece.gallowsMarked; delete piece.movedByEnemyThisTurn; }
      } else if(piece?.type==='enemy') delete piece.movedByEnemyThisTurn;
    }
    state.sanctuaryZones=(state.sanctuaryZones||[]).map(z=>({...z,turns:z.turns-1})).filter(z=>z.turns>0);
    state.portcullisRows=(state.portcullisRows||[]).map(z=>({...z,turns:z.turns-1})).filter(z=>z.turns>0);
    if(countPieces('enemy')===0){ renderEnemyProgress(true); triggerWin(); return; }
    state.turnPhase = 'player';
    state.enemyTurnRemainingIds = [];
    state.blackHolePulseResolvedThisEnemyTurn = false;
    state.plusMovedIds = [];
    // Siege expires independently on each selected enemy King.
    for (let r = 0; r < bsR; r++) {
      for (let c = 0; c < bsC; c++) {
        const piece = state.board[r][c].piece;
        if (piece?.type === 'enemy' && piece.siegedTurnsLeft > 0) piece.siegedTurnsLeft--;
      }
    }
    // Phalanx: same — the back-row wall weakens by one turn each enemy phase.
    if (state.phalanxTurnsLeft > 0) {
      state.phalanxTurnsLeft--;
      if (state.phalanxTurnsLeft === 0) state.phalanxRows = 0;
    }
    // Scorched Earth: one fewer burning player turn remains.
    // When it hits zero, extinguish every square it lit.
    if (state.scorchedEarthTurns > 0) {
      state.scorchedEarthTurns--;
      if (state.scorchedEarthTurns === 0 && state.scorchedEarthSquares) {
        state.scorchedEarthSquares.forEach(({ r, c }) => {
          if (state.board[r] && state.board[r][c] && state.board[r][c].hazard === 'fire' &&
              state.board[r][c].fireSource === 'scorched_earth') {
            state.board[r][c].hazard = null;
            state.board[r][c].fireSource = null;
          }
        });
        state.scorchedEarthSquares = [];
        state.scorchedEarthUnitIds = [];
        state.scorchedEarthAllUnits = false;
      }
    }
    // Mad Cow's poison — each poisoned square ticks down its OWN remaining
    // turn count (not one shared timer like Scorched Earth), since overlapping
    // casts can leave squares with different amounts of time left. Cleared
    // only if still actually 'poison' by the time it expires — a square that
    // picked up a different hazard in the meantime is left alone.
    if (state.poisonSquares && state.poisonSquares.length) {
      state.poisonSquares = state.poisonSquares.filter(p => {
        p.turnsLeft--;
        if (p.turnsLeft > 0) return true;
        if (state.board[p.r] && state.board[p.r][p.c] && state.board[p.r][p.c].hazard === 'poison') {
          state.board[p.r][p.c].hazard = null;
          state.board[p.r][p.c].poisonSparesFriendly = null;
        }
        return false;
      });
    }
    // Enemy stuck detection: if no enemy piece moved this turn, increment the
    // counter. Three consecutive stuck turns means the enemy is completely
    // trapped and the player wins automatically. Blizzard is completely
    // excluded from this rule — any turn where a frozen piece is the reason
    // nothing moved doesn't count as "stuck" at all (counter resets to 0,
    // exactly like a real move would), no matter how many Blizzards get
    // chained back-to-back. Only a genuine stalemate — nobody frozen, no
    // legal moves anywhere — can ever trigger the auto-win.
    if (!state.gameOver) {
      if (state.enemyFrozenThisTurn) {
        state.enemyStuckTurns = 0;
      } else if (!state.enemyMovedThisTurn) {
        state.enemyStuckTurns = (state.enemyStuckTurns || 0) + 1;
        if (state.enemyStuckTurns >= 3) { triggerWin(); return; }
      } else {
        state.enemyStuckTurns = 0;
      }
    }
    // Stalemate detector: if neither side lost a piece this full turn cycle,
    // increment the streak. At 10 consecutive no-capture turns, ask the player.
    if (!state.gameOver) {
      const enemyNow = countPieces('enemy');
      const yoursNow = countPieces('yours');
      const progress = enemyNow < (state.noCaptureSnapEnemy || enemyNow) ||
                       yoursNow < (state.noCaptureSnapYours || yoursNow);
      if (progress) {
        state.noCaptureStreak = 0;
      } else {
        state.noCaptureStreak = (state.noCaptureStreak || 0) + 1;
        if (state.noCaptureStreak > 0 && state.noCaptureStreak % 5 === 0) {
          if (state.noCaptureStreak >= 15) {
            // Third strike — force restart, no dialog
            restartLevelFresh();
          } else {
            showStalemateOverlay();
          }
        }
      }
      // Blood Oath triggers only on the first friendly loss each level.
      // Mastery controls both the number and, at the final tier, rarity.
      if (yoursNow < state.noCaptureSnapYours) triggerBloodOathDraw();
    }
    // Shield Wall and Counter both only cover ONE full enemy turn — it just
    // finished, so every shield/riposte you were carrying burns off now
    // regardless of whether it was actually tested.
    for (let r = 0; r < bsR; r++) {
      for (let c = 0; c < bsC; c++) {
        const p = state.board[r][c].piece;
        if (p && p.type === 'yours') {
          if (p.shielded) p.shielded = false;
          if (p.countering) p.countering = false;
          if (p.ambushed) p.ambushed = false;
        }
      }
    }
    beginSandsTurn('player');
    render();
    if (countPieces('enemy') === 0) { triggerWin(); return; }
    checkPlusTurnStart();
  }

  nextPiece();
}

function hasAnyValidMove() {
  const bsMr = getBoardRows();
  const bsMc = getBoardCols();
  const movedIds = new Set(state.plusMovedIds || []);
  for (let r = 0; r < bsMr; r++) {
    for (let c = 0; c < bsMc; c++) {
      const p = state.board[r][c].piece;
      if (!p || p.type !== 'yours') continue;

      // Only an eligible, not-yet-moved unit can keep End Turn locked. A unit
      // already inside the active void is committed to the Black Hole's next
      // pulse and must never strand the player in an unfinishable turn.
      if (movedIds.has(p.id)) continue;
      if (state.blackHoleActive && isBlackHoleCell(r, c)) continue;

      if (getValidMoves(r, c).length > 0) return true;
    }
  }
  return false;
}

// ── INTERACTION ──
// Plain selection changes only highlights; it does not alter gameplay state.
// Updating those classes directly avoids rebuilding every square and piece
// merely because the player tapped a unit or changed their mind.
function refreshPlainSelectionHighlights() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  boardEl.querySelectorAll('.cell.selected, .cell.valid-move, .cell.valid-capture').forEach(cell => {
    cell.classList.remove('selected', 'valid-move', 'valid-capture');
  });
  boardEl.querySelectorAll('.piece.selected-piece').forEach(piece => piece.classList.remove('selected-piece'));

  if (state.selected) {
    const selectedCell = boardEl.querySelector(`.cell[data-row="${state.selected.row}"][data-col="${state.selected.col}"]`);
    if (selectedCell) {
      selectedCell.classList.add('selected');
      const selectedPiece = selectedCell.querySelector('.piece');
      if (selectedPiece) selectedPiece.classList.add('selected-piece');
    }
  }
  (state.validMoves || []).forEach(move => {
    const cell = boardEl.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
    if (cell) cell.classList.add(move.type === 'capture' ? 'valid-capture' : 'valid-move');
  });
}

function cellClick(row, col) {
  if (state.gameOver || (typeof blackHoleAnimationRunning !== 'undefined' && blackHoleAnimationRunning)) return;
  if (state.mode === 'plus' && state.turnPhase === 'enemy') return; // enemy is acting, board is locked
  // Tutorial: only the exact square(s) the current prompt is pointing at are
  // tappable — anything else is a silent no-op. Without this, tapping ahead
  // of the script (an early capture, an out-of-order card use, moving a
  // piece the prompt never mentioned, etc.) could desync the scripted board
  // from what the prompts expect and leave the player stuck.
  if (tutorial.active && !tutorialAllowsCellClick(row, col)) return;
  // Swallow any tap that lands immediately after a card was just activated —
  // guards against a ghost/synthetic click landing on the board the instant
  // the carousel popup closes, so selecting a card never also uses it.
  if (Date.now() - lastCardActivationTime < 250) return;

  const cell = state.board[row][col];

  // Royal Standard is mandatory at the opening of every level and precedes
  // movement or card play. Each banner visibly marks its Glory-bonus area.
  if ((state.royalStandardPlacementRemaining || 0) > 0) {
    if (cell.hazard === 'crater' || isBlackHoleCell(row,col)) { setMessage('PLANT THE STANDARD ON THE FIELD'); return; }
    const level=newCardLevel('royal_standard');
    const size=(level===1||level>=3)?3:2;
    const preview=state.royalStandardPlacementPreview;
    if (!preview || preview.row!==row || preview.col!==col) {
      state.royalStandardPlacementPreview={row,col,size,cells:getSquareArea(row,col,size)};
      render(); saveGame();
      setMessage('TAP THE HIGHLIGHTED AREA AGAIN TO PLANT THE ROYAL STANDARD');
      return;
    }
    state.royalStandardBanners.push(preview);
    state.royalStandardPlacementPreview=null;
    state.royalStandardPlacementRemaining--;
    render(); saveGame();
    setMessage(state.royalStandardPlacementRemaining ? 'CHOOSE THE NEXT BANNER SPACE — TAP TWICE TO CONFIRM' : 'THE COLORS ARE RAISED');
    return;
  }

  // Once a capture chain begins, standard checkers rules require the same
  // piece to take every available follow-up jump. Do not allow selecting a
  // different piece, cancelling the selection, or starting a card midway.
  if (state.forcedJumpPieceId != null) {
    const selectedPiece = state.selected
      ? state.board[state.selected.row]?.[state.selected.col]?.piece
      : null;
    if (!selectedPiece || selectedPiece.id !== state.forcedJumpPieceId) {
      state.forcedJumpPieceId = null; // self-heal a stale/interrupted save
    } else {
      const forcedTarget = state.validMoves.find(m => m.row === row && m.col === col);
      if (forcedTarget) {
        executeMove(state.selected.row, state.selected.col, forcedTarget);
      } else {
        setMessage('ANOTHER CAPTURE IS AVAILABLE — YOU MUST KEEP JUMPING');
      }
      return;
    }
  }

  // Step 1: if card active but no piece selected yet
  if (state.activeCard && !state.selected) {
    if (state.activeCard === 'battering_ram') {
      if (!cell.piece || cell.piece.type!=='yours') { setMessage('CHOOSE A FRIENDLY UNIT TO DRIVE FORWARD'); return; }
      const ramResult=executeBatteringRam(row,col);
      if (!ramResult) { setMessage('THAT UNIT IS BLOCKED'); return; }
      beginUncommonAnimationResolution();
      markCardUsed('battering_ram'); state.activeCard=null; state.activeCardUid=null;
      saveStagedUncommonResolution();
      animateBatteringRam(ramResult.fromRow,ramResult.toRow,ramResult.col,ramResult.impactRows,()=>{
        plusMarkPieceMoved(ramResult.pieceId);
        finishUncommonAnimationResolution();
        setMessage('');
      });
      return;
    }
    if (state.activeCard === 'sanctuary') {
      if (state.sanctuaryPreview && state.sanctuaryPreview.row===row && state.sanctuaryPreview.col===col) {
        const size=Math.min(3,1+newCardLevel('sanctuary'));
        state.sanctuaryZones=[{row,col,size,cells:getSquareArea(row,col,size),turns:1}];
        state.sanctuaryPreview=null; markCardUsed('sanctuary'); state.activeCard=null; state.activeCardUid=null; render(); saveGame(); return;
      }
      state.sanctuaryPreview={row,col}; render(); setMessage('TAP THE HIGHLIGHTED AREA AGAIN TO PROTECT IT'); return;
    }
    if (state.activeCard === 'portcullis') {
      if (state.portcullisPreviewRow===row) {
        state.portcullisRows=[{row,turns:1+newCardLevel('portcullis')}]; state.portcullisPreviewRow=null;
        markCardUsed('portcullis'); state.activeCard=null; state.activeCardUid=null; render(); saveGame(); return;
      }
      state.portcullisPreviewRow=row; render(); setMessage('TAP THE HIGHLIGHTED ROW AGAIN TO SEAL IT'); return;
    }
    if (state.activeCard === 'the_masons') {
      if (!(cell.hazard||cell.trap||cell.trapSnapping)) { setMessage('CHOOSE A DAMAGED OR HAZARDOUS SPACE'); return; }
      const card=state.cards.find(c=>c.uid===state.activeCardUid); repairBoardCell(row,col); card.masonsRepairsUsed=(card.masonsRepairsUsed||0)+1;
      const cap=3+newCardLevel('the_masons');
      if(card.masonsRepairsUsed>=cap||getRepairableCells().length===0){ markCardUsed('the_masons'); state.activeCard=null; state.activeCardUid=null; }
      render(); saveGame(); setMessage(state.activeCard?`${cap-card.masonsRepairsUsed} REPAIR${cap-card.masonsRepairsUsed===1?'':'S'} REMAIN`:'THE FIELD IS REPAIRED'); return;
    }
    if (state.activeCard === 'headsmans_bounty') {
      if (!cell.piece || cell.piece.type!=='enemy' || !cell.piece.king) { setMessage('CHOOSE AN ENEMY KING'); return; }
      state.headsmansTargets=state.headsmansTargets||[]; if(!state.headsmansTargets.some(p=>p.row===row&&p.col===col)) state.headsmansTargets.push({row,col});
      const eligible=[]; for(let r=0;r<getBoardRows();r++)for(let c=0;c<getBoardCols();c++)if(state.board[r][c].piece?.type==='enemy'&&state.board[r][c].piece.king)eligible.push({r,c});
      const cap=Math.min(1+newCardLevel('headsmans_bounty'),eligible.length);
      if(state.headsmansTargets.length>=cap){state.headsmansTargets.forEach(p=>{const x=state.board[p.row][p.col].piece;if(x)x.headsmansBounty=true;});state.headsmansTargets=[];markCardUsed('headsmans_bounty');state.activeCard=null;state.activeCardUid=null;}
      render(); saveGame(); return;
    }
    if (state.activeCard === 'gallows') {
      if (!cell.piece || cell.piece.type!=='enemy') { setMessage('CHOOSE AN ENEMY FOR EXECUTION'); return; }
      state.gallowsTargets=state.gallowsTargets||[]; if(!state.gallowsTargets.some(p=>p.row===row&&p.col===col))state.gallowsTargets.push({row,col});
      const cap=Math.min(3+newCardLevel('gallows'),countPieces('enemy'));
      if(state.gallowsTargets.length>=cap){state.gallowsTargets.forEach(p=>{const x=state.board[p.row][p.col].piece;if(x){x.gallowsMarked=true;x.movedByEnemyThisTurn=false;}});state.gallowsTargets=[];markCardUsed('gallows');state.activeCard=null;state.activeCardUid=null;}
      render();saveGame();return;
    }
    if (state.activeCard === 'war_drums') {
      const allowKing=newCardLevel('war_drums')>=3;
      if(!cell.piece||cell.piece.type!=='yours'||(!allowKing&&cell.piece.king)){setMessage(allowKing?'CHOOSE A FRIENDLY UNIT':'CHOOSE A FRIENDLY PAWN');return;}
      state.warDrumsTargets=state.warDrumsTargets||[];if(!state.warDrumsTargets.some(p=>p.row===row&&p.col===col))state.warDrumsTargets.push({row,col});
      const cap=Math.min(newCardLevel('war_drums')===0?1:Math.min(3,newCardLevel('war_drums')+1),getFriendlyCells().filter(p=>allowKing||!state.board[p.row][p.col].piece.king).length);
      if(state.warDrumsTargets.length>=cap){state.warDrumsTargets.forEach(p=>advanceWarDrumPiece(p.row,p.col));state.warDrumsTargets=[];markCardUsed('war_drums');state.activeCard=null;state.activeCardUid=null;}
      render();saveGame();return;
    }
    // SECRET PASSAGE — choose two empty squares per tunnel. Each consecutive
    // pair becomes one two-way passage, colored gray then green so a
    // crowded board always makes the matching destination obvious.
    if (state.activeCard === 'secret_passage') {
      if (cell.piece || cell.hazard || cell.trap || isBlackHoleCell(row, col) || getSecretPassageEndpoint(row, col)) {
        setMessage('CHOOSE AN EMPTY, SAFE SQUARE FOR THE PASSAGE');
        return;
      }
      if (!Array.isArray(state.secretPassagePlacements)) state.secretPassagePlacements = [];
      if (state.secretPassagePlacements.some(point => point.row === row && point.col === col)) {
        setMessage('THAT PASSAGE END IS ALREADY SELECTED');
        return;
      }
      state.secretPassagePlacements.push({ row, col });
      const tunnelCount = getSecretPassageTunnelCount(state.mode);
      const endpointTarget = tunnelCount * 2;
      if (state.secretPassagePlacements.length >= endpointTarget) {
        const tunnels = [];
        for (let i = 0; i < tunnelCount; i++) {
          const color = SECRET_PASSAGE_COLORS[i];
          tunnels.push({
            id: `${Date.now()}-${i}`,
            colorKey: color.key,
            color: color.color,
            a: { ...state.secretPassagePlacements[i * 2] },
            b: { ...state.secretPassagePlacements[i * 2 + 1] },
          });
        }
        // One activation defines the active tunnel network for this level.
        // Recasting the card replaces it, preventing duplicate colors from
        // creating ambiguous destinations.
        state.secretPassageTunnels = tunnels;
        state.secretPassagePlacements = [];
        markCardUsed('secret_passage');
        state.activeCard = null;
        state.activeCardUid = null;
        render();
        setMessage(`${tunnelCount} COLOR-MATCHED TUNNEL${tunnelCount === 1 ? '' : 'S'} DUG`);
        maybeEndPlayerTurn();
        saveGame();
        return;
      }
      const nextIndex = state.secretPassagePlacements.length;
      const pairIndex = Math.floor(nextIndex / 2);
      const choosingExit = nextIndex % 2 === 1;
      const color = SECRET_PASSAGE_COLORS[pairIndex];
      render();
      setMessage(choosingExit
        ? `CHOOSE THE ${color.label} TUNNEL EXIT`
        : `CHOOSE THE ${color.label} TUNNEL ENTRANCE`);
      return;
    }
    // Revert — directly tap a piece, no destination needed
    // Demotion — tap up to getRevertDemoteCount() enemy pieces to mark
    // them, then all are demoted from kings to pawns simultaneously.
    // Auto-executes once that many are marked OR when all remaining
    // enemies are marked (handles a smaller enemy count than the target).
    if (state.activeCard === 'revert') {
      const demoteCount = getRevertDemoteCount(state.mode);
      const targetCap = Math.min(demoteCount, getEnemyKingCells().length);
      if (cell.piece?.type === 'enemy' && cell.piece.king) {
        if (!state.demotionTargets) state.demotionTargets = [];
        const idx = state.demotionTargets.findIndex(t => t.row === row && t.col === col);
        if (idx >= 0) {
          // Re-tapping a marked piece confirms early with current selection
          const targets = [...state.demotionTargets];
          state.demotionTargets = [];
          markCardUsed('revert');
          state.activeCard = null; state.activeCardUid = null;
          state.selected = null;  state.validMoves = [];
          targets.forEach(t => {
            const p = state.board[t.row][t.col].piece;
            if (p) { p.king = false; p.wasKing = true; }
          });
          render(); setMessage(''); maybeEndPlayerTurn();
          return;
        }
        if (state.demotionTargets.length < targetCap) {
          state.demotionTargets.push({ row, col });
          const eligibleKings = getEnemyKingCells().length;
          const allMarked = state.demotionTargets.length >= eligibleKings;
          if (state.demotionTargets.length >= targetCap || allMarked) {
            const targets = [...state.demotionTargets];
            state.demotionTargets = [];
            markCardUsed('revert');
            state.activeCard = null; state.activeCardUid = null;
            state.selected = null;  state.validMoves = [];
            targets.forEach(t => {
              const p = state.board[t.row][t.col].piece;
              if (p) { p.king = false; p.wasKing = true; }
            });
            render(); setMessage(''); maybeEndPlayerTurn();
          } else {
            render();
            setMessage(`${targetCap - state.demotionTargets.length} more — or tap a marked piece to confirm.`);
          }
        }
      }
      return;
    }
    // SAME piece again (see step 2 below) to actually detonate it.
    if (state.activeCard === 't_strike' && cell.piece && cell.piece.type === 'yours') {
      const r = row, c = col;
      const { captured, affected } = getTStrikePattern(r, c, state.mode);
      if (captured.length === 0) {
        setMessage('');
        return;
      }
      state.selected = { row: r, col: c };
      state.validMoves = [{ row: r, col: c, type: 't_detonate', captured, affected }];
      render();
      setMessage('Tap again to detonate!');
      return;
    }

    // Assassinate — mark enemy targets up to the mastery-scaled cap (tap a
    // marked one again to un-mark it), then the final tap strikes all of them
    // simultaneously. If fewer enemies remain, the cap shrinks to match.
    if (state.activeCard === 'assassinate' && cell.piece && cell.piece.type === 'enemy') {
      const r = row, c = col;
      if (!state.assassinateTargets) state.assassinateTargets = []; state.demotionTargets = [];
      const targetCap = Math.min(getAssassinateTargetCount(state.mode), countPieces('enemy'));
      const existingIdx = state.assassinateTargets.findIndex(t => t.row === r && t.col === c);
      if (existingIdx !== -1) {
        state.assassinateTargets.splice(existingIdx, 1);
        render();
        setMessage(state.assassinateTargets.length ? `SELECT ${targetCap - state.assassinateTargets.length} MORE` : `SELECT ${targetCap} TARGETS`);
        return;
      }
      state.assassinateTargets.push({ row: r, col: c });
      if (state.assassinateTargets.length < targetCap) {
        render();
        setMessage(`SELECT ${targetCap - state.assassinateTargets.length} MORE`);
        return;
      }
      // Cap reached — strike every marked target at once.
      const targets = state.assassinateTargets.slice();
      state.assassinateTargets = []; state.demotionTargets = [];
      markCardUsed('assassinate');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      beginUncommonAnimationResolution();
      targets.forEach(t => { state.board[t.row][t.col].piece = null; });
      saveStagedUncommonResolution();
      // One sound, right as the strike commits — see the comment on
      // ASSASSINATE_SLICE_SOUND_URL for why this isn't inside animateAssassinate.
      playAssassinateSliceSound();
      // NOTE: no render() call here before the animations run — render()
      // wipes and rebuilds the board's DOM, which would destroy the canvases
      // animateAssassinate just appended before they ever get to paint a
      // frame. All slashes play out first; render() only happens once
      // every one of them has actually finished.
      let finished = 0;
      targets.forEach(t => {
        animateAssassinate(t.row, t.col, () => {
          finished++;
          if (finished < targets.length) return;
          finishUncommonAnimationResolution();
          setMessage('');
          if (countPieces('enemy') === 0) { triggerWin(); return; }
          maybeEndPlayerTurn();
        });
      });
      return;
    }

    // Bear Trap — mark up to targetCap OPEN squares (mastery-scaled — see
    // getBearTrapCount/CARD_MASTERY_TIERS: base sets 1, each orb adds one
    // more, up to 4 at full mastery; tap a marked one again to un-mark it),
    // then the final tap sets every marked trap down at once. Traps sit on
    // the board as persistent hazards — see checkBearTraps(), which runs
    // every render() and kills ANY piece, friendly or enemy, that ends up
    // standing on one.
    if (state.activeCard === 'bear_trap' && !cell.piece && !cell.hazard && !state.board[row][col].trap) {
      const r = row, c = col;
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      let openCount = 0;
      for (let rr = 0; rr < bsR; rr++) {
        for (let cc = 0; cc < bsC; cc++) {
          const bc = state.board[rr][cc];
          if (!bc.piece && !bc.hazard && !bc.trap) openCount++;
        }
      }
      if (!state.bearTrapTargets) state.bearTrapTargets = [];
      const targetCap = Math.min(getBearTrapCount(state.mode), openCount);
      const existingIdx = state.bearTrapTargets.findIndex(t => t.row === r && t.col === c);
      if (existingIdx !== -1) {
        state.bearTrapTargets.splice(existingIdx, 1);
        render();
        setMessage(state.bearTrapTargets.length ? `SELECT ${targetCap - state.bearTrapTargets.length} MORE` : `SELECT ${targetCap} OPEN SPOTS`);
        return;
      }
      state.bearTrapTargets.push({ row: r, col: c });
      if (state.bearTrapTargets.length < targetCap) {
        render();
        setMessage(`SELECT ${targetCap - state.bearTrapTargets.length} MORE`);
        return;
      }
      // Cap reached — set every marked trap down at once.
      const targets = state.bearTrapTargets.slice();
      state.bearTrapTargets = [];
      targets.forEach(t => { state.board[t.row][t.col].trap = true; });
      markCardUsed('bear_trap');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('TRAPS SET');
      return;
    }

    // Cross Strike — tap your piece to preview both diagonal axes; tap the
    // SAME piece again (see step 2 below) to actually detonate it.
    if (state.activeCard === 'cross_strike' && cell.piece && cell.piece.type === 'yours') {
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const bsMax = Math.max(bsR, bsC);
      const r = row, c = col;
      const captured = [];
      const affected = [];
      const crossStrikeRange = getCrossStrikeRange(state.mode);
      for (const dr of [-1,1]) for (const dc of [-1,1]) {
        for (let s=1; s<bsMax; s++) {
          if (s > crossStrikeRange) break;
          const nr=r+dr*s, nc=c+dc*s;
          if (nr<0||nr>=bsR||nc<0||nc>=bsC) break;
          if (state.board[nr][nc].piece?.type==='yours') break;
          if (state.board[nr][nc].piece?.type==='enemy') captured.push({row:nr,col:nc});
          affected.push({row:nr,col:nc});
        }
      }
      if (captured.length === 0) { setMessage(''); return; }
      state.selected = { row: r, col: c };
      state.validMoves = [{ row: r, col: c, type: 'cross_detonate', captured, affected }];
      render();
      setMessage('Tap again to detonate!');
      return;
    }

    // Wrath — destroy every piece on the board, consumes one run-wide charge
    if (state.activeCard === 'wrath') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Catapult/Mad Cow, since this fires the instant you actually
      // use the card, not a per-kill sound.
      playWrathSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      // Collect every occupied square so the animation and the board wipe match.
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const allPieces = [];
      for (let r = 0; r < bsR; r++)
        for (let c = 0; c < bsC; c++)
          if (state.board[r][c].piece) allPieces.push({row:r, col:c});
      beginPendingRareEffect('wrath', { targets: allPieces });
      animateWrath(allPieces, () => {
        commitPendingRareEffect();
        setMessage('');
        // Wrath intentionally destroys the entire board. Enemy elimination
        // resolves first for this card alone, so its guaranteed mutual wipe is
        // a victory instead of making the card an automatic loss.
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Plague — randomly destroys a mastery-scaled fraction of all occupied
    // squares. At full mastery, friendly pieces are excluded from the pool.
    if (state.activeCard === 'plague') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Wrath, since this fires the instant you use the card.
      playPlagueSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const victims = getPlagueVictims(state.mode);
      beginPendingRareEffect('plague', { targets: victims });
      animatePlagueFog(() => {
        // Commit under the fog, but keep input locked until the reveal finishes.
        commitPendingRareEffect(true);
      }, () => {
        finishPendingRareAnimation();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Tornado — uses the same mastery-scaled victim fractions as Plague.
    // The funnel's random path travels through exactly the chosen squares.
    if (state.activeCard === 'tornado') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Wrath/Plague/Blizzard, since this fires the instant you use
      // the card.
      playTornadoSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const victims = getTornadoVictims(state.mode);
      beginPendingRareEffect('tornado', { targets: victims });
      animateTornado(victims, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Locust Swarm — runs down the mastery-scaled center lanes. At full
    // mastery, friendly pieces caught in the strip are spared.
    if (state.activeCard === 'locust_swarm') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Wrath/Plague/Blizzard/Tornado, since this fires the instant
      // you use the card.
      playLocustSwarmSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const swarmCols = getLocustSwarmColumns(state.mode, bsC);
      const spareFriendly = locustSwarmSparesFriendly(state.mode);
      const victims = [];
      for (let r = 0; r < bsR; r++) {
        swarmCols.forEach(c => {
          const piece = state.board[r][c].piece;
          if (piece && (!spareFriendly || piece.type !== 'yours')) victims.push({ row: r, col: c });
        });
      }
      beginPendingRareEffect('locust_swarm', { targets: victims });
      animateLocustSwarm(swarmCols, () => {
        // Commit beneath the swarm, then unlock only after it clears.
        commitPendingRareEffect(true);
      }, () => {
        finishPendingRareAnimation();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Blizzard — freeze every enemy currently on the board for the
    // mastery-scaled duration (see actOnePiece in startEnemyTurn).
    // No pieces are removed, so there's no win check needed here.
    if (state.activeCard === 'blizzard') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Wrath/Plague, since this fires the instant you use the card.
      playBlizzardSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const enemyCells = [];
      for (let r = 0; r < bsR; r++) {
        for (let c = 0; c < bsC; c++) {
          if (state.board[r][c].piece?.type === 'enemy') enemyCells.push({ row: r, col: c });
        }
      }
      const freezeTurns = getBlizzardFreezeTurns(state.mode);
      beginPendingRareEffect('blizzard', { targets: enemyCells, freezeTurns });
      animateBlizzard(() => {
        // Commit beneath the storm, then unlock only after it clears.
        commitPendingRareEffect(true);
      }, () => {
        finishPendingRareAnimation();
        setMessage('');
        maybeEndPlayerTurn();
      });
      return;
    }

    // The Jester — shoves every enemy backward and, at higher mastery,
    // outward from the center line. Obstacles stop movement; edges do not.
    if (state.activeCard === 'jester') {
      playJesterSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const enemyCells = [];
      for (let r = 0; r < bsR; r++) {
        for (let c = 0; c < bsC; c++) {
          if (state.board[r][c].piece?.type === 'enemy') enemyCells.push({ row: r, col: c });
        }
      }
      beginPendingRareEffect('jester');
      animateJester(enemyCells, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Meteor Strike — 5 squares up to 25% of the board are struck at
    // random and become permanent craters; anything standing on a struck
    // square is destroyed along with it, so a win/lose check is needed
    // here (same as Tornado).
    if (state.activeCard === 'meteor_strike') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as the other instant-activation cards, since this fires the
      // instant you use the card.
      playMeteorStrikeSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const targets = pickMeteorTargets();
      beginPendingRareEffect('meteor_strike', { targets });
      animateMeteorStrike(targets, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Wildfire — same random 5-to-25%-of-board targeting as Meteor Strike,
    // and anything standing on a struck square is destroyed the same way,
    // but the squares stay as permanent burning terrain rather than solid
    // rubble — see applyWildfireStrike/pickHazardTargets and the
    // `plainMovement` hazard rules in getValidMoves/executeMove for how
    // fire only punishes plain movement, never a card.
    if (state.activeCard === 'wildfire') {
      playWildfireSound();
      const usedCard = state.activeCard;
      const spareFriendly = wildfireSparesFriendly(state.mode);
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const targets = pickWildfireTargets();
      beginPendingRareEffect('wildfire', { targets, spareFriendly });
      animateWildfire(targets, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Shield Wall — select its mastery-scaled number of friendly units.
    // Protection lasts through the enemy's next full turn.
    // Siege — select enemy Kings. The required count automatically shrinks
    // when fewer eligible Kings remain on the board.
    if (state.activeCard === 'siege') {
      handleSiegeSelection(row, col);
      return;
    }

    if (state.activeCard === 'shield_wall') {
      handleShieldWallSelection(row, col);
      return;
    }

    // Counter — select its mastery-scaled number of friendly units.
    // Their riposte remains armed through the enemy's next full turn.
    if (state.activeCard === 'counter') {
      handleCounterSelection(row, col);
      return;
    }

    // Earthquake — displace affected pieces in independently random directions.
    // Mastery scales the distance from 1 to 2 squares, then spares friendly
    // pieces. Void/hazard landings and simultaneous destination collisions kill.
    if (state.activeCard === 'earthquake') {
      playEarthquakeSound();
      markCardUsed('earthquake');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const bsR = getBoardRows(), bsC = getBoardCols();
      const displaced = getEarthquakeDisplacement(state.mode);
      beginPendingRareEffect('earthquake', { displaced });
      animateEarthquake(displaced, bsR, bsC, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Mad Cow — first tap previews the mastery-scaled poisoned area; tapping
    // the same point again destroys every enemy there and poisons each square
    // for 3 enemy turns. Friendly pieces are not killed by the initial blast.
    if (state.activeCard === 'mad_cow') {
      const bsR = getBoardRows(), bsC = getBoardCols();
      if (state.madCowTarget &&
          state.madCowTarget.row === row && state.madCowTarget.col === col) {
        playMadCowLaunchSound();
        const { captured, affected } = state.madCowTarget;
        state.madCowTarget = null;
        markCardUsed('mad_cow');
        state.activeCard = null;
        state.activeCardUid = null;
        state.selected = null;
        state.validMoves = [];
        beginPendingRareEffect('mad_cow', { captured, affected, spareFriendly: state.madCowTargetSparesFriendly });
        animateMadCow(row, col, captured, affected, bsR, bsC, () => {
          commitPendingRareEffect();
          setMessage('');
          if (countPieces('enemy') === 0) { triggerWin(); return; }
          if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
          maybeEndPlayerTurn();
        });
        return;
      }

      const { captured, affected } = getMadCowBlast(row, col, state.mode);
      if (captured.length === 0) {
        setMessage('NO ENEMIES IN THAT AREA — CHOOSE ANOTHER POINT');
        return;
      }
      state.madCowTargetSparesFriendly = madCowSparesFriendlyFromPoison(state.mode);
      state.madCowTarget = { row, col, captured, affected };
      render();
      setMessage('TAP AGAIN TO RELEASE THE HERD');
      return;
    }

    // Puppet Master — sequentially move a mastery-scaled number of distinct
    // eligible enemy pieces. The required count uses enemies that have an
    // open adjacent destination, and shrinks again if later moves trap them.
    if (state.activeCard === 'puppet_master') {
      function finishPuppetMaster() {
        state.puppetTarget = null;
        state.puppetMoved = 0;
        state.puppetMovedIds = [];
        state.puppetMoveTarget = 0;
        markCardUsed('puppet_master');
        state.activeCard = null;
        state.activeCardUid = null;
        state.selected = null;
        state.validMoves = [];
      }

      if (state.puppetTarget) {
        const dest = state.validMoves.find(move => move.row === row && move.col === col);
        if (dest) {
          const { row: previousRow, col: previousCol } = state.puppetTarget;
          const movedPiece = state.board[previousRow][previousCol].piece;
          state.board[row][col].piece = movedPiece;
          state.board[previousRow][previousCol].piece = null;
          playChargeHitSound();
          if (state.board[row][col].hazard === 'fire' || state.board[row][col].hazard === 'poison') {
            state.board[row][col].piece = null;
          }
          if (!state.puppetMovedIds) state.puppetMovedIds = [];
          if (movedPiece?.id != null && !state.puppetMovedIds.includes(movedPiece.id)) state.puppetMovedIds.push(movedPiece.id);
          state.puppetTarget = null;
          state.validMoves = [];
          state.puppetMoved++;
          const enemiesLeft = countPieces('enemy');
          const eligibleEnemiesLeft = getPuppetEligibleEnemyCells().length;
          if (eligibleEnemiesLeft < state.puppetMoveTarget - state.puppetMoved) {
            state.puppetMoveTarget = state.puppetMoved + eligibleEnemiesLeft;
          }
          if (state.puppetMoved >= state.puppetMoveTarget || eligibleEnemiesLeft === 0) {
            finishPuppetMaster();
            render();
            setMessage('');
            if (enemiesLeft === 0) { triggerWin(); return; }
            maybeEndPlayerTurn();
          } else {
            render();
            const remaining = state.puppetMoveTarget - state.puppetMoved;
            setMessage('GOOD. ' + remaining + ' MORE — PICK AN ENEMY.');
          }
          return;
        }
        if (cell.piece?.type === 'enemy') {
          const moves = getPuppetAdjacentMoves(row, col);
          if (!moves.length) {
            setMessage('THAT ENEMY HAS NO ELIGIBLE MOVES');
            return;
          }
          state.puppetTarget = { row, col };
          state.validMoves = moves;
          render();
          setMessage('ENEMY GRABBED — PICK A DESTINATION.');
          return;
        }
        return;
      }

      if (cell.piece?.type === 'enemy') {
        const moves = getPuppetAdjacentMoves(row, col);
        if (!moves.length) {
          setMessage('THAT ENEMY HAS NO ELIGIBLE MOVES');
          return;
        }
        state.puppetTarget = { row, col };
        state.validMoves = moves;
        render();
        const remaining = state.puppetMoveTarget - state.puppetMoved;
        setMessage('ENEMY GRABBED — PICK A DESTINATION. (' + remaining + ' MOVE' + (remaining !== 1 ? 'S' : '') + ' REMAINING)');
        return;
      }
      return;
    }

    // Tidal Wave — its mastery profile controls both the flooded edges and
    // the pieces destroyed there, keeping the animation and damage aligned.
    if (state.activeCard === 'tidal_wave') {
      playTidalWaveSound();
      markCardUsed('tidal_wave');
      state.activeCard = null; state.activeCardUid = null;
      state.selected = null;  state.validMoves = [];
      const bsR = getBoardRows(), bsC = getBoardCols();
      const profile = getTidalWaveProfile(state.mode);
      const affectedRows = getTidalWaveAffectedRows(profile, bsR);
      const affected = [];
      for (const r of affectedRows) {
        for (let c = 0; c < bsC; c++) {
          const piece = state.board[r][c].piece;
          if (piece && !(profile.spareFriendly && piece.type === 'yours')) affected.push({ r, c });
        }
      }
      beginPendingRareEffect('tidal_wave', { targets: affected });
      animateTidalWave(affected, bsR, bsC, profile, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Trojan Horse — places a friendly unit according to its mastery:
    // anywhere, center, enemy third row, or enemy back row as a King.
    if (state.activeCard === 'trojan_horse') {
      const spawn = getTrojanHorseSpawn(state.mode);
      if (!spawn) {
        setMessage('NO OPEN SQUARE FOR THE TROJAN HORSE');
        return;
      }
      playTrojanHorseSound();
      markCardUsed('trojan_horse');
      state.activeCard = null; state.activeCardUid = null;
      state.selected = null;  state.validMoves = [];
      state.board[spawn.r][spawn.c].piece = {
        type: 'yours', king: spawn.king, wasKing: spawn.king,
        ability: null, id: state.pieceIdCounter++, variant: Math.floor(Math.random() * 18),
      };
      saveGame();
      render();
      setMessage('A friendly unit joins the battle!');
      maybeEndPlayerTurn();
      return;
    }

    // Thor's Hammer — the player chooses the first enemy. Each bounce then
    // hits the nearest unstruck enemy anywhere on the board, with random
    // tie-breaking only among enemies at the exact same distance.
    if (state.activeCard === 'thors_hammer') {
      if (cell.piece?.type !== 'enemy') {
        setMessage('Tap an enemy to call down the lightning.');
        return;
      }
      playThorsHammerSound();
      const bsR = getBoardRows(), bsC = getBoardCols();
      const chain = getThorsHammerChain(row, col, state.mode);
      markCardUsed('thors_hammer');
      state.activeCard = null; state.activeCardUid = null;
      state.selected = null;  state.validMoves = [];
      beginUncommonAnimationResolution();
      chain.forEach(t => { state.board[t.row][t.col].piece = null; });
      saveStagedUncommonResolution();
      animateThorsHammer(chain, bsR, bsC, () => {
        finishUncommonAnimationResolution();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Last Stand — only fires when exactly one friendly piece remains.
    // It crowns that piece and draws a mastery-scaled number of uniformly
    // random temporary cards from the complete playable action-card pool.
    if (state.activeCard === 'last_stand') {
      const bsR = getBoardRows(), bsC = getBoardCols();
      const yours = [];
      for (let r = 0; r < bsR; r++)
        for (let c = 0; c < bsC; c++)
          if (state.board[r][c].piece?.type === 'yours') yours.push(state.board[r][c].piece);
      if (yours.length !== 1) {
        setMessage('LAST STAND REQUIRES EXACTLY ONE FRIENDLY UNIT');
        return;
      }
      markCardUsed('last_stand');
      state.activeCard = null; state.activeCardUid = null;
      state.selected = null;  state.validMoves = [];
      crownFriendlyPiece(yours[0], true);
      const drawnIds = getRandomLastStandCardIds(getLastStandDrawCount(state.mode), state.mode);
      drawnIds.forEach(id => {
        state.cards.push(createRunCard(id, { temporary: true }));
      });
      saveGame();
      render();
      setMessage('Never surrender! Last unit crowned — ' + drawnIds.length + ' random card' + (drawnIds.length === 1 ? '' : 's') + ' drawn!');
      maybeEndPlayerTurn();
      return;
    }

    // Scorched Earth — select its mastery-scaled number of friendly units.
    // At full mastery activation is automatic, so this branch is a fallback.
    if (state.activeCard === 'scorched_earth') {
      handleScorchedEarthSelection(row, col);
      return;
    }

    // War Tax — add mastery-scaled temporary cards without discarding the
    // player's existing hand. Higher tiers control the rarity of the draw.
    if (state.activeCard === 'war_tax') {
      playWarTaxSound();
      markCardUsed('war_tax');
      state.activeCard = null; state.activeCardUid = null;
      state.selected = null;  state.validMoves = [];
      const drawnIds = getWarTaxDrawIds(state.mode);
      drawnIds.forEach(id => {
        state.cards.push(createRunCard(id, { temporary: true }));
      });
      saveGame();
      render();
      setMessage(`${drawnIds.length} temporary card${drawnIds.length !== 1 ? 's' : ''} added to your hand!`);
      maybeEndPlayerTurn();
      return;
    }

    // Dead Man's Hand — discard the current hand and replace it with a
    // mastery-scaled random/rarity-specific temporary hand for this level.
    if (state.activeCard === 'dead_mans_hand') {
      playDeadMansHandSound();
      const playedCard = state.cards.find(c => c.uid === state.activeCardUid);
      if (!Array.isArray(state.deadMansHandDiscardedCards)) state.deadMansHandDiscardedCards = [];
      if (!state.deadMansHandDiscardedCards.length) {
        state.deadMansHandDiscardedCards = state.cards.filter(c => !c.temporary).map(c => ({ ...c }));
      }
      markCardUsed('dead_mans_hand');
      const retainedByHero = playedCard && state.heroGambitBonusCardUid === playedCard.uid;
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      state.cards = [];
      const drawnIds = getDeadMansHandDrawIds(state.mode);
      drawnIds.forEach(id => {
        state.cards.push(createRunCard(id, { temporary: true }));
      });
      // Hero's Gambit promises a second activation of this exact physical
      // card, so it survives the first hand replacement until that use.
      if (retainedByHero) state.cards.push(playedCard);
      render();
      setMessage('NEW HAND DRAWN - ' + drawnIds.length + ' CARDS FOR THIS LEVEL ONLY!');
      maybeEndPlayerTurn();
      return;
    }

    // Hero's Gambit — sacrifice a mastery-scaled number of friendly units;
    // the next card played is free and stays available for a second use.
    if (state.activeCard === 'heros_gambit') {
      const required = getHeroGambitSacrificeCount(state.mode);
      if (cell.piece?.type === 'yours') {
        const idx = state.heroGambitSacrifices.findIndex(s => s.row === row && s.col === col);
        if (idx >= 0) {
          // Tap again to deselect.
          state.heroGambitSacrifices.splice(idx, 1);
          render();
          const remaining = required - state.heroGambitSacrifices.length;
          setMessage(`Choose ${remaining} more unit${remaining === 1 ? '' : 's'} to sacrifice.`);
        } else if (state.heroGambitSacrifices.length < required) {
          state.heroGambitSacrifices.push({ row, col });
          if (state.heroGambitSacrifices.length === required) {
            playHerosGambitSound();
            const sacrifices = [...state.heroGambitSacrifices];
            state.heroGambitSacrifices = [];
            markCardUsed('heros_gambit');
            state.activeCard = null;
            state.activeCardUid = null;
            state.selected = null;
            state.validMoves = [];
            sacrifices.forEach(s => { state.board[s.row][s.col].piece = null; });
            if (countPieces('yours') === 0) {
              state.doubleCardNext = false;
              render();
              triggerLose('wiped_out');
              return;
            }
            state.doubleCardNext = true;
            state.heroGambitBonusCardUid = null;
            state.heroGambitReservedCardUid = null;
            // Persist the purchased extra use immediately. It must survive an
            // ended turn, app backgrounding, or closing before a card is used.
            saveGame();
            render();
            updatePlusTurnUI();
            setMessage(`${required === 1 ? 'One unit' : 'Two units'} sacrificed — choose a card now and use it twice!`);
            // Don't end the turn: the player must play their buffed card.
          } else {
            render();
            const remaining = required - state.heroGambitSacrifices.length;
            setMessage(`Choose ${remaining} more unit${remaining === 1 ? '' : 's'} to sacrifice.`);
          }
        }
      }
      return;
    }

    // The Phalanx — seals a mastery-scaled number of back rows for a
    // mastery-scaled duration. No targeting needed; fires on any board tap.
    if (state.activeCard === 'phalanx') {
      const effect = getPhalanxEffect(state.mode);
      playPhalanxSound();
      markCardUsed('phalanx');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      state.phalanxTurnsLeft = (state.phalanxTurnsLeft || 0) + effect.turns;
      state.phalanxRows = Math.max(state.phalanxRows || 0, effect.rows);
      saveGame();
      render();
      setMessage(`Phalanx! Your back ${effect.rows === 1 ? 'row is' : `${effect.rows} rows are`} sealed for ${effect.turns} enemy turn${effect.turns === 1 ? '' : 's'}.`);
      maybeEndPlayerTurn();
      return;
    }

    // Coup d'Ã‰tat — demote a mastery-scaled number of enemy Kings only.
    if (state.activeCard === 'coup_detat') {
      const targets = getCoupDetatTargets(state.mode);
      markCardUsed('coup_detat');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      let demoted = 0;
      targets.forEach(({ row, col }) => {
        const piece = state.board[row]?.[col]?.piece;
        if (piece?.type !== 'enemy' || !piece.king) return;
        piece.king = false;
        // Keep back-row enemies from being immediately re-crowned by render().
        piece.wasKing = true;
        demoted++;
      });
      render();
      setMessage(demoted ? `${demoted} enemy King${demoted !== 1 ? 's' : ''} dethroned!` : 'No enemy Kings on the board.');
      maybeEndPlayerTurn();
      return;
    }


    // Conscript — fill available spaces on the player's actual back row with
    // its mastery-scaled pawn/King group. Dark squares are preferred, but any
    // open, hazard-free back-row square is eligible. If only one slot remains,
    // place as much of the group as fits; if none remain, keep the card unused.
    if (state.activeCard === 'conscript') {
      const bsR = getBoardRows(), bsC = getBoardCols();
      const backRow = bsR - 1;
      const openColumns = [];
      for (let c = 0; c < bsC; c++) {
        if (!state.board[backRow][c].piece && !state.board[backRow][c].hazard) openColumns.push(c);
      }
      openColumns.sort((a, b) => Number((backRow + b) % 2 === 1) - Number((backRow + a) % 2 === 1));
      if (!openColumns.length) {
        setMessage('NO ROOM ON YOUR BACK ROW');
        return;
      }

      playConscriptSound();
      markCardUsed('conscript');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const kingFlags = getConscriptKingFlags(state.mode);
      const placedCount = Math.min(kingFlags.length, openColumns.length);
      for (let i = 0; i < placedCount; i++) {
        const startsKing = kingFlags[i];
        const c = openColumns[i];
        state.board[backRow][c].piece = {
          type: 'yours', king: startsKing, wasKing: startsKing,
          ability: null, id: state.pieceIdCounter++, variant: Math.floor(Math.random() * 18),
        };
      }
      render();
      setMessage(placedCount + ' conscript' + (placedCount === 1 ? '' : 's') + ' joined the fight!');
      maybeEndPlayerTurn();
      return;
    }

    // King Me — tap a piece to instantly crown it. Its orb applies only
    // when this chosen piece already moved; another piece moving is irrelevant.
    if (state.activeCard === 'king_me' && cell.piece && cell.piece.type === 'yours') {
      if (!canCardTargetFriendlyPiece('king_me', cell.piece, state.mode)) {
        setMessage('UPGRADE THIS CARD TO USE IT ON A UNIT THAT ALREADY MOVED');
        return;
      }
      crownFriendlyPiece(cell.piece, true);
      playKingMeSound();
      markCardUsed('king_me');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('');
      return;
    }
    // Ambush — tap up to its mastery-scaled cap of your own pieces to arm
    // them (see getAmbushCount/CARD_MASTERY_TIERS: base arms 1, first two
    // orbs add one more each up to 3; tap an already-marked piece again to
    // un-mark it), then the final tap arms every marked piece at once. For
    // the enemy's next turn only: any enemy that ends up adjacent to an
    // armed piece is destroyed (see the proximity sweep in render()), and
    // any enemy that tries to capture it is destroyed instead of the
    // ambushed piece (see the countering-style check in actOnePiece). Burns
    // off at finishEnemyTurn. Below level 3 (see ambushCanArmMovedPiece), a
    // piece that already acted this turn can't be armed.
    if (state.activeCard === 'ambush' && cell.piece && cell.piece.type === 'yours') {
      if (state.mode === 'plus' && state.turnPhase === 'player' &&
          state.plusMovedIds.includes(cell.piece.id) && !ambushCanArmMovedPiece(state.mode)) {
        setMessage('THAT PIECE HAS ALREADY MOVED THIS TURN');
        return;
      }
      const ambushCap = Math.min(getAmbushCount(state.mode), getAmbushEligibleFriendlyCells(state.mode).length);
      if (!state.ambushTargets) state.ambushTargets = [];
      const existingIdx = state.ambushTargets.findIndex(t => t.row === row && t.col === col);
      if (existingIdx !== -1) {
        state.ambushTargets.splice(existingIdx, 1);
        render();
        setMessage(state.ambushTargets.length ? `SELECT ${ambushCap - state.ambushTargets.length} MORE` : `SELECT ${ambushCap} UNITS`);
        return;
      }
      state.ambushTargets.push({ row, col });
      if (state.ambushTargets.length < ambushCap) {
        render();
        setMessage(`SELECT ${ambushCap - state.ambushTargets.length} MORE`);
        return;
      }
      const targets = state.ambushTargets.slice();
      state.ambushTargets = [];
      targets.forEach(t => { const p = state.board[t.row][t.col].piece; if (p) p.ambushed = true; });
      markCardUsed('ambush');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('');
      return;
    }
    // Once More — tap one of your pieces that already acted this turn to
    // free it up and let it move again (New Run only — see plusMovedIds).
    if (state.activeCard === 'once_more' && cell.piece && cell.piece.type === 'yours') {
      if (!state.plusMovedIds || !state.plusMovedIds.includes(cell.piece.id)) {
        setMessage('THAT PIECE HAS NOT MOVED YET THIS TURN');
        return;
      }
      state.plusMovedIds = state.plusMovedIds.filter(id => id !== cell.piece.id);
      playOnceMoreSound();
      markCardUsed('once_more');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('');
      maybeEndPlayerTurn();
      return;
    }
    // Usurp — tap an enemy piece to replace it with a new yours piece
    if (state.activeCard === 'usurp' && cell.piece && cell.piece.type === 'enemy') {
      const wasEnemyKing = !!cell.piece.king;
      cell.piece = { type: 'yours', king: wasEnemyKing, wasKing: wasEnemyKing, ability: null, id: state.pieceIdCounter++, variant: Math.floor(Math.random() * 18) };
      playUsurpSound();
      markCardUsed('usurp');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('');
      // Check win
      if (countPieces('enemy') === 0) { triggerWin(); return; }
      maybeEndPlayerTurn();
      return;
    }
    if (cell.piece && cell.piece.type === 'yours') {
      state.selected = { row, col };
      state.validMoves = getValidMoves(row, col);
      render();
      setMessage('');
      return;
    }
    return;
  }

  // Step 2: if card active AND piece selected, execute card move
  if (state.activeCard && state.selected) {
    // Revert card — tap your own piece to strip its ability
    // (Assassinate and Demotion are fully handled in step 1 above — they never
    // set state.selected, so step 2 never sees them.)

    // Cross Strike in step 2 — tapping the already-armed piece again confirms
    // and detonates; tapping a different one of your pieces re-arms on that
    // piece instead (lets you change your mind about which piece to use).
    if (state.activeCard === 'cross_strike' && cell.piece && cell.piece.type === 'yours') {
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const bsMax = Math.max(bsR, bsC);
      const r = row, c = col;
      if (state.selected.row === r && state.selected.col === c) {
        const confirmMove = state.validMoves.find(m => m.row === r && m.col === c);
        const captured = confirmMove ? confirmMove.captured : [];
        if (captured.length === 0) { setMessage(''); return; }
        const usedCard = state.activeCard;
        markCardUsed(usedCard);
        state.lastUsedCard = null;
        state.activeCard = null;
        state.activeCardUid = null;
        state.selected = null;
        state.validMoves = [];
        const movedPieceId = cell.piece.id;
        beginUncommonAnimationResolution();
        captured.forEach(cap => { state.board[cap.row][cap.col].piece = null; });
        plusMarkPieceMoved(movedPieceId);
        saveStagedUncommonResolution();
        animateCrossStrike(r, c, captured, () => {
          finishUncommonAnimationResolution();
          if (countPieces('enemy') === 0) { triggerWin(); return; }
          setMessage('');
        });
        return;
      }
      const captured = [];
      const affected = [];
      const crossStrikeRange = getCrossStrikeRange(state.mode);
      for (const dr of [-1,1]) for (const dc of [-1,1]) {
        for (let s=1; s<bsMax; s++) {
          if (s > crossStrikeRange) break;
          const nr=r+dr*s, nc=c+dc*s;
          if (nr<0||nr>=bsR||nc<0||nc>=bsC) break;
          if (state.board[nr][nc].piece?.type==='yours') break;
          if (state.board[nr][nc].piece?.type==='enemy') captured.push({row:nr,col:nc});
          affected.push({row:nr,col:nc});
        }
      }
      if (captured.length === 0) { setMessage(''); state.selected = null; state.validMoves = []; render(); return; }
      state.selected = { row: r, col: c };
      state.validMoves = [{ row: r, col: c, type: 'cross_detonate', captured, affected }];
      render();
      setMessage('Tap again to detonate!');
      return;
    }

    // Wrath in step 2 — activates immediately on any tap
    if (state.activeCard === 'wrath') {
      playWrathSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const allPieces = [];
      for (let r = 0; r < bsR; r++)
        for (let c = 0; c < bsC; c++)
          if (state.board[r][c].piece) allPieces.push({row:r, col:c});
      beginPendingRareEffect('wrath', { targets: allPieces });
      animateWrath(allPieces, () => {
        commitPendingRareEffect();
        setMessage('');
        // Wrath intentionally destroys the entire board. Enemy elimination
        // resolves first for this card alone, so its guaranteed mutual wipe is
        // a victory instead of making the card an automatic loss.
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // T-Strike in step 2 also — tapping the already-armed piece again
    // confirms and detonates; tapping a different one of your pieces
    // re-arms on that piece instead.
    if (state.activeCard === 't_strike' && cell.piece && cell.piece.type === 'yours') {
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const r = row, c = col;
      if (state.selected.row === r && state.selected.col === c) {
        const confirmMove = state.validMoves.find(m => m.row === r && m.col === c);
        const captured = confirmMove ? confirmMove.captured : [];
        if (captured.length === 0) { setMessage(''); return; }
        const usedCard = state.activeCard;
        markCardUsed(usedCard);
        state.lastUsedCard = null;
        state.activeCard = null;
        state.activeCardUid = null;
        state.selected = null;
        state.validMoves = [];
        const movedPieceId = cell.piece.id;
        beginUncommonAnimationResolution();
        captured.forEach(cap => { state.board[cap.row][cap.col].piece = null; });
        plusMarkPieceMoved(movedPieceId);
        saveStagedUncommonResolution();
        animateBallista(r, c, captured, () => {
          finishUncommonAnimationResolution();
          if (countPieces('enemy') === 0) { triggerWin(); return; }
          setMessage('');
        });
        return;
      }
      const { captured, affected } = getTStrikePattern(r, c, state.mode);
      if (captured.length === 0) { setMessage(''); state.selected = null; state.validMoves = []; render(); return; }
      state.selected = { row: r, col: c };
      state.validMoves = [{ row: r, col: c, type: 't_detonate', captured, affected }];
      render();
      setMessage('Tap again to detonate!');
      return;
    }

    // Plague — randomly destroys a mastery-scaled fraction of all occupied
    // squares. At full mastery, friendly pieces are excluded from the pool.
    if (state.activeCard === 'plague') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Wrath, since this fires the instant you use the card.
      playPlagueSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const victims = getPlagueVictims(state.mode);
      beginPendingRareEffect('plague', { targets: victims });
      animatePlagueFog(() => {
        // Commit under the fog, but keep input locked until the reveal finishes.
        commitPendingRareEffect(true);
      }, () => {
        finishPendingRareAnimation();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Tornado — uses the same mastery-scaled victim fractions as Plague.
    // The funnel's random path travels through exactly the chosen squares.
    if (state.activeCard === 'tornado') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Wrath/Plague/Blizzard, since this fires the instant you use
      // the card.
      playTornadoSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const victims = getTornadoVictims(state.mode);
      beginPendingRareEffect('tornado', { targets: victims });
      animateTornado(victims, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Locust Swarm — runs down the mastery-scaled center lanes. At full
    // mastery, friendly pieces caught in the strip are spared.
    if (state.activeCard === 'locust_swarm') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Wrath/Plague/Blizzard/Tornado, since this fires the instant
      // you use the card.
      playLocustSwarmSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const swarmCols = getLocustSwarmColumns(state.mode, bsC);
      const spareFriendly = locustSwarmSparesFriendly(state.mode);
      const victims = [];
      for (let r = 0; r < bsR; r++) {
        swarmCols.forEach(c => {
          const piece = state.board[r][c].piece;
          if (piece && (!spareFriendly || piece.type !== 'yours')) victims.push({ row: r, col: c });
        });
      }
      beginPendingRareEffect('locust_swarm', { targets: victims });
      animateLocustSwarm(swarmCols, () => {
        // Commit beneath the swarm, then unlock only after it clears.
        commitPendingRareEffect(true);
      }, () => {
        finishPendingRareAnimation();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Blizzard — freeze every enemy currently on the board for the
    // mastery-scaled duration (see actOnePiece in startEnemyTurn).
    // No pieces are removed, so there's no win check needed here.
    if (state.activeCard === 'blizzard') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as Wrath/Plague, since this fires the instant you use the card.
      playBlizzardSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const enemyCells = [];
      for (let r = 0; r < bsR; r++) {
        for (let c = 0; c < bsC; c++) {
          if (state.board[r][c].piece?.type === 'enemy') enemyCells.push({ row: r, col: c });
        }
      }
      const freezeTurns = getBlizzardFreezeTurns(state.mode);
      beginPendingRareEffect('blizzard', { targets: enemyCells, freezeTurns });
      animateBlizzard(() => {
        // Commit beneath the storm, then unlock only after it clears.
        commitPendingRareEffect(true);
      }, () => {
        finishPendingRareAnimation();
        setMessage('');
        maybeEndPlayerTurn();
      });
      return;
    }

    // The Jester — shoves every enemy backward and, at higher mastery,
    // outward from the center line. Obstacles stop movement; edges do not.
    if (state.activeCard === 'jester') {
      playJesterSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const bsR = getBoardRows();
      const bsC = getBoardCols();
      const enemyCells = [];
      for (let r = 0; r < bsR; r++) {
        for (let c = 0; c < bsC; c++) {
          if (state.board[r][c].piece?.type === 'enemy') enemyCells.push({ row: r, col: c });
        }
      }
      beginPendingRareEffect('jester');
      animateJester(enemyCells, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Meteor Strike — 5 squares up to 25% of the board are struck at
    // random and become permanent craters; anything standing on a struck
    // square is destroyed along with it, so a win/lose check is needed
    // here (same as Tornado).
    if (state.activeCard === 'meteor_strike') {
      // Fired first, before anything else in this branch — same zero-delay
      // rule as the other instant-activation cards, since this fires the
      // instant you use the card.
      playMeteorStrikeSound();
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const targets = pickMeteorTargets();
      beginPendingRareEffect('meteor_strike', { targets });
      animateMeteorStrike(targets, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Wildfire — same random 5-to-25%-of-board targeting as Meteor Strike,
    // and anything standing on a struck square is destroyed the same way,
    // but the squares stay as permanent burning terrain rather than solid
    // rubble — see applyWildfireStrike/pickHazardTargets and the
    // `plainMovement` hazard rules in getValidMoves/executeMove for how
    // fire only punishes plain movement, never a card.
    if (state.activeCard === 'wildfire') {
      playWildfireSound();
      const usedCard = state.activeCard;
      const spareFriendly = wildfireSparesFriendly(state.mode);
      markCardUsed(usedCard);
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      const targets = pickWildfireTargets();
      beginPendingRareEffect('wildfire', { targets, spareFriendly });
      animateWildfire(targets, () => {
        commitPendingRareEffect();
        setMessage('');
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        maybeEndPlayerTurn();
      });
      return;
    }

    // Shield Wall — select its mastery-scaled number of friendly units.
    // Protection lasts through the enemy's next full turn.
    // Siege — select enemy Kings. The required count automatically shrinks
    // when fewer eligible Kings remain on the board.
    if (state.activeCard === 'siege') {
      handleSiegeSelection(row, col);
      return;
    }

    if (state.activeCard === 'shield_wall') {
      handleShieldWallSelection(row, col);
      return;
    }

    // Counter — select its mastery-scaled number of friendly units.
    // Their riposte remains armed through the enemy's next full turn.
    if (state.activeCard === 'counter') {
      handleCounterSelection(row, col);
      return;
    }

    // King Me in step 2 also — the restriction follows this chosen piece.
    if (state.activeCard === 'king_me' && cell.piece && cell.piece.type === 'yours') {
      if (!canCardTargetFriendlyPiece('king_me', cell.piece, state.mode)) {
        setMessage('UPGRADE THIS CARD TO USE IT ON A UNIT THAT ALREADY MOVED');
        return;
      }
      crownFriendlyPiece(cell.piece, true);
      playKingMeSound();
      markCardUsed('king_me');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('');
      return;
    }
    // Ambush in step 2 also (practically unreachable — Ambush never sets
    // state.selected — but kept in sync with the step 1 branch above just
    // in case some other flow leaves state.selected set while Ambush is
    // active)
    if (state.activeCard === 'ambush' && cell.piece && cell.piece.type === 'yours') {
      if (state.mode === 'plus' && state.turnPhase === 'player' &&
          state.plusMovedIds.includes(cell.piece.id) && !ambushCanArmMovedPiece(state.mode)) {
        setMessage('THAT PIECE HAS ALREADY MOVED THIS TURN');
        return;
      }
      const ambushCap = Math.min(getAmbushCount(state.mode), getAmbushEligibleFriendlyCells(state.mode).length);
      if (!state.ambushTargets) state.ambushTargets = [];
      const existingIdx = state.ambushTargets.findIndex(t => t.row === row && t.col === col);
      if (existingIdx !== -1) {
        state.ambushTargets.splice(existingIdx, 1);
        render();
        setMessage(state.ambushTargets.length ? `SELECT ${ambushCap - state.ambushTargets.length} MORE` : `SELECT ${ambushCap} UNITS`);
        return;
      }
      state.ambushTargets.push({ row, col });
      if (state.ambushTargets.length < ambushCap) {
        render();
        setMessage(`SELECT ${ambushCap - state.ambushTargets.length} MORE`);
        return;
      }
      const targets = state.ambushTargets.slice();
      state.ambushTargets = [];
      targets.forEach(t => { const p = state.board[t.row][t.col].piece; if (p) p.ambushed = true; });
      markCardUsed('ambush');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('');
      return;
    }
    // Once More in step 2 also
    if (state.activeCard === 'once_more' && cell.piece && cell.piece.type === 'yours') {
      if (!state.plusMovedIds || !state.plusMovedIds.includes(cell.piece.id)) {
        setMessage('THAT PIECE HAS NOT MOVED YET THIS TURN');
        return;
      }
      state.plusMovedIds = state.plusMovedIds.filter(id => id !== cell.piece.id);
      playOnceMoreSound();
      markCardUsed('once_more');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('');
      maybeEndPlayerTurn();
      return;
    }
    // Usurp in step 2
    if (state.activeCard === 'usurp' && cell.piece && cell.piece.type === 'enemy') {
      const wasEnemyKing = !!cell.piece.king;
      cell.piece = { type: 'yours', king: wasEnemyKing, wasKing: wasEnemyKing, ability: null, id: state.pieceIdCounter++, variant: Math.floor(Math.random() * 18) };
      playUsurpSound();
      markCardUsed('usurp');
      state.activeCard = null;
      state.activeCardUid = null;
      state.selected = null;
      state.validMoves = [];
      render();
      setMessage('');
      if (countPieces('enemy') === 0) { triggerWin(); return; }
      maybeEndPlayerTurn();
      return;
    }
    const validTarget = state.validMoves.find(m => m.row === row && m.col === col);
    // Catapult picks from dozens of possible landing tiles across the whole
    // board, so a single tap can't double as "preview" AND "commit" the way
    // it can for a card with only one real destination — tapping a tile
    // first arms it (shows the 3x3 blast preview), tapping that SAME tile
    // again actually launches. Tapping a different tile just re-arms there.
    if (validTarget && validTarget.type === 'catapult') {
      if (validTarget.armed) {
        // Fired first, before anything else in this branch — see the sound
        // function's own comment on why zero delay matters here specifically.
        playCatapultLaunchSound();
        const usedCard = state.activeCard;
        markCardUsed(usedCard);
        state.lastUsedCard = usedCard;
        state.activeCard = null;
        state.activeCardUid = null;
        executeMove(state.selected.row, state.selected.col, validTarget);
        return;
      }
      state.validMoves.forEach(m => { m.armed = false; });
      validTarget.armed = true;
      render();
      setMessage('Tap again to launch!');
      return;
    }
    if (validTarget) {
      const usedCard = state.activeCard;
      markCardUsed(usedCard);
      state.lastUsedCard = usedCard;
      state.activeCard = null;
      state.activeCardUid = null;
      executeMove(state.selected.row, state.selected.col, validTarget);
      return;
    }
    // Reselect a different piece
    if (cell.piece && cell.piece.type === 'yours') {
      state.selected = { row, col };
      state.validMoves = getValidMoves(row, col);
      render();
      return;
    }
    // Cancel selection (keep card active)
    state.selected = null;
    state.validMoves = [];
    render();
    return;
  }

  // Normal flow: check valid move target
  const validTarget = state.validMoves.find(m => m.row === row && m.col === col);
  if (validTarget && state.selected) {
    executeMove(state.selected.row, state.selected.col, validTarget);
    return;
  }

  // Select your piece
  if (cell.piece && cell.piece.type === 'yours') {
    state.selected = { row, col };
    state.validMoves = getValidMoves(row, col);
    refreshPlainSelectionHighlights();
    if (state.validMoves.length === 0) {
      setMessage('No valid moves for this piece. Try another.');
    } else {
      const p = cell.piece;
      const abilityStr = p.king ? 'King' : p.ability ? p.ability.replace('_', ' ') : 'standard';
      setMessage('');
    }
    return;
  }

  // Deselect
  state.selected = null;
  state.validMoves = [];
  refreshPlainSelectionHighlights();
  setMessage('');
}

// Shared by every canvas-based card/move animation: the naive
// col*cellW+cellW/2 math assumes the board is an even grid with zero gap,
// but #board actually has its own small padding + inter-cell gap (for the
// checker pattern), so that math drifts from the real piece position more
// the further a cell is from the top-left corner. Cells are always
// (re)built in row-major order every render(), so boardEl.children[row*bs+col]
// is always the real DOM cell — reading its actual rect sidesteps the
// padding/gap math entirely and lines up exactly regardless of CSS changes.
function getCellCenter(boardEl, boardRect, cols, row, col) {
  const idx = row * cols + col;
  const cellEl = boardEl.children[idx];
  if (cellEl) {
    const r = cellEl.getBoundingClientRect();
    return {
      x: r.left - boardRect.left + r.width / 2,
      y: r.top - boardRect.top + r.height / 2,
      w: r.width,
      h: r.height,
    };
  }
  // Fallback (shouldn't happen): even-grid approximation.
  const rows = getBoardRows();
  const cellW = boardRect.width / cols, cellH = boardRect.height / rows;
  return { x: col * cellW + cellW / 2, y: row * cellH + cellH / 2, w: cellW, h: cellH };
}

// 2.5D tilt support: every animate*() function below builds its own
// full-board <canvas> overlay and used to append it straight into #board,
// positioned with `position:absolute; top:0; left:0`. Now that #board sits
// inside a tilted (rotateX) .board-tilt wrapper, appending the canvas THERE
// would tilt the canvas's own pixel grid along with it — every meteor,
// lightning bolt, flash, etc. is drawn using flat 2D math (getCellCenter,
// boardRect-relative offsets), and warping that math's target surface in 3D
// would throw all of it off. Instead, this attaches the canvas to <body>
// with `position:fixed`, sized and placed at the board's ALREADY-PROJECTED
// on-screen rect (boardRect, from boardEl.getBoundingClientRect() — which
// browsers compute post-transform automatically). The effect then draws
// perfectly flat on top of the tilted board, like a HUD overlay, using
// every existing animate*() function's math completely unchanged.
//
// Known trade-off: a handful of animations also shake .board-wrap
// (.wrath-shake, .meteor-shake, .tornado-shake) for a couple hundred ms.
// Since this overlay's position is captured once at animation start rather
// than re-synced every frame, it won't visibly shake along with the board
// during that brief window — a minor, easy-to-revisit polish item if it
// turns out to be distracting in practice.
function createCartoonFxFrame(boardRect, kind, zIndex) {
  return { remove() {} };
}

function createEffectAccentCanvas(boardRect, kind, zIndex) {
  const accent = document.createElement('canvas');
  accent.className = 'manuscript-fx-accent';
  accent.width = Math.max(1, Math.round(boardRect.width));
  accent.height = Math.max(1, Math.round(boardRect.height));
  accent.style.cssText = `position:fixed;left:${boardRect.left}px;top:${boardRect.top}px;width:${boardRect.width}px;height:${boardRect.height}px;pointer-events:none;z-index:${Math.max(1, (Number(zIndex) || 50) - 1)};opacity:.72;`;
  const ctx = accent.getContext('2d');
  const W = accent.width, H = accent.height;
  const unit = Math.min(W, H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function outlinedLine(x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = 'rgba(31,24,17,.72)';
    ctx.lineWidth = width + 3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  if (kind === 'tornado' || kind === 'jester' || kind === 'charge' || kind === 'war-horse') {
    for (let i = 0; i < 18; i++) {
      const r = unit * (.12 + i * .023);
      const start = i * .83;
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(238,205,107,.58)' : 'rgba(211,231,220,.46)';
      ctx.lineWidth = 2 + (i % 4) * .55;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, start, start + 1.05 + (i % 3) * .28);
      ctx.stroke();
    }
  } else if (kind === 'tidal' || kind === 'catapult') {
    for (let i = 0; i < 26; i++) {
      const x = (i + .5) * W / 26;
      const crest = 5 + (i % 5) * 2.5;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,239,.78)' : 'rgba(119,224,236,.72)';
      ctx.beginPath(); ctx.arc(x, crest, 2.5 + (i % 4), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - x, H - crest, 2.5 + ((i + 2) % 4), 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'blizzard') {
    for (let i = 0; i < 30; i++) {
      const x = (i * 67 % 101) / 101 * W;
      const y = (i * 43 % 97) / 97 * H;
      const r = 3 + (i % 4) * 1.5;
      outlinedLine(x - r, y, x + r, y, 'rgba(239,255,255,.8)', 1.2);
      outlinedLine(x, y - r, x, y + r, 'rgba(169,231,241,.78)', 1.2);
    }
  } else if (kind === 'wildfire' || kind === 'meteor') {
    for (let i = 0; i < 28; i++) {
      const a = i * 2.399;
      const r1 = unit * (.08 + (i % 5) * .025);
      const r2 = r1 + unit * (.06 + (i % 3) * .018);
      outlinedLine(W/2 + Math.cos(a)*r1, H/2 + Math.sin(a)*r1, W/2 + Math.cos(a)*r2, H/2 + Math.sin(a)*r2, i % 2 ? 'rgba(255,190,45,.82)' : 'rgba(231,67,38,.82)', 2);
    }
  } else if (kind === 'wrath' || kind === 'thor' || kind === 'divine' || kind === 'lazarus') {
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * 2 * i / 16;
      const r1 = unit * .18, r2 = unit * (.4 + (i % 3) * .045);
      outlinedLine(W/2 + Math.cos(a)*r1, H/2 + Math.sin(a)*r1, W/2 + Math.cos(a)*r2, H/2 + Math.sin(a)*r2, i % 2 ? 'rgba(255,235,117,.88)' : 'rgba(111,184,255,.78)', 2.2);
    }
  } else if (kind === 'black-hole' || kind === 'sands') {
    for (let i = 0; i < 24; i++) {
      const a = i * 2.399;
      const r1 = unit * (.23 + (i % 4) * .025);
      const r2 = r1 + unit * .11;
      outlinedLine(W/2 + Math.cos(a)*r1, H/2 + Math.sin(a)*r1, W/2 + Math.cos(a)*r2, H/2 + Math.sin(a)*r2, i % 3 ? 'rgba(203,143,255,.72)' : 'rgba(255,215,88,.82)', 1.7);
    }
  } else if (kind === 'plague' || kind === 'mad-cow' || kind === 'locust') {
    for (let i = 0; i < 30; i++) {
      const x = (i * 73 % 103) / 103 * W;
      const y = (i * 47 % 107) / 107 * H;
      const r = 1.8 + (i % 5);
      ctx.fillStyle = i % 3 ? 'rgba(158,190,69,.64)' : 'rgba(218,191,67,.7)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'shield' || kind === 'counter' || kind === 'close-ranks') {
    const inset = unit * .055;
    ctx.strokeStyle = 'rgba(29,23,17,.82)'; ctx.lineWidth = 8;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    ctx.strokeStyle = kind === 'counter' ? 'rgba(105,204,239,.85)' : 'rgba(255,214,86,.86)';
    ctx.lineWidth = 3;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    for (let i = 0; i < 12; i++) {
      const x = inset + (W - inset * 2) * (i + .5) / 12;
      outlinedLine(x, inset, x + (i % 2 ? -7 : 7), inset + unit * .08, 'rgba(246,235,197,.8)', 2);
      outlinedLine(W - x, H - inset, W - x + (i % 2 ? 7 : -7), H - inset - unit * .08, 'rgba(246,235,197,.8)', 2);
    }
  } else if (kind === 'strike' || kind === 'ballista' || kind === 'assassinate' || kind === 'capture') {
    for (let i = 0; i < 18; i++) {
      const a = Math.PI * 2 * i / 18;
      const bend = (i % 3 - 1) * unit * .035;
      outlinedLine(W/2 + Math.cos(a)*unit*.08, H/2 + Math.sin(a)*unit*.08,
        W/2 + Math.cos(a)*unit*.43 - Math.sin(a)*bend,
        H/2 + Math.sin(a)*unit*.43 + Math.cos(a)*bend,
        i % 2 ? 'rgba(250,224,129,.82)' : 'rgba(206,58,58,.76)', 2.1);
    }
  } else if (kind === 'earthquake') {
    for (let i = 0; i < 9; i++) {
      const x = W * (i + .5) / 9;
      ctx.strokeStyle = i % 2 ? 'rgba(255,202,74,.8)' : 'rgba(225,92,49,.78)';
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(x, 0);
      for (let s = 1; s <= 7; s++) ctx.lineTo(x + (s % 2 ? 9 : -8), H * s / 7);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * 2 * i / 14;
      outlinedLine(W/2 + Math.cos(a)*unit*.25, H/2 + Math.sin(a)*unit*.25, W/2 + Math.cos(a)*unit*.4, H/2 + Math.sin(a)*unit*.4, i % 2 ? 'rgba(244,208,104,.62)' : 'rgba(239,242,220,.56)', 1.8);
    }
  }

  document.body.appendChild(accent);
  const accentDuration = kind === 'tornado' || kind === 'tidal' || kind === 'black-hole' ? 1450 : 950;
  accent.animate([
    { opacity: .08, transform: 'scale(.94) rotate(-1deg)' },
    { opacity: .78, transform: 'scale(1.015) rotate(.7deg)', offset: .52 },
    { opacity: .28, transform: 'scale(1.04) rotate(1.2deg)' }
  ], { duration: accentDuration, iterations: kind === 'tornado' ? 2 : 1, direction: 'alternate', easing: 'cubic-bezier(.2,.75,.2,1)' });
  setTimeout(() => accent.isConnected && accent.remove(), accentDuration * (kind === 'tornado' ? 2 : 1) + 120);
  return accent;
}

function attachBoardOverlayCanvas(canvas, boardRect) {
  canvas.style.position = 'fixed';
  canvas.style.left = boardRect.left + 'px';
  canvas.style.top = boardRect.top + 'px';
  document.body.appendChild(canvas);
}

function animateInfantryCapture(fromRow, fromCol, toRow, toCol, captured, callback) {
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width / bsC;
  const cellH = boardRect.height / bsR;

  const canvas = createManuscriptFxCanvas('capture');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `position:absolute;top:0;left:0;width:${boardRect.width}px;height:${boardRect.height}px;pointer-events:none;z-index:50;`;
  // Anchor to the actual #board element, not .board-wrap — the wrap has its
  // own padding around the board (for the frame/corners), so a canvas placed
  // at .board-wrap's top:0/left:0 draws offset from the real piece
  // positions by that padding amount. #board has none, so this lines up
  // exactly regardless of frame styling.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const fromC = getCellCenter(boardEl, boardRect, bsC, fromRow, fromCol);
  const toC = getCellCenter(boardEl, boardRect, bsC, toRow, toCol);
  const fcx = fromC.x, fcy = fromC.y, tcx = toC.x, tcy = toC.y;

  // Find actual captured enemy position
  const cap = captured[0] || {row: toRow, col: toCol};
  const capC = getCellCenter(boardEl, boardRect, bsC, cap.row, cap.col);
  const ecx = capC.x, ecy = capC.y;

  const ang = Math.atan2(ecy - fcy, ecx - fcx);
  const perp = ang + Math.PI/2;
  const dist = Math.sqrt((ecx-fcx)**2 + (ecy-fcy)**2);
  const spreads = [-10, 0, 10];

  const JIGGLE=280, JERK=80, FLY=180, IMPACT=360;
  const TOTAL = JIGGLE+JERK+FLY+IMPACT;
  let start = null;

  function eOut(t){return 1-(1-t)**2;}
  function eIn(t){return t*t;}

  // Jiggle the piece DOM element
  const cells = boardEl.querySelectorAll('.cell');
  const fromIdx = fromRow * bsC + fromCol;
  const fromCell = cells[fromIdx];
  const pieceEl = fromCell?.querySelector('.piece');
  const capCell = cells[cap.row * bsC + cap.col];
  const capPieceEl = capCell?.querySelector('.piece');
  let knockedBack = false;

  function draw(ts) {
    if (!start) start = ts;
    const el = ts - start;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (el < JIGGLE) {
      const t = el/JIGGLE;
      const shake = Math.sin(t*Math.PI*8)*3;
      if (pieceEl) pieceEl.style.transform = `translateX(${shake}px)`;

    } else if (el < JIGGLE+JERK) {
      const t = (el-JIGGLE)/JERK;
      const jx = Math.cos(ang)*eIn(t)*5;
      const jy = Math.sin(ang)*eIn(t)*5;
      if (pieceEl) pieceEl.style.transform = `translate(${jx}px,${jy}px)`;

    } else if (el < JIGGLE+JERK+FLY) {
      const t = eOut((el-JIGGLE-JERK)/FLY);
      if (pieceEl) pieceEl.style.transform = `translate(${Math.cos(ang)*5}px,${Math.sin(ang)*5}px)`;

      spreads.forEach(s => {
        const ox = Math.cos(perp)*s, oy = Math.sin(perp)*s;
        const sx = fcx+Math.cos(ang)*36+ox, sy = fcy+Math.sin(ang)*36+oy;
        const tx = fcx+Math.cos(ang)*(36+t*(dist-36))+ox;
        const ty = fcy+Math.sin(ang)*(36+t*(dist-36))+oy;
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(tx-Math.cos(ang)*10,ty-Math.sin(ang)*10);
        ctx.strokeStyle='#c8922a'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.stroke();
        ctx.save(); ctx.translate(tx,ty); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(-3,-5); ctx.lineTo(-3,5); ctx.closePath();
        ctx.fillStyle='#e8e0c0'; ctx.fill(); ctx.restore();
      });

    } else {
      const t = (el-JIGGLE-JERK-FLY)/IMPACT;
      if (pieceEl) pieceEl.style.transform = `translate(${Math.cos(ang)*5*(1-eOut(Math.min(t*4,1)))}px,${Math.sin(ang)*5*(1-eOut(Math.min(t*4,1)))}px)`;

      // The instant the spear actually lands, knock the real piece backward
      // and away rather than just letting the canvas burst mask it fading
      // out in place — consistent with how Charge/Catapult sell a capture.
      if (!knockedBack && capPieceEl) {
        knockedBack = true;
        const scatter = (Math.random() - 0.5) * 40;
        const kx = Math.cos(ang) * 90 + Math.cos(perp) * scatter;
        const ky = Math.sin(ang) * 90 + Math.sin(perp) * scatter;
        const spin = (Math.random() > 0.5 ? 1 : -1) * (250 + Math.random() * 200);
        capPieceEl.style.zIndex = '15';
        capPieceEl.style.transition = `transform ${IMPACT}ms cubic-bezier(0.2,0.8,0.4,1), opacity ${IMPACT}ms ease-in`;
        capPieceEl.style.transform = `translate(${kx}px, ${ky}px) rotate(${spin}deg) scale(0.85)`;
        capPieceEl.style.opacity = '0';
      }

      for (let i=0;i<3;i++) {
        const rt=Math.max(0,t-i*0.1); if(rt<=0)continue;
        ctx.beginPath(); ctx.arc(ecx,ecy,rt*48,0,Math.PI*2);
        ctx.strokeStyle=`rgba(255,${80+i*50},0,${Math.max(0,1-rt*1.3)})`; ctx.lineWidth=3-i*0.5; ctx.stroke();
      }
      if (t<0.3){ctx.beginPath();ctx.arc(ecx,ecy,36,0,Math.PI*2);ctx.fillStyle=`rgba(255,210,60,${(1-t/0.3)*0.8})`;ctx.fill();}
      for (let i=0;i<10;i++){
        const a2=(i/10)*Math.PI*2,d=eOut(t)*48,pa=Math.max(0,1-t*1.6);
        ctx.beginPath();ctx.arc(ecx+Math.cos(a2)*d,ecy+Math.sin(a2)*d,3,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,${60+i*18},0,${pa})`;ctx.fill();
      }
      if (t>0.35){
        ctx.beginPath();ctx.arc(ecx,ecy,38,0,Math.PI*2);
        ctx.fillStyle=`rgba(13,11,6,${Math.min((t-0.35)/0.4,1)})`;ctx.fill();
      }
      if (t>=1){
        if(pieceEl) pieceEl.style.transform='';
        canvas.remove(); callback(); return;
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// Burn every square Scorched Earth traverses, from the first square after
// the unit's origin through its destination. This applies equally to slides
// and capture jumps, so the complete movement path visibly catches fire.
function applyScorchedEarth(fromRow, fromCol, move, piece) {
  if ((state.scorchedEarthTurns || 0) <= 0) return;
  const selected = state.scorchedEarthAllUnits || (state.scorchedEarthUnitIds || []).includes(piece?.id);
  if (!selected) return;
  if (move.stayInPlace) return;
  const bsR = getBoardRows(), bsC = getBoardCols();
  const toR = move.row, toC = move.col;
  if (!state.scorchedEarthSquares) state.scorchedEarthSquares = [];

  function ignite(r, c) {
    state.board[r][c].hazard = 'fire';
    state.board[r][c].fireSource = 'scorched_earth';
    if (!state.scorchedEarthSquares.some(square => square.r === r && square.c === c))
      state.scorchedEarthSquares.push({ r, c });
  }

  const dr = Math.sign(toR - fromRow);
  const dc = Math.sign(toC - fromCol);
  if (dr === 0 && dc === 0) { ignite(toR, toC); return; }
  let r = fromRow + dr, c = fromCol + dc;
  while (r >= 0 && r < bsR && c >= 0 && c < bsC) {
    ignite(r, c);
    if (r === toR && c === toC) break;
    r += dr; c += dc;
  }
}

function executeMove(fromRow, fromCol, move) {
  // Portcullis is a defensive seal against the enemy only. Friendly units
  // may cross the selected row normally; enemy move generation applies the
  // crossing restriction in getEnemyMoves().
  // A real move is actually being committed — this is the run-timer's
  // activity signal (see markActivity()'s comment above). Deliberately at
  // the very top so it fires identically for every move type/card ability
  // this function handles below, instead of needing a call in each branch.
  markActivity();
  noteGlorySkillCapture(move);
  const piece = state.board[fromRow][fromCol].piece;

  // Captured BEFORE state.lastUsedCard gets cleared just below — Phantom
  // March (teleport) has no dedicated animation branch of its own, it falls
  // all the way through to the generic move-placement path further down, so
  // this is the only reliable place left to know the whoosh sound belongs
  // to THIS move once we get there.
  const isPhantomMarchMove = piece.ability === 'teleport' || state.lastUsedCard === 'teleport';

  // Same reasoning as isPhantomMarchMove just above — Feint has no dedicated
  // animation branch either, so this is the only reliable place left to
  // know the whoosh sound belongs to THIS move once it reaches the generic
  // placement path.
  const isFeintMove = piece.ability === 'feint' || state.lastUsedCard === 'feint';

  // Side Step — same "no dedicated animation branch" situation as Phantom
  // March/Feint above, so this is captured here before state.lastUsedCard
  // gets cleared. Reuses Chariot/Cavalry/Infantry Charge's impact sound
  // (playChargeHitSound) rather than a bespoke one, per design.
  const isSideStepMove = piece.ability === 'side_step' || state.lastUsedCard === 'side_step';

  // All cards are one-time use — clear ability after the move, no permanent grants
  if (state.lastUsedCard) piece.ability = null;
  state.lastUsedCard = null;

  // Infantry March capture — play spear animation first
  if ((piece.ability === 'vertical_jump' || state.lastUsedCard === 'vertical_jump') &&
      move.type === 'capture') {
    const captured = [{row: move.over.row, col: move.over.col}];
    animateInfantryCapture(fromRow, fromCol, move.row, move.col, captured, () => {
      state.board[fromRow][fromCol].piece = null;
      state.board[move.over.row][move.over.col].piece = null;
      state.board[move.row][move.col].piece = piece;
      // Same rule as every other move type — landing on fire/poison kills
      // the piece regardless of the ability that got it there.
      if (isDeadlyHazardForFriendly(state.board[move.row][move.col], state.mode)) {
        const deadlyHazard = state.board[move.row][move.col].hazard;
        recordLazarusFriendlyDeath(piece, move.row, move.col);
        state.board[move.row][move.col].piece = null;
        state.shieldedPiece = null; state.selected = null; state.validMoves = []; state.activeCard = null;
        state.lastUsedCard = null;
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        plusMarkPieceMoved(piece.id);
        render();
        setMessage(deadlyHazard === 'poison' ? 'Poisoned!' : 'Consumed by wildfire!');
        return;
      }
      if (piece.type==='yours' && move.row===0 && !piece.king && !piece.wasKing && !piece.ability) {
        crownFriendlyPiece(piece, true);
      }
      applyScorchedEarth(fromRow, fromCol, move, piece);
      state.shieldedPiece=null; state.selected=null; state.validMoves=[]; state.activeCard=null;
      if (state.lastUsedCard) {
        const ud = CARD_DEFS[state.lastUsedCard];
        if (ud?.rarity==='uncommon') { piece.ability=null; piece.king=false; }
        else if (state.lastUsedCard==='vertical_jump'||state.lastUsedCard==='horizontal_jump') { piece.king=false; piece.ability=state.lastUsedCard; }
        else if (state.lastUsedCard==='teleport') { piece.king=false; piece.ability=null; }
      }
      state.lastUsedCard=null;
      if (countPieces('enemy')===0){triggerWin();return;}
      plusMarkPieceMoved(piece.id);
      render();
      setMessage('');
    });
    return;
  }

  // Charge animations — pull back then blast through
  if (move.type === 'infantry_charge' || move.type === 'cavalry_charge' || move.type === 'chariot_charge') {
    if (move.type === 'chariot_charge') {
      const resolution = stageAnimatedUncommonMove('chariot_charge', fromRow, fromCol, move, piece);
      animateCharge(fromRow, fromCol, move.row, move.col, move.captured, move.direction, () => {
        finishUncommonAnimationResolution();
        if (resolution.deadlyHazard) {
          if (countPieces('enemy') === 0) { triggerWin(); return; }
          if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
          setMessage(resolution.deadlyHazard === 'poison' ? 'Poisoned!' : 'Consumed by wildfire!');
          return;
        }
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        setMessage('');
      });
      return;
    }
    animateCharge(fromRow, fromCol, move.row, move.col, move.captured, move.direction, () => {
      state.board[fromRow][fromCol].piece = null;
      if (move.captured) move.captured.forEach(cap => { state.board[cap.row][cap.col].piece = null; });
      state.board[move.row][move.col].piece = piece;
      // A charge landing on fire/poison is destroyed exactly like any plain
      // move would be — a card-driven charge into a burning/poisoned square
      // is no safer than walking into it. Checked before king-promotion so a
      // burned/poisoned piece can't be crowned.
      if (isDeadlyHazardForFriendly(state.board[move.row][move.col], state.mode)) {
        const deadlyHazard = state.board[move.row][move.col].hazard;
        recordLazarusFriendlyDeath(piece, move.row, move.col);
        state.board[move.row][move.col].piece = null;
        state.shieldedPiece = null; state.selected = null; state.validMoves = []; state.activeCard = null; state.activeCardUid = null;
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        plusMarkPieceMoved(piece.id);
        render();
        setMessage(deadlyHazard === 'poison' ? 'Poisoned!' : 'Consumed by wildfire!');
        return;
      }
      if ((move.type === 'infantry_charge' || move.type === 'chariot_charge') && move.row === 0 && !piece.wasKing) {
        crownFriendlyPiece(piece);
      }
      applyScorchedEarth(fromRow, fromCol, move, piece);
      state.shieldedPiece = null; state.selected = null; state.validMoves = []; state.activeCard = null; state.activeCardUid = null;
      if (countPieces('enemy') === 0) { triggerWin(); return; }
      plusMarkPieceMoved(piece.id);
      render();
      setMessage('');
    });
    return;
  }

  // Catapult — launch into the air, land, and scatter enemies in the blast zone
  if (move.type === 'catapult') {
    const resolution = stageAnimatedUncommonMove('catapult', fromRow, fromCol, move, piece);
    animateCatapult(fromRow, fromCol, move.row, move.col, move.captured, () => {
      finishUncommonAnimationResolution();
      if (resolution.deadlyHazard) {
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        setMessage(resolution.deadlyHazard === 'poison' ? 'Poisoned!' : 'Consumed by wildfire!');
        return;
      }
      if (countPieces('enemy') === 0) { triggerWin(); return; }
      setMessage('');
    });
    return;
  }

  // War Horse — double/triple jump with a real leaping arc over each
  // enemy. Fully handled here via animation callback: the generic
  // double_capture fallthrough further below must NEVER also run for this
  // move, or pieces would be removed/rendered twice. That's why this
  // branch returns immediately and the old generic `else if (move.type ===
  // 'double_capture')` block later in this function is now dead code for
  // this type (control flow never reaches it for a double_capture move,
  // since every double_capture is caught here first).
  if (move.type === 'double_capture') {
    const jumped = Array.isArray(move.captured)
      ? move.captured
      : [move.over, move.over2, move.over3, move.over4].filter(Boolean);
    const resolution = stageAnimatedUncommonMove('double_jump', fromRow, fromCol, move, piece);
    animateWarHorse(fromRow, fromCol, move.row, move.col, jumped, () => {
      finishUncommonAnimationResolution();
      if (resolution.deadlyHazard) {
        if (countPieces('enemy') === 0) { triggerWin(); return; }
        if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
        setMessage(resolution.deadlyHazard === 'poison' ? 'Poisoned!' : 'Consumed by wildfire!');
        return;
      }
      if (countPieces('enemy') === 0) { triggerWin(); return; }
      setMessage(resolution.hasFurtherJumps ? 'Another jump available — keep going!' : '');
    });
    return;
  }

  // Bodyguard — trade places with another friendly piece. Nothing is
  // captured and neither piece "moves through" any square, so this can't
  // reuse the generic move-application code below (which assumes exactly
  // one piece is changing position) — both squares just swap occupants.
  // The existing FLIP slide animation in render() picks this up for free
  // since both pieces keep their stable ids, just at new coordinates.
  if (move.type === 'swap') {
    const other = state.board[move.row][move.col].piece;
    state.board[fromRow][fromCol].piece = other;
    state.board[move.row][move.col].piece = piece;
    if (isDeadlyHazardForFriendly(state.board[fromRow][fromCol], state.mode)) {
      recordLazarusFriendlyDeath(other, fromRow, fromCol);
      state.board[fromRow][fromCol].piece = null;
    }
    if (isDeadlyHazardForFriendly(state.board[move.row][move.col], state.mode)) {
      recordLazarusFriendlyDeath(piece, move.row, move.col);
      state.board[move.row][move.col].piece = null;
    }
    // Bodyguard reuses the Charge cards' impact sound rather than a
    // dedicated one — this branch returns early, so it can't fall through
    // to the generic landing-sound path below like Side Step does.
    playChargeHitSound();
    state.shieldedPiece = null; state.selected = null; state.validMoves = []; state.activeCard = null; state.activeCardUid = null;
    if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
    // Bodyguard is a free repositioning trick, not a real move — neither the
    // piece you tapped/selected to perform the swap NOR the piece on the
    // other end gets marked as having moved. Each piece's moved/unmoved
    // status is left exactly as it was before the swap (if either had
    // already moved, it's still spent; if not, it's still free to move
    // later this turn). Deliberately NOT calling plusMarkPieceMoved here.
    maybeEndPlayerTurn();
    render();
    setMessage('');
    return;
  }

  state.board[fromRow][fromCol].piece = null;
  if (move.type === 'infantry_charge' || move.type === 'cavalry_charge') {
    // Remove all captured enemies
    if (move.captured) move.captured.forEach(cap => { state.board[cap.row][cap.col].piece = null; });
    // Place piece at destination
    state.board[move.row][move.col].piece = piece;
    // Auto-king if infantry reaches row 0 or cavalry reaches... no auto-king for cavalry
    if (move.type === 'infantry_charge' && move.row === 0 && !piece.wasKing) {
      crownFriendlyPiece(piece);
    }
  } else if (move.type === 'capture') {
    state.board[move.over.row][move.over.col].piece = null;
  } else if (move.type === 'double_capture') {
    // War Horse's generic (non-animated) fallback path — same null-guarding
    // as the animated branch above, since the path can now include empty
    // squares/craters with no enemy to capture there.
    const jumped = Array.isArray(move.captured)
      ? move.captured
      : [move.over, move.over2, move.over3, move.over4].filter(Boolean);
    jumped.forEach(cap => { state.board[cap.row][cap.col].piece = null; });
  } else if ((move.type === 't_capture' || move.type === 't_detonate') && move.captured) {
    move.captured.forEach(cap => {
      state.board[cap.row][cap.col].piece = null;
    });
  } else if (move.type === 'triple_capture') {
    state.board[move.over.row][move.over.col].piece = null;
    state.board[move.over2.row][move.over2.col].piece = null;
    state.board[move.over3.row][move.over3.col].piece = null;
  }
  // triple_capture: piece moves to landing square (already handled by default move logic below)
  // t_detonate: piece stays in place (fromRow/fromCol === move.row/col)
  if (!move.stayInPlace) {
    state.board[move.row][move.col].piece = piece;
  } else {
    state.board[fromRow][fromCol].piece = piece; // keep it where it was
  }

  // Secret Passage is triggered by entering either endpoint. The unit is
  // immediately removed from that square and placed at its color-matched
  // partner. Rewriting the committed landing coordinates here makes every
  // normal post-move rule (hazards, crowning, rendering and save state) use
  // the actual exit square. Passage travel always ends this unit's action.
  if (!move.stayInPlace) {
    // Promotion belongs to the square ENTERED, before the tunnel resolves.
    // A pawn stepping onto its crown row must become a King even when that
    // square immediately transports it somewhere else.
    if (piece.type === 'yours' && move.row === 0 && !piece.king && !piece.wasKing && !piece.ability) {
      crownFriendlyPiece(piece, true);
    }
    const passageTransit = transportThroughSecretPassage(move.row, move.col, piece);
    if (passageTransit.usedTunnel) {
      move = {
        ...move,
        row: passageTransit.row,
        col: passageTransit.col,
        usedSecretPassage: true,
        secretPassageColor: passageTransit.colorKey,
      };
    }
  }

  // Landing sound — only for plain, card-free moves/captures (see
  // playPieceLandSound's own comment). Every card/ability-driven move type
  // (charges, Catapult, War Horse, Teleport, etc.) either returns earlier
  // via its own animation branch above or never sets plainMovement, so this
  // never fires for those.
  if (move.plainMovement) {
    playPieceLandSound();
  }

  // Phantom March whoosh — fires right as the piece actually lands at its
  // new square (this generic path is the only place Teleport ever reaches;
  // see isPhantomMarchMove's own comment above for why it's captured early).
  if (isPhantomMarchMove) {
    playPhantomMarchSound();
  }

  // Feint whoosh — same generic-path landing rule as Phantom March above.
  if (isFeintMove) {
    playFeintSound();
  }

  // Side Step — same generic-path landing rule as Phantom March/Feint above,
  // reusing the Charge cards' impact sound rather than a dedicated one.
  if (isSideStepMove) {
    playChargeHitSound();
  }

  // Wildfire/Mad Cow/Bear Trap etc — a piece that lands here is destroyed
  // instantly, and that's true no matter HOW it got here: a plain step, a
  // regular jump, an ability-move like Teleport, Side Step, or Retreat —
  // all of those funnel through this same generic path, and every one of
  // them dies here just the same. (Charges, Catapult, and War Horse have
  // their own dedicated animation branches earlier in this function and
  // never reach this code — they carry an identical hazard check of their
  // own right after they place the piece, so the same rule still applies.)
  // Checked before king-promotion/chain-jump so a burned/poisoned piece
  // can't be crowned or keep capturing.
  if (isDeadlyHazardForFriendly(state.board[move.row][move.col], state.mode)) {
    const deadlyHazard = state.board[move.row][move.col].hazard;
    recordLazarusFriendlyDeath(piece, move.row, move.col);
    state.board[move.row][move.col].piece = null;
    state.shieldedPiece = null;
    state.selected = null;
    state.validMoves = [];
    state.activeCard = null;
    state.activeCardUid = null;
    if (countPieces('enemy') === 0) { triggerWin(); return; }
    if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
    plusMarkPieceMoved(piece.id);
    render();
    setMessage(deadlyHazard === 'poison' ? 'Poisoned!' : 'Consumed by wildfire!');
    return;
  }

  // King promotion — reaching back row
  // Only crown if: never been kinged before AND no ability (ability pieces don't get kinged by movement)
  if (piece.type === 'yours' && move.row === 0 && !piece.king && !piece.wasKing && !piece.ability) {
    crownFriendlyPiece(piece, true);
  }

  // Scorched Earth — burn the path this piece just traversed
  applyScorchedEarth(fromRow, fromCol, move, piece);

  state.shieldedPiece = null;
  state.selected = null;
  state.validMoves = [];
  state.activeCard = null;
  state.activeCardUid = null;

  // Check win
  if (countPieces('enemy') === 0) {
    triggerWin();
    return;
  }

  // No-valid-move states are intentionally non-terminal. The permanent
  // Forfeit button is the player-controlled escape hatch.

  // Multi-jump — New Run Plus only: if this same piece has ANOTHER capture
  // available from the square it just landed on, its turn isn't over yet.
  // Keep it selected (instead of marking it spent) so the player can
  // immediately continue the chain with another tap, same as standard
  // checkers multi-jump rules.
  const isJumpType = !move.usedSecretPassage &&
    (move.type === 'capture' || move.type === 'double_capture' || move.type === 'triple_capture');
  if (isJumpType && state.mode === 'plus' && state.turnPhase === 'player') {
    const furtherJumps = getValidMoves(move.row, move.col).filter(m =>
      m.type === 'capture' || m.type === 'double_capture' || m.type === 'triple_capture'
    );
    if (furtherJumps.length > 0) {
      state.forcedJumpPieceId = piece.id;
      state.selected = { row: move.row, col: move.col };
      state.validMoves = furtherJumps;
      render();
      setMessage('Another jump available — keep going!');
      return;
    }
  }

  state.forcedJumpPieceId = null;
  plusMarkPieceMoved(piece.id);
  render();
  setMessage(move.usedSecretPassage ? `${String(move.secretPassageColor || '').toUpperCase()} TUNNEL TRAVERSED — UNIT'S MOVE ENDED` : '');
}

const LOCAL_CARD_FX = Object.freeze({
  king_me:'crown', revert:'demote', teleport:'portal', usurp:'crown',
  side_step:'step', once_more:'sun', bodyguard:'shield', retreat:'step',
  bear_trap:'trap', ambush:'ambush', siege:'chain', coup_detat:'demote',
  conscript:'banner', dead_mans_hand:'cards', heros_gambit:'sun', phalanx:'shield',
  trojan_horse:'banner', war_tax:'cards', puppet_master:'strings',
  scorched_earth:'fire', last_stand:'sun', feint:'step'
});

function resolvedCardFxCells(cardId) {
  const rows=getBoardRows(), cols=getBoardCols(), cells=[];
  const selected = state.selected && Number.isInteger(state.selected.row) ? state.selected : null;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
    const square=state.board?.[r]?.[c], piece=square?.piece;
    let take=false;
    if(['king_me','usurp','once_more','ambush','heros_gambit','scorched_earth','last_stand','bodyguard'].includes(cardId)) take=piece?.type==='yours';
    else if(['revert','coup_detat','siege','puppet_master'].includes(cardId)) take=piece?.type==='enemy';
    else if(cardId==='bear_trap') take=!!square?.hazard?.bearTrap;
    else if(cardId==='phalanx') take=r>=rows-Math.min(2,rows);
    else if(['teleport','side_step','retreat','feint'].includes(cardId)) take=!!selected&&selected.row===r&&selected.col===c;
    else if(['conscript','trojan_horse'].includes(cardId)) take=piece?.type==='yours';
    if(take) cells.push({row:r,col:c});
  }
  if(!cells.length&&selected) cells.push({row:selected.row,col:selected.col});
  return cells;
}

function playResolvedCardAnimation(cardId) {
  const kind=LOCAL_CARD_FX[cardId];
  if(!kind) return;
  if(kind==='cards') {
    const hand=document.getElementById('cardsHand');
    if(hand) hand.animate([
      {transform:'translateY(14px) scale(.96)',filter:'brightness(.8)'},
      {transform:'translateY(-7px) scale(1.035)',filter:'brightness(1.35)',offset:.55},
      {transform:'',filter:''}
    ],{duration:760,easing:'cubic-bezier(.2,.8,.2,1)'});
    return;
  }
  const targets=resolvedCardFxCells(cardId);
  const cols=getBoardCols();
  targets.slice(0,64).forEach(({row,col},i)=>{
    const cell=document.getElementById('board')?.children?.[row*cols+col];
    if(!cell)return;
    const fx=document.createElement('span');
    fx.className='card-cell-fx fx-'+kind;
    fx.style.animationDelay=(Math.min(i,12)*24)+'ms';
    cell.appendChild(fx);
    setTimeout(()=>fx.remove(),1100+Math.min(i,12)*24);
  });
}

function markCardUsed(cardId) {
  ensureGloryState();
  // Do not add a generic board-wide piece overlay here. It could not know the
  // exact unit(s) chosen by a targeted card and consequently painted every
  // friendly/enemy piece. Each card's real, target-aware animation is the
  // only visual effect that should run when its action resolves.
  state.gloryLastCardId = cardId;
  state.gloryLastCardAt = Date.now();
  const deferGameSave = ['black_hole', 'close_ranks', 'sands_of_time', 'divine_intervention',
    'wrath', 'plague', 'tornado', 'locust_swarm', 'blizzard', 'jester',
    'meteor_strike', 'wildfire', 'earthquake', 'mad_cow', 'tidal_wave'].includes(cardId);
  // Hero's Gambit — the first activation is free and retains this exact card
  // for its promised second activation, even when the normal turn budget is full.
  if (state.doubleCardNext) {
    state.doubleCardNext = false;
    state.heroGambitBonusCardUid = state.activeCardUid;
    state.heroGambitReservedCardUid = null;
    state.lastCardPlayedId = cardId;
    state.activeCardUid = null;
    activeStatsObj().cardsPlayed++;
    saveActiveStats();
    return;
  }
  const uid = state.activeCardUid;
  const card = uid !== null
    ? state.cards.find(c => c.uid === uid)
    : state.cards.find(c => c.id === cardId && !c.used);
  if (card) {
    card.used = true;
    if (card.id === 'wrath') {
      card.wrathUses = (card.wrathUses || 0) + 1;
      const maxUses = getWrathMaxUses(state.mode);
      if (card.wrathUses >= maxUses) {
        state.cards = state.cards.filter(c => c.uid !== card.uid);
      } else {
        // The mastered card still has one run-wide charge remaining. Keep it
        // immediately playable, including later in this same battle.
        card.used = false;
      }
    }
  }
  if (state.heroGambitBonusCardUid === uid) state.heroGambitBonusCardUid = null;
  if (state.heroGambitReservedCardUid === uid) state.heroGambitReservedCardUid = null;
  state.lastCardPlayedId = cardId;
  state.activeCardUid = null;
  if (state.mode === 'plus' && state.turnPhase === 'player') {
    state.plusCardsUsed = (state.plusCardsUsed || 0) + 1;
  }
  activeStatsObj().cardsPlayed++;
  saveActiveStats();
  // Save immediately — card consumption is a significant state change and
  // the debounced save can be lost if the app is closed on Android.
  if (!deferGameSave) saveGame();
}

function playCartoonCardFlourish() {
  // Remove any legacy flourish node that may survive an older saved session.
  document.querySelectorAll('.cartoon-card-flourish').forEach(el => el.remove());
}

function activateCard(uid) {
  const requestedCard = state.cards.find(c => c.uid === uid);
  if (typeof blackHoleAnimationRunning !== 'undefined' && blackHoleAnimationRunning) {
    setMessage('WAIT FOR THE CURRENT CARD EFFECT TO FINISH');
    return;
  }
  // Tutorial: cards can only ever be touched during the one step that
  // actually asks for it.
  if (tutorial.active && tutorial.step !== 8) return;
  if (state.forcedJumpPieceId != null) {
    setMessage('ANOTHER CAPTURE IS AVAILABLE — YOU MUST KEEP JUMPING');
    return;
  }
  const card = requestedCard;
  if (!card || card.used) return;

  if ((state.royalStandardPlacementRemaining || 0) > 0 && card.id !== 'royal_standard') {
    setMessage(state.royalStandardPlacementPreview
      ? 'TAP THE HIGHLIGHTED AREA AGAIN TO PLANT THE ROYAL STANDARD'
      : 'PLANT THE ROYAL STANDARD FIRST — TAP A SPACE TWICE TO CONFIRM');
    return;
  }

  if (card.id === 'false_king') {
    state.activeCardUid = uid;
    deployFalseKings(1 + newCardLevel('false_king'));
    markCardUsed('false_king');
    state.activeCard = null; state.activeCardUid = null;
    render(); saveGame(); setMessage('THE FALSE KINGS TAKE THE FIELD');
    return;
  }

  // White cards are permanent run passives. The showcase keeps them in a
  // visible fifth stack so all 54 cards are present, but tapping one only
  // explains its status and never consumes a card action.
  if (CARD_DEFS[card.id]?.rarity === 'white') {
    setMessage(`${CARD_DEFS[card.id].name.toUpperCase()} IS ACTIVE FOR THIS RUN`);
    return;
  }

  // Lazarus is held, never played. Tapping it only explains the passive and
  // must not consume a card action or Hero's Gambit bonus.
  if (card.id === 'lazarus') {
    setMessage('LAZARUS ACTIVATES AUTOMATICALLY WHEN YOUR LAST UNIT FALLS');
    return;
  }

  if (card.id === 'sands_of_time' && !canActivateSandsOfTime()) {
    const warning = 'SANDS OF TIME REQUIRES THREE COMPLETED TURNS.';
    showGameDialog(warning, { title: 'CARD UNAVAILABLE' });
    setMessage(warning);
    return;
  }

  // Hero's Gambit may never duplicate Black Hole. Keep the Gambit bonus
  // armed so the player can choose a different eligible card.
  if (card.id === 'black_hole' &&
      (state.doubleCardNext || state.heroGambitBonusCardUid === uid)) {
    const warning = "BLACK HOLE IS NOT ELIGIBLE FOR HERO'S GAMBIT. CHOOSE A DIFFERENT CARD.";
    showGameDialog(warning, { title: 'CARD UNAVAILABLE' });
    setMessage(warning);
    return;
  }

  // Sands of Time is a unique timeline rewrite and cannot be copied.
  if (card.id === 'sands_of_time' &&
      (state.doubleCardNext || state.heroGambitBonusCardUid === uid)) {
    const warning = "SANDS OF TIME IS NOT ELIGIBLE FOR HERO'S GAMBIT. CHOOSE A DIFFERENT CARD.";
    showGameDialog(warning, { title: 'CARD UNAVAILABLE' });
    setMessage(warning);
    return;
  }

  // Divine Intervention is a single miracle for the entire run. It cannot
  // be copied by Hero's Gambit, and even a corrupt/legacy duplicate cannot
  // bypass the run-wide use lock. Keep the Gambit bonus armed so another
  // eligible card can be chosen.
  if (card.id === 'divine_intervention' &&
      (state.doubleCardNext || state.heroGambitBonusCardUid === uid)) {
    const warning = "DIVINE INTERVENTION IS NOT ELIGIBLE FOR HERO'S GAMBIT. CHOOSE A DIFFERENT CARD.";
    showGameDialog(warning, { title: 'CARD UNAVAILABLE' });
    setMessage(warning);
    return;
  }
  if (card.id === 'divine_intervention' && state.divineInterventionUsedThisRun) {
    const warning = 'DIVINE INTERVENTION CAN ONLY BE USED ONCE PER RUN.';
    showGameDialog(warning, { title: 'CARD UNAVAILABLE' });
    setMessage(warning);
    return;
  }

  // Corrupt/legacy saves may contain an extra physical copy, so enforce the
  // once-per-level rule independently of the normal card.used flag.
  if (card.id === 'black_hole' && state.blackHoleUsedThisLevel) {
    const warning = 'BLACK HOLE CAN ONLY BE USED ONCE PER LEVEL.';
    showGameDialog(warning, { title: 'CARD UNAVAILABLE' });
    setMessage(warning);
    return;
  }

  if (state.activeCardUid === uid) {
    state.activeCardUid = null;
    state.activeCard = null;
    state.activeCardMasteryId = null;
    state.activeCardMasteryLevel = null;
    state.selected = null;
    state.validMoves = [];
    state.assassinateTargets = []; state.demotionTargets = [];
    state.bearTrapTargets = [];
    state.ambushTargets = [];
    state.shieldWallTargets = [];
    state.counterTargets = [];
    state.siegeTargets = [];
    state.scorchedEarthTargets = [];
    state.heroGambitSacrifices = [];
    state.madCowTarget = null;
    state.puppetTarget = null;
    state.puppetMoved = 0;
    state.puppetMovedIds = [];
    state.puppetMoveTarget = 0;
    state.secretPassagePlacements = [];
    render();
    setMessage('');
    return;
  }

  // Hero's Gambit's promised card can be activated immediately, including
  // both activations when the normal per-turn card budget is already full.
  const heroGambitGrantedUse = state.doubleCardNext || state.heroGambitBonusCardUid === uid;
  // Flat 3-card-per-turn baseline, same rule as updatePlusHud — piece count
  // never inflates this, only Ace up the Sleeve's bonusCardActions does.
  if (state.mode === 'plus' && state.turnPhase === 'player' && !heroGambitGrantedUse &&
      (state.plusCardsUsed || 0) >= 3 + (state.bonusCardActions || 0)) {
    setMessage('NO CARD USES LEFT THIS TURN');
    return;
  }

  // Cards may always be armed after another friendly unit has moved. Any
  // post-move mastery restriction is checked later against the specific unit
  // selected for that card, never against plusMovedIds for the whole turn.

  state.activeCardUid = uid;
  state.activeCard = card.id;
  state.activeCardMasteryId = card.id;
  state.activeCardMasteryLevel = getPermanentCardMasteryLevel(card.id, state.mode);
  state.selected = null;
  state.validMoves = [];
  state.assassinateTargets = []; state.demotionTargets = [];
  state.bearTrapTargets = [];
  state.ambushTargets = [];
  state.shieldWallTargets = [];
  state.counterTargets = [];
  state.siegeTargets = [];
  state.scorchedEarthTargets = [];
  state.secretPassagePlacements = [];
  // A newly armed card always starts with a clean Mad Cow preview. Without
  // this, switching cards after Mad Cow's first tap could preserve a stale
  // blast footprint and allow an old location to confirm later.
  state.madCowTarget = null;

  // Selection cards with no currently eligible pieces stay in the hand.
  // This prevents an armed card from trapping the player in a selection
  // flow that can never reach its required count.
  let noEligibleMessage = '';
  if (card.id === 'revert' && getEnemyKingCells().length === 0)
    noEligibleMessage = 'NO ENEMY KINGS ARE ELIGIBLE';
  else if (card.id === 'coup_detat' && getEnemyKingCells().length === 0)
    noEligibleMessage = 'NO ENEMY KINGS ARE ELIGIBLE';
  else if (card.id === 'siege' && getEnemyKingCells().length === 0)
    noEligibleMessage = 'NO ENEMY KINGS ARE ELIGIBLE';
  else if (card.id === 'ambush' && getAmbushEligibleFriendlyCells(state.mode).length === 0)
    noEligibleMessage = 'NO FRIENDLY UNITS ARE ELIGIBLE';
  else if (card.id === 'last_stand' && countPieces('yours') !== 1)
    noEligibleMessage = 'LAST STAND REQUIRES EXACTLY ONE FRIENDLY UNIT';
  else if (card.id === 'divine_intervention') {
    trackLazarusFriendlyLosses();
    if (!Array.isArray(state.lazarusGraveyard) || state.lazarusGraveyard.length === 0)
      noEligibleMessage = 'DIVINE INTERVENTION REQUIRES AT LEAST ONE FALLEN FRIENDLY UNIT';
    else if (getDivineInterventionOpenSquares().length < state.lazarusGraveyard.length)
      noEligibleMessage = 'DIVINE INTERVENTION REQUIRES ONE SAFE SPACE FOR EVERY FALLEN UNIT';
  }
  else if (card.id === 'heros_gambit' && countPieces('yours') < getHeroGambitSacrificeCount(state.mode))
    noEligibleMessage = getHeroGambitSacrificeCount(state.mode) === 1
      ? 'HERO\'S GAMBIT REQUIRES ONE FRIENDLY UNIT'
      : 'HERO\'S GAMBIT REQUIRES TWO FRIENDLY UNITS';
  if (noEligibleMessage) {
    state.activeCardUid = null;
    state.activeCard = null;
    render();
    setMessage(noEligibleMessage);
    return;
  }

  // The illustrated edition gives every successful card activation a short,
  // colorful comic-book flourish. It is presentation only and never delays
  // or changes the underlying card resolution.
  playCartoonCardFlourish(card.id);

  if (card.id === 'divine_intervention') {
    lastCardActivationTime = Date.now();
    activateDivineInterventionCard();
    return;
  }

  if (card.id === 'black_hole') {
    lastCardActivationTime = Date.now();
    activateBlackHoleCard();
    return;
  }

  if (card.id === 'close_ranks') {
    lastCardActivationTime = Date.now();
    activateCloseRanksCard();
    return;
  }

  if (card.id === 'sands_of_time') {
    lastCardActivationTime = Date.now();
    activateSandsOfTimeCard();
    return;
  }

  if (card.id === 'meteor_strike') {
    lastCardActivationTime = Date.now();
    activateMeteorStrikeCard();
    return;
  }

  if (card.id === 'scorched_earth' && getScorchedEarthEffect(state.mode).targets === Infinity) {
    lastCardActivationTime = Date.now();
    commitScorchedEarth([], true);
    return;
  }

  if (card.id === 'puppet_master') {
    // Never demand more distinct moves than there are eligible enemies.
    // This cap is recomputed after every move in case the board changes.
    state.puppetMoved = 0;
    state.puppetMovedIds = [];
    state.puppetMoveTarget = Math.min(getPuppetMasterTargetCount(state.mode), getPuppetEligibleEnemyCells().length);
    if (state.puppetMoveTarget === 0) {
      state.activeCardUid = null;
      state.activeCard = null;
      render();
      setMessage('NO ENEMIES HAVE ELIGIBLE MOVES');
      return;
    }
  }
  // Remember which card the player chose after paying Hero's Gambit. If the
  // targeting flow is postponed by ending the turn, this reservation remains
  // in the save and the extra activation is still available next turn.
  if (state.doubleCardNext) {
    state.heroGambitReservedCardUid = uid;
    saveGame();
  }
  lastCardActivationTime = Date.now();
  render();

  if (card.id === 'secret_passage') {
    const tunnelCount = getSecretPassageTunnelCount(state.mode);
    setMessage(`CHOOSE THE ${SECRET_PASSAGE_COLORS[0].label} TUNNEL ENTRANCE — ${tunnelCount} TUNNEL${tunnelCount === 1 ? '' : 'S'} TOTAL`);
  } else if (card.id === 'battering_ram') {
    setMessage('CHOOSE A FRIENDLY UNIT TO DRIVE FORWARD');
  } else if (card.id === 'sanctuary') {
    setMessage('CHOOSE THE CENTER OF THE PROTECTED AREA');
  } else if (card.id === 'headsmans_bounty') {
    setMessage('CHOOSE ENEMY KINGS TO MARK FOR DOUBLE GLORY');
  } else if (card.id === 'the_masons') {
    setMessage('CHOOSE DAMAGED OR HAZARDOUS SPACES TO REPAIR');
  } else if (card.id === 'war_drums') {
    setMessage(newCardLevel('war_drums') >= 3 ? 'CHOOSE FRIENDLY UNITS TO ADVANCE' : 'CHOOSE FRIENDLY PAWNS TO ADVANCE');
  } else if (card.id === 'portcullis') {
    setMessage('CHOOSE A ROW TO SEAL');
  } else if (card.id === 'gallows') {
    setMessage('CHOOSE ENEMIES FOR EXECUTION');
  } else if (card.id === 'heros_gambit') {
    const required = getHeroGambitSacrificeCount(state.mode);
    setMessage(`SELECT ${required} FRIENDLY UNIT${required === 1 ? '' : 'S'} TO SACRIFICE`);
  } else if (card.id === 'counter') {
    const requested = getCounterTargetCount(state.mode);
    const targetCap = Math.min(requested, getFriendlyCells().length);
    setMessage(requested === Infinity
      ? 'TAP ANY FRIENDLY UNIT TO ARM COUNTER ON ALL UNITS'
      : `SELECT ${targetCap} FRIENDLY UNIT${targetCap === 1 ? '' : 'S'} TO COUNTER`);
  } else {
    setMessage(''); // other cards use their existing board/carousel instructions
  }
}

// ── WIN / LOSE ──
function countPieces(type) {
  let count = 0;
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  for (let r = 0; r < bsR; r++)
    for (let c = 0; c < bsC; c++)
      if (state.board[r][c].piece?.type === type) count++;
  return count;
}

// Shared by the tutorial and normal reward-choice screens.
// It builds the actual card faces (same
// art/name/desc as everywhere else in the game, not a plain emoji button)
// into #cardChoices and wires each one to become the (changeable) pending
// pick. Wrapped in try/catch per-card: buildCardElement throwing on ONE bad
// card used to silently abort the whole forEach loop (a thrown error inside
// a forEach callback stops every remaining iteration), which meant NONE of
// the reward cards would even get a click handler attached — every card on
// the screen looked normal but tapping any of them did nothing.
const GLORY_CARD_PACK_PRICES = { common: 1000, uncommon: 2500, rare: 5000 };

function getGloryCardPackPrice(rarity, level = state?.level || 3) {
  if (rarity === 'epic') return getGloryCardPackPrice('rare', level) * 2;
  const basePrice = GLORY_CARD_PACK_PRICES[rarity] || GLORY_CARD_PACK_PRICES.common;
  // Level 3 is the first paid market. Every later three-level market raises
  // all pack prices by another 15% of their original price. Linear scaling
  // keeps late-run packs meaningful without exponential prices eventually
  // becoming impossible. Round to the nearest 100 so every price stays clean.
  const marketStep = Math.max(0, Math.floor((Math.max(3, level) - 3) / 3));
  const priceInHundreds = (basePrice * (100 + marketStep * 15)) / 10000;
  return Math.max(basePrice, Math.round(priceInHundreds) * 100);
}

function getGloryPackPool(rarity) {
  const isPlus = state.mode === 'plus';
  const modeEligible = id => isPlus || !CARD_DEFS[id]?.plusOnly;
  const runEligible = id => typeof isCardAvailableForThisRun !== 'function' || isCardAvailableForThisRun(id);
  if (rarity === 'common') return CARD_POOL_BY_RARITY.common.filter(modeEligible);
  if (rarity === 'uncommon') return CARD_POOL_BY_RARITY.uncommon.filter(modeEligible);
  // Rare packs can reveal a Rare or a Bonus card, but never an Epic.
  if (rarity === 'rare') return [...RARE_CARD_POOL, ...WHITE_CARD_POOL].filter(modeEligible);
  if (rarity === 'epic') return EPIC_CARD_POOL.filter(id =>
    modeEligible(id) &&
    runEligible(id) &&
    state.level >= (CARD_DEFS[id]?.minimumRewardLevel || 1)
  );
  return [];
}

function drawGloryPackCard(rarity) {
  const pool = getGloryPackPool(rarity);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'vertical_jump';
}

function playGloryPackTearSound() {
  if (state?.sfxMuted) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    gloryAudioContext = gloryAudioContext || new AudioContextClass();
    if (gloryAudioContext.state === 'suspended') gloryAudioContext.resume().catch(() => {});
    const ctx = gloryAudioContext;
    const now = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .42), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * (0.42 + Math.sin(i * .17) * .12);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + .38);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.16, now + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .42);
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    source.start(now); source.stop(now + .44);
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const toneGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = frequency;
      toneGain.gain.setValueAtTime(.0001, now + .34 + index * .055);
      toneGain.gain.exponentialRampToValueAtTime(.055, now + .38 + index * .055);
      toneGain.gain.exponentialRampToValueAtTime(.0001, now + .68 + index * .055);
      osc.connect(toneGain); toneGain.connect(ctx.destination);
      osc.start(now + .34 + index * .055); osc.stop(now + .72 + index * .055);
    });
  } catch (err) {
    console.warn('Card pack sound unavailable:', err);
  }
}

function buildGloryPackElement(rarity, price, free = false) {
  const pack = document.createElement('button');
  pack.type = 'button';
  pack.className = 'glory-pack';
  pack.dataset.rarity = rarity;
  if (!free && (state.glory || 0) < price) pack.classList.add('locked');
  const artUrl = rarity === 'epic'
    ? CARD_BACK_URL.epic
    : (GLORY_PACK_ART_URL[rarity] || GLORY_PACK_ART_URL.common);
  pack.innerHTML =
    `<span class="glory-pack-half glory-pack-top"><img class="glory-pack-art" src="${artUrl}" alt=""></span>` +
    `<span class="glory-pack-half glory-pack-bottom"><img class="glory-pack-art" src="${artUrl}" alt=""></span>` +
    `<span class="glory-pack-copy"><span class="glory-pack-price">${free ? '0 GLORY' : price.toLocaleString() + ' GLORY'}</span></span>`;
  pack.addEventListener('click', () => openGloryCardPack(pack, rarity, price, free));
  return pack;
}

function renderGloryCardPacks(opening = false) {
  const stage = document.getElementById('cardPackStage');
  const choices = document.getElementById('cardChoices');
  if (!stage || !choices) return;
  choices.innerHTML = '';
  choices.style.display = 'none';
  stage.innerHTML = '';
  stage.classList.remove('pack-revealing');
  stage.style.display = 'flex';
  state.cardPackOpening = false;
  state.cardPackPurchasedThisReward = false;
  if (opening) stage.appendChild(buildGloryPackElement('common', 0, true));
  else {
    const marketRarities = ['common', 'uncommon', 'rare'];
    if (state.level > 0 && state.level % 12 === 0) marketRarities.push('epic');
    marketRarities.forEach(rarity => {
      stage.appendChild(buildGloryPackElement(rarity, getGloryCardPackPrice(rarity), false));
    });
  }
}

function displayGloryPackReveal(cardId) {
  const stage = document.getElementById('cardPackStage');
  if (!stage || !CARD_DEFS[cardId]) return;
  stage.style.display = 'flex';
  stage.innerHTML = '';
  stage.classList.remove('pack-revealing');
  const reveal = document.createElement('div');
  reveal.className = 'card-pack-reveal card-enlarge-stage';
  reveal.dataset.rarity = CARD_DEFS[cardId].rarity || 'common';
  try {
    reveal.innerHTML = buildBigCardHTML(cardId, false);
  } catch (err) {
    console.error('Pack card failed to build:', cardId, err);
    reveal.textContent = CARD_DEFS[cardId]?.name || 'New Card';
  }
  stage.appendChild(reveal);
  document.getElementById('winSub').textContent = `${CARD_DEFS[cardId].name} has been added to this run.`;
  const continueBtn = document.getElementById('continueBtn');
  continueBtn.disabled = false;
  continueBtn.style.pointerEvents = '';
  continueBtn.style.opacity = '';
  continueBtn.style.display = 'inline-block';
  document.getElementById('nextLevelNum').textContent = state.openingRewardPending ? state.level : state.level + 1;
}

function openGloryCardPack(pack, rarity, price, free) {
  if (!state || state.cardPackOpening || state.cardPackPurchasedThisReward || pack.classList.contains('opened')) return;
  if (!free && (state.glory || 0) < price) {
    showGameDialog(`You need ${price.toLocaleString()} Glory to open this ${getRarityDisplayName(rarity)} pack.`, { title: 'NOT ENOUGH GLORY' });
    return;
  }
  state.cardPackOpening = true;
  const pendingContinue = document.getElementById('continueBtn');
  if (pendingContinue) {
    pendingContinue.disabled = true;
    pendingContinue.style.pointerEvents = 'none';
    pendingContinue.style.opacity = '.45';
  }
  if (!free) {
    state.cardPackPurchasedThisReward = true;
    awardGlory(-price, `${getRarityDisplayName(rarity).toUpperCase()} PACK`);
    renderGlorySummary('gloryWinSummary', true);
  }
  pack.classList.add('opening', 'opened');
  document.getElementById('cardPackStage')?.classList.add('pack-revealing');
  playGloryPackTearSound();
  setTimeout(() => {
    // The tutorial uses a fixed, upgradeable Common so its later Collection
    // walkthrough can always point to a real hollow orb and grant one level.
    const cardId = tutorial.active && free ? 'vertical_jump' : drawGloryPackCard(rarity);
    if (tutorial.active && free) tutorial.upgradeCardId = cardId;
    state.pendingRewardCardId = null;
    grantCardToCurrentRun(cardId);
    state.lastPackCardId = cardId;
    if (free) state.openingPackOpened = true;
    displayGloryPackReveal(cardId);
    state.cardPackOpening = false;
    saveGame();
  }, 980);
}

function renderRewardCardChoices(choices) {
  const packStage = document.getElementById('cardPackStage');
  if (packStage) { packStage.style.display = 'none'; packStage.innerHTML = ''; }
  const choicesEl = document.getElementById('cardChoices');
  choicesEl.style.display = 'flex';
  choicesEl.innerHTML = '';
  choices.forEach((cardId, choiceIdx) => {
    let built;
    try {
      built = buildCardElement({ id: cardId, cards: [{ id: cardId, used: false, uid: -1000 - choiceIdx }] });
    } catch (err) {
      console.error('Reward card failed to build:', cardId, err);
      return;
    }
    const { el } = built;
    el.classList.add('reward-choice-card');
    el.addEventListener('click', () => {
      // Just mark this card as the (changeable) pick — nothing is granted
      // yet, so tapping a different card before hitting Continue simply
      // moves the selection instead of being locked out.
      state.pendingRewardCardId = cardId;
      choicesEl.querySelectorAll('.card').forEach(c => {
        c.classList.remove('active');
        c.style.opacity = '0.55';
        c.style.pointerEvents = '';
      });
      el.style.opacity = '1';
      el.classList.add('active');
      document.getElementById('continueBtn').style.display = 'inline-block';
      document.getElementById('nextLevelNum').textContent =
        state.openingRewardPending ? state.level : state.level + 1;
    });
    choicesEl.appendChild(el);
  });
}

// Every real run begins here, before setupLevel() creates the first board.
// This uses the normal reward renderer/commit path so unlocks, duplicate
// mastery rules, white passives, unique Epics, and orb display all remain
// identical to later reward screens. It is always exactly three choices.
function showOpeningRewardChoice() {
  state.openingRewardPending = true;
  state.pendingRewardCardId = null;

  const title = document.getElementById('winTitle');
  if (title) title.textContent = 'YOUR FIRST CARD PACK';
  document.getElementById('winSub').textContent =
    `Tear open your free Common pack to begin Level ${state.level}.`;
  document.getElementById('cardChoices').innerHTML = '';

  const continueBtn = document.getElementById('continueBtn');
  continueBtn.style.display = 'none';
  continueBtn.innerHTML = `Begin Level <span id="nextLevelNum">${state.level}</span>`;

  renderGloryCardPacks(true);
  if (state.openingPackOpened && state.lastPackCardId && CARD_DEFS[state.lastPackCardId]) {
    displayGloryPackReveal(state.lastPackCardId);
  }
  document.getElementById('winOverlay').classList.add('active');
  hideCardsHand();
}

function hasUnresolvedBearTrapVictim() {
  if (!state?.board) return false;
  for (const row of state.board) {
    for (const cell of row) if (cell?.trap && cell?.piece) return true;
  }
  return false;
}

function triggerWin() {
  if (!state || state.gameOver) return;
  if (hasUnresolvedBearTrapVictim()) {
    render();
    return;
  }
  document.getElementById('stalemateOverlay').classList.remove('active');
  document.getElementById('levelSelectOverlay').classList.remove('active');
  const winTitle = document.getElementById('winTitle');
  if (winTitle) winTitle.textContent = 'CLEARED';
  const continueBtn = document.getElementById('continueBtn');
  continueBtn.style.display = 'none';
  continueBtn.innerHTML = `Continue to Level <span id="nextLevelNum">${state.level + 1}</span>`;
  // The tutorial's final Catapult blast kills its last 2 enemies same as any
  // real win would — but instead of skipping the real reward screen, let it
  // actually show (forced to the card-choice branch, since this is only
  // "level 1" and wouldn't normally qualify for one), with the tutorial
  // banner explaining the mechanic on top of it. nextLevel() has its own
  // tutorial branch for what happens once a card is picked and Continue is
  // tapped — see there for why the run doesn't actually continue to level 2.
  if (tutorial.active) {
    state.gameOver = true;
    render();
    state.pendingRewardCardId = null;
    const tutorialWinTitle = document.getElementById('winTitle');
    if (tutorialWinTitle) tutorialWinTitle.textContent = 'CARD PACK';
    document.getElementById('winSub').textContent = 'Tear open the free Common pack.';
    const tutorialContinueBtn = document.getElementById('continueBtn');
    tutorialContinueBtn.style.display = 'none';
    renderGloryCardPacks(true);
    document.getElementById('winOverlay').classList.add('active');
    hideCardsHand();
    advanceTutorial(11);
    return;
  }
  // Developer builds deliberately bypass the entire reward/card-pack flow.
  // Clearing a board only records the in-memory Glory result and offers the
  // next board; the sandbox hand itself remains the fixed three-copy set.
  if (CARTOON_SHOWCASE_BUILD) {
    finalizeGloryLevel();
    state.gameOver = true;
    state.levelsCompleted++;
    state.pendingRewardCardId = null;
    state.openingRewardPending = false;
    state.cardPackOpening = false;
    render();
    const developerTitle = document.getElementById('winTitle');
    if (developerTitle) developerTitle.textContent = 'CLEARED';
    document.getElementById('winSub').textContent = `Developer Level ${state.level} cleared — rewards disabled.`;
    const choices = document.getElementById('cardChoices');
    if (choices) { choices.innerHTML = ''; choices.style.display = 'none'; }
    const packStage = document.getElementById('cardPackStage');
    if (packStage) { packStage.innerHTML = ''; packStage.style.display = 'none'; }
    continueBtn.style.display = 'inline-block';
    document.getElementById('nextLevelNum').textContent = state.level + 1;
    document.getElementById('winOverlay').classList.add('active');
    renderGlorySummary('gloryWinSummary', true);
    hideCardsHand();
    return;
  }
  finalizeGloryLevel();
  state.gameOver = true;
  state.levelsCompleted++;
  recordLevelBeaten(state.level, state.mode); // persists across runs, drives Starter Deck unlocks
  render();

  const earnCard = state.levelsCompleted % 3 === 0; // one card every 3 levels cleared

  state.pendingRewardCardId = null;
  // Cleared unconditionally, not just inside the earnCard branch below — a
  // previous win's reward cards would otherwise still be sitting in the DOM
  // (and briefly visible) the next time a level is cleared without earning
  // a new one.
  document.getElementById('cardChoices').innerHTML = '';
  document.getElementById('cardChoices').style.display = 'flex';
  const previousPackStage = document.getElementById('cardPackStage');
  if (previousPackStage) { previousPackStage.style.display = 'none'; previousPackStage.innerHTML = ''; }

  if (earnCard) {
    const packTitle = document.getElementById('winTitle');
    if (packTitle) packTitle.textContent = 'CARD PACK MARKET';
    document.getElementById('winSub').textContent =
      `Level ${state.level} cleared! Spend Glory on one pack, or continue without buying.`;
    renderGloryCardPacks(false);
    document.getElementById('continueBtn').style.display = 'inline-block';
    document.getElementById('nextLevelNum').textContent = state.level + 1;
  } else if (false) {
    document.getElementById('winSub').textContent = `Level ${state.level} cleared! Every 3 levels earns a card — choose one.`;
    let choices;
    try {
      choices = getCardChoices();
    } catch (err) {
      console.error('getCardChoices failed, falling back to a safe default set:', err);
      choices = ['vertical_jump', 'horizontal_jump', 'king_me'];
    }
    renderRewardCardChoices(choices);
  } else {
    const remaining = 3 - (state.levelsCompleted % 3);
    document.getElementById('winSub').textContent = `Level ${state.level} cleared! ${remaining} more level${remaining > 1 ? 's' : ''} until your next card.`;
    document.getElementById('continueBtn').style.display = 'inline-block';
    document.getElementById('nextLevelNum').textContent = state.level + 1;
  }

  document.getElementById('winOverlay').classList.add('active');
  renderGlorySummary('gloryWinSummary', true);
  hideCardsHand();
}

// LOSE_REASONS — only explicit forfeits and true piece-elimination defeats
// end a run. A board with no legal moves is intentionally non-terminal.
// â”€â”€ LAZARUS PASSIVE EPIC â”€â”€
// Store the complete friendly piece object, not just king/pawn. That keeps
// every status and visual variant exactly as it was at the moment of loss.
function cloneLazarusPiece(piece) {
  return JSON.parse(JSON.stringify(piece));
}

function getLazarusLiveFriendlySnapshots() {
  const snapshots = [];
  if (!state || !Array.isArray(state.board)) return snapshots;
  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < (state.board[row] || []).length; col++) {
      const piece = state.board[row][col]?.piece;
      if (piece?.type === 'yours') snapshots.push({ row, col, piece: cloneLazarusPiece(piece) });
    }
  }
  return snapshots;
}

function initializeLazarusFriendlySnapshot() {
  if (!state) return;
  state.lazarusFriendlySnapshot = getLazarusLiveFriendlySnapshots();
}

function trackLazarusFriendlyLosses() {
  if (!state || !Array.isArray(state.board)) return [];
  const current = getLazarusLiveFriendlySnapshots();
  if (!Array.isArray(state.lazarusGraveyard)) state.lazarusGraveyard = [];
  if (!Array.isArray(state.lazarusFriendlySnapshot)) {
    state.lazarusFriendlySnapshot = current;
    return [];
  }

  const liveIds = new Set(current.map(entry => entry.piece.id));
  const alreadyBuried = new Set(state.lazarusGraveyard.map(entry => entry.piece.id));
  const fallen = state.lazarusFriendlySnapshot.filter(entry =>
    !liveIds.has(entry.piece.id) && !alreadyBuried.has(entry.piece.id)
  );
  fallen.forEach(entry => state.lazarusGraveyard.push({
    row: entry.row,
    col: entry.col,
    piece: cloneLazarusPiece(entry.piece),
  }));
  state.lazarusFriendlySnapshot = current;
  return fallen;
}

function recordLazarusFriendlyDeath(piece, row, col) {
  if (!state || piece?.type !== 'yours' || piece.id == null) return false;
  if (!Array.isArray(state.lazarusGraveyard)) state.lazarusGraveyard = [];
  const alreadyBuried = state.lazarusGraveyard.some(entry => entry.piece?.id === piece.id);
  if (!alreadyBuried) {
    state.lazarusGraveyard.push({ row, col, piece: cloneLazarusPiece(piece) });
  }
  if (Array.isArray(state.lazarusFriendlySnapshot)) {
    state.lazarusFriendlySnapshot = state.lazarusFriendlySnapshot.filter(entry => entry.piece?.id !== piece.id);
  }
  return !alreadyBuried;
}

function findLazarusFallbackSquare(targetRow, targetCol) {
  const candidates = [];
  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < (state.board[row] || []).length; col++) {
      const cell = state.board[row][col];
      if (!cell || cell.piece || cell.hazard === 'crater' || cell.hazard === 'black_hole') continue;
      if (state.blackHoleActive && isBlackHoleCell(row, col)) continue;
      candidates.push({ row, col, distance: Math.abs(row - targetRow) + Math.abs(col - targetCol) });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance || a.row - b.row || a.col - b.col);
  if (candidates.length) return candidates[0];

  // An exceptionally crowded board may have no empty square. Preserve the
  // promise to revive every unit by taking the nearest enemy square.
  const enemyCandidates = [];
  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < (state.board[row] || []).length; col++) {
      if (state.board[row][col]?.piece?.type !== 'enemy') continue;
      if (state.blackHoleActive && isBlackHoleCell(row, col)) continue;
      enemyCandidates.push({ row, col, distance: Math.abs(row - targetRow) + Math.abs(col - targetCol) });
    }
  }
  enemyCandidates.sort((a, b) => a.distance - b.distance || a.row - b.row || a.col - b.col);
  return enemyCandidates[0] || null;
}

function restoreLazarusArmy() {
  const fallen = Array.isArray(state.lazarusGraveyard) ? state.lazarusGraveyard.slice() : [];
  state.lazarusGraveyard = [];
  let restored = 0;
  fallen.forEach(entry => {
    let row = entry.row;
    let col = entry.col;
    const desired = state.board[row]?.[col];
    // Enemies on a true death square are deliberately replaced. A friendly
    // can only be here after two units died on the same square in sequence;
    // use the nearest legal fallback so both fallen units still return.
    if (!desired || desired.piece?.type === 'yours') {
      const fallback = findLazarusFallbackSquare(row, col);
      if (!fallback) return;
      row = fallback.row;
      col = fallback.col;
    }
    state.board[row][col].piece = { ...cloneLazarusPiece(entry.piece), type: 'yours' };
    restored++;
  });
  initializeLazarusFriendlySnapshot();
  state.lastYoursCount = countPieces('yours');
  state.lastEnemyCount = countPieces('enemy');
  return restored;
}

// Lazarus does more than restore pieces: resurrection begins a completely
// fresh player turn. None of the revived IDs may remain spent from the turn
// in which they died, and the move/card budgets must be rebuilt from the
// newly restored army.
function startFreshPlayerTurnAfterLazarus() {
  if (!state) return;
  state.turnPhase = 'player';
  state.enemyTurnRemainingIds = [];
  state.blackHolePulseResolvedThisEnemyTurn = false;
  state.enemyMovedThisTurn = false;
  state.enemyFrozenThisTurn = false;
  state.plusMovedIds = [];
  state.forcedJumpPieceId = null;
  state.plusCardsUsed = 0;
  state.plusTurnPieceCount = countPieces('yours');
  state.lastCardPlayedId = null;
  state.noCaptureSnapEnemy = countPieces('enemy');
  state.noCaptureSnapYours = countPieces('yours');
  state.selected = null;
  state.validMoves = [];
  state.activeCard = null;
  state.activeCardUid = null;
  if (state.mode === 'plus' && typeof beginSandsTurn === 'function') beginSandsTurn();
}

function animateLazarusRevival(onRevive) {
  const board = document.getElementById('board');
  if (!board) { onRevive(); return; }
  const rect = board.getBoundingClientRect();
  const fxFrame = createCartoonFxFrame(rect, 'lazarus', 98);
  const light = document.createElement('div');
  light.className = 'lazarus-board-light';
  light.style.left = rect.left + 'px';
  light.style.top = rect.top + 'px';
  light.style.width = rect.width + 'px';
  light.style.height = rect.height + 'px';
  document.body.appendChild(light);
  setTimeout(onRevive, 720);
  setTimeout(() => { light.remove(); fxFrame.remove(); }, 1850);
}




function playLazarusSound() {
  try {
    const sfx = getCachedSfx(LAZARUS_SOUND_URL);
    sfx.volume = SFX_VOLUME;
    sfx.play().catch(() => {});
  } catch (err) {
    // Lazarus must still revive the army if audio playback is unavailable.
  }
}

// Animated Uncommon cards commit their gameplay state before their visuals
// begin. The current DOM still shows the pre-effect board until render(), so
// the animations retain their original targets while a force-close reloads
// the already-completed result. Reuse the global board-resolution lock so no
// move, card, or End Turn action can interleave with an animation callback.
function beginUncommonAnimationResolution() {
  if (typeof blackHoleAnimationRunning !== 'undefined') blackHoleAnimationRunning = true;
}

function saveStagedUncommonResolution() {
  saveGame();
}

function finishUncommonAnimationResolution() {
  if (typeof blackHoleAnimationRunning !== 'undefined') blackHoleAnimationRunning = false;
  render();
  saveGame();
}

function stageAnimatedUncommonMove(cardId, fromRow, fromCol, move, piece) {
  beginUncommonAnimationResolution();
  state.board[fromRow][fromCol].piece = null;
  if (cardId === 'double_jump') {
    const jumped = Array.isArray(move.captured)
      ? move.captured
      : [move.over, move.over2, move.over3, move.over4].filter(Boolean);
    jumped.forEach(cap => {
      state.board[cap.row][cap.col].piece = null;
    });
  } else {
    (move.captured || []).forEach(cap => { state.board[cap.row][cap.col].piece = null; });
  }
  state.board[move.row][move.col].piece = piece;

  let deadlyHazard = null;
  if (isDeadlyHazardForFriendly(state.board[move.row][move.col], state.mode)) {
    deadlyHazard = state.board[move.row][move.col].hazard;
    recordLazarusFriendlyDeath(piece, move.row, move.col);
    state.board[move.row][move.col].piece = null;
  } else {
    const shouldCrown = cardId === 'chariot_charge'
      ? move.row === 0 && !piece.wasKing
      : move.row === 0 && !piece.king && !piece.wasKing && !piece.ability;
    if (shouldCrown) crownFriendlyPiece(piece, cardId !== 'chariot_charge');
    applyScorchedEarth(fromRow, fromCol, move, piece);
  }

  state.shieldedPiece = null;
  state.selected = null;
  state.validMoves = [];
  state.activeCard = null;
  state.activeCardUid = null;

  let hasFurtherJumps = false;
  if (!deadlyHazard && cardId === 'double_jump' && state.mode === 'plus' && state.turnPhase === 'player') {
    const furtherJumps = getValidMoves(move.row, move.col).filter(next =>
      next.type === 'capture' || next.type === 'double_capture' || next.type === 'triple_capture'
    );
    if (furtherJumps.length) {
      hasFurtherJumps = true;
      state.forcedJumpPieceId = piece.id;
      state.selected = { row: move.row, col: move.col };
      state.validMoves = furtherJumps;
    }
  }
  if (!hasFurtherJumps) {
    state.forcedJumpPieceId = null;
    plusMarkPieceMoved(piece.id);
  }
  saveStagedUncommonResolution();
  return { deadlyHazard, hasFurtherJumps };
}

function beginPendingRareEffect(type, payload = {}) {
  state.pendingRareEffect = { type, ...cloneSandsValue(payload) };
  if (typeof blackHoleAnimationRunning !== 'undefined') blackHoleAnimationRunning = true;
  saveGame();
}

function applyPendingRareEffect(pending) {
  if (!pending?.type) return;
  const clearPieces = targets => (targets || []).forEach(target => {
    const row = target.row ?? target.r;
    const col = target.col ?? target.c;
    if (state.board[row]?.[col]) state.board[row][col].piece = null;
  });
  if (['wrath', 'plague', 'tornado', 'locust_swarm', 'tidal_wave'].includes(pending.type)) {
    clearPieces(pending.targets);
  } else if (pending.type === 'blizzard') {
    const freezeTurns = pending.freezeTurns || 1;
    (pending.targets || []).forEach(target => {
      const piece = state.board[target.row]?.[target.col]?.piece;
      if (piece?.type === 'enemy') {
        piece.frozen = true;
        piece.frozenTurnsLeft = (piece.frozenTurnsLeft || 0) + freezeTurns;
      }
    });
  } else if (pending.type === 'jester') {
    applyJesterShove();
  } else if (pending.type === 'meteor_strike') {
    applyMeteorStrike(pending.targets || []);
  } else if (pending.type === 'wildfire') {
    applyWildfireStrike(pending.targets || [], !!pending.spareFriendly);
  } else if (pending.type === 'earthquake') {
    applyEarthquakeDisplacement(pending.displaced || []);
  } else if (pending.type === 'mad_cow') {
    clearPieces(pending.captured);
    state.madCowTargetSparesFriendly = !!pending.spareFriendly;
    const poisonSparesFriendly = state.madCowTargetSparesFriendly;
    if (!state.poisonSquares) state.poisonSquares = [];
    (pending.affected || []).forEach(({ row, col }) => {
      const poisonCell = state.board[row]?.[col];
      if (!poisonCell) return;
      poisonCell.hazard = 'poison';
      poisonCell.poisonSparesFriendly = poisonSparesFriendly;
      if (!state.madCowTargetSparesFriendly && poisonCell.piece?.type === 'yours') poisonCell.piece = null;
      const existing = state.poisonSquares.find(square => square.r === row && square.c === col);
      if (existing) existing.turnsLeft = 3;
      else state.poisonSquares.push({ r: row, c: col, turnsLeft: 3 });
    });
  }
}

function commitPendingRareEffect(keepLocked = false) {
  const pending = state.pendingRareEffect;
  if (!pending) return;
  applyPendingRareEffect(pending);
  state.pendingRareEffect = null;
  if (!keepLocked && typeof blackHoleAnimationRunning !== 'undefined') blackHoleAnimationRunning = false;
  render();
  saveGame();
}

function finishPendingRareAnimation() {
  if (typeof blackHoleAnimationRunning !== 'undefined') blackHoleAnimationRunning = false;
}

function recoverPendingRareEffect() {
  const pending = state?.pendingRareEffect;
  if (!pending?.type) return null;
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  applyPendingRareEffect(pending);
  state.pendingRareEffect = null;
  if (typeof blackHoleAnimationRunning !== 'undefined') blackHoleAnimationRunning = false;
  return pending.type;
}

function recoverPendingEpicEffect() {
  const pending = state?.pendingEpicEffect;
  if (!pending?.type) return null;
  state.pendingEpicEffect = null;
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];

  const destructiveRecovery = pending.type === 'black_hole' ||
    pending.type === 'black_hole_turn' || pending.type === 'close_ranks';
  if (pending.type === 'black_hole' || pending.type === 'black_hole_turn') {
    state.blackHoleActive = true;
    applyBlackHolePull(pending.plan || []);
    if (pending.type === 'black_hole_turn') state.blackHolePulseResolvedThisEnemyTurn = true;
  } else if (pending.type === 'close_ranks') {
    resolveCloseRanksTargets(pending.targets || []);
  } else if (pending.type === 'lazarus') {
    state.lazarusReviving = false;
    restoreLazarusArmy();
    startFreshPlayerTurnAfterLazarus();
  } else if (pending.type === 'sands_of_time' && pending.target) {
    applySandsBoardState(pending.target);
    state.turnPhase = 'player';
    state.plusMovedIds = [];
    state.plusTurnPieceCount = countPieces('yours');
    state.noCaptureSnapEnemy = countPieces('enemy');
    state.noCaptureSnapYours = countPieces('yours');
    initializeSandsHistory();
  } else if (pending.type === 'divine_intervention') {
    restoreDivineInterventionArmy(pending.plan || []);
  }
  state.lazarusReviving = false;
  // Destructive recoveries must flow through render's ordinary piece-count
  // delta tracker so capture shards, statistics, Blood Oath, and friendly-loss
  // bookkeeping are awarded exactly as they are after an uninterrupted effect.
  if (!destructiveRecovery) {
    state.lastYoursCount = countPieces('yours');
    state.lastEnemyCount = countPieces('enemy');
  }
  return pending.type;
}

function tryActivateLazarus() {
  if (!state || state.lazarusReviving || countPieces('yours') > 0) return false;
  const card = (state.cards || []).find(candidate => candidate.id === 'lazarus' && !candidate.used);
  if (!card) return false;
  trackLazarusFriendlyLosses();
  if (!state.lazarusGraveyard.length) return false;
  playLazarusSound();

  // Consume the physical card immediately, exactly like Wrath disappearing
  // after its last charge. This also makes simultaneous/delayed loss checks
  // incapable of triggering the same Lazarus copy twice.
  state.cards = state.cards.filter(candidate => candidate.uid !== card.uid);
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  state.lazarusReviving = true;
  state.pendingEpicEffect = { type: 'lazarus' };
  if (typeof blackHoleAnimationRunning !== 'undefined') blackHoleAnimationRunning = true;
  setMessage('LAZARUS');
  saveGame();

  animateLazarusRevival(() => {
    state.pendingEpicEffect = null;
    const restored = restoreLazarusArmy();
    startFreshPlayerTurnAfterLazarus();
    state.lazarusReviving = false;
    if (typeof blackHoleAnimationRunning !== 'undefined') blackHoleAnimationRunning = false;
    render();
    saveGame();
    if (restored <= 0) { triggerLose('wiped_out'); return; }
    if (countPieces('enemy') === 0) { triggerWin(); return; }
    setMessage('YOUR FALLEN ARMY HAS RETURNED');
  });
  return true;
}




function playDivineInterventionSound() {
  try {
    const sfx = getCachedSfx(DIVINE_INTERVENTION_SOUND_URL);
    sfx.volume = SFX_VOLUME;
    sfx.play().catch(() => {});
  } catch (err) {
    // The resurrection must still complete if audio playback is unavailable.
  }
}

// ── DIVINE INTERVENTION PLAYABLE EPIC ──
// Lazarus already maintains the complete level-wide friendly graveyard, so
// this card deliberately shares that ledger. Restored IDs leave the graveyard
// and can be recorded again if those newly returned pawns fall later.
function getDivineInterventionOpenSquares() {
  if (!state || !Array.isArray(state.board)) return [];
  const open = [];
  getBoardShape().forEach(({ r, c }) => {
    const cell = state.board[r]?.[c];
    if (!cell || cell.piece || cell.hazard || cell.trap) return;
    if (state.blackHoleActive && isBlackHoleCell(r, c)) return;
    open.push({ row: r, col: c });
  });
  return open;
}

function shuffleDivineInterventionSquares(squares) {
  const result = squares.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildDivineInterventionPlan() {
  trackLazarusFriendlyLosses();
  const fallen = Array.isArray(state.lazarusGraveyard) ? state.lazarusGraveyard.slice() : [];
  const spaces = shuffleDivineInterventionSquares(getDivineInterventionOpenSquares());
  return fallen.slice(0, spaces.length).map((entry, index) => ({
    entry,
    row: spaces[index].row,
    col: spaces[index].col,
  }));
}

function restoreDivineInterventionArmy(plan) {
  const restoredIds = new Set();
  plan.forEach(({ entry, row, col }) => {
    const cell = state.board[row]?.[col];
    if (!cell || cell.piece || cell.hazard || cell.trap) return;
    const fallen = cloneLazarusPiece(entry.piece);
    cell.piece = {
      type: 'yours',
      king: false,
      wasKing: false,
      ability: null,
      id: fallen.id,
      variant: fallen.variant,
    };
    restoredIds.add(fallen.id);
  });
  state.lazarusGraveyard = (state.lazarusGraveyard || []).filter(entry =>
    !restoredIds.has(entry.piece.id)
  );
  initializeLazarusFriendlySnapshot();
  state.lastYoursCount = countPieces('yours');
  state.lastEnemyCount = countPieces('enemy');
  return restoredIds;
}

function animateDivineIntervention(plan, onRestore, onComplete) {
  const board = document.getElementById('board');
  if (!board) { onRestore(); onComplete(); return; }
  const rect = board.getBoundingClientRect();
  const fxFrame = createCartoonFxFrame(rect, 'divine', 98);
  const light = document.createElement('div');
  light.className = 'divine-intervention-light';
  light.style.cssText = [
    'position:fixed', 'pointer-events:none', 'overflow:hidden', 'z-index:98',
    'left:' + rect.left + 'px', 'top:' + rect.top + 'px',
    'width:' + rect.width + 'px', 'height:' + rect.height + 'px',
    'background:radial-gradient(circle at 50% 42%,rgba(255,255,238,.98) 0%,rgba(255,230,122,.62) 18%,rgba(255,190,46,.18) 48%,transparent 76%)',
    'mix-blend-mode:screen', 'opacity:0'
  ].join(';');
  const sigil = document.createElement('div');
  sigil.textContent = '✦';
  sigil.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff7be;font-size:min(34vw,34vh);filter:drop-shadow(0 0 24px #fff4a6) drop-shadow(0 0 50px #e6a719);';
  light.appendChild(sigil);
  document.body.appendChild(light);
  light.animate([
    { opacity: 0, filter: 'brightness(1)' },
    { opacity: 1, filter: 'brightness(2.4)', offset: .34 },
    { opacity: .8, filter: 'brightness(1.45)', offset: .72 },
    { opacity: 0, filter: 'brightness(1)' },
  ], { duration: 1900, easing: 'ease-in-out', fill: 'forwards' });
  sigil.animate([
    { transform: 'scale(.2) rotate(-28deg)', opacity: 0 },
    { transform: 'scale(1.08) rotate(0deg)', opacity: 1, offset: .42 },
    { transform: 'scale(1.3) rotate(8deg)', opacity: 0 },
  ], { duration: 1900, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'forwards' });

  setTimeout(() => {
    const restoredIds = onRestore();
    render();
    requestAnimationFrame(() => {
      restoredIds.forEach(id => {
        const pieceEl = document.querySelector('.piece[data-piece-id="' + id + '"]');
        if (!pieceEl) return;
        pieceEl.animate([
          { transform: 'scale(.05)', opacity: 0, filter: 'brightness(4) drop-shadow(0 0 18px #fff8b7)' },
          { transform: 'scale(1.18)', opacity: 1, filter: 'brightness(2.2) drop-shadow(0 0 16px #ffd85b)' },
          { transform: 'scale(1)', opacity: 1, filter: '' },
        ], { duration: 850, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
      });
    });
  }, 650);
  setTimeout(() => { light.remove(); fxFrame.remove(); onComplete(); }, 1920);
}

function activateDivineInterventionCard() {
  const plan = buildDivineInterventionPlan();
  const fallenCount = Array.isArray(state.lazarusGraveyard) ? state.lazarusGraveyard.length : 0;
  if (!plan.length || plan.length < fallenCount) {
    state.activeCard = null;
    state.activeCardUid = null;
    render();
    setMessage(plan.length ? 'NOT ENOUGH SAFE SPACES FOR ALL FALLEN UNITS' : 'NO FALLEN FRIENDLY UNIT CAN RETURN');
    return;
  }
  playDivineInterventionSound();
  const consumedUid = state.activeCardUid;
  state.divineInterventionAcquiredThisRun = true;
  state.divineInterventionUsedThisRun = true;
  markCardUsed('divine_intervention');
  state.cards = state.cards.filter(card => card.uid !== consumedUid);
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  blackHoleAnimationRunning = true;
  state.pendingEpicEffect = { type: 'divine_intervention', plan: cloneSandsValue(plan) };
  setMessage('HEAVEN ANSWERS...');
  saveGame();
  animateDivineIntervention(
    plan,
    () => {
      state.pendingEpicEffect = null;
      restoreDivineInterventionArmy(plan);
    },
    () => {
      blackHoleAnimationRunning = false;
      saveGame();
      const restored = plan.length - (state.lazarusGraveyard || []).filter(entry =>
        plan.some(item => item.entry.piece.id === entry.piece.id)
      ).length;
      setMessage(restored === 1 ? '1 FALLEN PIECE REINSTATED AS A PAWN' : restored + ' FALLEN PIECES REINSTATED AS PAWNS');
      maybeEndPlayerTurn();
    }
  );
}

const LOSE_REASONS = {
  wiped_out: {
    title: 'WIPED OUT',
    sub: 'Your last piece was captured.<br>Your run ends here.',
  },
  forfeit: {
    title: 'RUN FORFEITED',
    sub: 'You forfeited this run.<br>Your run ends here.',
  },
};

// Forfeit — an escape hatch for the rare board where the last enemy (or
// enemies) end up somewhere no card or move can actually reach (e.g. an
// enemy stranded on a light/"brown" square no piece can step on), which
// would otherwise soft-lock the run forever with no way to win OR lose.
// Reuses triggerLose() as-is: state.levelsCompleted already reflects levels
// actually cleared (NOT the level you're currently on), so forfeiting on
// level 20 scores exactly like dying on level 20 would — credit for level 19.
function forfeitRun() {
  if (state.gameOver) return;
  showGameDialog(
    `Forfeit this run at Level ${state.level}? You'll be scored for the ${state.levelsCompleted || 0} level(s) you've actually cleared, same as if you'd lost normally.`,
    {
      title: 'FORFEIT RUN?',
      confirmText: 'FORFEIT',
      cancelText: 'KEEP PLAYING',
      onConfirm: () => {
        if (!state.gameOver) triggerLose('forfeit');
      }
    }
  );
}

function triggerLose(reason) {
  if (!state || state.gameOver) return;
  // Delayed enemy callbacks can arrive after Lazarus has already restored
  // the army. Never convert that stale wipe notification into a real loss.
  if (reason === 'wiped_out' && countPieces('yours') > 0) return;
  if (reason === 'wiped_out' && state.lazarusReviving) return;
  if (reason === 'wiped_out' && tryActivateLazarus()) return;
  document.getElementById('stalemateOverlay').classList.remove('active');
  document.getElementById('levelSelectOverlay').classList.remove('active');
  state.gameOver = true;
  // Loss and forfeit both funnel through here (see forfeitRun above) — this
  // is the one guaranteed place a run actually ends, so it's where the
  // run-duration sound-effects mute choice resets back to on, and where the
  // main menu's music resumes immediately rather than waiting for the
  // player to manually click through to the menu via the lose overlay.
  state.sfxMuted = false;
  applySfxMuteFromState();
  playMenuMusic();
  if (!CARTOON_SHOWCASE_BUILD) {
    const activeStats = activeStatsObj();
    activeStats.runsLost++;
    activeStats.totalLevelsCleared += state.levelsCompleted || 0;
    if (state.mode === 'plus') {
      activeStats.bestLevelPlus = Math.max(activeStats.bestLevelPlus, state.levelsCompleted || 0);
      activeStats.legitBestLevelPlus = Math.max(activeStats.legitBestLevelPlus, state.levelsCompleted || 0);
    } else {
      activeStats.bestLevel = Math.max(activeStats.bestLevel, state.levelsCompleted || 0);
      activeStats.legitBestLevel = Math.max(activeStats.legitBestLevel, state.levelsCompleted || 0);
    }
    saveActiveStats();
  }
  render();
  const info = LOSE_REASONS[reason] || LOSE_REASONS.forfeit;
  document.getElementById('loseTitle').textContent = info.title;
  document.getElementById('loseSub').innerHTML = info.sub;
  document.getElementById('finalLevel').textContent = `You reached Level ${state.level}`;
  renderGlorySummary('gloryLoseSummary', false);
  document.getElementById('loseOverlay').classList.add('active');
  hideCardsHand();

  // A lost run is the one definitive "this run is over" moment (wins just
  // advance to the next level, there's no separate "beat the whole game"
  // screen) — so this is the only place a score actually gets submitted.
  const rankMsgEl = document.getElementById('leaderboardRankMsg');
  if (rankMsgEl) rankMsgEl.textContent = '';
  // Score is levels actually beaten this run, not the level lost on.
  if (CARTOON_SHOWCASE_BUILD) {
    if (rankMsgEl) rankMsgEl.textContent = 'Developer scores are not submitted.';
  } else {
    submitScoreIfEligible(state.mode, state.levelsCompleted, state.runActiveMs).then(rank => {
      if (rank && rankMsgEl) {
        const boardName = state.mode === 'plus' ? 'New Run' : 'New Puzzle';
        rankMsgEl.textContent = `Congratulations, you are now Rank ${rank} on the ${boardName} leaderboard!`;
      }
    });
  }
}

function hideCardsHand() {
  const handEl = document.getElementById('cardsHand');
  if (handEl) handEl.style.visibility = 'hidden';
}

function showCardsHand() {
  const handEl = document.getElementById('cardsHand');
  if (handEl) handEl.style.visibility = '';
}

function grantCardToCurrentRun(cardId) {
  const def = CARD_DEFS[cardId];
  if (!def) return false;
  unlockCard(cardId, state.mode);
  claimRunCardMastery(cardId);
  const rewardBaseOnly = false;
  if (cardId === 'plus_one') {
    state.whiteCardCount = (state.whiteCardCount || 0) + 1;
    state.rewardCardBonus = (state.rewardCardBonus || 0) + getPlusOneRewardBonus(state.mode, rewardBaseOnly);
  } else if (cardId === 'reinforcements') {
    state.whiteCardCount = (state.whiteCardCount || 0) + 1;
    state.bonusPieces = (state.bonusPieces || 0) + getReinforcementPieceBonus(state.mode, rewardBaseOnly);
  } else if (cardId === 'veteran') {
    state.whiteCardCount = (state.whiteCardCount || 0) + 1;
    state.veteranCount = (state.veteranCount || 0) + getVeteranStartingKingCount(state.mode, rewardBaseOnly);
  } else if (cardId === 'ace_up_the_sleeve') {
    state.whiteCardCount = (state.whiteCardCount || 0) + 1;
    state.bonusCardActions = (state.bonusCardActions || 0) + getAceCardActionBonus(state.mode, rewardBaseOnly);
  } else if (cardId === 'blood_oath') {
    state.whiteCardCount = (state.whiteCardCount || 0) + 1;
    state.bloodOathCount = (state.bloodOathCount || 0) + 1;
  } else if (cardId === 'royal_standard') {
    state.whiteCardCount = (state.whiteCardCount || 0) + 1;
    state.royalStandardCount = (state.royalStandardCount || 0) + 1;
  } else if (def.plusOnly && state.mode !== 'plus') {
    // The card is permanently discovered, but cannot enter a Puzzle hand.
  } else {
    if (cardId === 'black_hole') state.blackHoleAcquiredThisRun = true;
    if (cardId === 'sands_of_time') state.sandsOfTimeAcquiredThisRun = true;
    if (cardId === 'divine_intervention') state.divineInterventionAcquiredThisRun = true;
    state.cards.push({ id: cardId, used: false, uid: state.cardUidCounter++, baseOnly: rewardBaseOnly });
  }
  saveGame();
  return true;
}

function nextLevel() {
  if (state.cardPackOpening) return;
  const resolvingOpeningReward = state.openingRewardPending === true;
  const packStage = document.getElementById('cardPackStage');
  if (packStage) { packStage.style.display = 'none'; packStage.innerHTML = ''; packStage.classList.remove('pack-revealing'); }
  const cardChoices = document.getElementById('cardChoices');
  if (cardChoices) cardChoices.style.display = 'flex';
  // Card packs grant their reveal immediately. Legacy/tutorial reward cards
  // still arrive through pendingRewardCardId, so consume that path here once.
  if (state.pendingRewardCardId) {
    const pendingCardId = state.pendingRewardCardId;
    state.pendingRewardCardId = null;
    grantCardToCurrentRun(pendingCardId);
  }
  // Commit whichever reward card was selected (if the level-up screen
  // offered one) now, at the moment of confirming — not the moment it was
  // tapped, so tapping a different card beforehand can still change the pick.
  if (state.pendingRewardCardId) {
    const cardId = state.pendingRewardCardId;
    state.pendingRewardCardId = null;
    unlockCard(cardId, state.mode); // permanent collection progress — works for white cards too now
    const def = CARD_DEFS[cardId];
    // Reward-screen copies always inherit the card's permanent mastery.
    // Still register the acquisition for legacy/run bookkeeping, but do not
    // downgrade a duplicate reward to its base effect.
    claimRunCardMastery(cardId);
    const rewardBaseOnly = false;
    if (cardId === 'plus_one') {
      // Not held — just permanently widens every future reward screen
      // this run. whiteCardCount is what actually makes white cards rarer
      // to pull again (shared across every white card, see WHITE_CARD_POOL).
      state.whiteCardCount = (state.whiteCardCount || 0) + 1;
      state.rewardCardBonus = (state.rewardCardBonus || 0) + getPlusOneRewardBonus(state.mode, rewardBaseOnly);
    } else if (cardId === 'reinforcements') {
      // Not held — a permanent extra piece joins your formation starting
      // next level (and every level after that, for the rest of the run).
      state.whiteCardCount = (state.whiteCardCount || 0) + 1;
      state.bonusPieces = (state.bonusPieces || 0) + getReinforcementPieceBonus(state.mode, rewardBaseOnly);
    } else if (cardId === 'veteran') {
      // Not held — starting next level (and every level after that, for
      // the rest of the run), one MORE of your pieces begins the round
      // already crowned. Stacks with every copy picked. See setupLevel().
      state.whiteCardCount = (state.whiteCardCount || 0) + 1;
      state.veteranCount = (state.veteranCount || 0) + getVeteranStartingKingCount(state.mode, rewardBaseOnly);
    } else if (cardId === 'ace_up_the_sleeve') {
      // Not held — permanently adds one extra card action to the per-turn
      // budget for the rest of this run. Stacks each time it's picked.
      state.whiteCardCount = (state.whiteCardCount || 0) + 1;
      state.bonusCardActions = (state.bonusCardActions || 0) + getAceCardActionBonus(state.mode, rewardBaseOnly);
    } else if (cardId === 'blood_oath') {
      // Not held — the first time you lose a piece each level, one random
      // temporary card is drawn into your hand for that level only.
      state.whiteCardCount = (state.whiteCardCount || 0) + 1;
      state.bloodOathCount = (state.bloodOathCount || 0) + 1;
    } else if (cardId === 'royal_standard') {
      // Passive Bonus card: beginning with the next board, placement is
      // required before movement or other cards can be used.
      state.whiteCardCount = (state.whiteCardCount || 0) + 1;
      state.royalStandardCount = (state.royalStandardCount || 0) + 1;
    } else if (def && def.plusOnly && state.mode !== 'plus') {
      // Plus-only cards (Blizzard, etc.) can still be picked and unlocked in
      // a regular New Run — it just goes straight to the collection instead
      // of your hand, since it has nothing to do in a run without turns.
    } else {
      if (cardId === 'black_hole') state.blackHoleAcquiredThisRun = true;
      if (cardId === 'sands_of_time') state.sandsOfTimeAcquiredThisRun = true;
      if (cardId === 'divine_intervention') state.divineInterventionAcquiredThisRun = true;
      state.cards.push({ id: cardId, used: false, uid: state.cardUidCounter++, baseOnly: rewardBaseOnly });
    }
  }

  // The opening reward begins the current level; it must not increment the
  // level number. Generate the board only now so white/passive rewards such
  // as Reinforcements and Veteran affect the very first level immediately.
  if (resolvingOpeningReward) {
    state.openingRewardPending = false;
    state.gameOver = false;
    document.getElementById('winOverlay').classList.remove('active');
    const winTitle = document.getElementById('winTitle');
    if (winTitle) winTitle.textContent = 'CLEARED';
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.style.display = 'none';
    continueBtn.innerHTML = `Continue to Level <span id="nextLevelNum">${state.level + 1}</span>`;
    showCardsHand();
    setupLevel();
    return;
  }

  state.gameOver = false;
  document.getElementById('winOverlay').classList.remove('active');

  // The tutorial's guided run is only ever this one scripted level — there's
  // no level 2 to actually set up. The reward pick just committed above (the
  // whole point of showing this screen) already really did land in the real
  // collection, so from here the walkthrough hops back to the main menu to
  // show off the Collection screen next, instead of calling setupLevel() for
  // a level that was never scripted.
  if (tutorial.active) {
    showMainMenu();
    advanceTutorial(12);
    return;
  }

  state.level++;
  // Assassinate is a renewable resource, unlike other cards — its charges
  // refill to full every time you advance to a new level (but NOT on a
  // same-level retry/restart).
  state.cards.forEach(c => { if (c.id === 'assassinate') c.used = false; });
  showCardsHand();
  setupLevel();
}

// Developer-only direct advance. This never calls triggerWin(), awards a
// pack, records public progression, or mutates the release collection.
function developerSkipLevel() {
  if (!CARTOON_SHOWCASE_BUILD || !state || typeof state.level !== 'number') return;
  state.pendingRewardCardId = null;
  state.openingRewardPending = false;
  state.cardPackOpening = false;
  state.gameOver = false;
  ['winOverlay', 'loseOverlay', 'stalemateOverlay', 'gameDialogOverlay'].forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  const packStage = document.getElementById('cardPackStage');
  if (packStage) { packStage.innerHTML = ''; packStage.style.display = 'none'; }
  state.level++;
  showCardsHand();
  setupLevel();
  setMessage(`DEVELOPER LEVEL ${state.level}`);
}

function resetLevel() {
  state.gameOver = false;
  document.getElementById('loseOverlay').classList.remove('active');
  document.getElementById('winOverlay').classList.remove('active');
  showCardsHand();
  setupLevel();
}

function resetGame() {
  document.getElementById('loseOverlay').classList.remove('active');
  document.getElementById('winOverlay').classList.remove('active');
  showCardsHand();
  clearSave();
  initState();
}

// The in-game "Menu" buttons (persistent row + lose screen) route back to
// the main menu instead of silently restarting — the run stays saved, so
// "Continue Run" picks it back up from the menu if you didn't mean to leave.
function showStalemateOverlay() {
  if (state.gameOver) return;
  const streak    = state.noCaptureStreak || 0;
  const warning   = streak / 5; // 1 or 2
  const remaining = 3 - warning;
  document.getElementById('stalemateSub').innerHTML =
    `${streak} moves without a capture.<br>` +
    `Warning ${warning} of 2 — ${remaining} warning${remaining !== 1 ? 's' : ''} left before the level auto-restarts.`;
  document.getElementById('stalemateOverlay').classList.add('active');
}

function dismissStalemate() {
  document.getElementById('stalemateOverlay').classList.remove('active');
  render();
}

// Restart the current level with a freshly randomised board. Level number
// stays the same; the card hand is kept but usage flags are cleared.
function restartLevelFresh() {
  document.getElementById('stalemateOverlay').classList.remove('active');
  state.noCaptureStreak = 0;
  setupLevel();
  setMessage('15 moves without a capture — level restarted with a new layout.');
}

function returnToMenu() {
  document.getElementById('loseOverlay').classList.remove('active');
  document.getElementById('winOverlay').classList.remove('active');
  // A finished New Puzzle run returns to the New Puzzle hub, not the main
  // King Me menu — it's a standalone game now, so "Menu" means its own menu.
  if (state && state.mode === 'normal') {
    showPuzzleMenu();
  } else {
    showMainMenu();
  }
}


// Card hover preview


















// King crown art — a real photographed marble crown (background removed)
// that REPLACES a kinged piece's own art entirely, same footprint as any
// other piece. Light marble crown for your pieces, dark marble crown for
// the enemy's — swapped onto the piece's own <img> in render().







































































































// Hand-built bear trap icon (replaces the old 🪤 emoji, which rendered
// inconsistently across platforms and didn't look like an actual trap).
// Two jaw groups (each a curved band of teeth) sit apart at rest; the
// .trap-jaw-top / .trap-jaw-bottom classes are what the "snapping" CSS
// animates together when a piece steps on the trap.
const BEAR_TRAP_ICON_SVG = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="53" rx="36" ry="30" fill="#1c1a16" stroke="#5a5248" stroke-width="3"/>
    <ellipse cx="50" cy="53" rx="36" ry="30" fill="none" stroke="#8c5a28" stroke-width="1" opacity="0.6"/>
    <circle cx="50" cy="53" r="7" fill="#302b24" stroke="#7a7168" stroke-width="2"/>
    <circle cx="50" cy="53" r="2.4" fill="#4a4238"/>
    <g class="trap-jaw trap-jaw-top">
      <path d="M17,42 Q50,8 83,42" fill="none" stroke="#9a9188" stroke-width="6" stroke-linecap="round"/>
      <path d="M24,38 L28,25 L32,38 Z M38,32 L42,17 L46,32 Z M54,32 L58,17 L62,32 Z M68,38 L72,25 L76,38 Z"
            fill="#c8c0b4" stroke="#847a6e" stroke-width="1"/>
    </g>
    <g class="trap-jaw trap-jaw-bottom">
      <path d="M17,64 Q50,98 83,64" fill="none" stroke="#9a9188" stroke-width="6" stroke-linecap="round"/>
      <path d="M24,68 L28,81 L32,68 Z M38,74 L42,89 L46,74 Z M54,74 L58,89 L62,74 Z M68,68 L72,81 L76,68 Z"
            fill="#c8c0b4" stroke="#847a6e" stroke-width="1"/>
    </g>
  </svg>
`;

// Card-back art for the resting stack boxes — shown face-down until you tap
// the stack open; the popup always shows the real face regardless.



function showCardPreview(el, group) {
  const preview = document.getElementById('cardPreview');
  if (!preview) return;
  const def = CARD_DEFS[group.id];
  if (!def) return;
  const rect = el.getBoundingClientRect();
  preview.style.left = (rect.left + rect.width / 2) + 'px';
  preview.style.top  = rect.top + 'px';

  const isEpic     = def.rarity === 'epic';
  const isRare     = def.rarity === 'rare';
  const isUncommon = def.rarity === 'uncommon';
  const nameColor  = isEpic ? '#f8dc76' : isRare ? '#ffffff' : isUncommon ? '#4a8f4a' : '#e8b84b';
  const rarity     = isEpic ? 'Epic' : ''; // Epic is deliberately called out
  const rarityColor = isEpic ? '#f8dc76' : isRare ? '#3d6fa8' : isUncommon ? '#4a8f4a' : '#888';
  const borderColor = isEpic ? '#f6d66b' : isRare ? '#3d6fa8' : isUncommon ? '#4a8f4a' : '#e8b84b';
  preview.style.boxShadow = `0 16px 40px rgba(0,0,0,0.9), 0 0 0 2px ${borderColor}`;

  let innerHTML = '';
  if (group.id === 'vertical_jump') {
    innerHTML = `
      <div class="preview-art">
        <img src="${INFANTRY_ART_URL}" style="height:95%;bottom:0;left:-5%;opacity:0.8;filter:brightness(0.55);"/>
        <img src="${INFANTRY_ART_URL}" style="height:95%;bottom:0;right:-5%;opacity:0.8;filter:brightness(0.55);transform:scaleX(-1);"/>
        <img src="${INFANTRY_ART_URL}" style="height:100%;bottom:0;left:50%;transform:translateX(-50%);"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'horizontal_jump') {
    innerHTML = `
      <div class="preview-art">
        <img src="${CAVALRY_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'king_me') {
    innerHTML = `
      <div class="preview-art">
        <img src="${KING_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'revert') {
    innerHTML = `
      <div class="preview-art">
        <img src="${DEMOTION_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'teleport') {
    innerHTML = `
      <div class="preview-art">
        <img src="${PHANTOM_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'double_jump') {
    innerHTML = `
      <div class="preview-art">
        <img src="${WARHORSE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 't_strike') {
    innerHTML = `
      <div class="preview-art">
        <img src="${BALLISTA_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'usurp') {
    innerHTML = `
      <div class="preview-art">
        <img src="${USURP_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'wrath') {
    innerHTML = `
      <div class="preview-art">
        <img src="${WRATH_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'catapult') {
    innerHTML = `
      <div class="preview-art">
        <img src="${CATAPULT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'conscript') {
    innerHTML = `
      <div class="preview-art">
        <img src="${CONSCRIPT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'coup_detat') {
    innerHTML = `
      <div class="preview-art">
        <img src="${COUP_DETAT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'siege') {
    innerHTML = `
      <div class="preview-art">
        <img src="${SIEGE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'feint') {
    innerHTML = `
      <div class="preview-art">
        <img src="${FEINT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'earthquake') {
    innerHTML = `
      <div class="preview-art">
        <img src="${EARTHQUAKE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'mad_cow') {
    innerHTML = `
      <div class="preview-art">
        <img src="${MADCOW_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'dead_mans_hand') {
    innerHTML = `
      <div class="preview-art">
        <img src="${DEAD_MANS_HAND_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'heros_gambit') {
    innerHTML = `
      <div class="preview-art">
        <img src="${HEROS_GAMBIT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'phalanx') {
    innerHTML = `
      <div class="preview-art">
        <img src="${PHALANX_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'ace_up_the_sleeve') {
    innerHTML = `
      <div class="preview-art">
        <img src="${ACE_UP_THE_SLEEVE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'blood_oath') {
    innerHTML = `
      <div class="preview-art">
        <img src="${BLOOD_OATH_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'tidal_wave') {
    innerHTML = `
      <div class="preview-art">
        <img src="${TIDAL_WAVE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'trojan_horse') {
    innerHTML = `
      <div class="preview-art">
        <img src="${TROJAN_HORSE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'war_tax') {
    innerHTML = `
      <div class="preview-art">
        <img src="${WAR_TAX_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'puppet_master') {
    innerHTML = `
      <div class="preview-art">
        <img src="${PUPPET_MASTER_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'scorched_earth') {
    innerHTML = `
      <div class="preview-art">
        <img src="${SCORCHED_EARTH_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'last_stand') {
    innerHTML = `
      <div class="preview-art">
        <img src="${LAST_STAND_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else if (group.id === 'thors_hammer') {
    innerHTML = `
      <div class="preview-art">
        <img src="${THORS_HAMMER_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;"/>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-body">
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  } else {
    innerHTML = `
      <div class="preview-body" style="padding-top:16px;">
        <div class="preview-icon">${def.icon}</div>
        <div class="preview-name" style="color:${nameColor}">${def.name}</div>
        <div class="preview-desc">${def.desc}</div>
        <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      </div>`;
  }

  // Preserve corner spans, then add the same orb state used by the actual
  // card face. The hover preview is a card view too, so it cannot be stock-only.
  preview.innerHTML = '<span class="preview-corner tl">✦</span><span class="preview-corner tr">✦</span>' + innerHTML;
  const previewBodies = preview.querySelectorAll('.preview-body');
  const previewBody = previewBodies[previewBodies.length - 1];
  if (previewBody) {
    const displayCard = group.cards?.find(card => !card.used) || group.cards?.[0];
    const masteryLevelOverride = null;
    previewBody.insertAdjacentHTML('beforeend', getMasteryOrbsHTML(group.id, masteryLevelOverride));
  }
  preview.classList.add('visible');
}

function hideCardPreview() {
  const preview = document.getElementById('cardPreview');
  if (preview) preview.classList.remove('visible');
}

// ── T-STRIKE ANIMATION ──
// Battering Ram uses the same deliberate cadence as Chariot Charge: visible
// anticipation, a continuous rush through empty ground, a separate impact
// beat only on occupied enemy squares, then a short landing settle.
function animateBatteringRam(fromRow,toRow,col,impactRows,callback) {
  const boardEl=document.getElementById('board');
  const bsR=getBoardRows(), bsC=getBoardCols();
  const cells=boardEl?.querySelectorAll('.cell');
  const fromCell=cells?.[fromRow*bsC+col];
  const pieceEl=fromCell?.querySelector('.piece');
  if(!boardEl||!pieceEl){callback();return;}
  const fxFrame=createCartoonFxFrame(boardEl.getBoundingClientRect(),'charge',18);
  const cellH=boardEl.offsetHeight/bsR;
  const impacted=new Set(impactRows||[]);
  pieceEl.style.transition='none';
  pieceEl.style.zIndex='20';
  void pieceEl.offsetWidth;
  pieceEl.style.transition='transform 180ms ease-out';
  pieceEl.style.transform='translateY(10px)';

  function impactAt(row){
    if(!impacted.has(row)) return;
    playChargeHitSound();
    const cell=cells[row*bsC+col];
    if(!cell) return;
    const flash=document.createElement('div');
    flash.className='charge-impact-flash';
    cell.appendChild(flash);
    requestAnimationFrame(()=>{
      flash.style.transform='translate(-50%, -50%) scale(6)';
      flash.style.opacity='0';
    });
    setTimeout(()=>flash.remove(),340);
    const enemyEl=cell.querySelector('.piece');
    if(enemyEl){
      enemyEl.style.zIndex='15';
      enemyEl.style.transition='transform 360ms cubic-bezier(.2,.8,.35,1), opacity 360ms ease';
      enemyEl.style.transform=`translateY(${-cellH}px) rotate(-18deg)`;
      if(row===0) enemyEl.style.opacity='0';
    }
    const boardWrap=document.querySelector('.board-wrap');
    if(boardWrap){
      boardWrap.classList.remove('charge-shake');
      void boardWrap.offsetWidth;
      boardWrap.classList.add('charge-shake');
    }
  }

  const orderedImpacts=[...new Set(impactRows||[])]
    .filter(row=>row<fromRow&&row>=toRow)
    .sort((a,b)=>b-a);
  let impactIndex=0;
  function rushTo(row,onArrive){
    const distance=Math.abs(row-fromRow);
    const duration=Math.max(120,Math.min(300,75*distance));
    pieceEl.style.transition=`transform ${duration}ms cubic-bezier(.45,0,.75,.35)`;
    pieceEl.style.transform=`translateY(${(row-fromRow)*cellH}px)`;
    setTimeout(onArrive,duration);
  }
  function hitNext(){
    if(impactIndex>=orderedImpacts.length){
      rushTo(toRow,()=>{
        pieceEl.style.transition='transform 150ms ease-out';
        pieceEl.style.transform=`translateY(${(toRow-fromRow)*cellH}px)`;
        setTimeout(()=>{
          pieceEl.style.zIndex='';
          pieceEl.style.transition='';
          fxFrame.remove();
          callback();
        },170);
      });
      return;
    }
    const impactRow=orderedImpacts[impactIndex++];
    rushTo(impactRow,()=>{
      impactAt(impactRow);
      setTimeout(hitNext,150);
    });
  }

  setTimeout(()=>{
    if(!orderedImpacts.length){
      rushTo(toRow,()=>{
        pieceEl.style.transition='transform 150ms ease-out';
        pieceEl.style.transform=`translateY(${(toRow-fromRow)*cellH}px)`;
        setTimeout(()=>{
          pieceEl.style.zIndex='';
          pieceEl.style.transition='';
          fxFrame.remove();
          callback();
        },170);
      });
      return;
    }
    hitNext();
  },190);
}

// Infantry/Cavalry/Chariot Charge — rewritten for a slower, deliberate feel:
// the charging piece rushes to EACH enemy in its path as a distinct segment,
// visibly connects (impact flash + board jolt) with a real knockback flight
// for that enemy specifically, then continues on to the next one (or the
// final empty landing square once every enemy in the lane is down). This
// replaces the old version, which resolved every capture inside one
// continuous 280ms blur — too fast to actually read as a sequence of hits.
function animateCharge(fromRow, fromCol, toRow, toCol, captured, direction, callback) {
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const cells = boardEl.querySelectorAll('.cell');
  const fromCell = cells[fromRow * bsC + fromCol];
  const pieceEl  = fromCell?.querySelector('.piece');
  if (!pieceEl) { callback(); return; }
  const fxFrame = createCartoonFxFrame(boardEl.getBoundingClientRect(), 'charge', 18);

  const cellW = boardEl.offsetWidth  / bsC;
  const cellH = boardEl.offsetHeight / bsR;

  // Sort captured enemies in travel order so they're struck in sequence,
  // nearest first, exactly as the charging piece would actually reach them.
  const sortedCaps = [...(captured || [])].sort((a, b) => {
    if (direction === 'up')    return b.row - a.row;
    if (direction === 'down')  return a.row - b.row;
    if (direction === 'left')  return b.col - a.col;
    if (direction === 'right') return a.col - b.col;
    return 0;
  });

  const pullX = direction === 'left' ? 10 : direction === 'right' ? -10 : 0;
  const pullY = direction === 'up'   ? 10 : direction === 'down'  ? -10 : 0;

  pieceEl.style.transition = 'none';
  pieceEl.style.zIndex = '20';
  void pieceEl.offsetWidth; // force reflow so the 'none' transition actually applies before the next line

  // Phase 1 — anticipation: a small pull-back opposite the charge direction.
  pieceEl.style.transition = 'transform 0.14s ease-out';
  pieceEl.style.transform = `translate(${pullX}px, ${pullY}px)`;

  const PAUSE_BETWEEN_HITS = 110; // beat to let each knockback actually register before moving on

  setTimeout(() => {
    let step = 0;

    // Rushes from wherever the piece currently is to the given board cell.
    // Distance-scaled duration: a single-cell hop still reads as real motion
    // (floor), a long charge across an empty lane doesn't crawl (cap).
    function rushTo(row, col, onArrive) {
      const dx = (col - fromCol) * cellW;
      const dy = (row - fromRow) * cellH;
      const cellDist = Math.abs(row - fromRow) + Math.abs(col - fromCol);
      const duration = Math.max(90, Math.min(220, 70 * cellDist));
      pieceEl.style.transition = `transform ${duration}ms cubic-bezier(.5,0,.85,.3)`;
      pieceEl.style.transform = `translate(${dx}px, ${dy}px)`;
      setTimeout(onArrive, duration);
    }

    function knockOffCapturedPiece(cap) {
      const capCell = cells[cap.row * bsC + cap.col];
      const capPiece = capCell?.querySelector('.piece');
      if (!capCell) return;

      playChargeHitSound(); // once per actual hit — see the function's own comment

      // Impact flash right at the moment of the hit.
      const flash = document.createElement('div');
      flash.className = 'charge-impact-flash';
      capCell.appendChild(flash);
      requestAnimationFrame(() => {
        flash.style.transform = 'translate(-50%, -50%) scale(6)';
        flash.style.opacity = '0';
      });
      setTimeout(() => flash.remove(), 300);

      // A real board jolt, not just a piece animation — sells the weight of
      // the hit. Reuses the .board-wrap shake target so it composes with
      // the 2.5D tilt (see .board-tilt) instead of fighting it.
      const boardWrapEl = document.querySelector('.board-wrap');
      if (boardWrapEl) {
        boardWrapEl.classList.remove('charge-shake');
        void boardWrapEl.offsetWidth;
        boardWrapEl.classList.add('charge-shake');
      }

      if (!capPiece) return;
      const scatter = (Math.random() - 0.5) * 60;
      const flyX = direction === 'left'  ? -300 + scatter :
                   direction === 'right' ?  300 + scatter : scatter;
      const flyY = direction === 'up'    ? -300 + scatter :
                   direction === 'down'  ?  300 + scatter : scatter;
      const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360);
      capPiece.style.zIndex = '15';
      capPiece.style.transition = 'transform 0.45s cubic-bezier(0.2,0.8,0.4,1), opacity 0.45s ease-in';
      capPiece.style.transform  = `translate(${flyX}px, ${flyY}px) rotate(${spin}deg) scale(1.3)`;
      capPiece.style.opacity    = '0';
    }

    function hitNext() {
      if (step >= sortedCaps.length) {
        // Every enemy in the lane is down — final rush to the actual
        // landing square, then a quick settle before handing back control.
        rushTo(toRow, toCol, () => {
          pieceEl.style.transition = 'transform 0.12s ease-out';
          pieceEl.style.transform = '';
          setTimeout(() => {
            pieceEl.style.zIndex = '';
            pieceEl.style.transition = '';
            fxFrame.remove();
            callback();
          }, 130);
        });
        return;
      }
      const cap = sortedCaps[step];
      rushTo(cap.row, cap.col, () => {
        knockOffCapturedPiece(cap);
        step++;
        setTimeout(hitNext, PAUSE_BETWEEN_HITS);
      });
    }
    hitNext();
  }, 150);
}

// WAR HORSE — leaps in an arcing hop over each jumped enemy in sequence,
// like a checkers king jump made real: the attacking piece's own DOM
// element hops up and over each enemy square (parabolic arc, not a flat
// slide), the jumped piece flinches/squashes at the instant it's passed
// over, then fades away — landing with one board shake on first impact.
function animateWarHorse(fromRow, fromCol, toRow, toCol, jumped, callback) {
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const cells = boardEl.querySelectorAll('.cell');
  const fromCell = cells[fromRow * bsC + fromCol];
  const pieceEl = fromCell?.querySelector('.piece');
  if (!pieceEl) { callback(); return; }
  const fxFrame = createCartoonFxFrame(boardEl.getBoundingClientRect(), 'war-horse', 18);

  playWarHorseSound();

  const cellW = boardEl.offsetWidth / bsC;
  const cellH = boardEl.offsetHeight / bsR;

  // Build the full hop path: start -> each jumped enemy's square (mid-arc
  // apex point) -> final landing square. jumped[] is already in travel
  // order (over, over2, over3).
  const hops = (jumped || []).map(j => ({ row: j.row, col: j.col }));
  hops.push({ row: toRow, col: toCol });

  pieceEl.style.transition = 'none';
  pieceEl.style.zIndex = '20';
  void pieceEl.offsetWidth;

  let shaken = false;
  function shakeBoardOnce() {
    if (shaken) return;
    shaken = true;
    const boardWrapEl = document.querySelector('.board-wrap');
    if (boardWrapEl) {
      boardWrapEl.classList.remove('charge-shake');
      void boardWrapEl.offsetWidth;
      boardWrapEl.classList.add('charge-shake');
    }
  }

  function flinchEnemy(row, col) {
    const cell = cells[row * bsC + col];
    const enemyEl = cell?.querySelector('.piece');
    if (!cell) return;

    // Impact flash right at the moment the horse passes overhead.
    const flash = document.createElement('div');
    flash.className = 'charge-impact-flash';
    cell.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.transform = 'translate(-50%, -50%) scale(5)';
      flash.style.opacity = '0';
    });
    setTimeout(() => flash.remove(), 300);

    if (!enemyEl) return;
    // Quick downward squash/flinch first...
    enemyEl.style.transition = 'transform 0.1s ease-out';
    enemyEl.style.transform = 'translateY(4px) scaleY(0.8) scaleX(1.08)';
    setTimeout(() => {
      // ...then fade/shrink away rather than instantly vanishing.
      const scatter = (Math.random() - 0.5) * 30;
      enemyEl.style.zIndex = '15';
      enemyEl.style.transition = 'transform 0.32s cubic-bezier(0.2,0.8,0.4,1), opacity 0.32s ease-in';
      enemyEl.style.transform = `translate(${scatter}px, 10px) scale(0.4)`;
      enemyEl.style.opacity = '0';
    }, 100);
  }

  // Animate one parabolic hop from (curRow,curCol) to (nextRow,nextCol),
  // arcing up in the middle like hopping a hurdle. onLand fires when the
  // piece touches down on nextRow/nextCol.
  function hopTo(curRow, curCol, nextRow, nextCol, onLand) {
    const dx = (nextCol - fromCol) * cellW;
    const dy = (nextRow - fromRow) * cellH;
    const cellDist = Math.max(1, Math.abs(nextRow - curRow) + Math.abs(nextCol - curCol));
    const duration = Math.max(160, Math.min(320, 130 * cellDist));
    const ARC_HEIGHT = 34; // px of upward hop at the apex

    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      // Straight-line interpolation for x/y, plus a sine arc for the hop.
      const startDx = (curCol - fromCol) * cellW;
      const startDy = (curRow - fromRow) * cellH;
      const ix = startDx + (dx - startDx) * t;
      const iy = startDy + (dy - startDy) * t;
      const arc = Math.sin(t * Math.PI) * ARC_HEIGHT;
      pieceEl.style.transform = `translate(${ix}px, ${iy - arc}px) rotate(${Math.sin(t * Math.PI) * 8}deg)`;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        onLand();
      }
    }
    requestAnimationFrame(step);
  }

  let idx = 0;
  let curRow = fromRow, curCol = fromCol;
  function nextHop() {
    if (idx >= hops.length) {
      // All hops complete — settle at the final landing square.
      pieceEl.style.transition = 'transform 0.1s ease-out';
      setTimeout(() => {
        pieceEl.style.zIndex = '';
        pieceEl.style.transition = '';
        pieceEl.style.transform = '';
        fxFrame.remove();
        callback();
      }, 110);
      return;
    }
    const hop = hops[idx];
    const isEnemyHop = idx < jumped.length;
    hopTo(curRow, curCol, hop.row, hop.col, () => {
      shakeBoardOnce();
      if (isEnemyHop) flinchEnemy(hop.row, hop.col);
      curRow = hop.row; curCol = hop.col;
      idx++;
      setTimeout(nextHop, 30); // tiny beat between hops
    });
  }
  nextHop();
}

function animateCatapult(fromRow, fromCol, toRow, toCol, captured, callback) {
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const cells = boardEl.querySelectorAll('.cell');
  const fromCell = cells[fromRow * bsC + fromCol];
  const pieceEl  = fromCell?.querySelector('.piece');
  if (!pieceEl) { callback(); return; }
  const fxFrame = createCartoonFxFrame(boardEl.getBoundingClientRect(), 'catapult', 18);

  const cellW = boardEl.offsetWidth  / bsC;
  const cellH = boardEl.offsetHeight / bsR;

  const totalDX = (toCol - fromCol) * cellW;
  const totalDY = (toRow - fromRow) * cellH;
  const dist = Math.sqrt(totalDX * totalDX + totalDY * totalDY);
  const arcHeight = Math.max(cellW, cellH) * 1.4 + dist * 0.18;

  pieceEl.style.transition = 'none';
  pieceEl.style.zIndex = '25';

  const LAUNCH = 550;
  const IMPACT = 260;
  let start = null;
  let landed = false;

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function scatterCaptured() {
    (captured || []).forEach(cap => {
      const capCell = cells[cap.row * bsC + cap.col];
      const capPiece = capCell?.querySelector('.piece');
      if (!capPiece) return;
      const angle = Math.random() * Math.PI * 2;
      const dist2 = 90 + Math.random() * 70;
      const flyX = Math.cos(angle) * dist2;
      const flyY = Math.sin(angle) * dist2;
      const spin = (Math.random() > 0.5 ? 1 : -1) * (280 + Math.random() * 320);
      capPiece.style.transition = 'transform 0.4s cubic-bezier(0.2,0.8,0.4,1), opacity 0.4s ease-in';
      capPiece.style.transform  = `translate(${flyX}px, ${flyY}px) rotate(${spin}deg) scale(0.8)`;
      capPiece.style.opacity    = '0';
    });
  }

  function draw(ts) {
    if (!start) start = ts;
    const el = ts - start;

    if (el < LAUNCH) {
      const t = el / LAUNCH;
      const arcT = easeInOut(t);
      const x = totalDX * arcT;
      const y = totalDY * arcT - arcHeight * 4 * t * (1 - t);
      const scale = 1 + Math.sin(Math.PI * t) * 0.55;
      const rotate = t * 380;
      pieceEl.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`;

    } else if (!landed) {
      landed = true;
      pieceEl.style.transform = `translate(${totalDX}px, ${totalDY}px) scale(1) rotate(360deg)`;
      scatterCaptured();

      // A landing needs a real thud — impact flash at the touchdown cell
      // plus a board jolt, same language as Charge/Meteor Strike, so every
      // "something just slammed into the board" moment reads consistently.
      const landCell = cells[toRow * bsC + toCol];
      if (landCell) {
        const flash = document.createElement('div');
        flash.className = 'charge-impact-flash';
        landCell.appendChild(flash);
        requestAnimationFrame(() => {
          flash.style.transform = 'translate(-50%, -50%) scale(7)';
          flash.style.opacity = '0';
        });
        setTimeout(() => flash.remove(), 300);
      }
      const boardWrapEl = document.querySelector('.board-wrap');
      if (boardWrapEl) {
        boardWrapEl.classList.remove('charge-shake');
        void boardWrapEl.offsetWidth;
        boardWrapEl.classList.add('charge-shake');
      }

      start = ts - LAUNCH; // reuse timer for impact phase
      requestAnimationFrame(draw);
      return;

    } else if (el - LAUNCH < IMPACT) {
      // hold in place while captured pieces fly off
    } else {
      pieceEl.style.transform = '';
      pieceEl.style.zIndex = '';
      pieceEl.style.transition = '';
      fxFrame.remove();
      callback();
      return;
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

function createManuscriptFxCanvas(kind = 'strike') {
  const canvas = document.createElement('canvas');
  canvas.className = 'manuscript-fx-canvas';
  canvas.dataset.fxKind = kind;
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function animateWrath(captured, onComplete) {
  const boardWrapEl = document.querySelector('.board-wrap');
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width / bsC;
  const cellH = boardRect.height / bsR;

  const canvas = createManuscriptFxCanvas('wrath');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element, not .board-wrap — the wrap has its
  // own padding around the board (for the frame/corners), so a canvas placed
  // at .board-wrap's top:0/left:0 draws offset from the real piece
  // positions by that padding amount. #board has none, so this lines up
  // exactly regardless of frame styling. (The shake animation still targets
  // .board-wrap — that's a pure cosmetic transform, unrelated to canvas math.)
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  // Shake the whole board like a lightning strike just hit it.
  boardWrapEl.classList.add('wrath-shake');

  // A few jagged lightning bolts crashing down across the board.
  function makeBolt(targetX) {
    const pts = [];
    const segments = 7;
    let x = targetX + (Math.random() - 0.5) * canvas.width * 0.25;
    pts.push({ x, y: 0 });
    for (let i = 1; i <= segments; i++) {
      const y = (canvas.height * i) / segments;
      x += (Math.random() - 0.5) * canvas.width * 0.22;
      x = Math.max(8, Math.min(canvas.width - 8, x));
      pts.push({ x, y });
    }
    return pts;
  }
  const bolts = [makeBolt(canvas.width * 0.28), makeBolt(canvas.width * 0.72), makeBolt(canvas.width * 0.5)];

  let startTime = null;
  const FLASH = 450;              // lightning strike + white flash
  const DISINTEGRATE_START = 350; // enemies start crumbling as the flash fades
  const TOTAL = 3000;             // ~3 second sequence
  const perEnemy = captured.length ? Math.min(120, (TOTAL - DISINTEGRATE_START - 400) / captured.length) : 0;

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lightning bolts + screen flash
    if (elapsed < FLASH) {
      const t = elapsed / FLASH;
      const boltAlpha = Math.max(0, 1 - t * 1.3);
      bolts.forEach(pts => {
        ctx.save();
        ctx.strokeStyle = `rgba(34,25,18,${boltAlpha})`;
        ctx.lineWidth = 11;
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        // A thinner, brighter core line instead of shadowBlur (which is very
        // expensive on mobile WebViews) — cheap way to still read as "glowing".
        ctx.strokeStyle = `rgba(244,198,65,${boltAlpha})`;
        ctx.lineWidth = 5.5;
        ctx.stroke();
        ctx.strokeStyle = `rgba(248,252,225,${boltAlpha})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      });
      const flashAlpha = t < 0.25 ? (t / 0.25) * 0.85 : Math.max(0, 0.85 * (1 - (t - 0.25) / 0.75));
      ctx.fillStyle = `rgba(255,228,116,${flashAlpha * .72})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Enemies disintegrate into ash, staggered
    if (elapsed >= DISINTEGRATE_START) {
      captured.forEach((cap, i) => {
        const enemyStart = DISINTEGRATE_START + i * perEnemy;
        if (elapsed < enemyStart) return;
        const et = Math.min((elapsed - enemyStart) / 700, 1);
        const capC = getCellCenter(boardEl, boardRect, bsC, cap.row, cap.col);
        const ex = capC.x, ey = capC.y;
        const pieceR = capC.w * 0.4;

        // Scale particle count down as enemy count goes up — with dozens of
        // enemies disintegrating at once, this is what keeps the frame budget
        // sane on lower-powered devices (the individual per-particle canvas
        // calls are the actual cost, not the visual density).
        const numParticles = captured.length > 40 ? 5 : captured.length > 20 ? 8 : 14;
        for (let p = 0; p < numParticles; p++) {
          const seed = p * 999 + i * 37;
          const angle = ((seed % 360) / 360) * Math.PI * 2;
          const startDist = ((seed % 100) / 100) * pieceR;
          const px0 = ex + Math.cos(angle) * startDist;
          const py0 = ey + Math.sin(angle) * startDist;
          const drift = et * cellW * 0.6;
          const px = px0 + Math.cos(angle) * drift * 0.3;
          const py = py0 - drift; // ash rises
          const alpha = Math.max(0, 1 - et * 1.1);
          const size = 2 + (seed % 3);
          const gray = 120 + (seed % 80);
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${gray},${gray},${gray},${alpha})`;
          ctx.fill();
        }

        // Progressively erode the piece itself to nothing.
        const coverA = Math.min(et * 1.3, 1);
        ctx.beginPath();
        ctx.arc(ex, ey, pieceR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(13,13,13,${coverA})`;
        ctx.fill();
      });
    }

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      boardWrapEl.classList.remove('wrath-shake');
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

function animateBallista(anchorRow, anchorCol, captured, onComplete) {
  playBallistaSound();
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width / bsC;
  const cellH = boardRect.height / bsR;

  const canvas = createManuscriptFxCanvas('ballista');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element, not .board-wrap — the wrap has its
  // own padding around the board (for the frame/corners), so a canvas placed
  // at .board-wrap's top:0/left:0 draws offset from the real piece
  // positions by that padding amount. #board has none, so this lines up
  // exactly regardless of frame styling.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const anchorC = getCellCenter(boardEl, boardRect, bsC, anchorRow, anchorCol);
  const anchorX = anchorC.x, anchorY = anchorC.y;

  // Distance from the firing position out to the true board edge, in each
  // direction — measured from the real DOM cell rects (not an even-grid
  // approximation), so arrows travel the exact real distance regardless of
  // the board's padding/gap.
  const range = getTStrikeRange(state.mode);
  const topRow = Number.isFinite(range) ? Math.max(0, anchorRow - range) : 0;
  const bottomRow = Number.isFinite(range) ? Math.min(bsR - 1, anchorRow + range) : bsR - 1;
  const leftCol = Number.isFinite(range) ? Math.max(0, anchorCol - range) : 0;
  const rightCol = Number.isFinite(range) ? Math.min(bsC - 1, anchorCol + range) : bsC - 1;
  const topEdgeC = getCellCenter(boardEl, boardRect, bsC, topRow, anchorCol);
  const botEdgeC = getCellCenter(boardEl, boardRect, bsC, bottomRow, anchorCol);
  const leftEdgeC = getCellCenter(boardEl, boardRect, bsC, anchorRow, leftCol);
  const rightEdgeC = getCellCenter(boardEl, boardRect, bsC, anchorRow, rightCol);
  const DIRS = {
    up:    { dx: 0, dy: -1, dist: anchorY - (topEdgeC.y - topEdgeC.h / 2) },
    down:  { dx: 0, dy: 1,  dist: (botEdgeC.y + botEdgeC.h / 2) - anchorY },
    left:  { dx: -1, dy: 0, dist: anchorX - (leftEdgeC.x - leftEdgeC.w / 2) },
    right: { dx: 1, dy: 0,  dist: (rightEdgeC.x + rightEdgeC.w / 2) - anchorX },
  };
  const DIR_STAGGER = { up: 0, down: 40, left: 80, right: 120 };

  // A volley of arrows per direction, fired at staggered times, so it reads as
  // "multiple arrows shot at different times" rather than one clean line each way.
  const ARROWS_PER_DIR = 3;
  const arrows = [];
  Object.entries(DIRS).forEach(([dirName, d]) => {
    for (let i = 0; i < ARROWS_PER_DIR; i++) {
      arrows.push({
        dir: dirName,
        dx: d.dx, dy: d.dy,
        maxDist: d.dist,
        delay: DIR_STAGGER[dirName] + i * 170 + Math.random() * 40,
        speed: d.dist / (480 + Math.random() * 120), // px/ms — reaches the edge in ~0.5-0.6s
      });
    }
  });

  // Figure out which captured enemies sit in which direction, and how far out.
  const impactTargets = captured.map(cap => {
    const capC = getCellCenter(boardEl, boardRect, bsC, cap.row, cap.col);
    let dirName, dist;
    if (cap.col === anchorCol && cap.row < anchorRow) { dirName = 'up'; dist = anchorY - capC.y; }
    else if (cap.col === anchorCol && cap.row > anchorRow) { dirName = 'down'; dist = capC.y - anchorY; }
    else if (cap.row === anchorRow && cap.col < anchorCol) { dirName = 'left'; dist = anchorX - capC.x; }
    else { dirName = 'right'; dist = capC.x - anchorX; }
    return { ...cap, dirName, dist, ex: capC.x, ey: capC.y, hit: false, hitTime: undefined };
  });

  // A real wooden shaft with a subtle taper/shading, a slim steel broadhead
  // with a highlight, and two fanned feather vanes at the nock — plus a
  // short motion-blur trail behind it. Reads as a physical object in flight
  // rather than a cartoon line-with-a-triangle.
  function drawArrow(x, y, angle, alpha, wobble) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(0, wobble || 0);
    ctx.globalAlpha = alpha;

    // motion trail
    ctx.strokeStyle = '#2a1d14';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(-16, 0);
    ctx.stroke();
    ctx.strokeStyle='#e5b948';ctx.lineWidth=3;ctx.stroke();

    // wooden shaft — tapered gradient across its thickness for roundness
    ctx.strokeStyle = '#281b13';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
    ctx.strokeStyle='#d6a846';ctx.lineWidth=3;ctx.stroke();

    // narrow steel broadhead with a bright edge highlight
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(7, -2.4);
    ctx.lineTo(8.5, 0);
    ctx.lineTo(7, 2.4);
    ctx.closePath();
    ctx.fillStyle = '#e7d18a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(25,25,30,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // two fanned fletching vanes at the back, slightly angled like real feathers
    ctx.fillStyle = '#8f2a2a';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-24, -4.5);
    ctx.lineTo(-19, -0.6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-24, 4.5);
    ctx.lineTo(-19, 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  const DIR_ANGLE = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 };
  let shakeFired = false;
  function fireShakeOnce() {
    if (shakeFired) return;
    shakeFired = true;
    const boardWrapEl = document.querySelector('.board-wrap');
    if (boardWrapEl) {
      boardWrapEl.classList.remove('charge-shake');
      void boardWrapEl.offsetWidth;
      boardWrapEl.classList.add('charge-shake');
    }
  }

  let startTime = null;
  const TOTAL = 1800;

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    arrows.forEach(a => {
      const t = elapsed - a.delay;
      if (t < 0 || a.maxDist <= 0) return;
      const traveled = Math.min(t * a.speed, a.maxDist);
      if (traveled >= a.maxDist) return; // arrow has already landed/left the board
      const x = anchorX + a.dx * traveled;
      const y = anchorY + a.dy * traveled;
      const angle = Math.atan2(a.dy, a.dx);
      // Faint perpendicular wobble so a shaft in flight reads as a physical
      // object riding air currents rather than a rigid line sliding along a rail.
      const perp = Math.sin(t * 0.02 + a.delay) * 1.4;
      drawArrow(x, y, angle, 1, perp);

      impactTargets.forEach(target => {
        if (target.hit || target.dirName !== a.dir) return;
        if (traveled >= target.dist) {
          target.hit = true;
          fireShakeOnce();
        }
      });
    });

    impactTargets.forEach(target => {
      if (!target.hit) return;
      if (target.hitTime === undefined) target.hitTime = elapsed;
      const ex = target.ex, ey = target.ey;
      const et = Math.min((elapsed - target.hitTime) / 380, 1);
      const dirAngle = DIR_ANGLE[target.dirName];

      // the arrow that actually connected stays embedded, shaft-first, and
      // fades once the impact has settled rather than just vanishing.
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(dirAngle);
      ctx.globalAlpha = Math.max(0, 1 - et * 1.2);
      ctx.strokeStyle = '#caa661';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-cellW * 0.32, 0);
      ctx.stroke();
      ctx.restore();

      // splinter/dust fragments kicked out on impact — short jagged streaks,
      // not clean dots, so it reads as debris rather than a magic sparkle.
      for (let p = 0; p < 6; p++) {
        const ang = (p / 6) * Math.PI * 2 + (p % 2 ? 0.35 : -0.2);
        const r = et * cellW * 0.32;
        ctx.beginPath();
        ctx.moveTo(ex + Math.cos(ang) * r * 0.25, ey + Math.sin(ang) * r * 0.25);
        ctx.lineTo(ex + Math.cos(ang) * r, ey + Math.sin(ang) * r);
        ctx.strokeStyle = `rgba(178,148,108,${1 - et})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // a small settling dust puff at the point of impact, not a dark void
      ctx.beginPath();
      ctx.arc(ex, ey, cellW * 0.22 * (0.5 + et * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(90,80,65,${0.32 * (1 - et)})`;
      ctx.fill();
    });

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

function animatePlagueFog(onMidpoint, onComplete) {
  const boardEl = document.getElementById('board');
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('plague');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element, not .board-wrap — the wrap has its
  // own padding around the board (for the frame/corners), so a canvas placed
  // at .board-wrap's top:0/left:0 draws offset from the real piece
  // positions by that padding amount. #board has none, so this lines up
  // exactly regardless of frame styling.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const W = canvas.width, H = canvas.height;
  const diag = Math.hypot(W, H);
  const cx = W / 2, cy = H / 2;

  // A consistent "wind" direction the whole fog bank drifts along — wisps
  // stream in from the upwind side, hover while they do their work, then
  // keep drifting out the downwind side. This is what makes it read as fog
  // actually blowing across the board instead of the screen just fading.
  const windAngle = Math.random() * Math.PI * 2;
  const wind = { x: Math.cos(windAngle), y: Math.sin(windAngle) };
  const perp = { x: -wind.y, y: wind.x };

  const NUM_BLOBS = 16;
  const blobs = Array.from({ length: NUM_BLOBS }, () => {
    const lateral = (Math.random() - 0.5) * diag * 1.1;
    const restJitter = (Math.random() - 0.5) * diag * 0.25;
    const restX = cx + perp.x * lateral + wind.x * restJitter;
    const restY = cy + perp.y * lateral + wind.y * restJitter;
    const travel = diag * (0.75 + Math.random() * 0.35);
    return {
      startX: restX - wind.x * travel,
      startY: restY - wind.y * travel,
      exitX:  restX + wind.x * travel,
      exitY:  restY + wind.y * travel,
      r: diag * (0.16 + Math.random() * 0.16),
      // Stagger each wisp's own timeline slightly so they don't all move in
      // perfect lockstep — some lead, some trail, like a real rolling bank.
      phaseOffset: Math.random() * 0.35,
      durJitter: 0.85 + Math.random() * 0.3,
      swirl: Math.random() * Math.PI * 2,
      swirlSpeed: 0.0016 + Math.random() * 0.0014,
      swirlAmp: diag * (0.02 + Math.random() * 0.03),
      // Fixed per-blob "lobes" — a handful of smaller offset circles that
      // ride along with the blob's center so its silhouette reads as an
      // irregular, roiling cloud mass instead of one clean circle. All
      // offsets/radii/angles are computed once here (deterministic), so
      // rendering them per-frame is still cheap — only their shared center
      // moves each frame.
      lobes: Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => ({
        angle: Math.random() * Math.PI * 2,
        distFrac: 0.25 + Math.random() * 0.4,
        rFrac: 0.45 + Math.random() * 0.35,
      })),
    };
  });

  // Sparse dark "bubble"/mote particles drifting slowly within the fog bank
  // for a toxic-gas-bubbling feel. Cheap: fixed count, deterministic per-mote
  // seeds, only positions drift each frame.
  const NUM_MOTES = 8;
  const motes = Array.from({ length: NUM_MOTES }, () => {
    const lateral = (Math.random() - 0.5) * diag * 1.0;
    const restJitter = (Math.random() - 0.5) * diag * 0.2;
    const restX = cx + perp.x * lateral + wind.x * restJitter;
    const restY = cy + perp.y * lateral + wind.y * restJitter;
    return {
      restX, restY,
      r: 1.5 + Math.random() * 2.5,
      driftAngle: Math.random() * Math.PI * 2,
      driftSpeed: diag * (0.00004 + Math.random() * 0.00004),
      driftR: diag * (0.02 + Math.random() * 0.03),
      flickerPhase: Math.random() * Math.PI * 2,
      flickerSpeed: 0.002 + Math.random() * 0.002,
    };
  });

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  const ROLL_IN = 1000;             // fog visibly streams in and gathers
  const HOLD = 450;                 // fully covered — pieces vanish here
  const LIFT_START = ROLL_IN + HOLD;
  const LIFT_DUR = 1000;            // fog keeps drifting on through and clears
  const TOTAL = LIFT_START + LIFT_DUR;

  let startTime = null;
  let midpointFired = false;

  function phaseCoverage(elapsed) {
    if (elapsed < ROLL_IN) return easeInOutCubic(elapsed / ROLL_IN);
    if (elapsed < LIFT_START) return 1;
    return Math.max(0, 1 - easeInOutCubic((elapsed - LIFT_START) / LIFT_DUR));
  }

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, W, H);

    const globalCoverage = phaseCoverage(elapsed);
    if (!midpointFired && elapsed >= LIFT_START) {
      midpointFired = true;
      onMidpoint(); // board mutates while still fully hidden under the fog
    }

    ctx.save();
    blobs.forEach(b => {
      // Each blob has its own slightly offset, slightly scaled timeline so
      // the bank arrives and leaves as a churning mass, not a flat wall.
      const localRollIn = ROLL_IN * b.durJitter;
      const localLiftStart = ROLL_IN + HOLD - b.phaseOffset * ROLL_IN;
      const localLiftDur = LIFT_DUR * b.durJitter;
      let flow; // 0 = at start position, 1 = resting, 2 = fully exited
      if (elapsed < localRollIn) {
        flow = easeInOutCubic(elapsed / localRollIn);
      } else if (elapsed < localLiftStart) {
        flow = 1;
      } else {
        flow = 1 + easeInOutCubic(Math.min((elapsed - localLiftStart) / localLiftDur, 1));
      }
      const t = flow / 2; // 0..1 across the full start->exit journey
      let bx = b.startX + (b.exitX - b.startX) * t;
      let by = b.startY + (b.exitY - b.startY) * t;
      // Gentle perpendicular swirl so wisps churn rather than travel in a
      // dead-straight line.
      b.swirl += b.swirlSpeed * 16;
      bx += perp.x * Math.sin(b.swirl) * b.swirlAmp;
      by += perp.y * Math.sin(b.swirl) * b.swirlAmp;

      const blobAlpha = Math.max(0, Math.min(1, flow <= 1 ? flow : 2 - flow)) * 0.5;
      // Render the blob's silhouette as several overlapping offset lobes
      // (fixed per-blob seeds, only their shared center moves) rather than
      // one clean circle — reads as a roiling toxic cloud mass instead of a
      // flat gray disc. Each lobe gets its own murky-olive-core /
      // sickly-green-rim gradient for extra contrast over a flat tint.
      b.lobes.forEach(lobe => {
        const lx = bx + Math.cos(lobe.angle) * b.r * lobe.distFrac;
        const ly = by + Math.sin(lobe.angle) * b.r * lobe.distFrac;
        const lr = b.r * lobe.rFrac;
        const lgrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        lgrad.addColorStop(0, `rgba(60,70,25,${blobAlpha})`);
        lgrad.addColorStop(0.6, `rgba(110,140,45,${blobAlpha * 0.85})`);
        lgrad.addColorStop(1, 'rgba(140,170,60,0)');
        ctx.fillStyle = lgrad;
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fill();
      });
      // Core blob itself, same toxic palette, ties the lobes together.
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
      grad.addColorStop(0, `rgba(70,85,30,${blobAlpha})`);
      grad.addColorStop(0.65, `rgba(120,150,50,${blobAlpha * 0.7})`);
      grad.addColorStop(1, 'rgba(140,170,60,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // A flat base layer, tied to the guaranteed global coverage curve, so the
    // board is provably fully hidden at the hold point regardless of how the
    // individual wisps happen to be arranged. Recolored toward the same
    // murky toxic-olive tone as the blobs above (was flat gray-green).
    ctx.fillStyle = `rgba(103,112,42,${0.68 * globalCoverage})`;
    ctx.fillRect(0, 0, W, H);

    // Sparse dark "bubble"/mote particles drifting slowly within the fog —
    // small independent drift plus a slow flicker, for a toxic-gas-bubbling
    // feel. Only visible once the fog has some coverage, and fade with it.
    if (globalCoverage > 0.05) {
      motes.forEach(m => {
        const driftT = elapsed * m.driftSpeed;
        const mx = m.restX + Math.cos(m.driftAngle + driftT) * m.driftR;
        const my = m.restY + Math.sin(m.driftAngle + driftT) * m.driftR;
        const flicker = 0.5 + 0.5 * Math.sin(elapsed * m.flickerSpeed + m.flickerPhase);
        const moteAlpha = globalCoverage * (0.35 + flicker * 0.4);
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(211,178,55,${moteAlpha})`;
        ctx.strokeStyle = `rgba(31,29,18,${moteAlpha})`;
        ctx.lineWidth = Math.max(2,m.r*.42);
        ctx.fill();ctx.stroke();
      });
    }
    ctx.restore();

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

// BLIZZARD — same rolling-bank structure as the plague fog (reused because
// it already reads well as "the whole board gets covered, then clears"),
// but re-themed icy white/blue and with fast diagonal snow streaks layered
// on top so it sweeps across the screen rather than drifting like fog.
function animateBlizzard(onMidpoint, onComplete) {
  const boardEl = document.getElementById('board');
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('blizzard');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element, not .board-wrap — see the note on
  // animatePlagueFog above; same padding-offset issue applies here.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const W = canvas.width, H = canvas.height;
  const diag = Math.hypot(W, H);
  const cx = W / 2, cy = H / 2;

  // A blizzard sweeps in one strong, mostly-horizontal direction, unlike
  // fog's fully random drift — pick a wind biased toward left-right travel.
  const windAngle = (Math.random() - 0.5) * (Math.PI * 0.5) + (Math.random() < 0.5 ? 0 : Math.PI);
  const wind = { x: Math.cos(windAngle), y: Math.sin(windAngle) };
  const perp = { x: -wind.y, y: wind.x };

  const NUM_BLOBS = 16;
  const blobs = Array.from({ length: NUM_BLOBS }, () => {
    const lateral = (Math.random() - 0.5) * diag * 1.1;
    const restJitter = (Math.random() - 0.5) * diag * 0.25;
    const restX = cx + perp.x * lateral + wind.x * restJitter;
    const restY = cy + perp.y * lateral + wind.y * restJitter;
    const travel = diag * (0.75 + Math.random() * 0.35);
    return {
      startX: restX - wind.x * travel,
      startY: restY - wind.y * travel,
      exitX:  restX + wind.x * travel,
      exitY:  restY + wind.y * travel,
      r: diag * (0.16 + Math.random() * 0.16),
      phaseOffset: Math.random() * 0.35,
      durJitter: 0.8 + Math.random() * 0.25,
      swirl: Math.random() * Math.PI * 2,
      swirlSpeed: 0.0016 + Math.random() * 0.0014,
      swirlAmp: diag * (0.02 + Math.random() * 0.03),
    };
  });

  // Fast diagonal snow streaks — these are what actually sell "sweeping
  // storm" rather than "still fog bank". Each one is a short motion-blurred
  // line racing along the wind direction, looping the whole time the storm
  // bank is on screen.
  const NUM_STREAKS = 36;
  const streaks = Array.from({ length: NUM_STREAKS }, () => ({
    lateral: (Math.random() - 0.5) * diag * 1.2,
    offset: Math.random(),
    speed: diag * (1.1 + Math.random() * 0.8),
    len: diag * (0.05 + Math.random() * 0.06),
    width: 1 + Math.random() * 1.5,
    alpha: 0.25 + Math.random() * 0.35,
  }));

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  const ROLL_IN = 750;               // storm slams in faster than fog rolls
  const HOLD = 450;                  // fully covered — enemies freeze here
  const LIFT_START = ROLL_IN + HOLD;
  const LIFT_DUR = 850;
  const TOTAL = LIFT_START + LIFT_DUR;

  let startTime = null;
  let midpointFired = false;

  function phaseCoverage(elapsed) {
    if (elapsed < ROLL_IN) return easeInOutCubic(elapsed / ROLL_IN);
    if (elapsed < LIFT_START) return 1;
    return Math.max(0, 1 - easeInOutCubic((elapsed - LIFT_START) / LIFT_DUR));
  }

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, W, H);

    const globalCoverage = phaseCoverage(elapsed);
    if (!midpointFired && elapsed >= LIFT_START) {
      midpointFired = true;
      onMidpoint();
    }

    ctx.save();
    blobs.forEach(b => {
      const localRollIn = ROLL_IN * b.durJitter;
      const localLiftStart = ROLL_IN + HOLD - b.phaseOffset * ROLL_IN;
      const localLiftDur = LIFT_DUR * b.durJitter;
      let flow;
      if (elapsed < localRollIn) {
        flow = easeInOutCubic(elapsed / localRollIn);
      } else if (elapsed < localLiftStart) {
        flow = 1;
      } else {
        flow = 1 + easeInOutCubic(Math.min((elapsed - localLiftStart) / localLiftDur, 1));
      }
      const t = flow / 2;
      let bx = b.startX + (b.exitX - b.startX) * t;
      let by = b.startY + (b.exitY - b.startY) * t;
      b.swirl += b.swirlSpeed * 16;
      bx += perp.x * Math.sin(b.swirl) * b.swirlAmp;
      by += perp.y * Math.sin(b.swirl) * b.swirlAmp;

      const blobAlpha = Math.max(0, Math.min(1, flow <= 1 ? flow : 2 - flow)) * 0.55;
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
      grad.addColorStop(0, `rgba(225,240,255,${blobAlpha})`);
      grad.addColorStop(1, 'rgba(225,240,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = `rgba(119,190,208,${0.48 * globalCoverage})`;
    ctx.fillRect(0, 0, W, H);

    // Snow streaks race along the wind direction the whole time coverage is
    // above zero, looping continuously so it always feels like it's mid-sweep.
    if (globalCoverage > 0.05) {
      // Dark ink track beneath each snow stroke, then a pale painted core.
      streaks.forEach(s => {
        const travel = ((elapsed * s.speed) / 1000 + s.offset * diag) % (diag * 1.4) - diag * 0.2;
        const sx = cx + perp.x * s.lateral - wind.x * (diag * 0.7) + wind.x * travel;
        const sy = cy + perp.y * s.lateral - wind.y * (diag * 0.7) + wind.y * travel;
        ctx.globalAlpha = s.alpha * globalCoverage;
        ctx.strokeStyle = 'rgba(31,38,43,.92)';
        ctx.lineWidth = s.width + 3.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - wind.x * s.len, sy - wind.y * s.len);
        ctx.stroke();
        ctx.strokeStyle = s.offset > .5 ? '#f5fff4' : '#8ed2df';
        ctx.lineWidth = s.width;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}


// THE JESTER — shoves enemies backward toward row 0 and, at mastery levels
// 2–3, outward from the board center. Resolve the enemy-side rows first and
// work downward toward the player. Each resolved piece immediately vacates
// its old square in the occupancy map, so the next row can slide into the
// space it created instead of being incorrectly blocked by the old layout.
function applyJesterShove() {
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const profile = getJesterShoveProfile(state.mode);
  const enemyPositions = [];
  const occupied = new Set();
  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      if (state.board[r][c].piece) occupied.add(`${r},${c}`);
      if (state.board[r][c].piece?.type === 'enemy') enemyPositions.push({ row: r, col: c });
    }
  }

  // Row 0 is the enemy's back edge; the player's side is at the bottom.
  // Make this order explicit instead of depending on board scan order.
  enemyPositions.sort((a, b) => a.row - b.row || a.col - b.col);

  const centerCol = (bsC - 1) / 2;
  const moves = [];
  enemyPositions.forEach(({ row, col }) => {
    // This piece is being resolved now, so its starting square is available
    // to every enemy processed after it.
    occupied.delete(`${row},${col}`);
    const sideStep = !profile.outward || col === centerCol ? 0 : (col < centerCol ? -1 : 1);
    let targetRow = row;
    let targetCol = col;
    let fellOff = false;

    for (let step = 0; step < profile.steps; step++) {
      const nextRow = targetRow - 1;
      const nextCol = targetCol + sideStep;
      if (nextRow < 0 || nextCol < 0 || nextCol >= bsC) {
        fellOff = true;
        break;
      }
      const nextCell = state.board[nextRow][nextCol];
      if (nextCell.hazard === 'crater' || occupied.has(`${nextRow},${nextCol}`)) break;
      targetRow = nextRow;
      targetCol = nextCol;
    }

    if (fellOff || targetRow !== row || targetCol !== col) {
      moves.push({ from: { row, col }, to: fellOff ? null : { row: targetRow, col: targetCol } });
    }

    // Reserve the resolved destination for the remaining pieces. A piece
    // that fell off reserves nothing; a blocked piece re-reserves its origin.
    if (!fellOff) occupied.add(`${targetRow},${targetCol}`);
  });

  moves.forEach(({ from, to }) => {
    const piece = state.board[from.row][from.col].piece;
    state.board[from.row][from.col].piece = null;
    if (to) {
      const destination = state.board[to.row][to.col];
      destination.piece = piece;
      if (destination.hazard === 'fire' || destination.hazard === 'poison') {
        destination.piece = null;
      }
    }
  });
}

// A quick burst of comedic confetti (jester purple/gold/red) over every
// enemy square — "distract with laughter" — then hands off to
// applyJesterShove()/render() so the actual backward shove plays out as a
// normal FLIP piece-slide, same as any other move.
function animateJester(cells, onComplete) {
  const boardEl = document.getElementById('board');
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('jester');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const centers = cells.map(p => getCellCenter(boardEl, boardRect, bsC, p.row, p.col));
  const cellSize = centers.length ? centers[0].w : boardRect.width / bsC;
  const JESTER_COLORS = ['#8a3fc0', '#e8b84b', '#c0304f'];

  const bursts = centers.map(({ x, y }) => ({
    x, y,
    bits: Array.from({ length: 10 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = cellSize * (0.35 + Math.random() * 0.35);
      return {
        angle, dist,
        size: cellSize * (0.05 + Math.random() * 0.05),
        color: JESTER_COLORS[Math.floor(Math.random() * JESTER_COLORS.length)],
        spin: (Math.random() - 0.5) * 6,
      };
    }),
  }));

  const RISE = 220;  // confetti bursts outward
  const HOLD = 140;  // sits fully bright for a beat
  const FADE = 280;  // fades out, then the actual shove happens
  const TOTAL = RISE + HOLD + FADE;

  let startTime = null;
  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let t, alpha;
    if (elapsed < RISE) {
      t = elapsed / RISE;
      alpha = t;
    } else if (elapsed < RISE + HOLD) {
      t = 1;
      alpha = 1;
    } else {
      t = 1;
      alpha = Math.max(0, 1 - (elapsed - RISE - HOLD) / FADE);
    }

    bursts.forEach(b => {
      b.bits.forEach(bit => {
        const bx = b.x + Math.cos(bit.angle) * bit.dist * t;
        const by = b.y + Math.sin(bit.angle) * bit.dist * t;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(bit.spin * t);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = bit.color;
        ctx.strokeStyle='#2b2017';ctx.lineWidth=Math.max(1.5,bit.size*.22);
        ctx.beginPath();
        if(bit.spin>0){ctx.moveTo(0,-bit.size);ctx.lineTo(bit.size*.72,0);ctx.lineTo(0,bit.size);ctx.lineTo(-bit.size*.72,0);}
        else{ctx.arc(0,0,bit.size*.7,0,Math.PI*2);}
        ctx.closePath();ctx.fill();ctx.stroke();
        ctx.restore();
      });
    });

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }
  requestAnimationFrame(draw);
}

// METEOR STRIKE / WILDFIRE — both pick 5 squares up to 25% of the board
// (whichever don't already have a hazard) and destroy anything standing on
// a struck square, friendly or enemy. The squares themselves become
// permanent terrain: `state.board[r][c].hazard = 'crater'` (Meteor Strike)
// or `'fire'` (Wildfire), for the rest of the level. This is stored
// completely separately from `piece` on purpose — a card-driven move
// (Teleport, Side Step, Catapult, Chariot Charge, any special ability)
// passes over or lands on a hazard square with zero effect, exactly as both
// cards' text says. Only PLAIN movement (a piece with no ability doing a
// normal step/jump, tagged `plainMovement: true` in getValidMoves) and the
// enemy AI (which never has abilities, so all its moves count) respect
// hazards at all — a crater blocks plain movement outright like a wall (see
// the KING/standard-move blocks in getValidMoves and getEnemyMoves), while
// fire allows the plain move but destroys whatever just walked into it (see
// the fire-death checks in executeMove and actOnePiece). Board-wide
// auto-targeting cards that don't involve choosing a destination square
// (Locust Swarm, Wrath, Tornado, etc.) never consult any of this, so
// they're naturally unaffected either way.
function pickHazardTargets() {
  const rows = getBoardRows();
  const cols = getBoardCols();
  const total = rows * cols;
  const openCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!state.board[r][c].hazard) openCells.push({ row: r, col: c });
    }
  }
  const maxHit = Math.max(5, Math.floor(total * 0.25));
  const count = Math.min(openCells.length, 5 + Math.floor(Math.random() * (maxHit - 5 + 1)));
  for (let i = openCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [openCells[i], openCells[j]] = [openCells[j], openCells[i]];
  }
  return openCells.slice(0, count);
}
function pickMeteorTargets() { return pickHazardTargets(); }
function pickWildfireTargets() { return pickHazardTargets(); }

// Meteor Strike is an instant card. It must resolve from the card tap itself,
// never wait for an unrelated board-cell tap before the barrage begins.
function activateMeteorStrikeCard() {
  if (state.activeCard !== 'meteor_strike') return;
  playMeteorStrikeSound();
  markCardUsed('meteor_strike');
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  const targets = pickMeteorTargets();
  beginPendingRareEffect('meteor_strike', { targets });
  let resolved = false;
  let fallbackTimer = null;
  const finishMeteorStrike = () => {
    if (resolved) return;
    resolved = true;
    if (fallbackTimer !== null) clearTimeout(fallbackTimer);
    // Match the original game: destruction and craters resolve at impact,
    // after the falling meteors reach the board.
    commitPendingRareEffect();
    saveGame();
    setMessage('');
    if (countPieces('enemy') === 0) { triggerWin(); return; }
    if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
    maybeEndPlayerTurn();
  };
  // Preserve impact timing while preventing a dropped Android animation
  // callback from leaving the game permanently locked.
  fallbackTimer = setTimeout(finishMeteorStrike, 2600);
  try {
    animateMeteorStrike(targets, finishMeteorStrike);
  } catch (error) {
    console.error('Meteor Strike animation failed; resolving gameplay effect immediately.', error);
    finishMeteorStrike();
  }
}

function applyMeteorStrike(targets) {
  targets.forEach(({ row, col }) => {
    const cell = state.board[row][col];
    cell.piece = null; // whatever was standing here is destroyed by the direct hit
    cell.hazard = 'crater';
    // Whatever hazard was here before (a bear trap) is moot now — the
    // crater replaces it outright rather than the two stacking.
    cell.trap = false;
    cell.trapSnapping = false;
  });
}

function applyWildfireStrike(targets, spareFriendly = wildfireSparesFriendly(state.mode)) {
  targets.forEach(({ row, col }) => {
    const cell = state.board[row][col];
    // At mastery level 1 the flames can erupt beneath a friendly piece without
    // harming it; enemies are still destroyed by the initial strike.
    if (!cell.piece || cell.piece.type !== 'yours' || !spareFriendly) cell.piece = null;
    cell.hazard = 'fire';
    cell.fireSparesFriendly = spareFriendly;
    cell.trap = false;
    cell.trapSnapping = false;
  });
}

// A real barrage, not a single stamped effect: each meteor gets its own
// randomized trajectory and stagger so they don't all land in lockstep,
// with a falling glow + trail on the way in and a proper flash/shockwave/
// ember burst on impact that settles into the same dark scorched look the
// permanent .meteor-crater CSS uses — so the moment render() swaps this
// canvas out for the real crater div, nothing visibly jumps.
function animateMeteorStrike(targets, onComplete) {
  const boardEl = document.getElementById('board');
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('meteor');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:55;
  `;
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const boardWrapEl = document.querySelector('.board-wrap') || boardEl;
  const diag = Math.hypot(canvas.width, canvas.height);

  function easeInQuad(t) { return t * t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  const STAGGER_WINDOW = Math.min(900, 140 + targets.length * 18); // more meteors, tighter barrage
  const FALL_DUR = 420;
  const IMPACT_DUR = 520;

  let shakeFired = false;

  const meteors = targets.map(({ row, col }) => {
    const { x: tx, y: ty, w } = getCellCenter(boardEl, boardRect, bsC, row, col);
    // Each one falls in from a random high angle, not straight down every
    // time — sells "raining down" rather than a mechanical drop.
    const fallAngle = (Math.PI * 0.28) + Math.random() * (Math.PI * 0.2); // steep, mostly-vertical descent
    const dir = Math.random() < 0.5 ? -1 : 1;
    const travel = diag * (0.55 + Math.random() * 0.25);
    const sx = tx + Math.cos(fallAngle) * travel * dir;
    const sy = ty - Math.sin(fallAngle) * travel;
    return {
      row, col, tx, ty, sx, sy, cellSize: w,
      delay: Math.random() * STAGGER_WINDOW,
      size: w * (0.16 + Math.random() * 0.06),
      wobble: Math.random() * Math.PI * 2,
    };
  });

  const TOTAL = STAGGER_WINDOW + FALL_DUR + IMPACT_DUR + 60;
  let startTime = null;

  function drawFallingMeteor(m, p) {
    // p: 0..1 progress through the fall
    const e = easeInQuad(p);
    const x = m.sx + (m.tx - m.sx) * e;
    const y = m.sy + (m.ty - m.sy) * e;

    // Trail behind the meteor, fading toward its origin.
    const tailX = m.sx + (m.tx - m.sx) * Math.max(0, e - 0.22);
    const tailY = m.sy + (m.ty - m.sy) * Math.max(0, e - 0.22);
    ctx.save();
    ctx.strokeStyle = 'rgba(35,24,17,.9)';
    ctx.lineWidth = m.size * 1.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.strokeStyle = '#d84b31'; ctx.lineWidth = m.size * .72; ctx.stroke();
    ctx.strokeStyle = '#f5c94f'; ctx.lineWidth = m.size * .28; ctx.stroke();
    ctx.restore();

    // Faceted painted stone with an ink outline.
    const coreR = m.size * (0.55 + 0.15 * Math.sin(m.wobble + p * 18));
    ctx.save();
    ctx.fillStyle = '#2b211a'; ctx.strokeStyle = '#160f0b'; ctx.lineWidth = Math.max(2,coreR*.28);
    ctx.beginPath();
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9+m.wobble*.12;const rr=coreR*(i%2?1:.78);const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f2b73d';ctx.beginPath();ctx.arc(x-coreR*.22,y-coreR*.2,coreR*.24,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawImpact(m, p) {
    // p: 0..1 progress through the impact/settle phase.
    const { tx: x, ty: y, cellSize } = m;

    // Bright flash — quick, then gone.
    const flashA = Math.max(0, 1 - p / 0.35);
    if (flashA > 0) {
      const fg = ctx.createRadialGradient(x, y, 0, x, y, cellSize * 0.65);
      fg.addColorStop(0, `rgba(255,255,240,${0.9 * flashA})`);
      fg.addColorStop(0.5, `rgba(255,170,60,${0.6 * flashA})`);
      fg.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.save();
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Expanding shockwave ring.
    const ringR = cellSize * (0.15 + easeOutCubic(Math.min(p / 0.6, 1)) * 0.55);
    const ringA = Math.max(0, 1 - p / 0.6) * 0.7;
    if (ringA > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(38,27,18,${ringA})`;
      ctx.lineWidth = Math.max(3, cellSize * 0.12 * (1 - p));
      ctx.beginPath();
      ctx.arc(x, y, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(245,192,62,${ringA})`;
      ctx.lineWidth = Math.max(1.5, cellSize * 0.05 * (1 - p));
      ctx.stroke();
      for(let i=0;i<10;i++){
        const a=i*Math.PI/5+m.wobble;
        ctx.strokeStyle=i%2?`rgba(220,66,43,${ringA})`:`rgba(247,210,91,${ringA})`;
        ctx.lineWidth=Math.max(2,cellSize*.035);
        ctx.beginPath();ctx.moveTo(x+Math.cos(a)*ringR*.55,y+Math.sin(a)*ringR*.55);ctx.lineTo(x+Math.cos(a)*ringR*1.35,y+Math.sin(a)*ringR*1.35);ctx.stroke();
      }
      ctx.restore();
    }

    // Embers kicked outward, fading.
    const emberCount = 6;
    for (let i = 0; i < emberCount; i++) {
      const ang = (i / emberCount) * Math.PI * 2 + m.wobble;
      const dist = cellSize * 0.5 * easeOutCubic(Math.min(p / 0.8, 1));
      const ex = x + Math.cos(ang) * dist;
      const ey = y + Math.sin(ang) * dist * 0.7 - cellSize * 0.15 * p; // slight upward kick
      const emberA = Math.max(0, 1 - p / 0.85);
      if (emberA <= 0) continue;
      ctx.save();
      ctx.fillStyle = i%2?`rgba(246,205,82,${emberA})`:`rgba(208,58,42,${emberA})`;
      ctx.strokeStyle=`rgba(36,25,18,${emberA})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(ex,ey-cellSize*.06);ctx.lineTo(ex+cellSize*.045,ey);ctx.lineTo(ex,ey+cellSize*.06);ctx.lineTo(ex-cellSize*.045,ey);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.restore();
    }

    // Ash/smoke settling in — ramps up as the flash dies down, ends fully
    // dark to match the permanent crater underneath it once this canvas
    // is removed.
    const smokeA = Math.min(1, p / 0.7);
    const sg = ctx.createRadialGradient(x, y, 0, x, y, cellSize * 0.5);
    sg.addColorStop(0, `rgba(10,5,3,${0.92 * smokeA})`);
    sg.addColorStop(1, `rgba(10,5,3,${0.5 * smokeA})`);
    ctx.save();
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(x, y, cellSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let anyImpacted = false;
    meteors.forEach(m => {
      const local = elapsed - m.delay;
      if (local < 0) return; // hasn't launched yet
      if (local < FALL_DUR) {
        drawFallingMeteor(m, local / FALL_DUR);
      } else {
        anyImpacted = true;
        const impactP = Math.min(1, (local - FALL_DUR) / IMPACT_DUR);
        drawImpact(m, impactP);
      }
    });

    // One subtle, single shake the moment the barrage starts landing —
    // not per-meteor (that reads as jittery/cheesy), just one grounded hit
    // to sell the weight of the first impact.
    if (anyImpacted && !shakeFired) {
      shakeFired = true;
      boardWrapEl.classList.add('meteor-shake');
      setTimeout(() => boardWrapEl.classList.remove('meteor-shake'), 380);
    }

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }
  requestAnimationFrame(draw);
}

// WILDFIRE — a wall of flame sweeps up from the bottom of the board to the
// top, mirroring Blizzard's full-board weather sweep (just fire instead of
// snow, and vertical instead of horizontal). Every pre-picked target square
// ignites the instant the wave front passes over it and stays lit for the
// rest of the sweep, so what's "left behind" as the fire clears the top of
// the board already visually matches the permanent .wildfire-cell state
// that render() puts down for real once this canvas is removed.
function animateWildfire(targets, onComplete) {
  const boardEl = document.getElementById('board');
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('wildfire');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:55;
  `;
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const W = canvas.width, H = canvas.height;
  const targetCenters = targets.map(({ row, col }) => ({ ...getCellCenter(boardEl, boardRect, bsC, row, col), row, col }));

  const BAND_H = H * 0.22;
  const DURATION = 1250; // full bottom-to-top travel time
  const FADE = 220;
  const TOTAL = DURATION + FADE;

  // Flame-front "teeth" — jittering blobs spread across the width that ride
  // along with the wave front, giving it an irregular, licking edge instead
  // of reading as a flat bar of color sliding up the screen.
  const TEETH = 14;
  const teeth = Array.from({ length: TEETH }, (_, i) => ({
    x: (W / TEETH) * (i + 0.5) + (Math.random() - 0.5) * (W / TEETH) * 0.6,
    phase: Math.random() * Math.PI * 2,
    speed: 4 + Math.random() * 3,
    amp: BAND_H * (0.18 + Math.random() * 0.18),
    r: (W / TEETH) * (0.55 + Math.random() * 0.35),
  }));

  // Embers that peel off the wall and rise, trailing behind it.
  const EMBERS = 40;
  const embers = Array.from({ length: EMBERS }, () => ({
    x: Math.random() * W,
    startDelay: Math.random() * DURATION,
    life: 500 + Math.random() * 500,
    drift: (Math.random() - 0.5) * 20,
    size: 1.5 + Math.random() * 2,
  }));

  let startTime = null;
  const ignited = new Set(); // "row,col" keys the front has already passed

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, W, H);

    const sweepT = Math.min(1, elapsed / DURATION);
    // Front travels from just below the board to just above it.
    const frontY = H + BAND_H * 0.5 - sweepT * (H + BAND_H);

    // Target squares the wave has already climbed past stay lightly
    // scorched-orange for the rest of the sweep — the permanent flicker
    // takes over the instant render() runs after onComplete.
    targetCenters.forEach(tc => {
      const key = `${tc.row},${tc.col}`;
      if (tc.y > frontY) ignited.add(key);
      if (ignited.has(key)) {
        const g = ctx.createRadialGradient(tc.x, tc.y, 0, tc.x, tc.y, tc.w * 0.5);
        g.addColorStop(0, 'rgba(255,120,30,0.55)');
        g.addColorStop(1, 'rgba(255,120,30,0)');
        ctx.save();
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tc.x, tc.y, tc.w * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // The traveling wall of flame itself.
      if (sweepT < 1) {
        teeth.forEach(t => {
          const ty = frontY - Math.sin(elapsed / 1000 * t.speed + t.phase) * t.amp * 0.3;
          ctx.save();
          ctx.translate(t.x,ty);ctx.rotate(Math.sin(t.phase+elapsed*.008)*.16);
          ctx.fillStyle = '#df4b2f';ctx.strokeStyle='#281b13';ctx.lineWidth=Math.max(2,t.r*.14);
          ctx.beginPath();ctx.moveTo(0,-t.r);ctx.bezierCurveTo(-t.r*.82,-t.r*.15,-t.r*.72,t.r*.68,0,t.r);ctx.bezierCurveTo(t.r*.72,t.r*.68,t.r*.82,-t.r*.12,0,-t.r);ctx.fill();ctx.stroke();
          ctx.fillStyle='#f6cc52';ctx.beginPath();ctx.moveTo(0,-t.r*.48);ctx.bezierCurveTo(-t.r*.32,t.r*.1,-t.r*.25,t.r*.55,0,t.r*.62);ctx.bezierCurveTo(t.r*.3,t.r*.38,t.r*.28,0,0,-t.r*.48);ctx.fill();
          ctx.restore();
        });

      // Base glow strip under the flame teeth for a solid "wall" feel.
      const wallGrad = ctx.createLinearGradient(0, frontY - BAND_H * 0.3, 0, frontY + BAND_H * 0.5);
      wallGrad.addColorStop(0, 'rgba(255,140,40,0)');
      wallGrad.addColorStop(0.5, 'rgba(255,110,30,0.45)');
      wallGrad.addColorStop(1, 'rgba(120,30,10,0.15)');
      ctx.save();
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, frontY - BAND_H * 0.3, W, BAND_H * 0.8);
      ctx.restore();
    }

    // Embers peeling off the wall and rising.
    embers.forEach(e => {
      const local = elapsed - e.startDelay;
      if (local < 0 || local > e.life) return;
      const p = local / e.life;
      const ey = frontY + BAND_H * 0.3 - p * BAND_H * 2.2;
      const ex = e.x + e.drift * p;
      const a = Math.sin(p * Math.PI) * 0.8;
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#f4c94f';ctx.strokeStyle='#2b1d14';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(ex,ey-e.size*1.5);ctx.lineTo(ex+e.size,ey);ctx.lineTo(ex,ey+e.size*1.5);ctx.lineTo(ex-e.size,ey);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.restore();
    });

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }
  requestAnimationFrame(draw);
}

// SHIELD WALL — unlike Blizzard/Plague's slow board-wide weather, this is an
// instant defensive snap: a green shield glyph blooms into place over every
// one of your pieces simultaneously, however many there are, then settles
// into the persistent .piece.shielded glow (see CSS) that actually carries
// the protection through the enemy's next turn.
function animateShieldWall(cells, onComplete) {
  const boardEl = document.getElementById('board');
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('shield');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const centers = cells.map(p => getCellCenter(boardEl, boardRect, bsC, p.row, p.col));
  const cellSize = centers.length ? centers[0].w : boardRect.width / bsC;

  const RISE = 260;   // shields snap up into place, growing from nothing
  const HOLD = 300;   // sit fully bright for a beat so it reads clearly
  const FADE = 340;   // burst fades out, handing off to the CSS glow
  const TOTAL = RISE + HOLD + FADE;

  function drawShield(cx, cy, size, alpha, scale) {
    const w = size * 0.30 * scale, h = size * 0.36 * scale;
    ctx.save();
    ctx.translate(cx, cy - size * 0.02);
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(w, -h * 0.55);
    ctx.lineTo(w, h * 0.15);
    ctx.quadraticCurveTo(w, h * 0.75, 0, h);
    ctx.quadraticCurveTo(-w, h * 0.75, -w, h * 0.15);
    ctx.lineTo(-w, -h * 0.55);
    ctx.closePath();
    ctx.fillStyle = `rgba(65,132,157,${.72*alpha})`;
    ctx.strokeStyle = `rgba(36,27,19,${.95*alpha})`;ctx.lineWidth=Math.max(4,size*.075);ctx.fill();ctx.stroke();
    ctx.strokeStyle = `rgba(242,202,79,${.98*alpha})`;ctx.lineWidth=Math.max(2,size*.028);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-h*.72);ctx.lineTo(0,h*.68);ctx.moveTo(-w*.62,-h*.18);ctx.lineTo(w*.62,-h*.18);ctx.stroke();
    ctx.restore();
  }

  let startTime = null;
  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let scale, alpha;
    if (elapsed < RISE) {
      const t = elapsed / RISE;
      scale = 0.25 + 0.9 * t;
      alpha = t;
    } else if (elapsed < RISE + HOLD) {
      const t = (elapsed - RISE) / HOLD;
      scale = 1.15 - 0.15 * t;
      alpha = 1;
    } else {
      const t = (elapsed - RISE - HOLD) / FADE;
      scale = 1;
      alpha = Math.max(0, 1 - t);
    }

    centers.forEach(c => drawShield(c.x, c.y, cellSize, alpha, scale));

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}


// COUNTER — cast animation: a pair of crossed blades snaps into place over
// every one of your pieces simultaneously (however many you have), same
// "instant readiness" beat as Shield Wall's cast, just steel/crimson and
// blade-shaped instead of a green ward.
function animateCounterCast(cells, onComplete) {
  const boardEl = document.getElementById('board');
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('counter');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const centers = cells.map(p => getCellCenter(boardEl, boardRect, bsC, p.row, p.col));
  const cellSize = centers.length ? centers[0].w : boardRect.width / bsC;

  const RISE = 220;   // blades snap together fast — sharper than a shield rising
  const HOLD = 260;
  const FADE = 300;
  const TOTAL = RISE + HOLD + FADE;

  function drawBlade(cx, cy, angle, len, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = `rgba(38,28,20,${.96*alpha})`;
    ctx.lineWidth = len * 0.18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(len / 2, 0);
    ctx.stroke();
    ctx.strokeStyle=`rgba(242,211,111,${.98*alpha})`;ctx.lineWidth=len*.08;ctx.stroke();
    ctx.fillStyle=`rgba(190,53,62,${alpha})`;ctx.strokeStyle=`rgba(38,28,20,${alpha})`;ctx.lineWidth=Math.max(2,len*.025);ctx.beginPath();ctx.moveTo(len*.5,0);ctx.lineTo(len*.28,-len*.13);ctx.lineTo(len*.3,len*.12);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
  }

  function drawCross(cx, cy, size, alpha, scale) {
    const len = size * 0.85 * scale;
    ctx.save();
    // Bright clash flash right at the crossing point, brief and sharp.
    const flashR = size * 0.22 * scale;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
    grad.addColorStop(0, `rgba(255,255,255,${0.85 * alpha})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, flashR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawBlade(cx, cy, Math.PI / 4, len, alpha);
    drawBlade(cx, cy, -Math.PI / 4, len, alpha);
  }

  let startTime = null;
  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let scale, alpha;
    if (elapsed < RISE) {
      const t = elapsed / RISE;
      scale = 0.4 + 0.7 * t;
      alpha = t;
    } else if (elapsed < RISE + HOLD) {
      scale = 1;
      alpha = 1;
    } else {
      const t = (elapsed - RISE - HOLD) / FADE;
      scale = 1;
      alpha = Math.max(0, 1 - t);
    }

    centers.forEach(c => drawCross(c.x, c.y, cellSize, alpha, scale));

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

// COUNTER — clash animation: plays mid-enemy-turn, at the exact moment an
// enemy tries to jump a piece that's primed to riposte. A brief steel-on-
// steel anticipation beat (the crossed blades flicker as if bracing for the
// hit) leads into the actual clash: a sharp white flash, a real board jolt
// (same .charge-shake language as every other "something just got hit"
// moment), and a burst of sparks kicking outward — then the attacker (not
// the defender) is the one who gets removed once this finishes.
function animateCounterClash(row, col, onComplete) {
  const boardEl = document.getElementById('board');
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('counter');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const c = getCellCenter(boardEl, boardRect, bsC, row, col);
  const R = c.w * 0.5;

  // Anticipation: the blades brace, flickering in place, before the actual
  // clash lands — gives the hit a beat to build into instead of firing cold.
  const BRACE = 150;
  const FLASH = 130;
  const SPARK_DUR = 320;
  const TOTAL = BRACE + FLASH + SPARK_DUR + 140;

  let shakeFired = false;
  const boardWrapEl = document.querySelector('.board-wrap');

  const sparks = Array.from({ length: 14 }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 0.5,
    size: 1.5 + Math.random() * 1.5,
  }));

  let startTime = null;
  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (elapsed < BRACE) {
      // Blades flicker in and out, bracing for contact.
      const t = elapsed / BRACE;
      const flicker = 0.35 + Math.abs(Math.sin(t * Math.PI * 5)) * 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255,235,225,${flicker})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(c.x - R * 0.6, c.y - R * 0.6);
      ctx.lineTo(c.x + R * 0.6, c.y + R * 0.6);
      ctx.moveTo(c.x + R * 0.6, c.y - R * 0.6);
      ctx.lineTo(c.x - R * 0.6, c.y + R * 0.6);
      ctx.stroke();
      ctx.restore();
      requestAnimationFrame(draw);
      return;
    }

    const local = elapsed - BRACE;

    // The instant the clash actually lands: board jolt + the moment-of-
    // impact flash reused from Charge/Catapult, so every real hit reads the
    // same way regardless of which ability caused it.
    if (!shakeFired) {
      shakeFired = true;
      if (boardWrapEl) {
        boardWrapEl.classList.remove('charge-shake');
        void boardWrapEl.offsetWidth;
        boardWrapEl.classList.add('charge-shake');
      }
    }

    // A quick steel "X" clash right where the blades meet, sharper/brighter
    // than the brace flicker.
    if (local < FLASH + 90) {
      const a = Math.max(0, 1 - local / (FLASH + 90));
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(c.x - R * 0.75, c.y - R * 0.75);
      ctx.lineTo(c.x + R * 0.75, c.y + R * 0.75);
      ctx.moveTo(c.x + R * 0.75, c.y - R * 0.75);
      ctx.lineTo(c.x - R * 0.75, c.y + R * 0.75);
      ctx.stroke();
      ctx.restore();
    }

    // Bright flash at the point of contact.
    if (local < FLASH) {
      const a = 1 - local / FLASH;
      ctx.beginPath();
      ctx.arc(c.x, c.y, R * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
      ctx.fill();
    }

    // Sparks kicking outward from the clash.
    if (local >= FLASH * 0.25) {
      const t = Math.min((local - FLASH * 0.25) / SPARK_DUR, 1);
      sparks.forEach(s => {
        const dist = R * s.speed * t * 1.8;
        const sx = c.x + Math.cos(s.angle) * dist;
        const sy = c.y + Math.sin(s.angle) * dist;
        const alpha = Math.max(0, 1 - t);
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,140,${alpha})`;
        ctx.fill();
      });
    }

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}


// TORNADO — the funnel walks a genuinely random path: an off-board entry
// edge, then every victim (already shuffled by the caller) in that order,
// then an off-board exit edge. Each piece is sucked in (spins + shrinks in
// place, right as the funnel reaches its square) and once the whole path
// has been walked, every gathered piece is flung off the board at its own
// random angle. Drawn as a spinning vortex viewed from directly above,
// same viewpoint as the board itself.
function animateTornado(victims, onComplete) {
  const boardEl = document.getElementById('board');
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width / bsC;
  const diag = Math.hypot(boardRect.width, boardRect.height);

  const canvas = createManuscriptFxCanvas('tornado');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element, not .board-wrap — see the note on
  // animateWrath above; same padding-offset issue applies here.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  function randomEdgePoint() {
    const edge = Math.floor(Math.random() * 4); // 0 top, 1 right, 2 bottom, 3 left
    const along = Math.random();
    const overshoot = cellW * 1.2;
    if (edge === 0) return { x: along * canvas.width, y: -overshoot };
    if (edge === 1) return { x: canvas.width + overshoot, y: along * canvas.height };
    if (edge === 2) return { x: along * canvas.width, y: canvas.height + overshoot };
    return { x: -overshoot, y: along * canvas.height };
  }

  // Path = entry edge -> every victim's real cell center, in shuffled order
  // -> exit edge. This is what makes "the pieces it takes are the ones in
  // its path" literally true rather than just narratively true.
  const entryPt = randomEdgePoint();
  const exitPt = randomEdgePoint();
  const waypoints = [entryPt];
  victims.forEach(v => {
    const c = getCellCenter(boardEl, boardRect, bsC, v.row, v.col);
    waypoints.push({ x: c.x, y: c.y });
  });
  waypoints.push(exitPt);

  // Fixed total travel budget, split across segments proportional to their
  // real distance — NOT a fixed per-segment minimum. That per-segment floor
  // used to be what blew the whole animation up to 8+ seconds once there
  // were 30+ victims to path through (each hop cost at least ~200ms no
  // matter how many there were). Now the whole trip always takes the same
  // total time regardless of how many pieces are involved — with more
  // victims the funnel just weaves through them faster, which is exactly
  // what "a tornado tearing through 100 pieces" should look like anyway.
  const TRAVEL_BUDGET = 2900; // ms — entry edge through exit edge, always
  const segDists = [];
  let totalDist = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x, dy = waypoints[i].y - waypoints[i - 1].y;
    const d = Math.hypot(dx, dy);
    segDists.push(d);
    totalDist += d;
  }
  const FLOOR = 35; // ms — just enough that a same-cell/adjacent hop isn't a literal 0ms jump
  const rawSegDurs = segDists.map(d =>
    Math.max(FLOOR, totalDist > 0 ? (d / totalDist) * TRAVEL_BUDGET : TRAVEL_BUDGET / segDists.length)
  );
  const rawTotal = rawSegDurs.reduce((a, b) => a + b, 0);
  const scale = rawTotal > 0 ? TRAVEL_BUDGET / rawTotal : 1;
  const segDurs = rawSegDurs.map(d => d * scale); // rescaled so the sum is always exactly TRAVEL_BUDGET
  const arrival = [0];
  segDurs.forEach(d => arrival.push(arrival[arrival.length - 1] + d));
  const TRAVEL_TOTAL = arrival[arrival.length - 1];
  const SUCK_DUR = 440;  // how long a piece takes to spin/shrink away once reached
  const THROW_DUR = 900; // how long the final fling off-board takes
  // TRAVEL_TOTAL (~2900ms) + THROW_DUR (900ms) ≈ 3.8s total, regardless of
  // victim count — double the previous ~1.9s pacing, per request.

  // Grab each victim's live DOM piece element up front — cells are rebuilt
  // in row-major order every render(), so this index math reliably matches
  // (same trick used by animateInfantryCapture/animateWrath).
  victims.forEach(v => {
    const idx = v.row * bsC + v.col;
    v._el = boardEl.children[idx]?.querySelector('.piece') || null;
  });

  // Ground rumble while the funnel is actually crossing the board — subtle
  // and continuous (unlike Wrath's single big strike-shake), it's what
  // sells real force instead of a decal sliding around on top of the board.
  const boardWrapEl = document.querySelector('.board-wrap');
  if (boardWrapEl) boardWrapEl.classList.add('tornado-shake');

  let vortexAngle = 0;

  // A handful of irregular, independently-drifting cloud blobs instead of
  // one flat gradient disc — this is what actually reads as "churning
  // debris cloud" instead of "sprite spinning in place".
  const cloudLayers = Array.from({ length: 8 }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: (Math.random() < 0.5 ? -1 : 1) * (0.09 + Math.random() * 0.1),
    offset: 0.1 + Math.random() * 0.24,
    rScale: 0.7 + Math.random() * 0.45,
    dark: Math.random() < 0.55,
  }));

  // Tumbling debris chunks — small irregular shards orbiting the core,
  // rather than a perfect ring of uniform dots.
  const debrisChunks = Array.from({ length: 18 }, () => ({
    baseAngle: Math.random() * Math.PI * 2,
    orbitR: 0.3 + Math.random() * 0.6,
    orbitSpeed: (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.9),
    spin: Math.random() * Math.PI * 2,
    spinSpeed: (Math.random() < 0.5 ? -1 : 1) * (0.08 + Math.random() * 0.12),
    w: 3 + Math.random() * 5,
    h: 2 + Math.random() * 3,
  }));

  function drawVortex(x, y, scale, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    // Oversized footprint: the funnel now dominates several squares instead
    // of reading like a token-sized smoke decal passing over them.
    const r = cellW * 2.05 * scale;

    // Churning outer cloud mass — several overlapping, off-center blobs
    // that each drift at their own rate.
    cloudLayers.forEach(layer => {
      const lx = Math.cos(layer.angle + vortexAngle * layer.speed) * r * layer.offset;
      const ly = Math.sin(layer.angle + vortexAngle * layer.speed) * r * layer.offset;
      const lr = r * layer.rScale;
      ctx.fillStyle = layer.dark ? `rgba(49,55,48,${.28*alpha})` : `rgba(92,125,105,${.24*alpha})`;
      ctx.strokeStyle = `rgba(33,27,20,${.52*alpha})`;ctx.lineWidth=Math.max(2,r*.022);
      ctx.beginPath();
      for(let k=0;k<12;k++){const a=k*Math.PI/6;const wobble=lr*(k%2?.76:1);const px=lx+Math.cos(a)*wobble,py=ly+Math.sin(a)*wobble*.72;if(k)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
    });

    // Dense, near-black throat at the center — this is what actually
    // reads as "funnel" rather than "smoke puff".
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.42);
    coreGrad.addColorStop(0, `rgba(8,8,7,${0.92 * alpha})`);
    coreGrad.addColorStop(1, 'rgba(8,8,7,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2); ctx.fill();

    // Fast wind-streaks — short arcs at uneven radii/speeds/directions
    // instead of clean concentric rings, so it reads as turbulent air
    // rather than a decorative spiral.
    for (let i = 0; i < 8; i++) {
      const streakR = r * (0.27 + i * 0.095);
      const sweep = 0.75 + (i % 3) * 0.35;
      const rot = vortexAngle * (i % 2 === 0 ? 1.5 : -1.15) + i * 1.7;
      ctx.save();
      ctx.rotate(rot);
      ctx.strokeStyle = i % 3 === 0
        ? `rgba(238,192,74,${Math.max(0.08, 0.34 - i * 0.028) * alpha})`
        : `rgba(211,232,215,${Math.max(0.08, 0.38 - i * 0.03) * alpha})`;
      ctx.lineWidth = 1.2 + (8 - i) * 0.28;
      ctx.beginPath();
      ctx.arc(0, 0, streakR, 0, sweep);
      ctx.stroke();
      ctx.restore();
    }

    // Two broad, hand-inked spiral ribbons give the funnel a readable
    // illustrated silhouette even while crossing a crowded board.
    for (let ribbon = 0; ribbon < 2; ribbon++) {
      ctx.save();
      ctx.rotate(vortexAngle * (ribbon ? -1.08 : 1.22) + ribbon * Math.PI);
      ctx.strokeStyle = ribbon
        ? `rgba(66,116,111,${.66 * alpha})`
        : `rgba(238,205,107,${.72 * alpha})`;
      ctx.lineWidth = r * .09;
      ctx.shadowColor='rgba(33,25,18,.9)';ctx.shadowBlur=0;ctx.shadowOffsetX=2;ctx.shadowOffsetY=3;
      ctx.beginPath();
      for (let s = 0; s <= 22; s++) {
        const t = s / 22;
        const a = t * Math.PI * 2.35;
        const sr = r * (.12 + t * .82);
        const px = Math.cos(a) * sr;
        const py = Math.sin(a) * sr * .72;
        if (!s) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Tumbling debris shards flung around the core.
    debrisChunks.forEach(d => {
      const ang = d.baseAngle + vortexAngle * d.orbitSpeed;
      const dr = r * d.orbitR;
      const dx = Math.cos(ang) * dr, dy = Math.sin(ang) * dr;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(d.spin + vortexAngle * d.spinSpeed);
      ctx.fillStyle = `rgba(46,40,28,${0.7 * alpha})`;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    });

    ctx.restore();
  }

  function currentFunnelPos(elapsed) {
    let segIdx = 0;
    while (segIdx < segDurs.length && elapsed > arrival[segIdx + 1]) segIdx++;
    segIdx = Math.min(segIdx, segDurs.length - 1);
    const segElapsed = elapsed - arrival[segIdx];
    const t = Math.max(0, Math.min(1, segElapsed / segDurs[segIdx]));
    const a = waypoints[segIdx], b = waypoints[segIdx + 1];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  let startTime = null;
  let throwStart = null;
  const throwAngles = victims.map(() => Math.random() * Math.PI * 2);
  const throwSpeedJitter = victims.map(() => 0.8 + Math.random() * 0.5);

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    vortexAngle += 0.052; // brisk illustrated rotation without extra DOM layers

    if (elapsed < TRAVEL_TOTAL) {
      const pos = currentFunnelPos(elapsed);
      const fadeIn = Math.min(1, elapsed / 320);
      const fadeOut = Math.min(1, (TRAVEL_TOTAL - elapsed) / 320);
      drawVortex(pos.x, pos.y, 1, Math.min(fadeIn, fadeOut));

      // Suck in any victim the funnel has now reached — spin + shrink in
      // place right as the funnel's path crosses their square.
      victims.forEach((v, i) => {
        const arriveAt = arrival[i + 1]; // waypoints[0] is the entry point
        if (elapsed < arriveAt - SUCK_DUR) return;
        if (!v._el) return;
        const t = Math.max(0, Math.min(1, (elapsed - (arriveAt - SUCK_DUR)) / SUCK_DUR));
        const spin = t * 720; // two full spins while shrinking away
        const lift = Math.sin(t * Math.PI) * -6;
        v._el.style.transform = `translateY(${lift}px) scale(${1 - t}) rotate(${spin}deg)`;
        v._el.style.opacity = `${1 - t}`;
      });

      requestAnimationFrame(draw);
      return;
    }

    // Throw phase — every gathered piece flies off the board at its own
    // random angle, all at once, from wherever the funnel exited.
    if (throwStart === null) {
      throwStart = elapsed;
      if (boardWrapEl) boardWrapEl.classList.remove('tornado-shake');
    }
    const exitPos = waypoints[waypoints.length - 1];
    const tt = Math.min(1, (elapsed - throwStart) / THROW_DUR);
    drawVortex(exitPos.x, exitPos.y, 1 - tt * 0.4, Math.max(0, 1 - tt * 1.4));

    victims.forEach((v, i) => {
      const et = Math.min(1, tt * throwSpeedJitter[i]);
      const dist = et * diag * 0.75;
      const ang = throwAngles[i];
      const px = exitPos.x + Math.cos(ang) * dist;
      const py = exitPos.y + Math.sin(ang) * dist;
      const fragAlpha = Math.max(0, 1 - et * 1.1);

      // A short dust trail behind the fragment, so it reads as something
      // actually hurtling through the air rather than a dot sliding along.
      const trailX = px - Math.cos(ang) * cellW * 0.4;
      const trailY = py - Math.sin(ang) * cellW * 0.4;
      const trailGrad = ctx.createLinearGradient(trailX, trailY, px, py);
      trailGrad.addColorStop(0, `rgba(180,170,140,0)`);
      trailGrad.addColorStop(1, `rgba(180,170,140,${0.35 * fragAlpha})`);
      ctx.save();
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.restore();

      // An irregular, tumbling shard rather than a flat clean circle —
      // splintered debris instead of a cartoon marble.
      ctx.save();
      ctx.globalAlpha = fragAlpha;
      ctx.translate(px, py);
      ctx.rotate(et * Math.PI * 5 * (i % 2 === 0 ? 1 : -1));
      const baseR = cellW * 0.22;
      ctx.fillStyle = v.type === 'yours' ? '#8a6423' : '#232016';
      ctx.beginPath();
      ctx.moveTo(baseR, 0);
      ctx.lineTo(baseR * 0.2, baseR * 0.75);
      ctx.lineTo(-baseR * 0.85, baseR * 0.25);
      ctx.lineTo(-baseR * 0.5, -baseR * 0.7);
      ctx.lineTo(baseR * 0.4, -baseR * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    if (tt < 1) {
      requestAnimationFrame(draw);
    } else {
      victims.forEach(v => { if (v._el) { v._el.style.transform = ''; v._el.style.opacity = ''; } });
      if (boardWrapEl) boardWrapEl.classList.remove('tornado-shake');
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

// LOCUST SWARM — same roll-in/hold/lift structure as the plague fog and
// blizzard (arrives, fully covers, then clears — board mutates while still
// hidden), but confined to a 3-column-wide vertical lane down the center
// of the board and directional: the swarm rises straight up from the
// bottom edge, holds long enough to devour everything in the lane, then
// keeps rising and exits off the top — rather than fog's omnidirectional
// drift-in/drift-out.
function animateLocustSwarm(swarmCols, onMidpoint, onComplete) {
  const boardEl = document.getElementById('board');
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();

  const canvas = createManuscriptFxCanvas('locust');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element — see the note on animateWrath
  // above; same padding-offset issue applies here.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  // Real pixel left/right edges of the 3 center columns, read from the
  // actual DOM cells (not an even-grid guess) — same trick getCellCenter
  // is built around everywhere else in this file.
  const leftCol = swarmCols[0], rightCol = swarmCols[swarmCols.length - 1];
  const leftC = getCellCenter(boardEl, boardRect, bsC, 0, leftCol);
  const rightC = getCellCenter(boardEl, boardRect, bsC, 0, rightCol);
  const stripLeft = leftC.x - leftC.w / 2;
  const stripRight = rightC.x + rightC.w / 2;
  const stripW = stripRight - stripLeft;

  const W = canvas.width, H = canvas.height;
  const bandHeight = H * 1.3;
  const startY = H + bandHeight / 2; // fully below the board
  const midY = H / 2;                // centered — fully covers the whole lane
  const endY = -bandHeight / 2;      // fully above the board

  // A dense mass of small, fast, jittery locusts confined to the lane's
  // width — individually buzzing motion is what reads as "swarm" instead
  // of a smooth fog bank.
  const NUM_LOCUSTS = 70;
  const locusts = Array.from({ length: NUM_LOCUSTS }, () => {
    // Depth cue: 0 = far/small/pale/slow, 1 = near/big/dark/fast — gives the
    // swarm a sense of layers instead of one flat sheet of identical bugs.
    const depth = Math.random();
    return {
      x: stripLeft + Math.random() * stripW,
      yOffset: (Math.random() - 0.5) * bandHeight,
      jitterPhase: Math.random() * Math.PI * 2,
      jitterSpeed: 0.15 + Math.random() * 0.2,
      jitterAmp: 3 + Math.random() * 5,
      // Independent vertical jitter/drift so locusts don't all move in
      // perfect lockstep with the shared band's vertical travel.
      vJitterPhase: Math.random() * Math.PI * 2,
      vJitterSpeed: 0.1 + Math.random() * 0.18,
      vJitterAmp: 4 + Math.random() * 10,
      vDrift: (Math.random() - 0.5) * 0.012, // slow independent creep, px/ms
      depth,
      size: 1.4 + depth * 2.6 + Math.random() * 1.2,
      speedMul: 0.7 + depth * 0.6, // darker/closer bugs read as slightly faster
      flickerPhase: Math.random() * Math.PI * 2,
      flickerSpeed: (0.5 + Math.random() * 0.7) * (0.8 + depth * 0.6),
      // Occasional tiny random phase jump so wingbeats don't stay perfectly
      // periodic — reads as more frantic/irregular rather than a slow pulse.
      nextPhaseJumpAt: 200 + Math.random() * 500,
      // Tracks previous frame position so heading can be computed from
      // actual frame-to-frame velocity rather than a cosmetic-only tilt.
      prevX: null,
      prevY: null,
      heading: 0,
    };
  });

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  const ROLL_IN = 550;  // fast — a swarm arrives, it doesn't drift in
  const HOLD = 320;
  const LIFT_DUR = 620;
  const TOTAL = ROLL_IN + HOLD + LIFT_DUR;

  let startTime = null;
  let midpointFired = false;

  function bandCenterY(elapsed) {
    if (elapsed < ROLL_IN) return startY + (midY - startY) * easeInOutCubic(elapsed / ROLL_IN);
    if (elapsed < ROLL_IN + HOLD) return midY;
    return midY + (endY - midY) * easeInOutCubic((elapsed - ROLL_IN - HOLD) / LIFT_DUR);
  }

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, W, H);

    if (!midpointFired && elapsed >= ROLL_IN + HOLD) {
      midpointFired = true;
      onMidpoint(); // board mutates while the lane is still fully covered
    }

    const bandY = bandCenterY(elapsed);
    const bandTop = bandY - bandHeight / 2;
    const bandBottom = bandY + bandHeight / 2;

    ctx.save();
    // Clip everything to the 3-column lane — nothing renders outside it.
    ctx.beginPath();
    ctx.rect(stripLeft, 0, stripW, H);
    ctx.clip();

    // Dark base density layer — guarantees full coverage through the lane
    // regardless of how the individual locusts happen to be scattered.
    const coverGrad = ctx.createLinearGradient(0, bandTop, 0, bandBottom);
    coverGrad.addColorStop(0, 'rgba(40,34,18,0)');
    coverGrad.addColorStop(0.15, 'rgba(40,34,18,0.75)');
    coverGrad.addColorStop(0.85, 'rgba(40,34,18,0.75)');
    coverGrad.addColorStop(1, 'rgba(40,34,18,0)');
    ctx.fillStyle = coverGrad;
    ctx.fillRect(stripLeft, bandTop, stripW, bandHeight);

    // Individual locusts — small dark bodies with fast-flickering
    // translucent wings, each with its own independent motion in both x and
    // y (not just x-jitter riding a rigid shared band) so the mass reads as
    // a real chaotic swarm rather than a uniform block of identical dots.
    locusts.forEach(l => {
      // Occasional tiny random phase jump — makes wingbeats read as
      // irregular frantic motion instead of a perfectly periodic pulse.
      if (elapsed >= l.nextPhaseJumpAt) {
        l.flickerPhase += (Math.random() - 0.5) * 3;
        l.nextPhaseJumpAt = elapsed + 200 + Math.random() * 500;
      }

      const jitterX = Math.sin(elapsed * l.jitterSpeed * 0.02 * l.speedMul + l.jitterPhase) * l.jitterAmp;
      // Independent vertical jitter/drift layered on top of the shared band
      // travel, so locusts don't all move in perfect vertical lockstep.
      const vJitter = Math.sin(elapsed * l.vJitterSpeed * 0.02 * l.speedMul + l.vJitterPhase) * l.vJitterAmp
        + elapsed * l.vDrift;
      const ly = bandY + l.yOffset + vJitter;
      if (ly < -20 || ly > H + 20) return;
      const lx = Math.min(stripRight - 2, Math.max(stripLeft + 2, l.x + jitterX));

      // Heading from actual frame-to-frame velocity, so the body/wings
      // orient toward where the bug is actually flying rather than just a
      // cosmetic jitter-based tilt.
      let heading = l.heading;
      if (l.prevX !== null) {
        const dx = lx - l.prevX, dy = ly - l.prevY;
        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
          heading = Math.atan2(dy, dx);
        }
      }
      l.heading = heading;
      l.prevX = lx; l.prevY = ly;

      const flicker = 0.4 + 0.6 * Math.abs(Math.sin(elapsed * l.flickerSpeed * 0.02 + l.flickerPhase));
      // Depth/parallax cue: farther (smaller) locusts render paler/dimmer,
      // closer (bigger) ones darker and more opaque.
      const wingAlpha = (0.28 + 0.14 * l.depth) * flicker;
      const bodyAlpha = 0.65 + 0.3 * l.depth;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(heading);
      ctx.fillStyle = `rgba(226,195,91,${Math.min(1,wingAlpha*1.7)})`;
      ctx.strokeStyle=`rgba(36,29,18,${Math.min(1,bodyAlpha)})`;ctx.lineWidth=Math.max(1.2,l.size*.24);
      ctx.beginPath();
      ctx.ellipse(-l.size, 0, l.size * 1.3, l.size * 0.6, 0.4, 0, Math.PI * 2);
      ctx.ellipse(l.size, 0, l.size * 1.3, l.size * 0.6, -0.4, 0, Math.PI * 2);
      ctx.fill();ctx.stroke();
      ctx.fillStyle = `rgba(49,39,20,${bodyAlpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, l.size * 0.6, l.size, 0, 0, Math.PI * 2);
      ctx.fill();ctx.stroke();
      ctx.restore();
    });

    ctx.restore();

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

function animateAssassinate(row, col, onComplete) {
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width / bsC;
  const cellH = boardRect.height / bsR;

  const canvas = createManuscriptFxCanvas('assassinate');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element, not .board-wrap — the wrap has its
  // own padding around the board (for the frame/corners), so a canvas placed
  // at .board-wrap's top:0/left:0 draws offset from the real piece
  // positions by that padding amount. #board has none, so this lines up
  // exactly regardless of frame styling.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const cellC = getCellCenter(boardEl, boardRect, bsC, row, col);
  const ex = cellC.x, ey = cellC.y;
  const pieceR = cellC.w * 0.4;

  // A short, precise cut across the upper third of the piece — "the throat" —
  // rather than a wide board-spanning slash, since this is a single close kill.
  const cutY = ey - pieceR * 0.32;
  const cutHalfW = pieceR * 0.85;
  const tilt = pieceR * 0.18;
  const p0 = { x: ex - cutHalfW, y: cutY + tilt * 0.4 };
  const p1 = { x: ex + cutHalfW, y: cutY - tilt * 0.4 };

  const GLINT = 130;                          // blade catches the light for a beat first
  const SLASH_START = 130, SLASH_DUR = 110;    // the cut itself — fast and precise
  const BLEED_START = 240, BLEED_DUR = 500;    // wound + the piece going limp
  const TOTAL = 900;

  const drops = Array.from({ length: 6 }, (_, i) => {
    const t = (i + 0.5) / 6;
    return {
      x: p0.x + (p1.x - p0.x) * t + (Math.random() - 0.5) * 4,
      y: p0.y + (p1.y - p0.y) * t,
      delay: Math.random() * 140,
      fallSpeed: 0.05 + Math.random() * 0.03,
      size: 1.4 + Math.random() * 1.4,
    };
  });

  let startTime = null;
  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Blade glint — a quick flash right where the cut is about to land.
    if (elapsed < GLINT) {
      const ga = 1 - elapsed / GLINT;
      ctx.save();
      ctx.strokeStyle = `rgba(245,204,79,${ga})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p1.x + 7, p1.y - 9);
      ctx.lineTo(p1.x - 3, p1.y + 5);
      ctx.stroke();
      ctx.restore();
    }

    // The slash — one fast stroke, left to right.
    if (elapsed >= SLASH_START) {
      const t = Math.min((elapsed - SLASH_START) / SLASH_DUR, 1);
      const cx = p0.x + (p1.x - p0.x) * t;
      const cy = p0.y + (p1.y - p0.y) * t;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(38,27,18,.96)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.strokeStyle='#f2d788';ctx.lineWidth=3.5;ctx.stroke();
      ctx.restore();
    }

    // The wound left behind once the blade has passed.
    if (elapsed >= SLASH_START + SLASH_DUR) {
      const woundAlpha = Math.min((elapsed - SLASH_START - SLASH_DUR) / 150, 1);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(42,26,18,${woundAlpha})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.strokeStyle=`rgba(177,43,52,${woundAlpha})`;ctx.lineWidth=3.5;ctx.stroke();
      ctx.restore();
    }

    // A few drops trickling from the cut as the piece goes limp.
    if (elapsed >= BLEED_START) {
      const bt = elapsed - BLEED_START;
      drops.forEach(d => {
        const dt = bt - d.delay;
        if (dt < 0) return;
        const fall = dt * d.fallSpeed;
        const alpha = Math.max(0, 1 - dt / (BLEED_DUR + 200));
        ctx.beginPath();
        ctx.arc(d.x, d.y + fall, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(122,10,10,${alpha})`;
        ctx.fill();
      });

      // The piece itself darkens and fades away entirely.
      const et = Math.min(bt / BLEED_DUR, 1);
      ctx.beginPath();
      ctx.arc(ex, ey, pieceR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(13,13,13,${Math.min(et * 1.3, 1)})`;
      ctx.fill();
    }

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

function animateCrossStrike(anchorRow, anchorCol, captured, onComplete) {
  playCrossStrikeSound();
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width / bsC;
  const cellH = boardRect.height / bsR;

  const canvas = createManuscriptFxCanvas('strike');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element, not .board-wrap — the wrap has its
  // own padding around the board (for the frame/corners), so a canvas placed
  // at .board-wrap's top:0/left:0 draws offset from the real piece
  // positions by that padding amount. #board has none, so this lines up
  // exactly regardless of frame styling.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  function cellCenter(row, col) {
    return getCellCenter(boardEl, boardRect, bsC, row, col);
  }

  // Walk outward from the anchor along a diagonal (sign=1 is the "\" axis,
  // sign=-1 is the "/" axis) until it runs off the board, to get the full
  // edge-to-edge line each slash should sweep across.
  function diagEndpoints(sign) {
    let negSteps = 0;
    while (true) {
      const nr = anchorRow - (negSteps + 1), nc = anchorCol - (negSteps + 1) * sign;
      if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) break;
      negSteps++;
    }
    let posSteps = 0;
    while (true) {
      const nr = anchorRow + (posSteps + 1), nc = anchorCol + (posSteps + 1) * sign;
      if (nr < 0 || nr >= bsR || nc < 0 || nc >= bsC) break;
      posSteps++;
    }
    return {
      start: cellCenter(anchorRow - negSteps, anchorCol - negSteps * sign),
      end:   cellCenter(anchorRow + posSteps, anchorCol + posSteps * sign),
    };
  }
  const diagBack = diagEndpoints(1);   // "\" — top-left to bottom-right
  const diagFwd  = diagEndpoints(-1);  // "/" — top-right to bottom-left

  // Sort each captured enemy onto whichever diagonal it's actually on, so the
  // right slash triggers its impact as the blade passes over it.
  const targets = captured.map(cap => {
    const dr = cap.row - anchorRow, dc = cap.col - anchorCol;
    return { ...cap, diag: dr === dc ? 'back' : 'fwd', hit: false, hitTime: undefined };
  });

  // One board jolt at the very first strike, same weight-selling language as
  // every other real hit in the file — a clean pair of X-slashes felt too
  // weightless without it, especially when several enemies go down at once.
  const boardWrapEl = document.querySelector('.board-wrap');
  let shakeFired = false;
  function fireShakeOnce() {
    if (shakeFired || !boardWrapEl) return;
    shakeFired = true;
    boardWrapEl.classList.remove('charge-shake');
    void boardWrapEl.offsetWidth;
    boardWrapEl.classList.add('charge-shake');
  }

  // Real DOM "slice" effect: on the first hit, clone the actual piece
  // element into two halves cut along whichever diagonal the blade
  // traveled on, then have those two halves separate/fall/fade — so the
  // piece visibly splits in two rather than just getting a canvas X mark.
  function sliceTargetPiece(target) {
    const cellsList = boardEl.querySelectorAll('.cell');
    const targetCell = cellsList[target.row * bsC + target.col];
    const targetPieceEl = targetCell?.querySelector('.piece');
    if (!targetCell || !targetPieceEl) return;

    const clipA = target.diag === 'back'
      ? 'polygon(0 0, 100% 0, 100% 100%)'   // "\" — upper-right half
      : 'polygon(0 0, 100% 0, 0 100%)';     // "/" — upper-left half
    const clipB = target.diag === 'back'
      ? 'polygon(0 0, 100% 100%, 0 100%)'   // "\" — lower-left half
      : 'polygon(100% 0, 100% 100%, 0 100%)'; // "/" — lower-right half

    const halfA = targetPieceEl.cloneNode(true);
    const halfB = targetPieceEl.cloneNode(true);
    [halfA, halfB].forEach(h => {
      h.style.position = 'absolute';
      h.style.inset = '0';
      h.style.margin = '0';
      h.style.zIndex = '25';
      h.style.pointerEvents = 'none';
    });
    halfA.style.clipPath = clipA;
    halfB.style.clipPath = clipB;
    targetCell.appendChild(halfA);
    targetCell.appendChild(halfB);

    // Hide the original immediately so it doesn't sit doubled-up underneath.
    targetPieceEl.style.opacity = '0';

    // Separate the two halves perpendicular to the cut line, with a slight
    // opposite rotation and a small downward fall, then fade out.
    const perpAngle = target.diag === 'back' ? -45 : 45; // degrees, perpendicular to the cut
    const rad = perpAngle * Math.PI / 180;
    const sepDist = 9;
    const ax = Math.cos(rad) * sepDist, ay = Math.sin(rad) * sepDist;
    requestAnimationFrame(() => {
      halfA.style.transition = 'transform 400ms ease-in, opacity 400ms ease-in';
      halfB.style.transition = 'transform 400ms ease-in, opacity 400ms ease-in';
      halfA.style.transform = `translate(${ax}px, ${ay + 6}px) rotate(-18deg)`;
      halfB.style.transform = `translate(${-ax}px, ${-ay + 6}px) rotate(18deg)`;
      halfA.style.opacity = '0';
      halfB.style.opacity = '0';
    });
    setTimeout(() => {
      halfA.remove();
      halfB.remove();
    }, 430);
  }

  function drawSlash(p0, p1, progress, coreColor, glowColor) {
    const ex = p0.x + (p1.x - p0.x) * progress;
    const ey = p0.y + (p1.y - p0.y) * progress;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#281c14';
    ctx.lineWidth = 15;
    ctx.globalAlpha *= 0.82;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.globalAlpha /= 0.82;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 8;
    ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(ex, ey, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function checkImpacts(diagName, endpointStart, progress, dur) {
    const totalLen = Math.hypot(
      (diagName === 'back' ? diagBack.end.x : diagFwd.end.x) - endpointStart.x,
      (diagName === 'back' ? diagBack.end.y : diagFwd.end.y) - endpointStart.y
    );
    targets.forEach(target => {
      if (target.diag !== diagName || target.hit) return;
      const tc = cellCenter(target.row, target.col);
      const ex = tc.x, ey = tc.y;
      const targetLen = Math.hypot(ex - endpointStart.x, ey - endpointStart.y);
      if (progress * totalLen >= targetLen) target.hit = true;
    });
  }

  // Two quick slashes, one right after the other — not simultaneous.
  const SLASH1_START = 60, SLASH1_DUR = 170;
  const SLASH2_START = 300, SLASH2_DUR = 170;
  const TOTAL = 1450;

  let startTime = null;
  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (elapsed >= SLASH1_START) {
      const t1 = Math.min((elapsed - SLASH1_START) / SLASH1_DUR, 1);
      const fade1 = elapsed - SLASH1_START < SLASH1_DUR ? 1 : Math.max(0, 1 - (elapsed - SLASH1_START - SLASH1_DUR) / 250);
      if (fade1 > 0) {
        ctx.globalAlpha = fade1;
        drawSlash(diagBack.start, diagBack.end, t1, '#f5f5f5', '#9fd6ff');
        ctx.globalAlpha = 1;
      }
      checkImpacts('back', diagBack.start, t1);
    }

    if (elapsed >= SLASH2_START) {
      const t2 = Math.min((elapsed - SLASH2_START) / SLASH2_DUR, 1);
      const fade2 = elapsed - SLASH2_START < SLASH2_DUR ? 1 : Math.max(0, 1 - (elapsed - SLASH2_START - SLASH2_DUR) / 250);
      if (fade2 > 0) {
        ctx.globalAlpha = fade2;
        drawSlash(diagFwd.start, diagFwd.end, t2, '#f5f5f5', '#ffb199');
        ctx.globalAlpha = 1;
      }
      checkImpacts('fwd', diagFwd.start, t2);
    }

    targets.forEach(target => {
      if (!target.hit) return;
      if (target.hitTime === undefined) {
        target.hitTime = elapsed;
        fireShakeOnce();
        sliceTargetPiece(target);
      }
      const tc2 = cellCenter(target.row, target.col);
      const ex = tc2.x, ey = tc2.y;
      const et = Math.min((elapsed - target.hitTime) / 380, 1);
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${1 - et})`;
      ctx.lineWidth = 2;
      const s = tc2.w * 0.28 * (0.4 + et * 0.6);
      ctx.beginPath();
      ctx.moveTo(ex - s, ey - s); ctx.lineTo(ex + s, ey + s);
      ctx.moveTo(ex + s, ey - s); ctx.lineTo(ex - s, ey + s);
      ctx.stroke();
      ctx.restore();
      // A brief dark "void" puff at the cut — now that the real piece DOM
      // splits and falls away itself (see sliceTargetPiece), this no longer
      // needs to be a permanent solid mask, just a quick fading accent that
      // dies down alongside the halves separating.
      ctx.beginPath();
      ctx.arc(ex, ey, tc2.w * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(13,13,13,${Math.max(0, 0.55 - et * 0.55)})`;
      ctx.fill();
    });

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

function animateTStrike(anchorRow, anchorCol, captured, onComplete) {
  const boardEl = document.getElementById('board');
  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width / bsC;
  const cellH = boardRect.height / bsR;

  // Create a canvas overlay on top of the board
  const canvas = createManuscriptFxCanvas('strike');
  canvas.width = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = `
    position:absolute;
    top:0;left:0;
    width:${boardRect.width}px;
    height:${boardRect.height}px;
    pointer-events:none;
    z-index:50;
  `;
  // Anchor to the actual #board element, not .board-wrap — the wrap has its
  // own padding around the board (for the frame/corners), so a canvas placed
  // at .board-wrap's top:0/left:0 draws offset from the real piece
  // positions by that padding amount. #board has none, so this lines up
  // exactly regardless of frame styling.
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  const anchorC = getCellCenter(boardEl, boardRect, bsC, anchorRow, anchorCol);
  const anchorX = anchorC.x, anchorY = anchorC.y;

  // One board jolt right as the first enemy actually detonates — the pulse
  // and growing beams are pure buildup, this is the actual impact moment,
  // same weight-selling language used everywhere else in the file.
  const boardWrapEl = document.querySelector('.board-wrap');
  let shakeFired = false;
  function fireShakeOnce() {
    if (shakeFired || !boardWrapEl) return;
    shakeFired = true;
    boardWrapEl.classList.remove('charge-shake');
    void boardWrapEl.offsetWidth;
    boardWrapEl.classList.add('charge-shake');
  }

  let startTime = null;
  const PHASE1 = 300;   // pulse
  const PHASE2 = 800;   // lines grow
  const PHASE3 = 1600;  // explosions
  const TOTAL  = 2200;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / TOTAL, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Phase 1: anchor pulse rings
    if (elapsed < PHASE2) {
      const pt = Math.min(elapsed / PHASE1, 1);
      for (let ring = 0; ring < 3; ring++) {
        const ringT = Math.max(0, pt - ring * 0.25);
        if (ringT <= 0) continue;
        const radius = ringT * cellW * 1.2;
        const alpha = (1 - ringT) * 0.8;
        ctx.beginPath();
        ctx.arc(anchorX, anchorY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 180, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    // Phase 2: lines growing from anchor outward
    if (elapsed >= PHASE1 && elapsed < PHASE3) {
      const lt = easeOut(Math.min((elapsed - PHASE1) / (PHASE2 - PHASE1), 1));
      const alpha = elapsed < PHASE2 ? 1 : Math.max(0, 1 - (elapsed - PHASE2) / 200);

      // Horizontal line
      ctx.save();
      const hGrad = ctx.createLinearGradient(0, anchorY, boardRect.width, anchorY);
      hGrad.addColorStop(0, 'rgba(255,80,0,0)');
      hGrad.addColorStop(0.3, `rgba(255,150,0,${alpha})`);
      hGrad.addColorStop(0.5, `rgba(255,220,0,${alpha})`);
      hGrad.addColorStop(0.7, `rgba(255,150,0,${alpha})`);
      hGrad.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = hGrad;
      // Grow from center outward
      const hHalfW = lt * boardRect.width / 2;
      ctx.fillRect(anchorX - hHalfW, anchorY - 4, hHalfW * 2, 8);
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();

      // Vertical line
      ctx.save();
      const vGrad = ctx.createLinearGradient(anchorX, 0, anchorX, boardRect.height);
      vGrad.addColorStop(0, 'rgba(255,80,0,0)');
      vGrad.addColorStop(0.3, `rgba(255,150,0,${alpha})`);
      vGrad.addColorStop(0.5, `rgba(255,220,0,${alpha})`);
      vGrad.addColorStop(0.7, `rgba(255,150,0,${alpha})`);
      vGrad.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = vGrad;
      const vHalfH = lt * boardRect.height / 2;
      ctx.fillRect(anchorX - 4, anchorY - vHalfH, 8, vHalfH * 2);
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();
    }

    // Phase 3: enemy explosions
    if (elapsed >= PHASE2) {
      const perEnemy = 150;
      captured.forEach((cap, i) => {
        const enemyStart = PHASE2 + i * perEnemy;
        if (elapsed < enemyStart) return;
        fireShakeOnce();
        const et = Math.min((elapsed - enemyStart) / 500, 1);
        const capC = getCellCenter(boardEl, boardRect, bsC, cap.row, cap.col);
        const ex = capC.x, ey = capC.y;

        // Expanding shockwave
        const shockR = et * cellW * 1.5;
        const shockA = Math.max(0, 1 - et * 1.2);
        ctx.beginPath();
        ctx.arc(ex, ey, shockR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 120, 0, ${shockA})`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner fireball
        if (et < 0.6) {
          const fireR = et * cellW * 0.9;
          const fireA = Math.max(0, 1 - et * 1.5);
          const fireGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, fireR);
          fireGrad.addColorStop(0, `rgba(255,255,200,${fireA})`);
          fireGrad.addColorStop(0.4, `rgba(255,180,0,${fireA * 0.8})`);
          fireGrad.addColorStop(1, `rgba(255,50,0,0)`);
          ctx.beginPath();
          ctx.arc(ex, ey, fireR, 0, Math.PI * 2);
          ctx.fillStyle = fireGrad;
          ctx.fill();
        }

        // Particles flying out
        const numParticles = 6;
        for (let p = 0; p < numParticles; p++) {
          const angle = (p / numParticles) * Math.PI * 2;
          const dist = et * cellW * 1.2;
          const px = ex + Math.cos(angle) * dist;
          const py = ey + Math.sin(angle) * dist;
          const pa = Math.max(0, 1 - et * 1.3);
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, ${Math.floor(150 * (1-et))}, 0, ${pa})`;
          ctx.fill();
        }

        // Hide the DOM piece by overlaying black
        if (et > 0.3) {
          const coverA = Math.min((et - 0.3) / 0.4, 1);
          ctx.beginPath();
          ctx.arc(ex, ey, cellW * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(13,13,13,${coverA})`;
          ctx.fill();
        }
      });
    }

    if (elapsed < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

// ── EARTHQUAKE ANIMATION ──
// Three overlapping phases: (1) violent CSS board shake that builds then
// dies, (2) canvas crack that draws a jagged fracture line across the board
// with branching splits and dust — selling the "board cracks in half" moment,
// (3) every piece flies simultaneously to its displaced square or off into the
// void. All three run concurrently so the visual chaos reads as one event.
function animateEarthquake(displaced, bsR, bsC, onComplete) {
  const boardEl    = document.getElementById('board');
  const boardWrap  = document.querySelector('.board-wrap');
  const boardRect  = boardEl.getBoundingClientRect();
  const cellW      = boardRect.width  / bsC;
  const cellH      = boardRect.height / bsR;

  // ── Phase 1: shake ──
  boardWrap.classList.remove('earthquake-shake');
  void boardWrap.offsetWidth;
  boardWrap.classList.add('earthquake-shake');
  setTimeout(() => boardWrap.classList.remove('earthquake-shake'), 1250);

  // ── Phase 2: crack canvas ──
  const canvas = createManuscriptFxCanvas('earthquake');
  canvas.width  = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = 'pointer-events:none;z-index:60;';
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  // Build jagged polyline from (x0,y0) to (x1,y1) with `segs` segments
  function jagged(x0, y0, x1, y1, segs, jag) {
    const pts = [{x: x0, y: y0}];
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      pts.push({
        x: x0 + (x1 - x0) * t + (Math.random() - 0.5) * jag * 2,
        y: y0 + (y1 - y0) * t + (Math.random() - 0.5) * jag * 3,
      });
    }
    pts.push({x: x1, y: y1});
    return pts;
  }

  // Main horizontal fracture — slightly off-centre for organic feel
  const midY     = boardRect.height * (0.42 + Math.random() * 0.16);
  const endY     = midY + (Math.random() - 0.5) * cellH * 2;
  const mainCrack = jagged(0, midY, boardRect.width, endY, 18, cellW * 0.55);

  // 4–6 secondary cracks branching off the main line
  const branches = [];
  const branchCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < branchCount; i++) {
    const si  = 2 + Math.floor(Math.random() * (mainCrack.length - 4));
    const sp  = mainCrack[si];
    const up  = Math.random() > 0.5;
    const len = 3 + Math.floor(Math.random() * 4);
    branches.push(jagged(
      sp.x, sp.y,
      sp.x + (Math.random() - 0.3) * cellW * len,
      sp.y + (up ? -1 : 1) * cellH * (1 + Math.random() * 2),
      len, cellW * 0.4
    ));
  }

  // Dust particles pre-baked so they don't jitter each frame
  const dust = [];
  for (let i = 0; i < 44; i++) {
    const pt = mainCrack[Math.floor(Math.random() * mainCrack.length)];
    dust.push({
      x: pt.x + (Math.random() - 0.5) * cellW * 2,
      y: pt.y + (Math.random() - 0.5) * cellH * 1.5,
      r: 1.5 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 3,
      vy: -1.2 - Math.random() * 3.5,
    });
  }

  const CRACK_DRAW = 380, CRACK_HOLD = 220, CRACK_FADE = 400;
  const CRACK_TOTAL = CRACK_DRAW + CRACK_HOLD + CRACK_FADE;
  let crackStart = null;

  function drawCrack(ts) {
    if (!crackStart) crackStart = ts;
    const e = ts - crackStart;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let progress, alpha;
    if (e < CRACK_DRAW) {
      progress = e / CRACK_DRAW;
      alpha    = Math.min(1, progress * 2.2);
    } else if (e < CRACK_DRAW + CRACK_HOLD) {
      progress = 1; alpha = 1;
    } else {
      progress = 1;
      alpha = Math.max(0, 1 - (e - CRACK_DRAW - CRACK_HOLD) / CRACK_FADE);
    }

    const visMain = mainCrack.slice(0, Math.max(2, Math.ceil(mainCrack.length * progress)));

    // Shadow below the crack — sells the "board splitting" gap
    if (progress > 0.22) {
      const gA = alpha * Math.min(1, (progress - 0.22) / 0.35) * 0.65;
      ctx.save();
      ctx.globalAlpha = gA;
      const grad = ctx.createLinearGradient(0, midY, 0, midY + cellH * 1.6);
      grad.addColorStop(0, 'rgba(0,0,0,0.75)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      visMain.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.lineTo(boardRect.width, boardRect.height);
      ctx.lineTo(0, boardRect.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Ink-cut fissure with a painted orange interior.
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(38,27,18,1)';
    ctx.lineWidth   = 15;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.beginPath();
    visMain.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.strokeStyle='rgba(218,91,42,1)';ctx.lineWidth=8;ctx.stroke();
    ctx.restore();

    // Bright core
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255,245,200,0.95)';
    ctx.lineWidth   = 2.5;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.beginPath();
    visMain.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();

    // Branch cracks (appear as main extends)
    if (progress > 0.3) {
      const bp = Math.min(1, (progress - 0.3) / 0.7);
      branches.forEach(branch => {
        const visBranch = branch.slice(0, Math.max(2, Math.ceil(branch.length * bp)));
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = 'rgba(255,190,60,0.85)'; ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        visBranch.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,190,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        visBranch.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.restore();
      });
    }

    // Dust rising from the fracture
    if (progress > 0.38) {
      const dA  = alpha * Math.min(1, (progress - 0.38) / 0.28) * 0.5;
      const dT  = Math.min(1, (e - CRACK_DRAW * 0.38) / (CRACK_DRAW * 0.62 + CRACK_HOLD));
      ctx.save();
      ctx.globalAlpha = dA;
      ctx.fillStyle = 'rgba(155,115,55,1)';
      dust.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x + p.vx * dT * 32, p.y + p.vy * dT * 32, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    if (e < CRACK_TOTAL) {
      requestAnimationFrame(drawCrack);
    } else {
      canvas.remove();
    }
  }

  setTimeout(() => requestAnimationFrame(drawCrack), 150);

  // ── Phase 3: scatter pieces ──
  setTimeout(() => {
    const cells = boardEl.querySelectorAll('.cell');
    const flyDist = Math.max(boardRect.width, boardRect.height) * 0.88;

    displaced.forEach(p => {
      const cell    = cells[p.r * bsC + p.c];
      const pieceEl = cell?.querySelector('.piece');
      if (!pieceEl) return;

      pieceEl.style.transition = 'none';
      pieceEl.style.zIndex     = '25';
      void pieceEl.offsetWidth;

      if (p.eliminated) {
        // Fly off in the direction it was displaced (or scatter randomly for
        // collision victims that technically had a valid destination).
        const dr = p.nr - p.r, dc = p.nc - p.c;
        const fx = dc * flyDist + (Math.random() - 0.5) * cellW * 3;
        const fy = dr * flyDist + (Math.random() - 0.5) * cellH * 3;
        const spin = (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 380);
        pieceEl.style.transition = 'transform 0.58s cubic-bezier(0.25,0,1,0.55), opacity 0.52s ease-in';
        pieceEl.style.transform  = `translate(${fx}px,${fy}px) rotate(${spin}deg) scale(0.2)`;
        pieceEl.style.opacity    = '0';
      } else {
        // Slide to new cell with a tiny jitter so it looks knocked rather than gliding
        const fc = cells[p.r * bsC + p.c];
        const tc = cells[p.nr * bsC + p.nc];
        if (!fc || !tc) return;
        const fr = fc.getBoundingClientRect(), tr = tc.getBoundingClientRect();
        const jx = (Math.random() - 0.5) * 5, jy = (Math.random() - 0.5) * 5;
        pieceEl.style.transition = 'transform 0.42s cubic-bezier(0.18,0,0.7,1)';
        pieceEl.style.transform  = `translate(${tr.left - fr.left + jx}px,${tr.top - fr.top + jy}px)`;
      }
    });

    setTimeout(onComplete, 660);
  }, 275);
}

// ── MAD COW ANIMATION ──
// Phase 1: a lone piece is hurled in from the corner of the screen — same
// arc-throw/impact language as Catapult (see animateCatapult) — and slams
// down at the chosen point. It's a purely decorative piece (Mad Cow doesn't
// spend/move any of your real pieces — see the card text), built fresh each
// cast, never an actual `.piece[data-piece-id]` on the board.
// Phase 2: right on impact, the existing miasma cloud erupts, swells to
// cover the 3×3 infection radius, and absorbs every enemy caught inside —
// pieces spiral inward toward the source as the fog swallows them, then the
// plague fades, leaving the poisoned ground itself behind (see
// state.poisonSquares / the 'poison' hazard — that lasting 3-turn field is
// rendered separately by render(), not by this one-shot animation).
function animateMadCow(centerRow, centerCol, captured, affected, bsR, bsC, onComplete) {
  const boardEl   = document.getElementById('board');
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width  / bsC;
  const cellH = boardRect.height / bsR;
  const footprint = affected && affected.length ? affected : [{ row: centerRow, col: centerCol }];
  const minRow = Math.min(...footprint.map(square => square.row));
  const maxRow = Math.max(...footprint.map(square => square.row));
  const minCol = Math.min(...footprint.map(square => square.col));
  const maxCol = Math.max(...footprint.map(square => square.col));
  const visualRow = (minRow + maxRow) / 2;
  const visualCol = (minCol + maxCol) / 2;

  // Screen coords of the chosen footprint's centre — even-grid math (not
  // getCellCenter's DOM-measured rects) so the thrown piece's landing spot
  // and the cloud's own anchor below always agree exactly.
  const cx = (visualCol + 0.5) * cellW;
  const cy = (visualRow + 0.5) * cellH;

  // ── Phase 1: throw-in from the corner ──
  const throwWrapEl = document.createElement('div');
  throwWrapEl.style.cssText = `position:fixed;left:${boardRect.left}px;top:${boardRect.top}px;width:${boardRect.width}px;height:${boardRect.height}px;pointer-events:none;z-index:65;overflow:visible;`;
  document.body.appendChild(throwWrapEl);

  const startLeft = -cellW * 0.6;   // just outside the board's bottom-left corner
  const startTop  = boardRect.height - cellH * 0.4;
  const destLeft  = cx - cellW / 2;
  const destTop   = cy - cellH / 2;

  const thrownEl = document.createElement('div');
  thrownEl.className = 'piece yours';
  thrownEl.style.cssText = `position:absolute;left:${startLeft}px;top:${startTop}px;width:${cellW}px;height:${cellH}px;`;
  const thrownImg = document.createElement('img');
  thrownImg.draggable = false;
  thrownImg.src = YOUR_PIECE_VARIANT_URLS[Math.floor(Math.random() * YOUR_PIECE_VARIANT_URLS.length)];
  thrownImg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;pointer-events:none;';
  thrownEl.appendChild(thrownImg);
  throwWrapEl.appendChild(thrownEl);

  const totalDX = destLeft - startLeft;
  const totalDY = destTop  - startTop;
  const throwDist = Math.hypot(totalDX, totalDY);
  const arcHeight = Math.max(cellW, cellH) * 1.4 + throwDist * 0.18;

  const LAUNCH = 550;
  const IMPACT = 260;
  let throwStart = null;
  let landed = false;

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function throwDraw(ts) {
    if (!throwStart) throwStart = ts;
    const el = ts - throwStart;

    if (el < LAUNCH) {
      const t = el / LAUNCH;
      const arcT = easeInOut(t);
      const x = totalDX * arcT;
      const y = totalDY * arcT - arcHeight * 4 * t * (1 - t);
      const scale = 1 + Math.sin(Math.PI * t) * 0.5;
      const rotate = t * 420;
      thrownEl.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`;
      requestAnimationFrame(throwDraw);
      return;
    }

    if (!landed) {
      landed = true;
      thrownEl.style.transform = `translate(${totalDX}px, ${totalDY}px) scale(1) rotate(360deg)`;

      // A landing needs a real thud — impact flash at the touchdown cell
      // plus a board jolt, same language as Charge/Catapult, so every
      // "something just slammed into the board" moment reads consistently.
      const cells = boardEl.querySelectorAll('.cell');
      const landCell = cells[centerRow * bsC + centerCol];
      if (landCell) {
        const flash = document.createElement('div');
        flash.className = 'charge-impact-flash';
        landCell.appendChild(flash);
        requestAnimationFrame(() => {
          flash.style.transform = 'translate(-50%, -50%) scale(7)';
          flash.style.opacity = '0';
        });
        setTimeout(() => flash.remove(), 300);
      }
      const boardWrapEl = document.querySelector('.board-wrap');
      if (boardWrapEl) {
        boardWrapEl.classList.remove('charge-shake');
        void boardWrapEl.offsetWidth;
        boardWrapEl.classList.add('charge-shake');
      }

      setTimeout(() => {
        throwWrapEl.remove();
        startPlagueCloud();
      }, IMPACT);
    }
  }
  requestAnimationFrame(throwDraw);

  // ── Phase 2: the miasma cloud (unchanged from before) ──
  function startPlagueCloud() {
    // Scale the miasma to the actual 1-square, 2x2, or 3x3 footprint.
    const footprintWidth = maxCol - minCol + 1;
    const footprintHeight = maxRow - minRow + 1;
    const maxR = Math.max(cellW * footprintWidth, cellH * footprintHeight) * 0.58;

    const canvas = createManuscriptFxCanvas('mad-cow');
    canvas.width  = boardRect.width;
    canvas.height = boardRect.height;
    canvas.style.cssText = 'pointer-events:none;z-index:60;';
    attachBoardOverlayCanvas(canvas, boardRect);
    const ctx = canvas.getContext('2d');

    // Pre-bake swirling plague particles so they don't jitter each frame
    const particles = Array.from({ length: 58 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist  = (0.25 + Math.random() * 0.75) * maxR;
      return {
        sx: cx + Math.cos(angle) * dist * 0.2,  // start close to center
        sy: cy + Math.sin(angle) * dist * 0.2,
        tx: cx + Math.cos(angle) * dist,          // drift outward as fog expands
        ty: cy + Math.sin(angle) * dist,
        r:  2.5 + Math.random() * 6,
        hue: 75 + Math.random() * 45,             // sickly yellow-green
      };
    });

    const EXPAND = 440;
    const HOLD   = 210;
    const FADE   = 390;
    const TOTAL  = EXPAND + HOLD + FADE;

    let startTs   = null;
    let absorbed  = false; // pieces fly into the fog once, then we leave them

    function draw(ts) {
      if (!startTs) startTs = ts;
      const e = ts - startTs;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let radius, alpha;
      if (e < EXPAND) {
        const t = e / EXPAND;
        radius = maxR * (1 - Math.pow(1 - t, 2.5)); // fast-then-decelerate
        alpha  = Math.min(1, t * 2.8);
      } else if (e < EXPAND + HOLD) {
        radius = maxR; alpha = 1;
      } else {
        radius = maxR;
        alpha  = Math.max(0, 1 - (e - EXPAND - HOLD) / FADE);
      }

      // ── Outer bilious haze ──
      const outerG = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      outerG.addColorStop(0,    `rgba(35,75,5,${alpha * 0.80})`);
      outerG.addColorStop(0.45, `rgba(55,95,8,${alpha * 0.62})`);
      outerG.addColorStop(0.78, `rgba(80,120,15,${alpha * 0.30})`);
      outerG.addColorStop(1,    `rgba(100,140,25,0)`);
      ctx.save();
      ctx.fillStyle = outerG;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle=`rgba(39,35,18,${alpha*.78})`;ctx.lineWidth=Math.max(3,radius*.035);ctx.stroke();
      ctx.strokeStyle=`rgba(212,180,54,${alpha*.72})`;ctx.lineWidth=Math.max(1.5,radius*.014);ctx.stroke();
      ctx.restore();

      // ── Dark infection core ──
      const coreR  = radius * 0.32;
      const coreG  = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreG.addColorStop(0,   `rgba(5,20,0,${alpha * 0.90})`);
      coreG.addColorStop(0.6, `rgba(15,40,3,${alpha * 0.65})`);
      coreG.addColorStop(1,   `rgba(35,65,8,0)`);
      ctx.save();
      ctx.fillStyle = coreG;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Locust-swarm-style fog wisps inside the cloud ──
      const pt = Math.min(1, e / EXPAND);
      ctx.save();
      particles.forEach(p => {
        const px = p.sx + (p.tx - p.sx) * pt;
        const py = p.sy + (p.ty - p.sy) * pt;
        const d  = Math.hypot(px - cx, py - cy);
        if (d > radius * 0.96) return;
        ctx.globalAlpha = alpha * 0.52 * (1 - d / (radius * 1.1));
        ctx.fillStyle   = p.hue > 90 ? '#a9a33b' : '#716e2c';
        ctx.strokeStyle = '#272315';ctx.lineWidth=Math.max(1,p.r*.35);
        ctx.beginPath();
        ctx.arc(px, py, p.r * Math.max(0.4, alpha), 0, Math.PI * 2);
        ctx.fill();ctx.stroke();
      });
      ctx.restore();

      // ── Absorb enemy pieces once fog has grown large enough to reach them ──
      if (!absorbed && radius > maxR * 0.48) {
        absorbed = true;
        const cells = boardEl.querySelectorAll('.cell');
        captured.forEach(cap => {
          const cell    = cells[cap.row * bsC + cap.col];
          const pieceEl = cell?.querySelector('.piece');
          if (!pieceEl) return;
          pieceEl.style.transition = 'none';
          pieceEl.style.zIndex     = '20';
          void pieceEl.offsetWidth;
          // Spiral toward the plague centre and vanish
          const dx   = cx - (cap.col + 0.5) * cellW;
          const dy   = cy - (cap.row + 0.5) * cellH;
          const spin = (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 160);
          pieceEl.style.transition = 'transform 0.52s cubic-bezier(0.5,0,1,0.75), opacity 0.44s ease-in';
          pieceEl.style.transform  = `translate(${dx * 0.65}px,${dy * 0.65}px) rotate(${spin}deg) scale(0.08)`;
          pieceEl.style.opacity    = '0';
        });
      }

      if (e < TOTAL) {
        requestAnimationFrame(draw);
      } else {
        canvas.remove();
        onComplete();
      }
    }

    requestAnimationFrame(draw);
  }
}

// ── TIDAL WAVE ANIMATION ──
// Two walls of water slam in simultaneously — one from the top edge, one
// from the bottom. They crash through the affected rows, pulverise whatever
// is there, and recede. The board shakes on impact; pieces in the flood
// zones are blasted inward toward the centre as the water engulfs them.
function animateTidalWave(affected, bsR, bsC, profile, onComplete) {
  const boardEl   = document.getElementById('board');
  const boardWrap = document.querySelector('.board-wrap');
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width  / bsC;
  const cellH = boardRect.height / bsR;

  // Board shake on impact
  boardWrap.classList.remove('tidal-shake');
  void boardWrap.offsetWidth;
  boardWrap.classList.add('tidal-shake');
  setTimeout(() => boardWrap.classList.remove('tidal-shake'), 760);

  const canvas = createManuscriptFxCanvas('tidal');
  canvas.width  = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = 'pointer-events:none;z-index:60;';
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  // The profile determines which edge waves appear and how many rows they cover.
  const topFloodH = profile.topRows * cellH;
  const botFloodH = profile.bottomRows * cellH;

  // Pre-bake a handful of large foam blobs for each wave crest
  function makeFoam(count) {
    return Array.from({ length: count }, () => ({
      x:   Math.random() * boardRect.width,
      r:   5 + Math.random() * 12,
      spd: 0.6 + Math.random() * 0.8,
    }));
  }
  const topFoam = makeFoam(18);
  const botFoam = makeFoam(18);

  function makeSpray(count) {
    return Array.from({ length: count }, (_, i) => ({
      x: (i + .35 + Math.random() * .3) * boardRect.width / count,
      phase: Math.random() * Math.PI * 2,
      lift: 7 + Math.random() * 22,
      r: 1.5 + Math.random() * 4.5,
      speed: .75 + Math.random() * 1.4,
    }));
  }
  const topSpray = makeSpray(30);
  const botSpray = makeSpray(30);

  function drawRollingCrest(y, direction, time, alpha, spray) {
    ctx.save();
    // Three irregular, inked ribbons replace the former ruler-straight edge.
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      for (let s = 0; s <= 28; s++) {
        const x = s * canvas.width / 28;
        const ripple = Math.sin(s * .82 + time * (.009 + layer * .0017) + layer * 1.8) * (7 + layer * 3);
        const cy = y + direction * (ripple + layer * 6);
        if (!s) ctx.moveTo(x, cy); else ctx.lineTo(x, cy);
      }
      ctx.strokeStyle = `rgba(24,45,67,${alpha * (.7 - layer * .13)})`;
      ctx.lineWidth = 8 - layer;
      ctx.stroke();
      ctx.strokeStyle = layer === 0
        ? `rgba(245,255,235,${alpha * .94})`
        : `rgba(${95 + layer * 35},${200 + layer * 15},235,${alpha * (.82 - layer * .12)})`;
      ctx.lineWidth = 4.5 - layer * .7;
      ctx.stroke();
    }
    spray.forEach((drop, i) => {
      const flutter = Math.sin(drop.phase + time * .012 * drop.speed);
      const sy = y + direction * (8 + drop.lift * (.35 + .65 * Math.abs(flutter)));
      const sx = drop.x + Math.cos(drop.phase + time * .006) * 7;
      ctx.fillStyle = i % 3 === 0
        ? `rgba(111,218,232,${alpha * .86})`
        : `rgba(249,255,239,${alpha * .9})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy, drop.r * .65, drop.r * 1.35, flutter * .35, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  const CRASH = 380;   // a larger, readable wall of water slams in
  const HOLD  = 220;
  const FADE  = 520;
  const TOTAL = CRASH + HOLD + FADE;

  let startTs      = null;
  let piecesBlasted = false;

  function draw(ts) {
    if (!startTs) startTs = ts;
    const e  = ts - startTs;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Progress [0→1]: accelerates then holds
    let progress, alpha;
    if (e < CRASH) {
      progress = Math.pow(e / CRASH, 0.6); // fast start, slows at end
      alpha    = 1;
    } else if (e < CRASH + HOLD) {
      progress = 1; alpha = 1;
    } else {
      progress = 1;
      alpha = Math.max(0, 1 - (e - CRASH - HOLD) / FADE);
    }

    const topNow = topFloodH    * progress;   // how far the top wave has descended
    const botNow = botFloodH    * progress;   // how far the bottom wave has risen

    // ── Top flood (dark deep-ocean fills from the top edge downward) ──
    if (profile.topRows > 0 && topNow > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, topNow);
      g.addColorStop(0,   `rgba(5, 25, 100, ${alpha * 0.97})`);
      g.addColorStop(0.5, `rgba(12, 55, 160, ${alpha * 0.88})`);
      g.addColorStop(1,   `rgba(30, 90, 210, ${alpha * 0.65})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, topNow);
      // Crest line
      ctx.save();
      ctx.globalAlpha = alpha * 0.95;
      ctx.fillStyle = 'rgba(180, 225, 255, 0.92)';
      ctx.fillRect(0, topNow - 6, canvas.width, 6);
      // Foam blobs at the crest
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      const ft = e / CRASH;
      topFoam.forEach((f, i) => {
        const fy = topNow - 4 + Math.sin(ft * Math.PI * 2 * f.spd + i * 0.9) * 8;
        ctx.beginPath();
        ctx.arc(f.x, fy, f.r * Math.min(1, alpha), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      drawRollingCrest(topNow, 1, e, alpha, topSpray);
    }

    // ── Bottom flood (fills from the bottom edge upward) ──
    const botY = boardRect.height - botNow;
    if (profile.bottomRows > 0 && botNow > 0) {
      const g = ctx.createLinearGradient(0, boardRect.height, 0, botY);
      g.addColorStop(0,   `rgba(5, 25, 100, ${alpha * 0.97})`);
      g.addColorStop(0.5, `rgba(12, 55, 160, ${alpha * 0.88})`);
      g.addColorStop(1,   `rgba(30, 90, 210, ${alpha * 0.65})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, botY, canvas.width, botNow);
      // Crest line
      ctx.save();
      ctx.globalAlpha = alpha * 0.95;
      ctx.fillStyle = 'rgba(180, 225, 255, 0.92)';
      ctx.fillRect(0, botY, canvas.width, 6);
      // Foam blobs at the crest
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      const bt = e / CRASH;
      botFoam.forEach((f, i) => {
        const fy = botY + 4 + Math.sin(bt * Math.PI * 2 * f.spd + i * 1.1) * 8;
        ctx.beginPath();
        ctx.arc(f.x, fy, f.r * Math.min(1, alpha), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      drawRollingCrest(botY, -1, e, alpha, botSpray);
    }

    // ── Impact flash when waves are nearly full ──
    if (progress > 0.85 && e < CRASH + HOLD) {
      const fl = ((progress - 0.85) / 0.15) * alpha * 0.38;
      ctx.save();
      ctx.globalAlpha = fl;
      ctx.fillStyle = 'rgba(140,210,255,1)';
      if (profile.topRows > 0) ctx.fillRect(0, 0, canvas.width, topNow + 10);
      if (profile.bottomRows > 0) ctx.fillRect(0, botY - 10, canvas.width, botNow + 10);
      ctx.restore();
    }

    // ── Blast pieces outward once water is 45% in ──
    if (!piecesBlasted && progress > 0.45) {
      piecesBlasted = true;
      const cells = boardEl.querySelectorAll('.cell');
      const boardCentreY = boardRect.height / 2;
      affected.forEach(p => {
        const cell    = cells[p.r * bsC + p.c];
        const pieceEl = cell?.querySelector('.piece');
        if (!pieceEl) return;
        pieceEl.style.transition = 'none';
        void pieceEl.offsetWidth;
        // Pieces in top rows blast downward toward centre;
        // pieces in bottom rows blast upward toward centre.
        const pieceCentreY = (p.r + 0.5) * cellH;
        const dir = pieceCentreY < boardCentreY ? 1 : -1; // toward centre
        const fy  = dir * cellH * (2.5 + Math.random());
        const fx  = (Math.random() - 0.5) * cellW * 2.5;
        const spin = (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 200);
        pieceEl.style.transition = 'transform 0.38s cubic-bezier(0.3,0,1,0.65), opacity 0.32s ease-in';
        pieceEl.style.transform  = `translate(${fx}px,${fy}px) rotate(${spin}deg) scale(0.1)`;
        pieceEl.style.opacity    = '0';
      });
    }

    if (e < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

// ── THOR'S HAMMER ANIMATION ──
// One canvas, bolts drawn one at a time in sequence. Each bolt grows from
// the previous strike point to the next target: outer blue glow, bright
// white core, jagged branching off-shoots. A flash erupts on each impact
// point as the bolt arrives. Enemy pieces strobe white then collapse.
function animateThorsHammer(chain, bsR, bsC, onComplete) {
  const boardEl   = document.getElementById('board');
  const boardRect = boardEl.getBoundingClientRect();
  const cellW = boardRect.width  / bsC;
  const cellH = boardRect.height / bsR;

  const canvas = createManuscriptFxCanvas('thor');
  canvas.width  = boardRect.width;
  canvas.height = boardRect.height;
  canvas.style.cssText = 'pointer-events:none;z-index:60;';
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');

  function centre(t) {
    return { x: (t.col + 0.5) * cellW, y: (t.row + 0.5) * cellH };
  }

  // Build a jagged polyline from (x1,y1) to (x2,y2)
  function jagged(x1, y1, x2, y2, segs, jitter) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len, ny = dx / len;
    const pts = [{ x: x1, y: y1 }];
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      pts.push({
        x: x1 + dx * t + nx * (Math.random() - 0.5) * len * jitter,
        y: y1 + dy * t + ny * (Math.random() - 0.5) * len * jitter,
      });
    }
    pts.push({ x: x2, y: y2 });
    return pts;
  }

  // Pre-bake bolt geometry for each link in the chain
  const bolts = chain.slice(1).map((to, i) => {
    const f = centre(chain[i]), t = centre(to);
    return {
      main: jagged(f.x, f.y, t.x, t.y, 12, 0.32),
      branches: [
        jagged(f.x, f.y, t.x + (Math.random() - 0.5) * cellW * 1.8, t.y + (Math.random() - 0.5) * cellH * 1.8, 6, 0.45),
        jagged(f.x + (Math.random() - 0.5) * cellW * 0.8, f.y + (Math.random() - 0.5) * cellH * 0.8, t.x, t.y, 5, 0.45),
      ],
    };
  });

  // Flash a piece element bright white then collapse it
  function flashAndCollapse(chainIdx) {
    const cells = boardEl.querySelectorAll('.cell');
    const t = chain[chainIdx];
    const pieceEl = cells[t.row * bsC + t.col]?.querySelector('.piece');
    if (!pieceEl) return;
    pieceEl.style.transition = 'none';
    void pieceEl.offsetWidth;
    pieceEl.style.transition = 'filter 0.07s, transform 0.07s';
    pieceEl.style.filter    = 'brightness(8) saturate(0)';
    pieceEl.style.transform = 'scale(1.35)';
    setTimeout(() => {
      if (!pieceEl.parentNode) return;
      pieceEl.style.transition = 'filter 0.22s ease-in, transform 0.25s ease-in, opacity 0.28s ease-in';
      pieceEl.style.filter    = 'brightness(0)';
      pieceEl.style.transform = 'scale(0.4)';
      pieceEl.style.opacity   = '0';
    }, 90);
  }

  const INITIAL_FLASH = 90;   // flash on first target before any bolt
  const BOLT_DRAW  = 200;
  const BOLT_HOLD  = 110;
  const BOLT_FADE  = 170;
  const INTER_GAP  = 70;
  const PER_BOUNCE = BOLT_DRAW + BOLT_HOLD + BOLT_FADE + INTER_GAP;
  const TOTAL = INITIAL_FLASH + bolts.length * PER_BOUNCE + 220;

  // Schedule piece flashes
  flashAndCollapse(0);
  for (let i = 1; i < chain.length; i++) {
    setTimeout(() => flashAndCollapse(i),
      INITIAL_FLASH + (i - 1) * PER_BOUNCE + Math.floor(BOLT_DRAW * 0.72));
  }

  let startTs = null;

  function draw(ts) {
    if (!startTs) startTs = ts;
    const e = ts - startTs;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Initial radial flash on the first target
    if (e < INITIAL_FLASH * 2.5) {
      const c0 = centre(chain[0]);
      const fl = Math.max(0, 1 - e / (INITIAL_FLASH * 2.5));
      ctx.save();
      ctx.globalAlpha = fl * 0.85;
      const g = ctx.createRadialGradient(c0.x, c0.y, 0, c0.x, c0.y, cellW * 1.6);
      g.addColorStop(0,   'rgba(220,235,255,1)');
      g.addColorStop(0.35,'rgba(120,170,255,0.75)');
      g.addColorStop(1,   'rgba(60,110,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c0.x, c0.y, cellW * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw bolts one at a time
    bolts.forEach((bolt, bi) => {
      const bStart = INITIAL_FLASH + bi * PER_BOUNCE;
      const be = e - bStart;
      if (be < 0) return;

      let progress, alpha;
      if (be < BOLT_DRAW) {
        progress = be / BOLT_DRAW;
        alpha    = 1;
      } else if (be < BOLT_DRAW + BOLT_HOLD) {
        progress = 1; alpha = 1;
      } else if (be < BOLT_DRAW + BOLT_HOLD + BOLT_FADE) {
        progress = 1;
        alpha = Math.max(0, 1 - (be - BOLT_DRAW - BOLT_HOLD) / BOLT_FADE);
      } else { return; }

      const vis = bolt.main.slice(0, Math.max(2, Math.ceil(bolt.main.length * progress)));

      // Impact flash at the landing target
      if (progress > 0.8) {
        const land = bolt.main[bolt.main.length - 1];
        const fl2  = ((progress - 0.8) / 0.2) * alpha;
        ctx.save();
        ctx.globalAlpha = fl2 * 0.75;
        const g2 = ctx.createRadialGradient(land.x, land.y, 0, land.x, land.y, cellW * 1.3);
        g2.addColorStop(0, 'rgba(210,230,255,1)');
        g2.addColorStop(1, 'rgba(60,110,255,0)');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(land.x, land.y, cellW * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Heavy ink contour, blue paint, and a gold-white core make the chain
      // read like an illuminated marginal lightning bolt rather than neon.
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(35,25,18,1)';
      ctx.lineWidth   = 13;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.beginPath();
      vis.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(67,148,203,.98)';ctx.lineWidth=7;ctx.stroke();
      ctx.strokeStyle = 'rgba(247,214,91,.98)';
      ctx.lineWidth   = 2.8;
      ctx.beginPath();
      vis.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.restore();

      // Off-shoot branches appear mid-draw
      if (progress > 0.35) {
        const bp = Math.min(1, (progress - 0.35) / 0.65);
        bolt.branches.forEach(br => {
          const visBr = br.slice(0, Math.max(2, Math.ceil(br.length * bp)));
          ctx.save();
          ctx.globalAlpha = alpha * 0.38;
          ctx.strokeStyle = 'rgba(130,190,255,0.85)';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          visBr.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          ctx.stroke();
          ctx.restore();
        });
      }
    });

    if (e < TOTAL) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
      onComplete();
    }
  }

  requestAnimationFrame(draw);
}

// BLACK HOLE ------------------------------------------------------------
// The visible and lethal area is always three rows by three columns, centered
// as closely as possible on both odd and even board dimensions.
function getBlackHoleBounds() {
  const rows = getBoardRows();
  const cols = getBoardCols();
  const height = Math.min(3, rows);
  const width = Math.min(3, cols);
  const startRow = Math.max(0, Math.floor((rows - height) / 2));
  const startCol = Math.max(0, Math.floor((cols - width) / 2));
  return {
    startRow, startCol,
    endRow: startRow + height - 1,
    endCol: startCol + width - 1,
    centerRow: startRow + Math.floor(height / 2),
    centerCol: startCol + Math.floor(width / 2),
  };
}

function isBlackHoleCell(row, col) {
  // The void is not a crater or path obstacle. Movement cards may cross it
  // freely; only the gravitational pulse consumes units pulled into it.
  if (!state?.blackHoleActive) return false;
  const b = getBlackHoleBounds();
  return row >= b.startRow && row <= b.endRow && col >= b.startCol && col <= b.endCol;
}

function getBlackHolePullPlan() {
  if (!state?.blackHoleActive) return [];
  const bounds = getBlackHoleBounds();
  const rows = getBoardRows(), cols = getBoardCols();
  const shape = new Set(getBoardShape().map(({ r, c }) => r + ',' + c));
  const pieces = [];
  const occupied = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const piece = state.board[r][c].piece;
      if (!piece) continue;
      const entry = { from: { row: r, col: c }, piece };
      pieces.push(entry);
      occupied.set(r + ',' + c, entry);
    }
  }

  const consumed = [];
  const candidates = [];
  pieces.forEach(entry => {
    const { row, col } = entry.from;
    if (isBlackHoleCell(row, col)) {
      consumed.push({ ...entry, to: { row: bounds.centerRow, col: bounds.centerCol }, consumed: true });
      return;
    }
    const nr = row + Math.sign(bounds.centerRow - row);
    const nc = col + Math.sign(bounds.centerCol - col);
    if (isBlackHoleCell(nr, nc)) {
      consumed.push({ ...entry, to: { row: bounds.centerRow, col: bounds.centerCol }, consumed: true });
      return;
    }
    if (!shape.has(nr + ',' + nc) || state.board[nr][nc].hazard === 'crater') return;
    candidates.push({ ...entry, to: { row: nr, col: nc }, consumed: false });
  });

  // Pulls are simultaneous. A contested destination blocks every arrival;
  // an occupied destination works only when its occupant is also moving away
  // or being consumed during this same pulse.
  const destinationCounts = new Map();
  candidates.forEach(entry => {
    const key = entry.to.row + ',' + entry.to.col;
    destinationCounts.set(key, (destinationCounts.get(key) || 0) + 1);
  });
  const consumedIds = new Set(consumed.map(entry => entry.piece.id));
  const successful = new Map(candidates
    .filter(entry => destinationCounts.get(entry.to.row + ',' + entry.to.col) === 1)
    .map(entry => [entry.piece.id, entry]));

  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, entry] of [...successful]) {
      const blocker = occupied.get(entry.to.row + ',' + entry.to.col);
      if (blocker && !consumedIds.has(blocker.piece.id) && !successful.has(blocker.piece.id)) {
        successful.delete(id);
        changed = true;
      }
    }
  }
  return [...consumed, ...successful.values()];
}

function applyBlackHolePull(plan) {
  plan.filter(entry => entry.consumed && entry.piece?.type === 'yours').forEach(entry => {
    recordLazarusFriendlyDeath(entry.piece, entry.to.row, entry.to.col);
  });
  plan.forEach(entry => { state.board[entry.from.row][entry.from.col].piece = null; });
  plan.forEach(entry => {
    if (entry.consumed) return;
    const destination = state.board[entry.to.row][entry.to.col];
    destination.piece = entry.piece;
    const diesToTerrain = entry.piece.type === 'enemy'
      ? destination.hazard === 'fire' || destination.hazard === 'poison'
      : isDeadlyHazardForFriendly(destination, state.mode);
    if (diesToTerrain) {
      recordLazarusFriendlyDeath(entry.piece, entry.to.row, entry.to.col);
      destination.piece = null;
    }
  });
}

function animateBlackHolePull(plan, onComplete) {
  const boardEl = document.getElementById('board');
  if (!boardEl || !plan.length) { setTimeout(onComplete, 180); return; }
  const cols = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const bounds = getBlackHoleBounds();
  // Read every required cell rectangle before changing a single piece style.
  // The old read/write/read/write loop forced a synchronous layout for nearly
  // every unit pulled by Black Hole, which became severe at levels 50+.
  const cellCenters = new Map();
  const cachedCellCenter = (row, col) => {
    const key = row + ',' + col;
    if (!cellCenters.has(key)) cellCenters.set(key, getCellCenter(boardEl, boardRect, cols, row, col));
    return cellCenters.get(key);
  };
  const core = cachedCellCenter(bounds.centerRow, bounds.centerCol);
  plan.forEach(entry => {
    cachedCellCenter(entry.from.row, entry.from.col);
    if (!entry.consumed) cachedCellCenter(entry.to.row, entry.to.col);
  });
  const canvas = createManuscriptFxCanvas('black-hole');
  canvas.width = Math.max(1, Math.round(boardRect.width));
  canvas.height = Math.max(1, Math.round(boardRect.height));
  canvas.style.cssText = 'position:absolute;pointer-events:none;z-index:68;';
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');
  const duration = 760;
  let start = null;

  boardEl.classList.add('black-hole-pulsing');
  const animatedPieces = [];
  plan.forEach(entry => {
    const fromIndex = entry.from.row * cols + entry.from.col;
    const pieceEl = boardEl.children[fromIndex]?.querySelector('.piece');
    if (!pieceEl) return;
    const from = cachedCellCenter(entry.from.row, entry.from.col);
    const target = entry.consumed
      ? core
      : cachedCellCenter(entry.to.row, entry.to.col);
    animatedPieces.push({ pieceEl, dx: target.x - from.x, dy: target.y - from.y, consumed: entry.consumed });
  });
  // Batch all writes after all geometry reads so the browser can composite the
  // full pull without repeated layout recalculation.
  animatedPieces.forEach(({ pieceEl }) => {
    pieceEl.style.willChange = 'transform, opacity';
    pieceEl.style.transition = 'transform 720ms cubic-bezier(.55,.02,.74,.35), opacity 720ms ease';
    pieceEl.style.transformOrigin = 'center';
  });
  requestAnimationFrame(() => animatedPieces.forEach(item => {
    item.pieceEl.style.transform = `translate(${item.dx}px, ${item.dy}px) rotate(${item.consumed ? 210 : 18}deg) scale(${item.consumed ? 0.02 : 0.82})`;
    item.pieceEl.style.opacity = item.consumed ? '0' : '0.72';
  }));

  function draw(timestamp) {
    if (!start) start = timestamp;
    const t = Math.min(1, (timestamp - start) / duration);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pulse = 0.7 + Math.sin(t * Math.PI * 8) * 0.12;
    for (let ring = 0; ring < 6; ring++) {
      const radius = core.w * (0.48 + ring * 0.38) * (1 - t * 0.42);
      ctx.beginPath();
      ctx.ellipse(core.x, core.y, radius * 1.25, radius * 0.72, t * 2.6 + ring * 0.42, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(116,86,235,${Math.max(0, (0.34 - ring * 0.035) * pulse)})`;
      ctx.lineWidth = Math.max(1, core.w * 0.025);
      ctx.stroke();
    }
    for (let i = 0; i < 34; i++) {
      const angle = i * 2.399 + t * 7;
      const radius = core.w * (0.4 + ((i * 17) % 23) / 8) * (1 - t * 0.72);
      ctx.beginPath();
      ctx.arc(core.x + Math.cos(angle) * radius, core.y + Math.sin(angle) * radius * 0.65, Math.max(1, core.w * 0.018), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(174,151,255,${0.18 + 0.55 * t})`;
      ctx.fill();
    }
    if (t < 1) requestAnimationFrame(draw);
    else {
      canvas.remove();
      boardEl.classList.remove('black-hole-pulsing');
      onComplete();
    }
  }
  requestAnimationFrame(draw);
}

function performBlackHolePulse(onComplete) {
  if (!state.blackHoleActive || state.gameOver) { if (onComplete) onComplete(); return; }
  blackHoleAnimationRunning = true;
  const plan = state.pendingEpicEffect?.type === 'black_hole_turn'
    ? state.pendingEpicEffect.plan || []
    : getBlackHolePullPlan();
  animateBlackHolePull(plan, () => {
    applyBlackHolePull(plan);
    blackHoleAnimationRunning = false;
    render();
    if (countPieces('enemy') === 0) { triggerWin(); return; }
    if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
    if (onComplete) onComplete();
  });
}




function playSandsOfTimeSound() {
  try {
    const sfx = getCachedSfx(SANDS_OF_TIME_SOUND_URL);
    sfx.volume = SFX_VOLUME;
    sfx.play().catch(() => {});
  } catch (err) {
    // The timeline reversal must continue even if audio is unavailable.
  }
}

// ── SANDS OF TIME: THREE-TURN BOARD HISTORY ──
// History is deliberately kept outside `state`, so frequent board snapshots
// never bloat localStorage saves. Closing/reloading safely starts a fresh
// three-turn recording window for the current level.
const SANDS_REVERSAL_DURATION_MS = 4800;
const SANDS_BOARD_STATE_FIELDS = [
  'blackHoleActive',
  'phalanxTurnsLeft',
  'phalanxRows',
  'scorchedEarthTurns',
  'scorchedEarthUnitIds',
  'scorchedEarthAllUnits',
  'scorchedEarthSquares',
  'poisonSquares',
  'lazarusGraveyard',
  'lazarusFriendlySnapshot',
  'lastEnemyCount',
  'lastYoursCount',
  'enemyStuckTurns',
  'noCaptureStreak',
  'noCaptureSnapEnemy',
  'noCaptureSnapYours',
];

let sandsTurnSerial = 0;
let sandsTurnStarts = [];
let sandsFrames = [];
let sandsRecordingSuspended = false;
let sandsReversing = false;
let sandsLastQuickSignature = '';

function cloneSandsValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function getSandsQuickSignature() {
  if (!state || !Array.isArray(state.board)) return '';
  return JSON.stringify([
    state.board,
    ...SANDS_BOARD_STATE_FIELDS.map(field => state[field]),
  ]);
}

function captureSandsBoardState() {
  if (!state || !Array.isArray(state.board)) return null;
  const snapshot = { board: cloneSandsValue(state.board) };
  SANDS_BOARD_STATE_FIELDS.forEach(field => {
    snapshot[field] = cloneSandsValue(state[field]);
  });
  return snapshot;
}

function sandsSnapshotSignature(snapshot) {
  return snapshot ? JSON.stringify(snapshot) : '';
}

function applySandsBoardState(snapshot) {
  if (!state || !snapshot) return;
  state.board = cloneSandsValue(snapshot.board);
  SANDS_BOARD_STATE_FIELDS.forEach(field => {
    state[field] = cloneSandsValue(snapshot[field]);
  });
  state.selected = null;
  state.validMoves = [];
  state.activeCard = null;
  state.activeCardUid = null;
  state.activeCardMasteryId = null;
  state.activeCardMasteryLevel = null;
}

function initializeSandsHistory() {
  sandsTurnSerial = 0;
  sandsTurnStarts = [];
  sandsFrames = [];
  sandsRecordingSuspended = false;
  sandsReversing = false;
  sandsLastQuickSignature = getSandsQuickSignature();
  const snapshot = captureSandsBoardState();
  if (!snapshot || state.mode !== 'plus') return;
  const signature = sandsSnapshotSignature(snapshot);
  sandsTurnStarts.push({ serial: 0, snapshot: cloneSandsValue(snapshot) });
  sandsFrames.push({ serial: 0, snapshot, signature });
}

function recordSandsFrame() {
  if (!state || state.mode !== 'plus' || sandsRecordingSuspended || sandsReversing || state.gameOver) return;
  if (!sandsTurnStarts.length) {
    initializeSandsHistory();
    return;
  }
  // Selection/highlight renders do not change reversible gameplay state.
  // Avoid cloning the full board and serializing it again for those clicks.
  const quickSignature = getSandsQuickSignature();
  if (quickSignature === sandsLastQuickSignature) return;
  sandsLastQuickSignature = quickSignature;
  const snapshot = captureSandsBoardState();
  const signature = sandsSnapshotSignature(snapshot);
  if (sandsFrames.length && sandsFrames[sandsFrames.length - 1].signature === signature) return;
  // Preserve several visible steps for the rewind animation without retaining
  // an unbounded full-board clone for every enemy on a packed board. Keep the
  // first seven frames plus the newest settled frame for each turn.
  const MAX_SANDS_FRAMES_PER_TURN = 8;
  const framesThisTurn = sandsFrames.filter(frame => frame.serial === sandsTurnSerial);
  if (framesThisTurn.length >= MAX_SANDS_FRAMES_PER_TURN) {
    const lastIndex = sandsFrames.map(frame => frame.serial).lastIndexOf(sandsTurnSerial);
    sandsFrames[lastIndex] = { serial: sandsTurnSerial, snapshot, signature };
  } else {
    sandsFrames.push({ serial: sandsTurnSerial, snapshot, signature });
  }
  const oldestNeeded = Math.max(0, sandsTurnSerial - 4);
  sandsFrames = sandsFrames.filter(frame => frame.serial >= oldestNeeded);
}

function beginSandsTurn() {
  if (!state || state.mode !== 'plus' || sandsRecordingSuspended || sandsReversing) return;
  if (!sandsTurnStarts.length) initializeSandsHistory();
  sandsTurnSerial++;
  const snapshot = captureSandsBoardState();
  if (!snapshot) return;
  sandsTurnStarts.push({ serial: sandsTurnSerial, snapshot: cloneSandsValue(snapshot) });
  sandsTurnStarts = sandsTurnStarts.filter(entry => entry.serial >= sandsTurnSerial - 4);
  const signature = sandsSnapshotSignature(snapshot);
  if (!sandsFrames.length || sandsFrames[sandsFrames.length - 1].signature !== signature) {
    sandsFrames.push({ serial: sandsTurnSerial, snapshot, signature });
  }
}

function canActivateSandsOfTime() {
  if (!state || state.mode !== 'plus' || sandsReversing) return false;
  const targetSerial = sandsTurnSerial - 3;
  return targetSerial >= 0 && sandsTurnStarts.some(entry => entry.serial === targetSerial);
}

function buildSandsReversalPlan() {
  recordSandsFrame();
  const targetSerial = sandsTurnSerial - 3;
  const targetEntry = sandsTurnStarts.find(entry => entry.serial === targetSerial);
  if (!targetEntry) return null;

  const chronological = [];
  const pushUnique = snapshot => {
    const signature = sandsSnapshotSignature(snapshot);
    if (!chronological.length || chronological[chronological.length - 1].signature !== signature) {
      chronological.push({ snapshot: cloneSandsValue(snapshot), signature });
    }
  };
  pushUnique(targetEntry.snapshot);
  sandsFrames
    .filter(frame => frame.serial >= targetSerial && frame.serial <= sandsTurnSerial)
    .forEach(frame => pushUnique(frame.snapshot));
  pushUnique(captureSandsBoardState());

  // The current state is already painted. Each step is therefore the prior
  // settled state, in reverse chronological order, ending at the target.
  return {
    target: cloneSandsValue(targetEntry.snapshot),
    steps: chronological.slice(0, -1).reverse().map(frame => frame.snapshot),
  };
}

function getSandsPieceVisuals() {
  const visuals = new Map();
  const board = document.getElementById('board');
  if (!board) return visuals;
  board.querySelectorAll('.piece[data-piece-id]').forEach(element => {
    visuals.set(String(element.dataset.pieceId), {
      element,
      rect: element.getBoundingClientRect(),
    });
  });
  return visuals;
}

function createSandsTimeWash() {
  const board = document.getElementById('board');
  if (!board) return null;
  const rect = board.getBoundingClientRect();
  const fxFrame = createCartoonFxFrame(rect, 'sands', 95);
  const wash = document.createElement('div');
  wash.className = 'sands-time-wash';
  wash.style.cssText = [
    'position:fixed',
    `left:${rect.left}px`,
    `top:${rect.top}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    'z-index:95',
    'pointer-events:none',
    'overflow:hidden',
    'border:2px solid rgba(255,220,105,.82)',
    'box-shadow:inset 0 0 55px rgba(255,203,73,.36),0 0 36px rgba(255,191,51,.38)',
    'background:radial-gradient(circle at 50% 50%,rgba(255,224,135,.13),rgba(104,58,5,.08) 55%,rgba(20,8,0,.28))',
  ].join(';');
  const hourglass = document.createElement('div');
  hourglass.textContent = '⌛';
  hourglass.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:min(28vw,28vh);color:#ffe294;opacity:.20;filter:drop-shadow(0 0 18px #ffbd32);animation:sandsHourglassReverse 1.15s linear infinite reverse;';
  wash.appendChild(hourglass);
  wash._cartoonFxFrame = fxFrame;
  document.body.appendChild(wash);
  return wash;
}

function animateSandsFrame(snapshot, durationMs) {
  const before = getSandsPieceVisuals();
  sandsRecordingSuspended = true;
  applySandsBoardState(snapshot);
  render();
  const after = getSandsPieceVisuals();
  const transitionMs = Math.max(12, Math.min(420, durationMs * 0.82));

  before.forEach((oldVisual, id) => {
    if (after.has(id)) return;
    const ghost = oldVisual.element.cloneNode(true);
    ghost.style.cssText += `;position:fixed;left:${oldVisual.rect.left}px;top:${oldVisual.rect.top}px;width:${oldVisual.rect.width}px;height:${oldVisual.rect.height}px;z-index:97;pointer-events:none;transition:opacity ${transitionMs}ms linear,transform ${transitionMs}ms ease-in;`;
    document.body.appendChild(ghost);
    requestAnimationFrame(() => {
      ghost.style.opacity = '0';
      ghost.style.transform = 'scale(.18) rotate(-35deg)';
    });
    setTimeout(() => ghost.remove(), transitionMs + 30);
  });

  after.forEach((newVisual, id) => {
    const oldVisual = before.get(id);
    const element = newVisual.element;
    element.style.transition = 'none';
    if (oldVisual) {
      const dx = oldVisual.rect.left - newVisual.rect.left;
      const dy = oldVisual.rect.top - newVisual.rect.top;
      element.style.transform = `translate(${dx}px,${dy}px)`;
    } else {
      element.style.opacity = '0';
      element.style.transform = 'scale(.18)';
      element.style.filter = 'brightness(3) drop-shadow(0 0 12px #ffe18a)';
    }
    element.getBoundingClientRect();
    requestAnimationFrame(() => {
      element.style.transition = `transform ${transitionMs}ms cubic-bezier(.25,.75,.35,1),opacity ${transitionMs}ms linear,filter ${transitionMs}ms linear`;
      element.style.transform = '';
      element.style.opacity = '';
      element.style.filter = '';
    });
  });
}

function animateSandsReversal(plan, onComplete) {
  const wash = createSandsTimeWash();
  const steps = plan.steps.length ? plan.steps : [plan.target];
  const stepDuration = SANDS_REVERSAL_DURATION_MS / steps.length;
  const startedAt = performance.now();
  let index = 0;

  function next() {
    if (index >= steps.length) {
      const remaining = Math.max(0, SANDS_REVERSAL_DURATION_MS - (performance.now() - startedAt));
      setTimeout(() => {
        if (wash) {
          if (wash._cartoonFxFrame) wash._cartoonFxFrame.remove();
          wash.remove();
        }
        onComplete();
      }, remaining);
      return;
    }
    animateSandsFrame(steps[index], stepDuration);
    index++;
    const nextAt = startedAt + index * stepDuration;
    setTimeout(next, Math.max(0, nextAt - performance.now()));
  }
  next();
}

function activateSandsOfTimeCard() {
  const plan = buildSandsReversalPlan();
  if (!plan) {
    setMessage('SANDS OF TIME REQUIRES THREE COMPLETED TURNS');
    return;
  }
  playSandsOfTimeSound();
  const consumedUid = state.activeCardUid;
  markCardUsed('sands_of_time');
  state.cards = state.cards.filter(card => card.uid !== consumedUid);
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  sandsReversing = true;
  sandsRecordingSuspended = true;
  blackHoleAnimationRunning = true;
  state.pendingEpicEffect = { type: 'sands_of_time', target: cloneSandsValue(plan.target) };
  setMessage('TIME FLOWS BACKWARD...');
  saveGame();

  animateSandsReversal(plan, () => {
    state.pendingEpicEffect = null;
    applySandsBoardState(plan.target);
    state.turnPhase = 'player';
    state.plusMovedIds = [];
    state.plusTurnPieceCount = countPieces('yours');
    state.noCaptureSnapEnemy = countPieces('enemy');
    state.noCaptureSnapYours = countPieces('yours');
    state.lastCardPlayedId = 'sands_of_time';
    sandsReversing = false;
    sandsRecordingSuspended = false;
    blackHoleAnimationRunning = false;
    render();
    initializeSandsHistory();
    saveGame();
    setMessage('FATE HAS BEEN TURNED BACK');
    maybeEndPlayerTurn();
  });
}

function activateBlackHoleCard() {
  playBlackHoleSound();
  state.blackHoleAcquiredThisRun = true;
  state.blackHoleUsedThisLevel = true;
  markCardUsed('black_hole');
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  state.blackHoleActive = true;
  const activationPlan = getBlackHolePullPlan();
  state.pendingEpicEffect = { type: 'black_hole', plan: cloneSandsValue(activationPlan) };
  render();
  saveGame();
  setMessage('THE BLACK HOLE AWAKENS');
  performBlackHolePulse(() => {
    state.pendingEpicEffect = null;
    saveGame();
    setMessage('ALL UNITS WILL BE PULLED INWARD AFTER EVERY TURN');
    maybeEndPlayerTurn();
  });
}

// Close Ranks follows the actual playable outline rather than assuming a
// rectangular board. A cell is on the perimeter when at least one of its
// four orthogonal neighbors lies outside the current board shape. Each
// exposed side gets its own spear for the animation; each occupied border
// cell is still destroyed only once.
function getCloseRanksBorderData() {
  const shape = new Set(getBoardShape().map(({r, c}) => r + ',' + c));
  const directions = [
    { dr: -1, dc: 0, inwardDr: 1, inwardDc: 0 },
    { dr: 1, dc: 0, inwardDr: -1, inwardDc: 0 },
    { dr: 0, dc: -1, inwardDr: 0, inwardDc: 1 },
    { dr: 0, dc: 1, inwardDr: 0, inwardDc: -1 },
  ];
  const borderCells = [];
  const spearEntries = [];
  getBoardShape().forEach(({r, c}) => {
    const exposed = directions.filter(dir => !shape.has((r + dir.dr) + ',' + (c + dir.dc)));
    if (!exposed.length) return;
    borderCells.push({ row: r, col: c });
    exposed.forEach(dir => spearEntries.push({
      row: r, col: c, dr: dir.inwardDr, dc: dir.inwardDc,
    }));
  });
  const targets = borderCells.filter(({row, col}) => state.board[row]?.[col]?.piece);
  return { borderCells, spearEntries, targets };
}

function drawCloseRanksSpear(ctx, tipX, tipY, dx, dy, size, alpha) {
  const length = size * 0.92;
  const shaftX = tipX - dx * length;
  const shaftY = tipY - dy * length;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(255,214,104,.9)';
  ctx.shadowBlur = Math.max(2, size * .08);
  ctx.strokeStyle = '#8f5a20';
  ctx.lineWidth = Math.max(2, size * .075);
  ctx.beginPath();
  ctx.moveTo(shaftX, shaftY);
  ctx.lineTo(tipX - dx * size * .13, tipY - dy * size * .13);
  ctx.stroke();
  ctx.strokeStyle = '#e2b65a';
  ctx.lineWidth = Math.max(1, size * .022);
  ctx.stroke();

  const px = -dy, py = dx;
  const headLength = size * .31;
  const headWidth = size * .15;
  ctx.fillStyle = '#f4df9b';
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - dx * headLength + px * headWidth, tipY - dy * headLength + py * headWidth);
  ctx.lineTo(tipX - dx * headLength * .7, tipY - dy * headLength * .7);
  ctx.lineTo(tipX - dx * headLength - px * headWidth, tipY - dy * headLength - py * headWidth);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function animateCloseRanksStrike(data, onComplete) {
  const boardEl = document.getElementById('board');
  if (!boardEl) { setTimeout(onComplete, 150); return; }
  const cols = getBoardCols();
  const boardRect = boardEl.getBoundingClientRect();
  const canvas = createManuscriptFxCanvas('close-ranks');
  canvas.width = Math.max(1, Math.round(boardRect.width));
  canvas.height = Math.max(1, Math.round(boardRect.height));
  canvas.style.cssText = 'position:absolute;pointer-events:none;z-index:72;';
  attachBoardOverlayCanvas(canvas, boardRect);
  const ctx = canvas.getContext('2d');
  const spears = data.spearEntries.map(entry => ({
    ...entry,
    cell: getCellCenter(boardEl, boardRect, cols, entry.row, entry.col),
  }));
  const victimElements = data.targets.filter(target => {
    const piece = state.board[target.row]?.[target.col]?.piece;
    return !(piece?.type === 'yours' && (piece.shielded || piece.countering));
  }).map(target =>
    boardEl.children[target.row * cols + target.col]?.querySelector('.piece')
  ).filter(Boolean);
  const duration = 940;
  let start = null;
  let impactStarted = false;

  function draw(timestamp) {
    if (!start) start = timestamp;
    const t = Math.min(1, (timestamp - start) / duration);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const lunge = t < .18 ? 0 : t < .58
      ? 1 - Math.pow(1 - (t - .18) / .40, 3)
      : Math.max(0, 1 - (t - .58) / .42 * .34);
    const alpha = t < .78 ? 1 : Math.max(0, 1 - (t - .78) / .22);

    spears.forEach(entry => {
      const size = Math.min(entry.cell.w, entry.cell.h);
      const outsideX = entry.cell.x - entry.dc * size * .72;
      const outsideY = entry.cell.y - entry.dr * size * .72;
      const travel = size * 1.02 * lunge;
      drawCloseRanksSpear(
        ctx,
        outsideX + entry.dc * travel,
        outsideY + entry.dr * travel,
        entry.dc,
        entry.dr,
        size,
        alpha
      );
    });

    if (t >= .55 && !impactStarted) {
      impactStarted = true;
      victimElements.forEach(pieceEl => {
        pieceEl.style.transition = 'transform 250ms cubic-bezier(.4,0,.9,.5), opacity 250ms ease, filter 250ms ease';
        pieceEl.style.transform = 'scale(.08) rotate(20deg)';
        pieceEl.style.opacity = '0';
        pieceEl.style.filter = 'brightness(2.4) blur(3px)';
      });
    }
    if (t >= .52 && t <= .74) {
      const flash = 1 - Math.abs(t - .63) / .11;
      data.borderCells.forEach(cell => {
        const center = getCellCenter(boardEl, boardRect, cols, cell.row, cell.col);
        ctx.beginPath();
        ctx.arc(center.x, center.y, Math.max(2, center.w * (.1 + flash * .36)), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,225,145,' + Math.max(0, flash * .34) + ')';
        ctx.fill();
      });
    }

    if (t < 1) requestAnimationFrame(draw);
    else {
      canvas.remove();
      onComplete();
    }
  }
  requestAnimationFrame(draw);
}

function resolveCloseRanksTargets(targets) {
  targets.forEach(({ row, col }) => {
    const piece = state.board[row]?.[col]?.piece;
    if (!piece) return;
    if (piece.type === 'yours' && (piece.shielded || piece.countering)) {
      piece.shielded = false;
      piece.countering = false;
      return;
    }
    state.board[row][col].piece = null;
  });
}

function activateCloseRanksCard() {
  playCloseRanksSound();
  markCardUsed('close_ranks');
  state.activeCard = null;
  state.activeCardUid = null;
  state.selected = null;
  state.validMoves = [];
  render();
  const data = getCloseRanksBorderData();
  state.pendingEpicEffect = { type: 'close_ranks', targets: cloneSandsValue(data.targets) };
  saveGame();
  blackHoleAnimationRunning = true;
  setMessage('CLOSE RANKS!');
  animateCloseRanksStrike(data, () => {
    state.pendingEpicEffect = null;
    resolveCloseRanksTargets(data.targets);
    blackHoleAnimationRunning = false;
    render();
    // As with every simultaneous board wipe, losing every friendly unit takes
    // priority if both armies are eliminated by the same strike.
    if (countPieces('enemy') === 0) { triggerWin(); return; }
    if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
    setMessage('THE BORDER HAS BEEN CLEARED');
    maybeEndPlayerTurn();
  });
}

function buildCloseRanksArtHTML(className) {
  return '<div class="' + className + ' close-ranks-card-art">' +
    '<span class="cr-spear"></span>'.repeat(8) + '</div>';
}

// One shared source for the newly developed card artwork. Both the normal card
// renderer and enlarged carousel/collection view reference this map so the
// standalone builder embeds each large illustration only once.


















const NEW_CARD_ART_URL = Object.freeze({
  battering_ram: BATTERING_RAM_ART_URL,
  sanctuary: SANCTUARY_ART_URL,
  headsmans_bounty: HEADSMANS_BOUNTY_ART_URL,
  the_masons: THE_MASONS_ART_URL,
  false_king: FALSE_KING_ART_URL,
  war_drums: WAR_DRUMS_ART_URL,
  portcullis: PORTCULLIS_ART_URL,
  royal_standard: ROYAL_STANDARD_ART_URL,
  gallows: GALLOWS_ART_URL
});

// ── RENDER ──
function buildCardElement(group, opts) {
  const def = CARD_DEFS[group.id];
  const displayCard = group.cards?.find(card => !card.used) || group.cards?.[0];
  const masteryLevelOverride = null;
    // Upgrade orbs are a permanent part of every upgradable card face. Keep
    // this false so no caller can accidentally render a stock-only card.
    const hideMasteryOrbs = false;
    const isUncommon = def.rarity === 'uncommon';
    const isRare = def.rarity === 'rare';
    const isEpic = def.rarity === 'epic';
    const isWhite = def.rarity === 'white';
    const borderColor = isWhite ? '#e8e8e8' : isEpic ? '#f6d66b' : isRare ? '#1a3a6a' : isUncommon ? '#2d6a2d' : '#3d2e12';
    const activeBorder = isWhite ? '#ffffff' : isEpic ? '#fff0a8' : isRare ? '#1a3a6a' : isUncommon ? '#2d6a2d' : '#e8b84b';

    // Find first unused card in group to use
    const availableCard = group.cards.find(c => !c.used);
    const allUsed = !availableCard;
    const isActive = group.cards.some(c => state.activeCardUid === c.uid);

    // Count available vs total
    const totalCount = group.cards.length;
    const usedCount = group.cards.filter(c => c.used).length;
    const availCount = totalCount - usedCount;

    const el = document.createElement('div');
    const rarityFaceClass = isWhite ? 'white-card' : isEpic ? 'epic-card' : isRare ? 'rare' : isUncommon ? 'uncommon' : 'common';
    el.className = 'card ' + rarityFaceClass + (allUsed ? ' used' : '') + (isActive ? ' active' : '');
    el.style.background = isEpic
      ? 'radial-gradient(circle at 50% -15%, rgba(255,235,150,0.42), transparent 38%), linear-gradient(145deg, #8a650f 0%, #3b2504 45%, #110b02 100%)'
      : `linear-gradient(160deg, ${def.color}, #0d0b06)`;
    el.style.borderColor = isActive ? activeBorder : borderColor;
    if (isRare) el.style.boxShadow = `0 0 8px rgba(61,111,168,0.35)`;
    if (isEpic) el.style.boxShadow = `0 0 16px rgba(255,220,95,0.8), 0 0 30px rgba(190,125,10,0.42)`;
    if (isWhite) el.style.boxShadow = `0 0 10px rgba(255,255,255,0.4)`;
    if (isActive) el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.9), 0 0 0 2px ${activeBorder}`;

    // Stack badge if more than 1
    const stackBadge = availCount > 1
      ? `<div style="
          position:absolute;
          top:6px;right:6px;
          min-width:24px;height:24px;
          padding:0 5px;
          box-sizing:border-box;
          border-radius:50%;
          background:rgba(12,10,7,0.94);
          border:2px solid ${borderColor};
          font-family:var(--font-card-name);
          font-size:0.8rem;
          font-weight:700;
          color:#fff6d5;
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:30;
          line-height:1;
          box-shadow:0 2px 6px rgba(0,0,0,0.8);
          opacity:${allUsed ? 0.3 : 1};
          pointer-events:none;
        ">${availCount}</div>`
      : '';

    const iconColor = isWhite ? '#f0f0f0' : isEpic ? '#fff0a8' : isRare ? '#5f8fc0' : isUncommon ? '#5fa05f' : 'var(--gold-light)';
    const nameColor = isWhite ? '#f0f0f0' : isEpic ? '#f8dc76' : isRare ? '#ffffff' : isUncommon ? '#2d6a2d' : 'var(--gold)';
    // Rarity is color-coded (border/name color above) — no text label needed
    // for common/uncommon/rare anymore. White-rarity bonus cards (Plus One)
    // keep their "Bonus" tag since that's a distinct mechanic, not a rarity tier.
    const rarityLabel = '';
    // Cards usable only in New Run still show up as collectibles/rewards in
    // New Run Puzzle too — no badge needed, they just quietly don't do
    // anything if picked there (see the reward-commit logic in nextLevel()).
    const plusOnlyBadge = '';
    let cardInnerHTML;
    const newCardArt = NEW_CARD_ART_URL[group.id];
    if (newCardArt) {
      cardInnerHTML = `<div class="card-art"><img src="${newCardArt}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:.94;"/></div><div class="card-art-divider"></div><span class="card-name" style="color:${nameColor};">${def.name}</span><span class="card-desc">${def.desc}</span>${rarityLabel}${getMasteryOrbsHTML(group.id,state.mode,masteryLevelOverride,hideMasteryOrbs)}`;
    } else if (group.id === 'secret_passage') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${SECRET_PASSAGE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.92;"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${getMasteryOrbsHTML(group.id, state.mode, masteryLevelOverride, hideMasteryOrbs)}
      `;
    } else if (group.id === 'vertical_jump') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${INFANTRY_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'horizontal_jump') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${CAVALRY_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'king_me') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${KING_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'revert') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${DEMOTION_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'teleport') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${PHANTOM_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'double_jump') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${WARHORSE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 't_strike') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${BALLISTA_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'usurp') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${USURP_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'wrath') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${WRATH_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'catapult') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${CATAPULT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'assassinate') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${ASSASSINATE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'side_step') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${SIDE_STEP_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'plus_one') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${PLUS_ONE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.65);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'reinforcements') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${REINFORCEMENTS_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.65);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'veteran') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${VETERAN_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.65);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'cross_strike') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${CROSS_STRIKE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'plague') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${PLAGUE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'blizzard') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${BLIZZARD_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'tornado') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${TORNADO_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'locust_swarm') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${LOCUST_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'jester') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${JESTER_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'meteor_strike') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${METEOR_STRIKE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'black_hole') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${BLACK_HOLE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'close_ranks') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${CLOSE_RANKS_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'lazarus') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${LAZARUS_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'sands_of_time') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${SANDS_OF_TIME_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'divine_intervention') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${DIVINE_INTERVENTION_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'wildfire') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${WILDFIRE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'chariot_charge') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${CHARIOT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'shield_wall') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${SHIELD_WALL_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'counter') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${COUNTER_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'once_more') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${ONCE_MORE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'bodyguard') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${BODYGUARD_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'retreat') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${RETREAT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'bear_trap') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${BEAR_TRAP_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'ambush') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${AMBUSH_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'conscript') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${CONSCRIPT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'coup_detat') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${COUP_DETAT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'siege') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${SIEGE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'feint') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${FEINT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'earthquake') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${EARTHQUAKE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'mad_cow') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${MADCOW_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'dead_mans_hand') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${DEAD_MANS_HAND_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'heros_gambit') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${HEROS_GAMBIT_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'phalanx') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${PHALANX_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'ace_up_the_sleeve') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${ACE_UP_THE_SLEEVE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'blood_oath') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${BLOOD_OATH_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'tidal_wave') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${TIDAL_WAVE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'trojan_horse') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${TROJAN_HORSE_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'war_tax') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${WAR_TAX_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'puppet_master') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${PUPPET_MASTER_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'scorched_earth') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${SCORCHED_EARTH_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'last_stand') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${LAST_STAND_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    } else if (group.id === 'thors_hammer') {
      cardInnerHTML = `
        <div class="card-art">
          <img src="${THORS_HAMMER_ART_URL}" style="width:100%;height:100%;top:0;left:0;object-fit:cover;opacity:0.75;filter:brightness(0.55);"/>
        </div>
        <div class="card-art-divider"></div>
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
  } else {
      const iconHTML = `<span class="card-icon" style="color:${iconColor};">${def.icon}</span>`;
      cardInnerHTML = `
        ${iconHTML}
        <span class="card-name" style="color:${nameColor};">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        ${rarityLabel}
        ${hideMasteryOrbs ? '' : getMasteryOrbsHTML(group.id, masteryLevelOverride)}`;
    }
    el.innerHTML = `
      ${stackBadge}
      ${plusOnlyBadge}
      <div class="card-inner">
        ${cardInnerHTML}
      </div>`;
    // One authoritative card face everywhere. The enlarged Collection view
    // is the canonical design; hand groups, reward choices, Collection cards,
    // Starter Deck cards, and the carousel all render this exact same markup.
    // Keep the live-copy badge outside that shared face so it remains visible
    // without creating a second visual variation of the card itself.
    el.innerHTML = `${stackBadge}${buildBigCardHTML(group.id)}`;
    el.dataset.availableCopies = String(availCount);
  // Card titles must never wrap to a second line (that's what stranded a
  // lone "S" under "REINFORCEMENT" for the Reinforcements card) — shrink the
  // name's font-size just enough to fit on one line instead. This has to
  // run after `el` is actually attached to the DOM by whichever caller is
  // about to append it (hand carousel, reward screen, Collection, Starter
  // Deck, enlarged preview, etc.) so its real box width is measurable, so
  // it's deferred one frame. Every buildCardElement() caller gets this for
  // free without needing its own fit call.
  return { el, allUsed };
}

// See the requestAnimationFrame call at the end of buildCardElement() above.
function fitCardNameToBox(nameEl) {
  if (!nameEl || !nameEl.isConnected) return; // never got attached — nothing to measure
  if (nameEl.clientWidth === 0) return; // hidden/zero-size box — nothing sensible to measure
  let guard = 0;
  while (nameEl.scrollWidth > nameEl.clientWidth + 0.5 && guard < 40) {
    const current = parseFloat(getComputedStyle(nameEl).fontSize);
    if (!current || current <= 6) break; // floor — never shrink past unreadable
    nameEl.style.fontSize = (current - 0.5) + 'px';
    guard++;
  }
}


// Logical positions from the previous paint let FLIP measure only pieces
// that actually changed squares. Selection/highlight clicks move nothing,
// so they no longer force layout reads for every piece on the board.
let lastRenderedPieceCells = {};
let lastRenderedPieceStates = {};
function render(options = {}) {
  // render() can be reached by UI refresh hooks while the page is still
  // booting. Never try to paint a half-created game state; doing so throws
  // before the board controls are wired and leaves the screen looking
  // permanently frozen.
  if (!state || !Array.isArray(state.board)) return;
  const fastEnemyFrame = options.fastEnemyFrame === true;
  // Compare stable piece IDs before rebuilding the board. A move keeps its
  // ID and merely updates the snapshot; an ID that vanished is a true death.
  trackLazarusFriendlyLosses();
  // Safety-net king promotion: ANY piece sitting on its opponent's back row —
  // yours on row 0, enemy on the far row — is always a king, full stop, no
  // matter how it got there (a normal move, a chain-capture landing, Usurp
  // flipping an enemy into a yours piece mid-row, a charge/catapult/etc.
  // landing spot, or any future card). This runs on every render so it can
  // never get missed by one card's move-handling path, and it also
  // self-heals any piece that's already stuck unkinged on that row right now.
  let statsChanged = false;
  if (state && state.board && state.board.length) {
    const bsK = state.board.length;
    const bsKc = bsK ? state.board[0].length : 0;
    // Bear Trap safety-net: ANY piece — friendly or enemy, however it got
    // there (a normal move, a capture landing, Usurp, Catapult, Chariot
    // Charge, the enemy AI, anything) — that ends up standing on a trapped
    // cell is destroyed and the trap is spent. Runs first, before the
    // live piece counts below, so the resulting death is picked up
    // automatically by the piece-count-delta capture tracker just like any
    // other kill.
    for (let r = 0; r < bsK; r++) {
      for (let c = 0; c < bsKc; c++) {
        const bc = state.board[r][c];
        // Don't kill the piece instantly — flag it so this render shows the
        // jaws snapping shut on it (see the trap-icon and piece rendering
        // below), then actually remove it a beat later so the animation has
        // time to play instead of the piece just vanishing on the spot.
        if (bc.trap && bc.piece && !bc.trapSnapping) {
          playBearTrapSound();
          bc.trapSnapping = true;
          const rr = r, cc = c;
          setTimeout(() => {
            const cell2 = state.board[rr] && state.board[rr][cc];
            if (cell2 && cell2.trapSnapping) {
              cell2.piece = null;
              cell2.trap = false;
              cell2.trapSnapping = false;
              if (countPieces('enemy') === 0) { triggerWin(); return; }
              if (countPieces('yours') === 0) { triggerLose('wiped_out'); return; }
              render();
            }
          }, 420);
        }
      }
    }
    let liveEnemy = 0, liveYours = 0;
    for (let r = 0; r < bsK; r++) {
      for (let c = 0; c < bsKc; c++) {
        const p = state.board[r][c].piece;
        if (!p) continue;
        if (p.type === 'enemy') liveEnemy++;
        if (p.type === 'yours') liveYours++;
        if (p.king) continue;
        if (p.type === 'yours' && r === 0) {
          if (crownFriendlyPiece(p)) statsChanged = true;
        } else if (p.type === 'enemy' && r === bsK - 1 && !p.wasKing) {
          p.king = true;
        }
      }
    }
    // Piece-count-delta capture tracker: whenever either side's on-board
    // count drops since the last render, something got captured (covers
    // every capture mechanic — normal jumps, chain captures, Assassinate,
    // Tornado, Locust Swarm, Catapult, Chariot Charge, Usurp, etc. — without
    // needing a hook at every single card's capture site).
    if (typeof state.lastEnemyCount === 'number') {
      if (liveEnemy < state.lastEnemyCount) {
        const captured = state.lastEnemyCount - liveEnemy;
        activeStatsObj().piecesCaptured += captured;
        awardMasteryShards(captured * 100); // every defeated enemy adds 100 permanent Glory Points
        statsChanged = true;
      }
      if (liveYours < state.lastYoursCount) {
        activeStatsObj().piecesLost += (state.lastYoursCount - liveYours);
        triggerBloodOathDraw();
        statsChanged = true;
      }
    }
    state.lastEnemyCount = liveEnemy;
    state.lastYoursCount = liveYours;
  }
  // Run scoring after the promotion safety-net above so a newly crowned unit
  // earns Glory on this same paint rather than waiting for a later click.
  syncGloryScore();
  if (statsChanged) saveActiveStats();
  const boardEl = document.getElementById('board');

  // FLIP setup: before wiping the board, record where every currently-visible
  // piece actually sits on screen, keyed by its stable piece id. The board is
  // fully torn down and rebuilt every render (cheap thanks to the template
  // clone above), so pieces never keep the same DOM node across a move — this
  // is what lets a "moved" piece slide from its old square to its new one
  // instead of just popping into place, without needing persistent piece nodes.
  // getBoundingClientRect() forces a synchronous layout, and during the enemy
  // turn render() fires once per enemy action — with a heavily-populated
  // board (50+ pieces) that's dozens of forced layouts in a couple seconds,
  // which is exactly what was making busy boards feel laggy. The slide is
  // also not really perceptible at that pace anyway (enemy actions are
  // already firing faster than the 220ms slide transition), so above a
  // piece-count threshold we skip FLIP measurement entirely and let pieces
  // just pop straight into their new squares.
  const totalPieceCount = countPieces('yours') + countPieces('enemy');
  const activeHazardCount = state.board.reduce((sum, row) =>
    sum + row.reduce((rowSum, cell) => rowSum + (cell?.hazard ? 1 : 0), 0), 0);
  document.body.classList.toggle('dense-board', totalPieceCount + activeHazardCount > 40);
  const flipEnabled = totalPieceCount <= 40 && !sandsReversing;
  const nextPieceCells = {};
  const nextPieceStates = {};
  if (state && Array.isArray(state.board)) {
    for (let r = 0; r < state.board.length; r++) {
      for (let c = 0; c < state.board[r].length; c++) {
        const p = state.board[r][c].piece;
        if (p?.id != null) {
          nextPieceCells[p.id] = { r, c };
          nextPieceStates[p.id] = { r, c, type: p.type, king: !!p.king };
        }
      }
    }
  }
  const hadPreviousPieceFrame = Object.keys(lastRenderedPieceCells).length > 0;
  const movedPieceIds = new Set();
  const arrivingPieceIds = new Set();
  const crowningPieceIds = new Set();
  Object.keys(nextPieceCells).forEach(id => {
    const prev = lastRenderedPieceCells[id];
    const previousState = lastRenderedPieceStates[id];
    const next = nextPieceCells[id];
    if (prev && (prev.r !== next.r || prev.c !== next.c)) movedPieceIds.add(String(id));
    if (hadPreviousPieceFrame && !prev) arrivingPieceIds.add(String(id));
    if (previousState && !previousState.king && nextPieceStates[id].king) crowningPieceIds.add(String(id));
  });
  const removedPieceEffects = hadPreviousPieceFrame
    ? Object.keys(lastRenderedPieceStates)
        .filter(id => !nextPieceStates[id])
        .map(id => lastRenderedPieceStates[id])
    : [];
  const prevPieceRects = {};
  if (flipEnabled && movedPieceIds.size) {
    boardEl.querySelectorAll('.piece[data-piece-id]').forEach(el => {
      if (movedPieceIds.has(el.dataset.pieceId)) {
        prevPieceRects[el.dataset.pieceId] = el.getBoundingClientRect();
      }
    });
  }
  lastRenderedPieceCells = nextPieceCells;
  lastRenderedPieceStates = nextPieceStates;

  // Always commit one complete board representation. The experimental
  // node-by-node patcher could leave old and new cells mixed together when
  // several squares changed during the same action, producing a visible but
  // non-interactive board. Building off-DOM still keeps the expensive work
  // away from the live page, then replaceChildren performs one atomic swap.
  const boardFragment = document.createDocumentFragment();

  const bsR = getBoardRows();
  const bsC = getBoardCols();
  const shapeSet = new Set(getBoardShape().map(({r,c}) => `${r},${c}`));
  document.getElementById('board').style.gridTemplateColumns = `repeat(${bsC}, 1fr)`;
  document.getElementById('board').style.gridTemplateRows = `repeat(${bsR}, 1fr)`;
  for (let r = 0; r < bsR; r++) {
    for (let c = 0; c < bsC; c++) {
      const cell = document.createElement('div');
      const isDark = (r + c) % 2 === 1;
      const inShape = shapeSet.has(`${r},${c}`);
      if (!inShape) {
        cell.className = 'cell';
        cell.style.background = 'transparent';
        cell.style.cursor = 'default';
        cell.style.pointerEvents = 'none';
        boardFragment.appendChild(cell);
        continue;
      }
      cell.className = `cell ${isDark ? 'dark' : 'light'}`;
      if (state.blackHoleActive && isBlackHoleCell(r, c)) {
        cell.classList.add('black-hole-zone');
        const bounds = getBlackHoleBounds();
        if (r === bounds.centerRow && c === bounds.centerCol) cell.classList.add('black-hole-core');
      }
      cell.dataset.row = r;
      cell.dataset.col = c;

      const passageEndpoint = getSecretPassageEndpoint(r, c);
      const pendingPassageIndex = state.activeCard === 'secret_passage' && Array.isArray(state.secretPassagePlacements)
        ? state.secretPassagePlacements.findIndex(point => point.row === r && point.col === c)
        : -1;
      if (passageEndpoint || pendingPassageIndex >= 0) {
        const pairIndex = passageEndpoint
          ? Math.max(0, SECRET_PASSAGE_COLORS.findIndex(color => color.key === passageEndpoint.tunnel.colorKey))
          : Math.floor(pendingPassageIndex / 2);
        const color = passageEndpoint?.tunnel?.color || SECRET_PASSAGE_COLORS[pairIndex]?.color || SECRET_PASSAGE_COLORS[0].color;
        const marker = document.createElement('div');
        marker.className = `secret-passage-marker secret-passage-${passageEndpoint?.tunnel?.colorKey || SECRET_PASSAGE_COLORS[pairIndex]?.key || 'gray'}` +
          (pendingPassageIndex >= 0 ? ' pending' : '');
        marker.style.setProperty('--passage-color', color);
        marker.setAttribute('aria-hidden', 'true');
        cell.appendChild(marker);
      }

      const sanctuaryPreviewCells = state.sanctuaryPreview
        ? getSquareArea(state.sanctuaryPreview.row,state.sanctuaryPreview.col,Math.min(3,1+newCardLevel('sanctuary'))) : [];
      const sanctuaryDisplayCells=[...sanctuaryCells(),...sanctuaryPreviewCells];
      if (sanctuaryDisplayCells.some(p=>p.row===r&&p.col===c)) {
        cell.classList.add('sanctuary-zone');
        const sanctuaryBorder=document.createElement('div');
        sanctuaryBorder.className=`sanctuary-perimeter ${getAreaEdgeClasses(sanctuaryDisplayCells,r,c,'sanctuary').join(' ')}`;
        sanctuaryBorder.setAttribute('aria-hidden','true');
        cell.appendChild(sanctuaryBorder);
      }
      if ((state.portcullisRows||[]).some(x=>x.row===r) || state.portcullisPreviewRow===r) cell.classList.add('portcullis-row');
      if (isRoyalStandardCell(r,c)) cell.classList.add('royal-standard-zone', ...getRoyalStandardEdgeClasses(r,c));
      if (isRoyalStandardPreviewCell(r,c)) cell.classList.add('royal-standard-zone', ...getRoyalStandardPreviewEdgeClasses(r,c));
      if ((state.royalStandardBanners||[]).some(x=>x.row===r&&x.col===c)) cell.classList.add('royal-standard-banner');
      if ((state.gallowsTargets||[]).some(x=>x.row===r&&x.col===c) || state.board[r][c].piece?.gallowsMarked) cell.classList.add('gallows-marked');
      if ((state.headsmansTargets||[]).some(x=>x.row===r&&x.col===c) || state.board[r][c].piece?.headsmansBounty) cell.classList.add('bounty-marked');

      // Highlight selected
      if (state.selected && state.selected.row === r && state.selected.col === c) {
        cell.classList.add('selected');
      }

      // Valid moves
      const validMove = state.validMoves.find(m => m.row === r && m.col === c);
      // Catapult is unlike every other lane/blast card: it generates a
      // candidate move for basically every square on the board, so once one
      // tile is armed, the OTHER 8 squares in its 3x3 blast zone would each
      // still match their own individual "valid landing spot" move above and
      // never fall through to the charge-preview branch below — the blast
      // zone was getting silently swallowed by the generic highlight. Check
      // armed-blast membership first so it always wins for those squares.
      const armedCatapult = state.validMoves.find(m => m.type === 'catapult' && m.armed);
      const inArmedCatapultBlast = armedCatapult && armedCatapult.affected &&
        !(r === armedCatapult.row && c === armedCatapult.col) &&
        armedCatapult.affected.some(a => a.row === r && a.col === c);
      // Once a Catapult landing is armed, keep every other candidate in
      // validMoves so it can still be tapped to change the target, but stop
      // painting the whole board green. Only the armed landing and its
      // mastery-scaled blast footprint remain highlighted.
      const hideUnarmedCatapultCandidate = armedCatapult && validMove &&
        validMove.type === 'catapult' && !validMove.armed;
      if (inArmedCatapultBlast) {
        cell.classList.add('charge-preview');
      } else if (validMove && !hideUnarmedCatapultCandidate) {
        cell.classList.add(validMove.type === 'capture' ? 'valid-capture' : 'valid-move');
        if (validMove.armed) cell.classList.add('armed-target');
      } else if (state.validMoves.some(m => m.affected && m.affected.some(a => a.row === r && a.col === c) &&
                 (m.type !== 'catapult' || m.armed))) {
        // Not the landing square itself, but a square that'll be affected
        // once you commit — a charge lane (always shown) or, for Catapult
        // specifically, the 3x3 blast zone around whichever tile is
        // currently armed (only ONE of the many possible tiles at a time,
        // otherwise every square on the board would preview simultaneously).
        cell.classList.add('charge-preview');
      }

      // Shield Wall — units selected so far while waiting for the final
      // mastery-scaled choice glow green.
      if (state.activeCard === 'shield_wall' && state.shieldWallTargets &&
          state.shieldWallTargets.some(t => t.row === r && t.col === c)) {
        cell.classList.add('shield-marked');
      }
      // Siege marks the enemy Kings selected so far.
      if (state.activeCard === 'siege' && state.siegeTargets &&
          state.siegeTargets.some(t => t.row === r && t.col === c)) {
        cell.classList.add('assassin-marked');
      }
      // Counter mirrors Shield Wall's selection preview in red.
      if (state.activeCard === 'counter' && state.counterTargets &&
          state.counterTargets.some(t => t.row === r && t.col === c)) {
        cell.classList.add('counter-marked');
      }

      // Scorched Earth — show both pending selections and the units that
      // are currently armed to leave a trail of fire. Full mastery marks all.
      const scorchedPiece = state.board[r][c].piece;
      if ((state.activeCard === 'scorched_earth' && state.scorchedEarthTargets &&
           state.scorchedEarthTargets.some(t => t.row === r && t.col === c)) ||
          ((state.scorchedEarthTurns || 0) > 0 && scorchedPiece?.type === 'yours' &&
           (state.scorchedEarthAllUnits || (state.scorchedEarthUnitIds || []).includes(scorchedPiece.id)))) {
        cell.classList.add('scorched-armed');
      }

      // Assassinate — targets marked so far, waiting to be struck
      // together once the last one is picked.
      if (state.activeCard === 'assassinate' && state.assassinateTargets &&
          state.assassinateTargets.some(t => t.row === r && t.col === c)) {
        cell.classList.add('assassin-marked');
      }
      if (state.activeCard === 'revert' && state.demotionTargets &&
          state.demotionTargets.some(t => t.row === r && t.col === c)) {
        cell.classList.add('assassin-marked');
      }

      // Bear Trap — open squares marked so far (up to 3), waiting to be set
      // down together once the last one is picked.
      if (state.activeCard === 'bear_trap' && state.bearTrapTargets &&
          state.bearTrapTargets.some(t => t.row === r && t.col === c)) {
        cell.classList.add('assassin-marked');
      }

      // Ambush — your own pieces marked so far (up to its mastery-scaled
      // cap), waiting to be armed together once the last one is picked.
      if (state.activeCard === 'ambush' && state.ambushTargets &&
          state.ambushTargets.some(t => t.row === r && t.col === c)) {
        cell.classList.add('assassin-marked');
      }

      // Bear Trap — a trap already sitting on the board, waiting quietly
      // for something to step on it.
      if (state.board[r][c].trap) {
        cell.classList.add('bear-trap-cell');
        const trapIcon = document.createElement('div');
        trapIcon.className = 'bear-trap-icon' + (state.board[r][c].trapSnapping ? ' snapping' : '');
        trapIcon.innerHTML = BEAR_TRAP_ICON_SVG;
        cell.appendChild(trapIcon);
      }

      // Mad Cow — the armed point gets the standard green + pulsing-gold
      // treatment; every square in the mastery-scaled poison footprint is
      // previewed so the player can see the exact area before confirming.
      if (state.activeCard === 'mad_cow' && state.madCowTarget) {
        if (r === state.madCowTarget.row && c === state.madCowTarget.col) {
          cell.classList.add('valid-move');
          cell.classList.add('armed-target');
        } else if (state.madCowTarget.affected &&
                   state.madCowTarget.affected.some(a => a.row === r && a.col === c)) {
          cell.classList.add('charge-preview');
        }
      }

      // Hero's Gambit — friendly pieces selected for sacrifice show an
      // orange-red ring so the player sees which ones are committed.
      if (state.activeCard === 'heros_gambit' && state.heroGambitSacrifices &&
          state.heroGambitSacrifices.some(s => s.row === r && s.col === c)) {
        cell.classList.add('sacrifice-marked');
      }

      // Puppet Master — the currently grabbed enemy piece gets a gold armed
      // ring so the player can see which one they're about to move.
      if (state.activeCard === 'puppet_master' && state.puppetTarget &&
          state.puppetTarget.row === r && state.puppetTarget.col === c) {
        cell.classList.add('armed-target');
      }

      // Thor's Hammer — while the card is armed, all enemies glow red so the
      // player knows to tap one to start the chain.
      if (state.activeCard === 'thors_hammer' &&
          state.board[r][c].piece?.type === 'enemy') {
        cell.classList.add('valid-capture');
      }
      if (state.activeCard === 'revert' &&
          state.board[r][c].piece?.type === 'enemy' &&
          !(state.demotionTargets || []).some(t => t.row === r && t.col === c)) {
        cell.classList.add('valid-capture');
      }

      // Phalanx — tint every sealed back row gold while the wall is active
      // so the player can see the full impassable zone at a glance.
      if ((state.phalanxTurnsLeft || 0) > 0 && r >= bsR - (state.phalanxRows || getPhalanxEffect(state.mode).rows)) {
        cell.classList.add('phalanx-wall');
      }

      // Tutorial — pulsing glow on whichever square(s) the current step wants
      // the player's attention on.
      if (tutorial.active && tutorial.highlightCells &&
          tutorial.highlightCells.some(h => h.row === r && h.col === c)) {
        cell.classList.add('tutorial-glow');
      }

      // Meteor Strike / Wildfire — permanent terrain hazards. Stored as
      // `state.board[r][c].hazard` ('crater' or 'fire'), deliberately NOT as
      // an occupying piece. Craters block movement the same way a friendly
      // piece would for any card that slides/charges across multiple
      // squares (Infantry Charge, Cavalry Charge, Chariot Charge — see
      // getVerticalMoves/getHorizontalMoves/getChariotMoves) as well as
      // plain/regular movement and the enemy AI. Cards that place a piece
      // directly rather than sliding it there (Teleport, Side Step, Feint,
      // Catapult) still can't land ON a crater, but aren't blocked by one
      // sitting between the start and end squares since there's no actual
      // path being traced. War Horse (Double Jump) is the one deliberate
      // exception that hops clean over a crater mid-jump, per its own card
      // text. Fire doesn't block line of sight (a slide can still pass
      // through/land past an empty burning square) but IS a valid — if
      // fatal — place to stop. See the fire-death checks in
      // executeMove/actOnePiece. Rendered as its own
      // simple element, NOT a `.piece[data-piece-id]` (which is what the
      // FLIP slide-animation logic and the piece-count threshold in
      // render() key off of) — hazard cells never move once placed, so
      // giving them that markup would just be dozens of extra elements for
      // the FLIP pass to measure every render for no visual benefit,
      // undoing the crowded-board performance fix. Rendered independently
      // of whatever piece (if any) is also standing on the cell, since a
      // card can legitimately put a piece on top of a hazard square.
      const hazard = state.board[r][c].hazard;
      if (hazard === 'crater') {
        const craterEl = document.createElement('div');
        craterEl.className = 'meteor-crater';
        cell.appendChild(craterEl);
      } else if (hazard === 'fire') {
        const fireEl = document.createElement('div');
        fireEl.className = 'wildfire-cell';
        fireEl.innerHTML = '<span class="wildfire-flame wildfire-flame-1"></span><span class="wildfire-flame wildfire-flame-2"></span><span class="wildfire-flame wildfire-flame-3"></span>';
        cell.appendChild(fireEl);
      } else if (hazard === 'poison') {
        // Mad Cow's leftover 3-turn poison field — same sickly yellow-green
        // language as the card's own miasma-cloud animation, left behind as
        // a real persistent ground effect once the cloud itself fades.
        const poisonEl = document.createElement('div');
        poisonEl.className = 'poison-cell';
        poisonEl.innerHTML = '<span class="poison-bubble poison-bubble-1"></span><span class="poison-bubble poison-bubble-2"></span><span class="poison-bubble poison-bubble-3"></span>';
        cell.appendChild(poisonEl);
      }

      // Piece
      const { piece } = state.board[r][c];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `piece ${piece.type}`;
        if (piece.falseKing) pieceEl.classList.add('false-king');
        pieceEl.dataset.pieceId = piece.id;
        const pieceIdKey = String(piece.id);
        if (arrivingPieceIds.has(pieceIdKey)) pieceEl.classList.add('piece-arriving');
        if (movedPieceIds.has(pieceIdKey) && !flipEnabled) pieceEl.classList.add('piece-landing');
        if (crowningPieceIds.has(pieceIdKey)) pieceEl.classList.add('piece-crowning');
        // Base piece art — real cropped photo, picked once per piece (see
        // pieceArtUrl). A kinged piece's art is REPLACED entirely by its
        // marble crown (light for yours, dark for the enemy's) rather than
        // decorated with anything extra — see the .piece.king CSS for the
        // object-fit switch that lets the (non-circular) crown show
        // uncropped in the same box a normal piece's photo fills.
        const pieceImg = document.createElement('img');
        pieceImg.draggable = false;
        pieceImg.decoding = 'async';
        pieceImg.className = 'piece-art';
        pieceImg.src = piece.king
          ? (piece.type === 'yours' ? YOUR_KING_PIECE_URL : ENEMY_KING_PIECE_URL)
          : pieceArtUrl(piece);
        pieceImg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:1;';
        pieceEl.appendChild(pieceImg);
        if (piece.king) {
          pieceEl.classList.add('king');
        }
        if (piece.frozen) {
          pieceEl.classList.add('frozen');
        }
        if (piece.shielded) {
          pieceEl.classList.add('shielded');
        }
        if (piece.countering) {
          pieceEl.classList.add('countering');
        }
        if (piece.ambushed) {
          pieceEl.classList.add('ambushed');
        }
        if (state.board[r][c].trapSnapping) {
          pieceEl.classList.add('trap-victim');
        }
        if (state.selected && state.selected.row === r && state.selected.col === c) {
          pieceEl.classList.add('selected-piece');
        }
        // New Run Plus: dim/ghost any of your pieces that already acted this turn
        if (state.mode === 'plus' && piece.type === 'yours' && state.plusMovedIds.includes(piece.id)) {
          pieceEl.classList.add('plus-moved');
        }

        // Shield indicator
        if (state.shieldedPiece && state.shieldedPiece.row === r && state.shieldedPiece.col === c) {
          pieceEl.style.boxShadow = '0 0 0 3px #4488ff, 0 3px 8px rgba(0,0,0,0.6)';
        }



        cell.appendChild(pieceEl);
      }

      // No per-cell click listener anymore — see initBoardClickDelegation(),
      // a single delegated listener set up once at boot. render() rebuilds
      // every cell from scratch on every move (and once per enemy piece
      // action during the AI turn — busy boards can mean dozens of full
      // rebuilds per turn), so attaching a fresh listener+closure to every
      // cell here was real allocation/GC churn on large boards. Using
      // event delegation removes that cost without touching how render()
      // paints anything.
      boardFragment.appendChild(cell);
    }
  }

  boardEl.replaceChildren(boardFragment);

  // Paint short-lived action marks directly over the affected squares. This
  // makes ordinary jumps, card kills, revivals, and multi-captures feel alive
  // without rebuilding the board again or attaching another listener.
  const addBoardActionFx = (kind, row, col, extraClass = '') => {
    const fx = document.createElement('div');
    fx.className = `board-action-fx ${kind}${extraClass ? ' ' + extraClass : ''}`;
    fx.style.left = `${((col + .5) / bsC) * 100}%`;
    fx.style.top = `${((row + .5) / bsR) * 100}%`;
    boardEl.appendChild(fx);
    fx.addEventListener('animationend', () => fx.remove(), { once: true });
    setTimeout(() => fx.remove(), 900);
  };
  removedPieceEffects.slice(0, 24).forEach(piece => {
    addBoardActionFx('capture-burst', piece.r, piece.c, piece.type === 'yours' ? 'friendly-loss' : '');
  });
  movedPieceIds.forEach(id => {
    const landing = nextPieceCells[id];
    if (landing) addBoardActionFx('landing-ring', landing.r, landing.c);
  });

  // FLIP play: for any piece whose square actually changed since the last
  // render, jump it back to its old on-screen spot with no transition, then
  // release it into a transitioned slide back to its real (new) position.
  // Skipped above the piece-count threshold — see flipEnabled above.
  if (flipEnabled && movedPieceIds.size) {
    requestAnimationFrame(() => {
      boardEl.querySelectorAll('.piece[data-piece-id]').forEach(el => {
        if (!movedPieceIds.has(el.dataset.pieceId)) return;
        const prev = prevPieceRects[el.dataset.pieceId];
        if (!prev) return; // brand new piece (e.g. Usurp) — no old spot to slide from
        const next = el.getBoundingClientRect();
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return; // didn't actually move
        if (typeof el.animate === 'function') {
          // A small lifted arc and squash on landing is much more readable
          // than a flat linear slide, while still using compositor transforms.
          el.animate([
            { transform: `translate(${dx}px, ${dy}px) scale(.92)`, offset: 0 },
            { transform: `translate(${dx * .46}px, calc(${dy * .46}px - 10px)) scale(1.06) rotate(-2deg)`, offset: .56 },
            { transform: 'translate(0, 3px) scale(1.1,.84) rotate(1deg)', offset: .82 },
            { transform: 'translate(0, 0) scale(1) rotate(0)', offset: 1 }
          ], { duration: 320, easing: 'cubic-bezier(.2,.8,.25,1)' });
        } else {
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.getBoundingClientRect();
          requestAnimationFrame(() => {
            el.style.transition = 'transform .3s cubic-bezier(.2,.8,.25,1)';
            el.style.transform = '';
            el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true });
          });
        }
      });
    });
  }

  // Update status
  document.getElementById('yourCount').textContent = countPieces('yours');
  document.getElementById('enemyCount').textContent = countPieces('enemy');
  document.getElementById('cardCount').textContent = state.cards.filter(c => !c.used).length;
  document.getElementById('boardSizeDisplay').textContent = `${getBoardRows()}×${getBoardCols()}`;
  document.getElementById('levelNum').textContent = state.level;
  updateGloryHud();
  updatePlusTurnUI();

  // Render cards hand — one carousel per rarity (Common / Uncommon / Rare).
  // Each carousel shows exactly ONE card at a time; drag left/right on the box
  // rotates through your cards of that rarity, tap the shown card to select it.
  // Cards do not change while individual enemies move. On sampled enemy-turn
  // frames, leave the existing carousel DOM intact instead of rebuilding it.
  if (!fastEnemyFrame) {
    ['common', 'uncommon', 'rare', 'epic'].forEach(r => {
      try {
        renderCarousel(r, gatherRarityGroups(r), false);
      } catch (err) {
        console.error('renderCarousel failed for', r, err);
        showDebugError(`Card render error (${r}): ${err.message}`);
      }
    });
  }

  recordSandsFrame();
  checkTutorialProgress();
  scheduleSaveGame();
}

function setMessage(msg) {
  document.getElementById('message').textContent = msg;
}

// Surfaces an unexpected error on-screen instead of failing silently. This is
// a temporary diagnostic aid — if the card row (or anything else) ever goes
// blank again, whatever broke it should show up here as actual text we can
// read, rather than us guessing blind at what happened.
function showDebugError(msg) {
  console.error(msg);
  const staleDebugBar = document.getElementById('debugError');
  if (staleDebugBar) staleDebugBar.remove();
}

// Global safety net: retain diagnostics in the developer console without
// exposing internal error text in the player-facing interface.
window.addEventListener('error', (e) => {
  showDebugError(`Uncaught error: ${e.message} (${e.filename ? e.filename.split('/').pop() : ''}:${e.lineno}:${e.colno})`);
});

// ── CARD CAROUSEL ──
// Each rarity (Common / Uncommon / Rare) shows its current front card in a small
// box below the board. Tap that box to pop open a 3D coverflow carousel, centered
// on screen, with the rest of your cards of that rarity floating to the sides —
// so you can always see what's next without having to swipe first.
const STACK_IDS = { common: 'stackCommon', uncommon: 'stackUncommon', rare: 'stackRare', epic: 'stackEpic' };
let carouselIndex = { common: 0, uncommon: 0, rare: 0, epic: 0 };

function gatherRarityGroups(rarity) {
  const groupsMap = {};
  state.cards.forEach(card => {
    const def = CARD_DEFS[card.id];
    // A card with no matching definition (bad/unimplemented id) should never be
    // able to crash the whole card row — skip it instead of throwing, since
    // gatherRarityGroups scans the FULL hand regardless of which rarity was
    // asked for, so one bad card used to be able to break all three stacks at once.
    if (!def || def.rarity !== rarity) return;
    if (!groupsMap[card.id]) groupsMap[card.id] = { id: card.id, cards: [] };
    groupsMap[card.id].cards.push(card);
  });
  return Object.values(groupsMap);
}

// Small resting box — shows only the current front card for that rarity.
function renderCarousel(rarity, groups) {
  const wrapId = STACK_IDS[rarity];
  const stackEl = document.getElementById(wrapId);
  const containerId = wrapId + 'Cards';
  const container = document.getElementById(containerId);
  const posEl = document.getElementById(wrapId + 'Pos');
  if (!stackEl || !container) return;

  const wrapEl = stackEl.parentElement;

  if (!groups.length) {
    // No cards of this rarity left (e.g. Wrath used up and removed from the
    // hand entirely) — keep the box visible as an empty, grayed-out back
    // instead of hiding the whole stack, so it's clear it's just empty, not broken.
    if (wrapEl) wrapEl.style.display = '';
    container.innerHTML = '';
    const emptyEl = document.createElement('div');
    emptyEl.className = `card card-back card-back-${rarity} used`;
    emptyEl.style.backgroundImage = `url(${CARD_BACK_URL[rarity]})`;
    container.appendChild(emptyEl);
    if (posEl) posEl.textContent = '0/0';
    return;
  }
  if (wrapEl) wrapEl.style.display = '';

  const n = groups.length;
  let idx = ((carouselIndex[rarity] % n) + n) % n;
  // If the type currently sitting front-and-center has been fully used up
  // but this rarity still has OTHER unused cards, don't get stuck showing an
  // exhausted type as the resting box — hop to the first group that still
  // has something playable, so what's on top is always accurate.
  if (groups[idx].cards.every(c => c.used)) {
    const firstUsable = groups.findIndex(g => g.cards.some(c => !c.used));
    if (firstUsable !== -1) idx = firstUsable;
  }
  carouselIndex[rarity] = idx;

  const group = groups[idx];
  container.innerHTML = '';
  const backEl = document.createElement('div');
  // Only gray the whole stack out when EVERY card of this rarity is used —
  // using up one type shouldn't gray out the box while other types in the
  // same rarity are still playable.
  const rarityFullyUsed = groups.every(g => g.cards.every(c => c.used));
  backEl.className = `card card-back card-back-${rarity}` + (rarityFullyUsed ? ' used' : '');
  backEl.dataset.groupId = group.id;
  backEl.style.backgroundImage = `url(${CARD_BACK_URL[rarity]})`;
  container.appendChild(backEl);

  if (posEl) posEl.textContent = n > 1 ? `${idx + 1}/${n}` : '';
}

function initCarousels() {
  ['common', 'uncommon', 'rare', 'epic'].forEach(rarity => {
    const stackEl = document.getElementById(STACK_IDS[rarity]);
    if (!stackEl) return;
    stackEl.addEventListener('click', () => openCarouselOverlay(rarity));
  });
  initCarouselOverlay();
}

// ── 3D COVERFLOW POPUP ──
// The regular carousel shows the same complete card face at every position.
// Side cards remain one size and the centered card is exactly twice that size.
// Tapping the center enters full-screen inspection; tapping it again uses it.
const CO_SPACING = 146;  // px between neighboring complete-card centers in normal view
const CO_ROT_DEG = 38;   // max Y-axis rotation applied to a side card

let carouselOverlayState = { rarity: null, groups: [], baseOffset: 0, view: 'carousel' };
let carouselOverlayDrag = { active: false, startX: 0, startY: 0, startBase: 0, moved: false };
let lastCardActivationTime = 0; // ghost-click guard — see cellClick()
let blackHoleAnimationRunning = false;

// One shared art-URL lookup for the enlarged detail view (kept in sync with the
// per-card branches in buildCardElement / the old showCardPreview).
const CARD_DETAIL_ART_URL = {
  secret_passage:  () => SECRET_PASSAGE_ART_URL,
  battering_ram: () => NEW_CARD_ART_URL.battering_ram,
  sanctuary: () => NEW_CARD_ART_URL.sanctuary,
  headsmans_bounty: () => NEW_CARD_ART_URL.headsmans_bounty,
  the_masons: () => NEW_CARD_ART_URL.the_masons,
  false_king: () => NEW_CARD_ART_URL.false_king,
  war_drums: () => NEW_CARD_ART_URL.war_drums,
  portcullis: () => NEW_CARD_ART_URL.portcullis,
  royal_standard: () => NEW_CARD_ART_URL.royal_standard,
  gallows: () => NEW_CARD_ART_URL.gallows,
  vertical_jump:   () => INFANTRY_ART_URL,
  horizontal_jump: () => CAVALRY_ART_URL,
  king_me:         () => KING_ART_URL,
  revert:          () => DEMOTION_ART_URL,
  teleport:        () => PHANTOM_ART_URL,
  double_jump:     () => WARHORSE_ART_URL,
  t_strike:        () => BALLISTA_ART_URL,
  usurp:           () => USURP_ART_URL,
  wrath:           () => WRATH_ART_URL,
  catapult:        () => CATAPULT_ART_URL,
  assassinate:     () => ASSASSINATE_ART_URL,
  cross_strike:    () => CROSS_STRIKE_ART_URL,
  plague:          () => PLAGUE_ART_URL,
  side_step:       () => SIDE_STEP_ART_URL,
  blizzard:        () => BLIZZARD_ART_URL,
  tornado:         () => TORNADO_ART_URL,
  locust_swarm:    () => LOCUST_ART_URL,
  chariot_charge:  () => CHARIOT_ART_URL,
  shield_wall:     () => SHIELD_WALL_ART_URL,
  counter:         () => COUNTER_ART_URL,
  reinforcements:  () => REINFORCEMENTS_ART_URL,
  veteran:         () => VETERAN_ART_URL,
  plus_one:        () => PLUS_ONE_ART_URL,
  once_more:       () => ONCE_MORE_ART_URL,
  bodyguard:       () => BODYGUARD_ART_URL,
  retreat:         () => RETREAT_ART_URL,
  bear_trap:       () => BEAR_TRAP_ART_URL,
  ambush:          () => AMBUSH_ART_URL,
  jester:          () => JESTER_ART_URL,
  meteor_strike:   () => METEOR_STRIKE_ART_URL,
  black_hole:       () => BLACK_HOLE_ART_URL,
  close_ranks:      () => CLOSE_RANKS_ART_URL,
  lazarus:          () => LAZARUS_ART_URL,
  sands_of_time:    () => SANDS_OF_TIME_ART_URL,
  divine_intervention: () => DIVINE_INTERVENTION_ART_URL,
  wildfire:        () => WILDFIRE_ART_URL,
  conscript:       () => CONSCRIPT_ART_URL,
  coup_detat:      () => COUP_DETAT_ART_URL,
  siege:           () => SIEGE_ART_URL,
  feint:           () => FEINT_ART_URL,
  earthquake:      () => EARTHQUAKE_ART_URL,
  mad_cow:         () => MADCOW_ART_URL,
  dead_mans_hand:  () => DEAD_MANS_HAND_ART_URL,
  heros_gambit:    () => HEROS_GAMBIT_ART_URL,
  phalanx:         () => PHALANX_ART_URL,
  ace_up_the_sleeve: () => ACE_UP_THE_SLEEVE_ART_URL,
  blood_oath:        () => BLOOD_OATH_ART_URL,
  tidal_wave:        () => TIDAL_WAVE_ART_URL,
  trojan_horse:      () => TROJAN_HORSE_ART_URL,
  war_tax:           () => WAR_TAX_ART_URL,
  puppet_master:     () => PUPPET_MASTER_ART_URL,
  scorched_earth:    () => SCORCHED_EARTH_ART_URL,
  last_stand:        () => LAST_STAND_ART_URL,
  thors_hammer:      () => THORS_HAMMER_ART_URL,
};

// Builds the same big, detailed layout used by the old hover-preview tooltip —
// full art strip, name, description, rarity — for whichever card is centered.
function buildCardDetailInnerHTML(group) {
  const def = CARD_DEFS[group.id];
  if (!def) return '';
  const displayCard = group.cards?.find(card => !card.used) || group.cards?.[0];
  const masteryLevelOverride = null;
  const isEpic = def.rarity === 'epic';
  const isRare = def.rarity === 'rare';
  const isUncommon = def.rarity === 'uncommon';
  const nameColor   = isEpic ? '#f8dc76' : isRare ? '#ffffff' : isUncommon ? '#2d6a2d' : '#e8b84b';
  const rarity      = isEpic ? 'Epic' : '';
  const rarityColor = isEpic ? '#f8dc76' : isRare ? '#1a3a6a' : isUncommon ? '#2d6a2d' : '#888';

  const urlFn = CARD_DETAIL_ART_URL[group.id];
  const art = urlFn
    ? `<div class="preview-art"><img src="${urlFn()}" style="width:100%;height:100%;top:0;left:0;object-fit:contain;"/></div>`
    : `<div class="preview-body" style="padding-top:16px;"><div class="preview-icon">${def.icon}</div></div>`;

  return `<span class="preview-corner tl">✦</span><span class="preview-corner tr">✦</span>${art}
    <div class="preview-divider"></div>
    <div class="preview-body">
      <div class="preview-name" style="color:${nameColor}">${def.name}</div>
      <div class="preview-desc">${def.desc}</div>
      <div class="preview-rarity" style="color:${rarityColor}">${rarity}</div>
      ${getMasteryOrbsHTML(group.id, masteryLevelOverride)}
    </div>`;
}

function openCarouselOverlay(rarity) {
  // Tutorial: the card stacks themselves are inert until the one step that
  // actually points at the uncommon stack.
  if (tutorial.active && !(tutorial.step === 8 && rarity === 'uncommon')) return;
  hideCardPreview(); // dismiss any stray hover/tap preview before the popup takes over
  const groups = gatherRarityGroups(rarity);
  if (!groups.length) return;
  const n = groups.length;
  const startIdx = ((carouselIndex[rarity] % n) + n) % n;
  carouselOverlayState = { rarity, groups, baseOffset: startIdx, view: 'carousel' };
  carouselOverlayDrag = { active: false, startX: 0, startY: 0, startBase: 0, moved: false };

  const stage = document.getElementById('carouselOverlayStage');
  stage.innerHTML = '';
  stage.classList.remove('full-card-view');
  groups.forEach((group, i) => {
    const { el } = buildCardElement(group);
    el.dataset.groupId = group.id;
    el.dataset.idx = String(i);
    el.classList.add('carousel-card-face', 'carousel-full-card');
    setCarouselCardImageActivity(el, Math.abs(shortestDelta(i, startIdx, n)) <= 2);
    stage.appendChild(el);
  });
  updateStageTransforms();
  document.getElementById('carouselOverlay').classList.add('active');

  // Hide the little resting card entirely while the popup is up. It was sitting
  // there the whole time (same "War Horse" card, unmoving) and — regardless of
  // any z-index stacking on the actual device — visually blocking the popup
  // underneath it. With it hidden, only the enlarged, centered popup card shows.
  hideCardsHand();
}

function setCarouselCardImageActivity(cardEl, active) {
  cardEl.querySelectorAll('img').forEach(img => {
    img.decoding = 'async';
    if (active) {
      if (img.dataset.deferredSrc) {
        img.src = img.dataset.deferredSrc;
        delete img.dataset.deferredSrc;
      }
      img.style.visibility = '';
    } else if (!img.dataset.deferredSrc && img.getAttribute('src')) {
      img.dataset.deferredSrc = img.getAttribute('src');
      img.removeAttribute('src');
      img.style.visibility = 'hidden';
    }
  });
}

function closeCarouselOverlay() {
  const overlay = document.getElementById('carouselOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.getElementById('carouselOverlayStage').innerHTML = '';
  const rulesFloat = document.getElementById('carouselRulesFloat');
  if (rulesFloat) {
    rulesFloat.classList.remove('visible');
    rulesFloat.innerHTML = '';
  }
  carouselOverlayState = { rarity: null, groups: [], baseOffset: 0, view: 'carousel' };
  hideCardPreview();
  showCardsHand();
}

// Shortest circular distance from `i` to the current center offset, so the fan
// always wraps the short way around instead of unwinding across the whole deck.
function shortestDelta(i, baseOffset, n) {
  let delta = i - baseOffset;
  if (delta > n / 2) delta -= n;
  if (delta < -n / 2) delta += n;
  return delta;
}

function updateStageTransforms() {
  const { groups, baseOffset, view } = carouselOverlayState;
  const n = groups.length;
  if (!n) return;
  const stageEl = document.getElementById('carouselOverlayStage');
  const isFullView = view === 'full';
  if (stageEl) stageEl.classList.toggle('full-card-view', isFullView);
  const cardEls = Array.from(document.querySelectorAll('#carouselOverlayStage .card'));

  // Compute each card's distance from center up front, so we can both style it
  // AND settle the real DOM stacking order from it (belt-and-suspenders — some
  // mobile browsers don't reliably respect z-index across a perspective/3D
  // parent, so whichever card is closest to center is also moved latest in the
  // DOM, which always paints on top regardless of z-index quirks).
  const withDelta = cardEls.map(el => {
    const i = Number(el.dataset.idx);
    const delta = shortestDelta(i, baseOffset, n);
    return { el, delta, absDelta: Math.abs(delta) };
  });

  withDelta.forEach(({ el, delta, absDelta }) => {
    const isCentered = absDelta < 0.15; // generous enough to catch it reliably mid-drag
    const spacing = isFullView ? Math.min(window.innerWidth * 0.88, 470) : CO_SPACING;
    const translateX = delta * spacing;
    const rotateY = isFullView ? 0 : Math.max(-CO_ROT_DEG, Math.min(CO_ROT_DEG, delta * -CO_ROT_DEG));
    // Normal carousel: every side card is exactly the same size and the center
    // is exactly 2x. Full view: the center expands responsively to the screen.
    const scale = isFullView
      ? (isCentered ? 1 : 0.72)
      : (isCentered ? 2 : 1);
    const translateY = 0;
    const opacity = isFullView
      ? Math.max(0.04, 1 - Math.min(absDelta, 1) * 0.9)
      : Math.max(0.18, 1 - Math.max(0, absDelta - 2) * 0.28);
    const z = Math.round(1000 - absDelta * 10);

    el.style.setProperty('transform', `translateX(${translateX}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`, 'important');
    // The coverflow needs inline opacity for distance-based fading, but an
    // inline value also outranks .card.used in CSS. Cap exhausted cards at
    // the same 30% opacity so a spent card (Usurp included) cannot continue
    // looking playable merely because it is centered in the carousel.
    const renderedOpacity = el.classList.contains('used')
      ? Math.min(opacity, 0.3)
      : opacity;
    el.style.opacity = String(renderedOpacity);
    el.style.zIndex = String(z);
    el.classList.toggle('co-focused', isCentered);

    el.classList.toggle('card-detail-mode', isFullView && isCentered);
    // Keep artwork loaded for every card that is visibly fanned on screen.
    // The carousel shows three cards on either side of center; unloading at
    // two positions caused the two end cards to display empty art panels.
    // Cards farther away remain deferred so large decks still avoid decoding
    // every full-size illustration at once.
    setCarouselCardImageActivity(el, absDelta <= 3.05);
  });

  // Reorder in the DOM: farthest-from-center first, closest last — so whichever
  // card you're actually landing on while swiping always renders on top, and the
  // "top of the deck" alternates live as you cross from one card to the next.
  if (stageEl) {
    withDelta
      .slice()
      .sort((a, b) => b.absDelta - a.absDelta)
      .forEach(({ el }) => stageEl.appendChild(el));
  }

  const nearest = withDelta.reduce((best, item) => !best || item.absDelta < best.absDelta ? item : best, null);
  const rulesFloat = document.getElementById('carouselRulesFloat');
  const centeredGroup = nearest ? groups.find(group => group.id === nearest.el.dataset.groupId) : null;
  if (rulesFloat) {
    const displayCard = centeredGroup?.cards.find(card => !card.used) || centeredGroup?.cards[0];
    const baseOnly = false;
    rulesFloat.innerHTML = centeredGroup
      ? buildFloatingCardRulesHTML(centeredGroup.id, baseOnly ? 0 : null, baseOnly)
      : '';
    rulesFloat.classList.toggle('visible', !!centeredGroup);
  }
}

// Resolve a tap by the cards' VISUAL center positions instead of whichever
// transformed element happens to be painted on top. The enlarged center card
// overlaps its neighbors, so elementFromPoint() let that center card steal a
// click intended for the next/previous card—especially noticeable once the
// center card was exhausted. Choosing the nearest displayed center makes every
// visible side card a dependable navigation target on both mouse and touch.
function getCarouselCardNearestPoint(clientX, clientY) {
  const stageEl = document.getElementById('carouselOverlayStage');
  if (!stageEl) return null;

  let nearest = null;
  Array.from(stageEl.querySelectorAll('.card')).forEach(el => {
    const rect = el.getBoundingClientRect();
    const inside = clientX >= rect.left - 6 && clientX <= rect.right + 6 &&
      clientY >= rect.top - 6 && clientY <= rect.bottom + 6;
    if (!inside) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    if (!nearest || distance < nearest.distance) nearest = { el, distance };
  });

  return nearest ? nearest.el : null;
}

function initCarouselOverlay() {
  const overlay = document.getElementById('carouselOverlay');
  if (!overlay) return;

  overlay.addEventListener('pointerdown', (e) => {
    // Stops the browser from synthesizing a follow-up "click" event after
    // this touch/pointer sequence ends. Without this, tapping a centered
    // card to activate it would close the popup, THEN a ghost click would
    // land on whatever board cell is now revealed underneath — instantly
    // using the just-selected card on it with no second tap involved.
    e.preventDefault();
    carouselOverlayDrag = {
      active: true, moved: false,
      startX: e.clientX, startY: e.clientY,
      startBase: carouselOverlayState.baseOffset,
    };
  });

  overlay.addEventListener('pointermove', (e) => {
    if (!carouselOverlayDrag.active) return;
    const dx = e.clientX - carouselOverlayDrag.startX;
    const dy = e.clientY - carouselOverlayDrag.startY;

    if (!carouselOverlayDrag.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      carouselOverlayDrag.moved = true;
      const stageEl = document.getElementById('carouselOverlayStage');
      if (stageEl) stageEl.classList.add('dragging'); // no-transition while live-following the finger
    }
    if (!carouselOverlayDrag.moved) return;

    // A mostly-vertical drag is a swipe-to-close gesture — don't also rotate the cards.
    if (Math.abs(dy) > Math.abs(dx)) return;

    const n = carouselOverlayState.groups.length;
    if (!n) return;
    const swipeSpacing = carouselOverlayState.view === 'full'
      ? Math.min(window.innerWidth * 0.82, 430)
      : CO_SPACING;
    const live = carouselOverlayDrag.startBase - dx / swipeSpacing;
    carouselOverlayState.baseOffset = ((live % n) + n) % n;
    updateStageTransforms();
  });

  overlay.addEventListener('pointerup', (e) => {
    if (!carouselOverlayDrag.active) return;
    e.preventDefault(); // belt-and-suspenders against a synthetic ghost click
    carouselOverlayDrag.active = false;
    const stageEl = document.getElementById('carouselOverlayStage');
    if (stageEl) stageEl.classList.remove('dragging'); // restore transition so the settle animates

    const dx = e.clientX - carouselOverlayDrag.startX;
    const dy = e.clientY - carouselOverlayDrag.startY;

    // Swipe down walks back one visual level: full card -> normal carousel -> closed.
    if (carouselOverlayDrag.moved && dy > 70 && dy > Math.abs(dx)) {
      if (carouselOverlayState.view === 'full') {
        carouselOverlayState.view = 'carousel';
        updateStageTransforms();
      } else {
        closeCarouselOverlay();
      }
      return;
    }

    const n = carouselOverlayState.groups.length;
    if (!n) { closeCarouselOverlay(); return; }

    if (!carouselOverlayDrag.moved) {
      // In the full-card view the centered carousel index is authoritative.
      // Do not search every transformed card for the nearest visual center:
      // those cards overlap on phones and can make a second tap resolve to a
      // hidden neighbour instead of the full card the player is looking at.
      if (carouselOverlayState.view === 'full') {
        const focusedEl = document.querySelector('#carouselOverlayStage .card.co-focused');
        const focusedRect = focusedEl?.getBoundingClientRect();
        const tappedFocusedCard = focusedRect &&
          e.clientX >= focusedRect.left && e.clientX <= focusedRect.right &&
          e.clientY >= focusedRect.top && e.clientY <= focusedRect.bottom;

        // A tap outside the full card returns to the normal carousel. A tap
        // on it uses exactly the currently centered card.
        if (!tappedFocusedCard) {
          carouselOverlayState.view = 'carousel';
          updateStageTransforms();
          return;
        }

        const centeredIdx = Math.round(
          ((carouselOverlayState.baseOffset % n) + n) % n
        ) % n;
        carouselOverlayState.baseOffset = centeredIdx;
        carouselIndex[carouselOverlayState.rarity] = centeredIdx;
        const centeredGroup = carouselOverlayState.groups[centeredIdx];
        if (!centeredGroup) return;
        const centeredCard = centeredGroup.cards.find(c => !c.used);
        // Exhausted cards remain browsable but cannot be activated.
        if (!centeredCard) return;
        closeCarouselOverlay();
        activateCard(centeredCard.uid);
        return;
      }

      // A tap, not a drag. Resolve it by the nearest card's visual center;
      // transformed cards overlap, so DOM hit-testing alone is unreliable.
      const cardEl = getCarouselCardNearestPoint(e.clientX, e.clientY);
      if (!cardEl) {
        if (carouselOverlayState.view === 'full') {
          carouselOverlayState.view = 'carousel';
          updateStageTransforms();
        } else {
          closeCarouselOverlay();
        }
        return;
      }

      const groupId = cardEl.dataset.groupId;
      const i = Number(cardEl.dataset.idx);
      const delta = shortestDelta(i, carouselOverlayState.baseOffset, n);
      const isCentered = Math.abs(delta) < 0.5;

      if (!isCentered) {
        // Tapping a side card recenters it, same as swiping to it.
        carouselOverlayState.baseOffset = ((i % n) + n) % n;
        carouselIndex[carouselOverlayState.rarity] = i;
        updateStageTransforms();
        return;
      }

      // The first center tap opens the full-screen version. Its second-tap
      // activation is handled by the authoritative centered-index path above.
      carouselOverlayState.view = 'full';
      updateStageTransforms();
      return;
    }

    // Was a horizontal drag — snap to the nearest whole card and remember it for this rarity.
    const snapped = Math.round(((carouselOverlayState.baseOffset % n) + n) % n) % n;
    carouselOverlayState.baseOffset = snapped;
    updateStageTransforms();
    carouselIndex[carouselOverlayState.rarity] = snapped;
  });
}

// ── MAIN MENU / CARD COLLECTION ──

function buildBigCardHTML(cardId, locked = false) {
  const def = CARD_DEFS[cardId];
  if (!def) return '';
  const isEpic = def.rarity === 'epic';
  const isRare = def.rarity === 'rare';
  const isUncommon = def.rarity === 'uncommon';
  const isWhite = def.rarity === 'white';
  const nameColor   = isWhite ? '#f0f0f0' : isEpic ? '#f8dc76' : isRare ? '#ffffff' : isUncommon ? '#4a8f4a' : '#e8b84b';
  const rarity      = isWhite ? 'Bonus' : isEpic ? 'Epic' : '';
  const rarityColor = isWhite ? '#f0f0f0' : isEpic ? '#f8dc76' : isRare ? '#3d6fa8' : isUncommon ? '#4a8f4a' : '#888';
  const plusOnlyBadge = '';

  let artHTML;
  if (cardId === 'vertical_jump') {
    artHTML = `<div class="big-card-art">
      <img src="${INFANTRY_ART_URL}" style="object-fit:contain;left:-8%;opacity:0.8;filter:brightness(0.55);"/>
      <img src="${INFANTRY_ART_URL}" style="object-fit:contain;left:8%;opacity:0.8;filter:brightness(0.55);transform:scaleX(-1);"/>
      <img src="${INFANTRY_ART_URL}" style="object-fit:contain;"/>
    </div>`;
  } else {
    const urlFn = CARD_DETAIL_ART_URL[cardId];
    artHTML = urlFn
      ? `<div class="big-card-art"><img src="${urlFn()}"/></div>`
      : `<div class="big-card-art" style="display:flex;align-items:center;justify-content:center;"><span class="big-card-icon">${def.icon}</span></div>`;
  }

  return `${plusOnlyBadge}${artHTML}
    <div class="big-card-divider"></div>
    <div class="big-card-body">
      <div class="big-card-name" style="color:${nameColor}">${def.name}</div>
      <div class="big-card-desc">${def.desc}</div>
      ${locked ? '<div class="big-card-locked-label">LOCKED — VIEW ONLY</div>' : ''}
      ${getMasteryOrbsHTML(cardId)}
    </div>`;
}

function openCardEnlarge(cardId) {
  const def = CARD_DEFS[cardId];
  if (!def) return;
  const stage = document.getElementById('cardEnlargeStage');
  const locked = !isCardUnlockedInMode(cardId, activeCollectionScreenMode);
  stage.classList.toggle('locked-detail', locked);
  stage.dataset.rarity = def.rarity || 'common';
  stage.style.borderColor = def.rarity === 'white' ? '#e8e8e8'
    : def.rarity === 'epic' ? '#f6d66b'
    : def.rarity === 'rare' ? '#1a3a6a'
    : def.rarity === 'uncommon' ? '#2d6a2d'
    : '#c8922a';
  stage.innerHTML = buildBigCardHTML(cardId, locked);
  if (tutorial.active && tutorial.upgradeCardId === cardId) {
    const tutorialOrb = stage.querySelector('.mastery-orb:not(.filled)') || stage.querySelector('.mastery-orb');
    if (tutorialOrb) tutorialOrb.id = 'tutorialUpgradeOrb';
  }
  const rulesFloat = document.getElementById('collectionRulesFloat');
  if (rulesFloat) rulesFloat.innerHTML = buildFloatingCardRulesHTML(cardId);
  document.getElementById('cardEnlargeOverlay').classList.add('active');
}

function closeCardEnlarge() {
  document.getElementById('cardEnlargeOverlay').classList.remove('active');
  const rulesFloat = document.getElementById('collectionRulesFloat');
  if (rulesFloat) rulesFloat.innerHTML = '';
}

// ── STARTER DECK: ADD / REMOVE BUTTONS ──
// Explicit buttons instead of drag-and-drop — simpler and more reliable on
// touch devices, and there's no ambiguity about what a tap does.
function assignStarterSlot(slotIdx, cardId) {
  getScreenCollection().starterDeckSlots[slotIdx] = cardId;
  saveScreenCollection();
  renderStarterDeckSection();
}

function clearStarterSlot(slotIdx) {
  getScreenCollection().starterDeckSlots[slotIdx] = null;
  saveScreenCollection();
  renderStarterDeckSection();
}

// Puts a card into the first unlocked, empty Starter Deck slot THAT MATCHES
// ITS RARITY (slot 1 = Common, slots 2-3 = Uncommon, slots 4-5 = Rare) — a
// Rare card can only ever go in a Rare slot, so you can't end up with, say,
// five copies of Tornado trivializing the entire run. Each card is also
// limited to one slot total, so the same card can't double (or quintuple) up.
function addCardToDeck(cardId) {
  const def = CARD_DEFS[cardId];
  if (!def) return;
  const col = getScreenCollection();

  if (!col.unlockedCards.includes(cardId)) {
    showGameDialog(`${def.name} is still locked.`, { title: 'CARD LOCKED' });
    return;
  }

  if (col.starterDeckSlots.includes(cardId)) {
    showGameDialog(`${def.name} is already in your Starter Deck — pick a different card, or remove it from its current slot first.`, { title: 'ALREADY EQUIPPED' });
    return;
  }

  const idx = STARTER_DECK_MILESTONES.findIndex((levelReq, i) =>
    col.highestLevelBeaten >= levelReq &&
    !col.starterDeckSlots[i] &&
    STARTER_DECK_RARITIES[i] === def.rarity
  );
  if (idx === -1) {
    const rarityLabel = getRarityDisplayName(def.rarity);
    const hasAnyRaritySlotAtAll = STARTER_DECK_RARITIES.includes(def.rarity);
    const msg = hasAnyRaritySlotAtAll
      ? `No open ${rarityLabel} Starter Deck slot. Beat more levels to unlock one, or remove a ${rarityLabel} card from an existing slot first.`
      : `${def.name} is ${rarityLabel} — there's no Starter Deck slot for that rarity.`;
    showGameDialog(msg, { title: 'STARTER DECK' });
    return;
  }
  assignStarterSlot(idx, cardId);
}

// Retroactively fixes a save that already has cards sitting in slots from
// before rarity-locked/no-duplicate slots existed — e.g. Tornado assigned to
// more than one slot, or a Rare card sitting in what's now a Common-only
// slot. Runs every time the Starter Deck renders, so an old save heals
// itself the first time this screen is opened rather than silently keeping
// an overpowered deck forever.
//
// Deliberately NOT destructive when a slot's cardId simply isn't in CARD_DEFS
// right now (`!def`) — that's indistinguishable from the player's browser
// having momentarily loaded a stale/cached build of the game that predates
// that card, and permanently erasing a real assignment because of a
// transient load is worse than leaving a slot temporarily unrenderable for
// one screen visit. Only an actually-recognized card whose rarity no longer
// matches its slot (the real legacy-data case this function exists for) or
// a genuine duplicate gets cleared.
function sanitizeStarterDeckSlots() {
  const col = getScreenCollection();
  const seen = new Set();
  let changed = false;
  col.starterDeckSlots = col.starterDeckSlots.map((cardId, idx) => {
    if (!cardId) return cardId;
    const def = CARD_DEFS[cardId];
    if (!def) return cardId; // unrecognized right now — leave it, don't erase real data over a possibly-stale load
    if (def.rarity !== STARTER_DECK_RARITIES[idx] || seen.has(cardId)) {
      changed = true;
      return null;
    }
    seen.add(cardId);
    return cardId;
  });
  if (changed) saveScreenCollection();
}

function renderStarterDeckSection() {
  sanitizeStarterDeckSlots();
  const col = getScreenCollection();
  const grid = document.getElementById('starterDeckGrid');
  grid.innerHTML = '';
  STARTER_DECK_MILESTONES.forEach((levelReq, idx) => {
    const isUnlocked = col.highestLevelBeaten >= levelReq;
    const assignedCardId = col.starterDeckSlots[idx];

    if (isUnlocked && assignedCardId && CARD_DEFS[assignedCardId]) {
      const fakeGroup = { id: assignedCardId, cards: [{ id: assignedCardId, used: false, uid: -1 }] };
      const { el } = buildCardElement(fakeGroup);
      el.addEventListener('click', () => openCardEnlarge(assignedCardId));

      const wrap = document.createElement('div');
      wrap.className = 'starter-slot-wrap';
      wrap.dataset.slotIdx = String(idx);
      // Stable anchor for the tutorial's "every 10 levels" step to highlight
      // and scroll to, regardless of which state (filled/empty/locked) this
      // very first slot happens to be in for the current player.
      if (idx === 0) wrap.id = 'starterSlot0';
      wrap.appendChild(el);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'starter-remove-btn';
      removeBtn.textContent = '\u2715 Remove';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearStarterSlot(idx);
      });
      wrap.appendChild(removeBtn);

      grid.appendChild(wrap);
      return;
    }

    const rarityLabel = getRarityDisplayName(STARTER_DECK_RARITIES[idx]);
    const rarityColor = STARTER_DECK_RARITIES[idx] === 'rare' ? '#3d6fa8' : STARTER_DECK_RARITIES[idx] === 'uncommon' ? '#4a8f4a' : STARTER_DECK_RARITIES[idx] === 'white' ? '#e8e8e8' : '#e8b84b';
    const slot = document.createElement('div');
    slot.dataset.slotIdx = String(idx);
    if (idx === 0) slot.id = 'starterSlot0';
    // Outline every empty/locked slot in its own rarity's color — a filled
    // slot already gets this for free from buildCardElement's own border,
    // but the placeholder states need it set explicitly so you can see at a
    // glance (before beating any levels) which upcoming slots are Rare.
    slot.style.borderColor = rarityColor;
    if (isUnlocked) {
      slot.className = 'starter-slot unlocked-empty';
      slot.innerHTML = `<span class="starter-slot-empty-label">Empty</span><span class="starter-slot-req" style="color:${rarityColor}">${rarityLabel}</span>`;
    } else {
      slot.className = 'starter-slot locked';
      slot.innerHTML = `<span class="starter-slot-lock-icon">&#128274;</span><span class="starter-slot-req">Beat Level ${levelReq} (${rarityLabel})</span>`;
    }
    grid.appendChild(slot);
  });
}

function renderStatsSection() {
  const el = document.getElementById('statsGrid');
  if (!el) return;
  const s = getScreenStats();
  const isPlus = activeCollectionScreenMode === 'plus';
  const tiles = [
    { label: 'Runs Played', value: s.runsStarted },
    { label: 'Runs Lost', value: s.runsLost },
    { label: 'Levels Cleared', value: s.totalLevelsCleared },
    { label: 'Best Level', value: isPlus ? s.bestLevelPlus : s.bestLevel },
    { label: 'Pieces Captured', value: s.piecesCaptured },
    { label: 'Pieces Lost', value: s.piecesLost },
    { label: 'Cards Played', value: s.cardsPlayed },
    { label: 'Kings Crowned', value: s.kingsCrowned },
    { label: 'Glory Points', value: (getScreenCollection().masteryShards || 0).toLocaleString() },
  ];
  el.innerHTML = tiles.map(t => `
    <div class="stat-tile">
      <div class="stat-tile-value">${t.value}</div>
      <div class="stat-tile-label">${t.label}</div>
    </div>
  `).join('');
}

// Which collectible cards can actually ever show up in this screen's mode.
// New Puzzle strips every plusOnly card out entirely — those can never be
// earned there (see the same plusOnly filter used for reward pools/starter
// deck/dev hand) — so its total/locked-slot count only ever counts cards it
// could realistically unlock, instead of counting New-Run-only cards it can
// never get.
function getScreenCollectibleCardIds() {
  return activeCollectionScreenMode === 'plus'
    ? COLLECTIBLE_CARD_IDS
    : COLLECTIBLE_CARD_IDS.filter(id => !CARD_DEFS[id].plusOnly);
}

const COLLECTION_RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3, white: 4 };
function getSortedScreenCollectibleCardIds() {
  // Stable within each rarity so the hand-authored CARD_DEFS order remains
  // familiar, while the entire single grid is grouped Common → Uncommon →
  // Rare → White exactly as displayed by the game's rarity system.
  return getScreenCollectibleCardIds()
    .map((id, index) => ({ id, index }))
    .sort((a, b) =>
      (COLLECTION_RARITY_ORDER[CARD_DEFS[a.id].rarity] ?? 99) -
      (COLLECTION_RARITY_ORDER[CARD_DEFS[b.id].rarity] ?? 99) ||
      a.index - b.index
    )
    .map(entry => entry.id);
}

function renderCollectionScreen() {
  // Make sure the unlock list is current whenever this screen renders.
  // The
  // unlock list is current the instant this screen actually renders —
  // don't rely on having passed through one of the other trigger points
  // (starting a run, resuming a run, flipping the dev toggle) first.
  const titleEl = document.getElementById('collectionTitle');
  if (titleEl) titleEl.textContent = activeCollectionScreenMode === 'plus' ? 'Card Collection' : 'Card Collection (New Puzzle)';
  renderStatsSection();
  const col = getScreenCollection();
  const grid = document.getElementById('collectionGrid');
  const countEl = document.getElementById('collectionCount');
  grid.innerHTML = '';
  const screenCardIds = getSortedScreenCollectibleCardIds();
  const total = screenCardIds.length;
  const unlockedCount = screenCardIds.filter(id => col.unlockedCards.includes(id)).length;
  countEl.textContent = `${unlockedCount}/${total}`;

  screenCardIds.forEach(cardId => {
    const unlocked = col.unlockedCards.includes(cardId);
    const fakeGroup = { id: cardId, cards: [{ id: cardId, used: false, uid: -1 }] };
    const { el } = buildCardElement(fakeGroup);
    el.addEventListener('click', () => {
      openCardEnlarge(cardId);
      if (tutorial.active && tutorial.step === 15 && tutorial.upgradeCardId === cardId) {
        advanceTutorial(16);
      }
    });
    el.setAttribute('aria-label', CARD_DEFS[cardId].name + (unlocked ? '' : ' — Locked'));

    const wrap = document.createElement('div');
    const rarity = CARD_DEFS[cardId].rarity || 'common';
    wrap.className = `collection-card-wrap collection-rarity-${rarity}` + (unlocked ? '' : ' collection-locked');
    wrap.dataset.rarityLabel = getRarityDisplayName(rarity);
    wrap.dataset.cardId = cardId;
    if (tutorial.active && tutorial.upgradeCardId === cardId) wrap.id = 'tutorialUpgradeCard';
    wrap.appendChild(el);

    grid.appendChild(wrap);
  });
}

// ── FIRST-TIME TUTORIAL ──
// Fixed script: 1 of yours vs 3 enemies on a plain 6x6 board, running on the
// real New Run engine so movement/capture/king promotion/cards all behave
// exactly like a real game — only the enemy turns and the board setup are
// hard-scripted instead of random, so this always plays out the same way.
// Steps 10-14 walk past the game board entirely (the reward screen, the main
// menu, the collection screen) — see startTutorial()'s move of #tutorialBanner
// to a fixed, always-on-top element so the same banner can follow the player
// across all of them instead of disappearing whenever #gameApp is hidden.
const TUTORIAL_STEPS = [
  /* 0  */ { text: 'Welcome to King Me. A roguelike checkers game where every move counts.', showNext: true },
  /* 1  */ { text: 'Move your piece to the highlighted square.', highlightCells: [{ row: 5, col: 0 }, { row: 4, col: 1 }] },
  /* 2  */ { text: 'You are out of moves. Click End Turn.', highlightEl: 'endTurnBtn' },
  /* 3  */ { text: 'The enemy moved close enough to jump — take the capture!', highlightCells: [{ row: 4, col: 1 }, { row: 2, col: 3 }] },
  /* 4  */ { text: 'That enemy was worth 100 Glory Points. Every enemy piece is worth 100 points. Only jump captures build your multiplier; chain jumps raise it higher. The multiplier resets when your turn ends or one of your pieces is lost.', showNext: true },
  /* 5  */ { text: 'Click End Turn.', highlightEl: 'endTurnBtn' },
  /* 6  */ { text: 'The enemy has been declared king! They can now move across the entire board diagonally.', showNext: true },
  /* 7  */ { text: "Watch — a king isn't limited to one step at a time. It can slide clear across the board on the diagonal.", showNext: false },
  /* 8  */ { text: 'I think you have a card for this. Click on a stack of cards and use one to destroy the King!', highlightEl: 'stackUncommon' },
  /* 9  */ { text: 'Click the piece you would like to launch into the enemy.', highlightCells: [{ row: 2, col: 3 }] },
  /* 10 */ { text: 'Now take out the King!', highlightCells: [{ row: 5, col: 4 }] },
  /* 11 */ { text: "Every run begins with one free Common pack. Tap it to tear it open, reveal a random card, then hit Continue.", showNext: false },
  /* 12 */ { text: "Tap Card Collection to browse every card in the game.", highlightEl: 'menuCollectionBtn', showNext: false },
  /* 13 */ { text: "Black cards are Common, green cards are Uncommon, blue cards are Rare, and pale cards are Bonus. Hollow cards are locked, but you can still tap them to study their abilities.", showNext: true },
  /* 14 */ { text: "Every 3 levels you can open a card pack. Use them to help advance and earn more Glory Points.", showNext: true },
  /* 15 */ { text: "Cards grow stronger through permanent upgrade orbs. Common orbs cost 2,500 Glory, Uncommon cost 5,000, and Rare cost 10,000. Tap the glowing card to learn how upgrades work.", highlightEl: 'tutorialUpgradeCard', showNext: false },
  /* 16 */ { text: "The hollow circles at the bottom are upgrade orbs. Tap the glowing orb to inspect this card's Base effect and every upgrade ability.", highlightEl: 'tutorialUpgradeOrb', showNext: false },
  /* 17 */ { text: "The panel shows the Base ability and what every orb adds. Filled orbs are upgrades you permanently own. Review the abilities above, then tap Next.", showNext: true },
  /* 18 */ { text: "Your first upgrade is free during the tutorial. Tap the glowing Upgrade button now.", highlightEl: 'tutorialFreeUpgradeBtn', showNext: false },
  /* 19 */ { text: "The first orb is now filled, and that upgraded ability is permanently unlocked. Earn Glory, upgrade your collection, become a King, and fight for the top of the leaderboard!", showNext: true },
];

function startTutorial() {
  enterGame();
  // Flattens the board's 3D tilt for the duration of the tutorial — see the
  // body.tutorial-mode CSS rule on .board-tilt for why.
  document.body.classList.add('tutorial-mode');
  // Set BEFORE initState('plus') runs, not after — initState() ends by
  // calling setupLevel(), which unconditionally calls saveGame() to protect
  // against force-closes mid-level. saveGame() itself skips while
  // tutorial.active is true (never persist the scripted fake board over a
  // real save), but that guard only works if it's already true by the time
  // setupLevel() runs. Setting it after initState() returned was too late —
  // it let setupLevel()'s saveGame() call slip through and silently write
  // the tutorial's throwaway pre-script board into the real New Run save
  // slot, which could then make a later boot think a real save exists and
  // skip straight to the main menu instead of the tutorial.
  tutorial.active = true;
  initState('plus'); // cheap way to get a fully-shaped, valid state object

  state.level = 1;
  // The tutorial always uses a real 6x6 board.
  state.boardRows = 6;
  state.boardCols = 6;
  state.specialBoardType = null;
  state.board = [];
  for (let r = 0; r < 6; r++) {
    state.board.push([]);
    for (let c = 0; c < 6; c++) state.board[r].push({ piece: null });
  }
  // Positions are chosen so every scripted enemy move below is a normal,
  // believable single diagonal step — not a multi-row "teleport" — while
  // still landing exactly where the script needs them each turn.
  state.board[5][0].piece = { type: 'yours', king: false, id: state.pieceIdCounter++, ability: null, wasKing: false, variant: 0 };
  // All three start on DARK squares only (every diagonal step preserves
  // light/dark, so picking dark starts keeps every later position dark too —
  // matches how levels 1-10 normally look, no early light-square pieces).
  state.board[2][1].piece = { type: 'enemy', king: false, id: state.pieceIdCounter++, ability: null, variant: 0 };
  state.board[3][4].piece = { type: 'enemy', king: false, id: state.pieceIdCounter++, ability: null, variant: 0 };
  state.board[2][3].piece = { type: 'enemy', king: false, id: state.pieceIdCounter++, ability: null, variant: 0 };
  state.cards = [{ id: 'catapult', used: false, uid: state.cardUidCounter++ }];
  state.selected = null;
  state.validMoves = [];
  state.activeCard = null;
  state.activeCardUid = null;
  state.assassinateTargets = []; state.demotionTargets = [];
  state.turnPhase = 'player';
  state.plusMovedIds = [];
  state.plusCardsUsed = 0;
  state.plusTurnPieceCount = 1;
  state.lastEnemyCount = 3;
  state.lastYoursCount = 1;
  state.gameOver = false;

  // initState() briefly created a normal random board before the scripted
  // tutorial board replaced it. Re-seed Glory from the tutorial positions so
  // that swap cannot be mistaken for dozens of captures or losses.
  initializeGloryLevel();

  render();
  showTutorialStep(0);
}

function showTutorialStep(step) {
  tutorial.step = step;
  const cfg = TUTORIAL_STEPS[step];
  if (!cfg) return;
  tutorial.highlightCells = cfg.highlightCells || [];
  const banner = document.getElementById('tutorialBanner');
  const textEl = document.getElementById('tutorialBannerText');
  const nextBtn = document.getElementById('tutorialNextBtn');
  if (banner && textEl && nextBtn) {
    textEl.textContent = cfg.text;
    // NOTE: '' would just clear the inline style and fall back to the
    // stylesheet's #tutorialNextBtn { display: none; } — that's exactly why
    // the button never appeared. Has to be set to an actual visible value.
    nextBtn.style.display = cfg.showNext ? 'inline-block' : 'none';
    banner.classList.add('active');
  }
  applyTutorialElementHighlight(cfg.highlightEl || null);
  render();

  if (step === 7) {
    // Non-interactive: demonstrate a king's long diagonal slide, then
    // auto-continue — no tap/click is expected from the player for this step.
    setTimeout(() => playTutorialKingDemo(8), 900);
  }
}

// Non-interactive demo for step 6 — slides the tutorial's newly-crowned
// enemy king from the back row clear across the board and back, purely to
// show off the long diagonal move, then continues the script. Reuses
// moveTutorialPiece/render exactly like the scripted enemy turns do, just
// without the player having done anything to trigger it.
function playTutorialKingDemo(nextStep) {
  moveTutorialPiece(5, 4, 1, 0);
  render();
  setTimeout(() => {
    moveTutorialPiece(1, 0, 5, 4);
    render();
    setTimeout(() => advanceTutorial(nextStep), 260);
  }, 900);
}

function applyTutorialElementHighlight(elId) {
  document.querySelectorAll('.tutorial-glow-el').forEach(el => el.classList.remove('tutorial-glow-el'));
  if (elId) {
    const el = document.getElementById(elId);
    if (el) el.classList.add('tutorial-glow-el');
  }
}

function advanceTutorial(step) {
  showTutorialStep(step);
}

// Checks whether whatever the CURRENT step is waiting for has just happened,
// and if so, moves on. Called at the end of every render() while the
// tutorial is active — the two "click End Turn" steps (2 and 4) are NOT
// handled here since they advance via the scripted enemy-turn completion,
// and the final win (step 8) advances via the triggerWin() interception.
// A move just completed calls render() to kick off its slide-into-place FLIP
// animation, then checkTutorialProgress() runs at the tail of that SAME
// render() and (if the step just finished) immediately calls advanceTutorial,
// which renders AGAIN to refresh the banner/highlights — tearing the board
// down and rebuilding it before the first render's animation frame ever had
// a chance to paint, so the piece looked like it "teleported" instead of
// sliding. Deferring the advance past the slide's ~220ms transition lets it
// actually finish playing first. The `advancing` guard stops a second
// render() firing during that wait from queuing a duplicate advance.
function checkTutorialProgress() {
  if (!tutorial.active || tutorial.advancing) return;
  if (tutorial.step === 1 && state.board[4][1]?.piece?.type === 'yours') {
    tutorial.advancing = true;
    setTimeout(() => { tutorial.advancing = false; advanceTutorial(2); }, 280);
  } else if (tutorial.step === 3 && countPieces('enemy') === 2 && state.board[2][3]?.piece?.type === 'yours') {
    tutorial.advancing = true;
    setTimeout(() => { tutorial.advancing = false; advanceTutorial(4); }, 280);
  } else if (tutorial.step === 8 && state.activeCard === 'catapult') {
    advanceTutorial(9); // no piece slide involved, safe to advance immediately
  } else if (tutorial.step === 9 && state.selected) {
    advanceTutorial(10); // no piece slide involved, safe to advance immediately
  }
}

function tutorialNextClicked() {
  if (tutorial.step === 0) advanceTutorial(1);
  else if (tutorial.step === 4) advanceTutorial(5);
  else if (tutorial.step === 6) advanceTutorial(7);
  else if (tutorial.step === 13) advanceTutorial(14);
  else if (tutorial.step === 14) advanceTutorial(15);
  else if (tutorial.step === 17) {
    advanceTutorial(18);
    openMasteryOrbInfo(tutorial.upgradeCardId);
    applyTutorialElementHighlight('tutorialFreeUpgradeBtn');
  }
  else if (tutorial.step === 19) finishTutorial();
}

function finishTutorial() {
  tutorial.active = false;
  tutorial.highlightCells = [];
  markTutorialSeen();
  const banner = document.getElementById('tutorialBanner');
  if (banner) banner.classList.remove('active');
  applyTutorialElementHighlight(null);
  document.body.classList.remove('tutorial-mode');
  // The last few steps walk through the Collection screen, which is still
  // open at this point — close it before returning to the main menu.
  document.getElementById('collectionScreen').classList.remove('active');
  document.getElementById('cardEnlargeOverlay').classList.remove('active');
  document.getElementById('masteryOrbOverlay').classList.remove('active');
  tutorial.upgradeCardId = null;
  showMainMenu();
}

// Exact whitelist of tappable board squares per step — steps not listed here
// (0, 2, 4, 5, 6, 9) expect ZERO board taps: they're either a pure "Next"
// prompt, or "click End Turn" / "click the card stack", none of which go
// through cellClick at all.
function tutorialAllowsCellClick(row, col) {
  switch (tutorial.step) {
    case 1: return (row === 5 && col === 0) || (row === 4 && col === 1);
    case 3: return (row === 4 && col === 1) || (row === 2 && col === 3);
    case 9: return (row === 2 && col === 3);
    case 10: return (row === 5 && col === 4);
    default: return false;
  }
}

// The tutorial is a genuinely guided sequence: while it is active, the only
// control that can receive an input is the one named by the current prompt.
// Individual gameplay functions already reject many out-of-order actions, but
// that was not enough on menu screens — New Run, New Puzzle, Leaderboard, Back,
// and other unrelated buttons could still navigate away and bypass the rest of
// the walkthrough. This single capture-phase whitelist covers every screen and
// every input method before those controls' own handlers can run.
function tutorialAllowsUiTarget(target) {
  if (!tutorial.active) return true;
  if (!(target instanceof Element)) return false;

  // The mandatory first-launch name gate appears before the tutorial can
  // begin. Keep its input and Save button usable even though tutorial state
  // has already been prepared in the background.
  if (target.closest('#nameEntryOverlay.active')) return true;

  switch (tutorial.step) {
    // Explanatory steps advance only through the tutorial's own Next button.
    case 0:
    case 4:
    case 6:
    case 13:
    case 14:
    case 17:
    case 19:
      return !!target.closest('#tutorialNextBtn');

    // Board movement/capture steps use the same exact square whitelist as
    // cellClick(), including taps directly on a piece image inside the cell.
    case 1:
    case 3:
    case 9:
    case 10: {
      const cell = target.closest('#board .cell');
      if (!cell) return false;
      return tutorialAllowsCellClick(Number(cell.dataset.row), Number(cell.dataset.col));
    }

    case 2:
    case 5:
      return !!target.closest('#endTurnBtn');

    // The king demonstration is automatic; player input is intentionally off.
    case 7:
      return false;

    // Let the requested Uncommon stack open, then allow interaction only with
    // its carousel stage so the player can inspect and activate Catapult.
    case 8:
      return !!target.closest('#stackUncommon, #carouselOverlayStage');

    // The free pack and its Continue button are the only two actions on the
    // reward screen that this tutorial step asks the player to perform.
    case 11:
      return !!target.closest('#cardPackStage .glory-pack, #continueBtn');

    // On the main menu, Card Collection is the sole legal destination.
    case 12:
      return !!target.closest('#menuCollectionBtn');

    // Collection mastery walkthrough: one card, then one orb, then the free
    // upgrade button. Every surrounding card/control remains locked.
    case 15:
      return !!target.closest('#tutorialUpgradeCard') && !target.closest('.mastery-orb');
    case 16:
      return !!target.closest('#tutorialUpgradeOrb');
    case 18:
      return !!target.closest('#tutorialFreeUpgradeBtn');

    default:
      return false;
  }
}

function blockOutOfOrderTutorialInput(event) {
  if (!tutorial.active || tutorialAllowsUiTarget(event.target)) return;
  if (event.cancelable) event.preventDefault();
  event.stopImmediatePropagation();
}

function initTutorialInputLock() {
  // pointerdown stops mouse, pen, and modern touch input before a control can
  // react; click also catches keyboard-generated and scripted button clicks.
  document.addEventListener('pointerdown', blockOutOfOrderTutorialInput, true);
  document.addEventListener('click', blockOutOfOrderTutorialInput, true);
  // Older Android WebViews may not emit Pointer Events.
  document.addEventListener('touchstart', blockOutOfOrderTutorialInput, { capture: true, passive: false });
  document.addEventListener('keydown', (event) => {
    if (!tutorial.active) return;
    if ((event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') &&
        !tutorialAllowsUiTarget(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

function moveTutorialPiece(fr, fc, tr, tc) {
  const p = state.board[fr][fc].piece;
  if (!p) return;
  state.board[fr][fc].piece = null;
  state.board[tr][tc].piece = p;
}

function finishTutorialEnemyTurn(nextStep) {
  state.turnPhase = 'player';
  state.plusMovedIds = [];
  state.plusCardsUsed = 0;
  state.plusTurnPieceCount = countPieces('yours');
  render(); // also runs the existing auto-king sweep, so reaching row 5 crowns automatically
  // Wait for that render's slide-into-place animation to actually finish
  // before rendering again for the next prompt — otherwise the second
  // render tears the board down mid-slide and the pieces just snap into
  // place instead of sliding.
  setTimeout(() => advanceTutorial(nextStep), 320);
}

// Replaces the real random enemy AI for both of the tutorial's enemy turns.
// Real gameplay's enemy AI (see actOnePiece/nextPiece in startEnemyTurn)
// moves one piece at a time — move, render(), short pause, next piece —
// so each enemy gets its own visible FLIP slide instead of the whole side
// jumping at once. The tutorial's scripted moves used to fire every piece
// in a single synchronous batch before the one render() call, so all of
// them appeared to teleport into place together with no per-piece slide.
// This plays each scripted move through the same one-at-a-time pacing.
const TUTORIAL_ENEMY_STEP_DELAY = 220; // matches the FLIP slide's own 0.22s transition
function playTutorialEnemyMoves(moves, nextStep) {
  let idx = 0;
  function next() {
    if (idx >= moves.length) {
      setMessage('');
      finishTutorialEnemyTurn(nextStep);
      return;
    }
    const [fr, fc, tr, tc] = moves[idx++];
    moveTutorialPiece(fr, fc, tr, tc);
    render();
    setTimeout(next, TUTORIAL_ENEMY_STEP_DELAY);
  }
  next();
}

function runScriptedTutorialEnemyTurn() {
  state.turnPhase = 'enemy';
  render();
  setMessage('Enemy turn...');
  setTimeout(() => {
    if (tutorial.step === 2) {
      // Turn 1 — each enemy takes one normal diagonal step forward. Order
      // matters: B vacates (3,4) before C steps into it. (2,1)->(3,2) lands
      // right next to your piece at (4,1), ready to be jumped.
      playTutorialEnemyMoves([
        [2, 1, 3, 2], // A -> about to be captured
        [3, 4, 4, 3], // B -> pre-king position
        [2, 3, 3, 4], // C -> follows into B's old square
      ], 3);
    } else if (tutorial.step === 5) {
      // Turn 2 — again, one normal diagonal step each. (4,3)->(5,4) reaches
      // the back row and gets auto-crowned. C now steps to (4,5) instead of
      // the old (4,3) — still a normal single diagonal step, and still well
      // within a single Catapult blast centered on (5,4) (a 3x3 area) so both
      // die together later, but it leaves the (5,4)-(4,3)-(3,2)-(2,1)-(1,0)
      // diagonal completely clear for the king's movement demo in step 6.
      playTutorialEnemyMoves([
        [4, 3, 5, 4], // B -> king row, auto-crowned
        [3, 4, 4, 5], // C -> normal diagonal step, off the king's demo diagonal
      ], 6);
    }
  }, 600);
}

function showMainMenu() {
  document.getElementById('gameApp').style.display = 'none';
  document.getElementById('puzzleMenu').classList.remove('active');
  // New Run's own Continue button only ever reflects New Run's save slot —
  // New Puzzle has its own separate Continue button on its own hub screen
  // (see showPuzzleMenu), since the two games are now fully standalone.
  const existingSave = loadGame('plus');
  const continueBtn = document.getElementById('menuContinueBtn');
  // Used to require existingSave.level > 1 here, which meant a save made
  // during your very first level (before you'd cleared it once) didn't
  // count as "real" progress — no Continue button, and (see the New Run
  // handlers below) no warning before it got silently wiped either. That's
  // exactly why progress only ever seemed to survive once you'd finished a
  // level: level 1 itself was never actually protected. Any non-gameOver
  // save is real in-progress state and deserves a Continue option.
  if (existingSave && !existingSave.gameOver) {
    continueBtn.style.display = '';
    continueBtn.textContent = `Continue Run — Level ${existingSave.level}`;
  } else {
    continueBtn.style.display = 'none';
  }
  document.getElementById('mainMenu').classList.add('active');
  if (typeof refreshCheckpointButtons === 'function') refreshCheckpointButtons();
  playMenuMusic();
}

// New Puzzle's own hub — mirrors showMainMenu()'s structure but scoped
// entirely to the standalone Puzzle save slot/stats/collection.
function showPuzzleMenu() {
  document.getElementById('gameApp').style.display = 'none';
  document.getElementById('mainMenu').classList.remove('active');
  const existingSave = loadGame('normal');
  const continueBtn = document.getElementById('puzzleContinueBtn');
  if (existingSave && !existingSave.gameOver) {
    continueBtn.style.display = '';
    continueBtn.textContent = `Continue Run — Level ${existingSave.level}`;
  } else {
    continueBtn.style.display = 'none';
  }
  document.getElementById('puzzleMenu').classList.add('active');
  playMenuMusic();
}

function enterGame() {
  document.getElementById('mainMenu').classList.remove('active');
  // New Puzzle's hub screen (#puzzleMenu) is a second, separate `.main-menu`
  // instance — every entry point into actual play funnels through here (New
  // Run, New Puzzle, Continue, tutorial), so this has to hide BOTH hub
  // screens, not just the main one. Without this, starting a Puzzle run left
  // #puzzleMenu sitting active on top of the game board (same z-index tier
  // as #mainMenu) — the run genuinely started under the hood, but visually
  // it looked exactly like nothing had happened / like it bounced back to
  // the menu.
  document.getElementById('puzzleMenu').classList.remove('active');
  document.getElementById('gameApp').style.display = '';
  pauseMenuMusic();
  // A loss or forfeit hides the card stacks (hideCardsHand(), so they don't
  // sit there behind the Lose overlay) but nothing was undoing that when the
  // NEXT run started — New Run/Continue/tutorial all funnel through here
  // (see the comment above this function), so this is the one place that's
  // guaranteed to run every time actual play begins. Without it, a run
  // started right after a loss/forfeit would look like the card stacks had
  // vanished entirely (just black space under the board), when really they
  // were still there, just invisible.
  showCardsHand();
}

// Track which mode is pending while the level-select overlay is open
let pendingRunMode = null;
// Sound-effects on/off choice pending while the level-select overlay is open
// (see the toggle button wired in initMenuUI) — defaults to on (false =
// not muted) every time the overlay is opened, and flows through to
// doStartRun -> initState(..., sfxMuted) where it becomes state.sfxMuted for
// the whole run.
let pendingSfxMuted = false;

function updateSfxToggleLabel() {
  document.getElementById('levelSelectSfxToggle').textContent =
    'Sound Effects: ' + (pendingSfxMuted ? 'Off' : 'On');
}

function openLevelSelect(mode) {
  pendingRunMode = mode;
  pendingSfxMuted = false;
  updateSfxToggleLabel();
  const best = mode === 'plus'
    ? (stats.legitBestLevelPlus || 0)
    : (puzzleStats.legitBestLevel || 0);
  document.getElementById('levelSelectTitle').textContent =
    mode === 'plus' ? 'NEW RUN' : 'NEW PUZZLE';
  document.getElementById('levelSelectL10').style.display = best >= 10 ? '' : 'none';
  document.getElementById('levelSelectL20').style.display = best >= 20 ? '' : 'none';
  // Previously this skipped the overlay entirely and started at level 1
  // immediately for players with no checkpoints unlocked (best < 10). That
  // shortcut is removed now that the overlay is also how every player
  // chooses their sound-effects on/off setting for the run — everyone needs
  // to see it, not just players with checkpoints to pick between.
  document.getElementById('levelSelectOverlay').classList.add('active');
}

function closeLevelSelect() {
  document.getElementById('levelSelectOverlay').classList.remove('active');
  pendingRunMode = null;
}

function doStartRun(mode, startLevel, sfxMuted) {
  clearSave(mode);
  enterGame();
  if (!CARTOON_SHOWCASE_BUILD && mode === 'plus') {
    stats.runsStarted++;
    stats.runsStartedPlus++;
    saveStats();
  } else if (!CARTOON_SHOWCASE_BUILD) {
    puzzleStats.runsStarted++;
    savePuzzleStats();
  }
  initState(mode, startLevel || 1, sfxMuted);
}

// startRunAtLevel kept as alias for restartLevelFresh and other callers
function startRunAtLevel(mode, startLevel) { doStartRun(mode, startLevel); }

function refreshCheckpointButtons() { /* no-op — level select is a popup now */ }

function initMenuUI() {
  initTutorialInputLock();
  const developerSkipBtn = document.getElementById('developerSkipBtn');
  if (developerSkipBtn) developerSkipBtn.style.display = CARTOON_SHOWCASE_BUILD ? '' : 'none';
  // New Puzzle is now a fully standalone sub-game reached through its own
  // hub screen (mirroring the main menu), instead of jumping straight to
  // the level-select overlay.
  document.getElementById('menuNewRunBtn').addEventListener('click',     () => showPuzzleMenu());
  document.getElementById('menuNewRunPlusBtn').addEventListener('click', () => openLevelSelect('plus'));

  document.getElementById('puzzleStartBtn').addEventListener('click', () => openLevelSelect('normal'));
  document.getElementById('puzzleContinueBtn').addEventListener('click', () => {
    enterGame();
    loadOrInitState('normal');
    applySfxMuteFromState();
  });
  document.getElementById('puzzleCollectionBtn').addEventListener('click', () => {
    activeCollectionScreenMode = 'normal';
    renderCollectionScreen();
    document.getElementById('collectionScreen').classList.add('active');
  });
  document.getElementById('puzzleLeaderboardBtn').addEventListener('click', () => {
    openLeaderboardScreen('normal');
  });
  document.getElementById('puzzleBackBtn').addEventListener('click', () => {
    showMainMenu();
  });

  // Level select overlay buttons wired here — no inline onclick
  document.getElementById('levelSelectL1').addEventListener('click', () => {
    const mode = pendingRunMode; const sfxMuted = pendingSfxMuted; closeLevelSelect(); if (mode) doStartRun(mode, 1, sfxMuted);
  });
  document.getElementById('levelSelectL10').addEventListener('click', () => {
    const mode = pendingRunMode; const sfxMuted = pendingSfxMuted; closeLevelSelect(); if (mode) doStartRun(mode, 10, sfxMuted);
  });
  document.getElementById('levelSelectL20').addEventListener('click', () => {
    const mode = pendingRunMode; const sfxMuted = pendingSfxMuted; closeLevelSelect(); if (mode) doStartRun(mode, 20, sfxMuted);
  });
  document.getElementById('levelSelectSfxToggle').addEventListener('click', () => {
    pendingSfxMuted = !pendingSfxMuted;
    updateSfxToggleLabel();
  });
  document.getElementById('levelSelectCancel').addEventListener('click', () => closeLevelSelect());

  document.getElementById('menuContinueBtn').addEventListener('click', () => {
    enterGame();
    loadOrInitState('plus');
    applySfxMuteFromState();
  });

  document.getElementById('menuCollectionBtn').addEventListener('click', () => {
    activeCollectionScreenMode = 'plus';
    renderCollectionScreen();
    document.getElementById('collectionScreen').classList.add('active');
    if (tutorial.active && tutorial.step === 12) advanceTutorial(13);
  });

  document.getElementById('menuLeaderboardBtn').addEventListener('click', () => {
    // New Run's own Leaderboard button only ever shows the New Run board —
    // New Puzzle has its own separate Leaderboard button/tab on its own hub
    // (see puzzleLeaderboardBtn), so the tab switcher itself is no longer
    // needed on either screen.
    openLeaderboardScreen('plus');
  });

  document.getElementById('leaderboardBackBtn').addEventListener('click', () => {
    document.getElementById('leaderboardScreen').classList.remove('active');
  });

  document.getElementById('lbTabNormal').addEventListener('click', () => setLeaderboardTab('normal'));
  document.getElementById('lbTabPlus').addEventListener('click', () => setLeaderboardTab('plus'));

  document.getElementById('tutorialNextBtn').addEventListener('click', tutorialNextClicked);

  document.getElementById('nameEntrySubmitBtn').addEventListener('click', submitNameEntry);
  document.getElementById('nameEntryInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitNameEntry();
  });

  document.getElementById('collectionBackBtn').addEventListener('click', () => {
    document.getElementById('collectionScreen').classList.remove('active');
  });

  document.getElementById('cardEnlargeOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'cardEnlargeOverlay') closeCardEnlarge();
  });

}

// Whatever the app would normally do on boot once a name is guaranteed to
// exist (see the actual gate right below) — pulled out into its own
// function so submitNameEntry() can resume this after the mandatory
// first-launch name entry succeeds.
function continueBootAfterNameEntry() {
  if (CARTOON_SHOWCASE_BUILD) {
    doStartRun('plus', CARTOON_SHOWCASE_START_LEVEL, false);
  } else if (!hasTutorialBeenSeen() && !loadGame('plus') && !loadGame('normal')) {
    startTutorial();
  } else {
    showMainMenu();
  }
}

// Read the background URL chosen by the portrait/landscape media query and
// decode that exact image before revealing the menu. CSS backgrounds do not
// expose their own load event, so this mirrors the selected resource through
// an Image object without maintaining a second hardcoded asset choice.
function getSelectedMenuBackgroundUrl() {
  const background = document.querySelector('#mainMenu .main-menu-bg');
  if (!background) return '';
  const value = getComputedStyle(background).backgroundImage || '';
  const urls = [...value.matchAll(/url\((['"]?)(.*?)\1\)/g)];
  return urls.length ? urls[urls.length - 1][2] : '';
}

function decodeInitialMenuBackground() {
  const url = getSelectedMenuBackgroundUrl();
  if (!url) return Promise.resolve();
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  if (typeof image.decode === 'function') return image.decode().catch(() => {});
  return new Promise(resolve => {
    image.onload = resolve;
    image.onerror = resolve;
  });
}

async function prepareInitialMenuVisuals() {
  const tasks = [decodeInitialMenuBackground()];
  if (document.fonts && typeof document.fonts.load === 'function') {
    tasks.push(
      document.fonts.load('700 48px "Cinzel Decorative"'),
      document.fonts.load('900 16px "Inter"'),
      document.fonts.load('700 16px "Cinzel"')
    );
  }
  // A failed remote font must never strand an offline installation here.
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise(resolve => setTimeout(resolve, 6000))
  ]);
}

function dismissBootSplash() {
  const splash = document.getElementById('bootSplash');
  if (!splash) return;
  // Let the completed screen paint underneath before fading the cover away.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    splash.classList.add('boot-splash-hidden');
    setTimeout(() => splash.remove(), 260);
  }));
}

async function startInitialBoot() {
  await prepareInitialMenuVisuals();
  if (!CARTOON_SHOWCASE_BUILD && !getPlayerName()) openFirstRunNameEntryModal();
  else continueBootAfterNameEntry();
  dismissBootSplash();
}

// One delegated click listener for the whole board, set up once at boot,
// instead of render() attaching a fresh `cell.addEventListener('click', ...)`
// closure to every single cell on every single render. #board itself is a
// static element (render() only ever clears/rebuilds what's INSIDE it via
// innerHTML/appendChild, it never replaces #board itself), so one listener
// here safely outlives every future render() call. Row/col come off the
// dataset attributes render() stamps on each cell (see cell.dataset.row/col).
function initBoardClickDelegation() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  boardEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || !boardEl.contains(cell)) return;
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    if (Number.isNaN(r) || Number.isNaN(c)) return; // e.g. an out-of-shape filler cell
    cellClick(r, c);
  });
}

// Offline asset cache — see sw.js for the actual caching logic/comments. This
// only registers it; it's a total no-op (silently caught below) on browsers
// without service worker support, and also fails harmlessly if the game is
// opened as a bare file:// page or over plain HTTP, since service workers
// require HTTPS (localhost is exempted, which is why this still works while
// testing locally via a dev server). Registered with a path relative to this
// HTML file rather than a hardcoded absolute one, so it keeps working
// regardless of which subpath the game is actually deployed under.
// ── START ──
// Prepare the two sounds used constantly during ordinary navigation and
// movement before the first tap, so decoding never delays that interaction.
try {
  getCachedSfx(UI_CLICK_SOUND_URL);
  getCachedSfx(PIECE_LAND_SOUND_URL);
} catch (err) {}

activityTimer = setInterval(activityTick, ACTIVITY_TICK_MS);
initBoardClickDelegation();
initUIClickSound();
initCarousels();
initMenuUI();
// Mandatory first-launch gate: no name saved yet means nothing else — not
// the tutorial, not the main menu, nothing — is shown until one is entered.
// There is no cancel/skip control on this overlay.
void startInitialBoot();
