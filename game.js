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

const SANDS_OF_TIME_SOUND_URL = 'data:audio/wav;base64,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ZQC0/1r/wf9yAIcA6v9c/4//QwCaACQAdP9o/wgAlwBYAKH/U//N/3sAfgDe/1H/nP9VAJwAHQBy/3P/KgCkAF0Ap/9i//H/mACSAN7/Yf+7/3cArgAeAHr/i/86ALkAXgCc/3H/CwCrAJYA2f9u/9H/jAC3AB4Ad/+g/1wAwwBaAJ//c/8kALoAjgDR/2v/3/+dALIADQBz/6r/ZwDLAEcAjv99/zAAvgCBAL3/aP/t/6IArQD1/2f/qf96AMUAOgCB/4j/OADFAHcArv9r//7/rQCrAOT/Z//D/4cAxwAtAH3/kf9aANEAdwCr/33/GwDPALEA9f96/+r/rwDgADkAkf+6/4EA9QCCAL//m/9HAO4AwAD3/4//CwDSAPIAPACi/9X/owAJAYYAx/+1/2wADAHLAP7/pP80APIA/wBDALD/8//NABIBjgDH/8v/hwAcAcIA9f+r/z0A/gDzACoApf/3/8oABAFqAKn/v/+CAAIBnwDM/5L/NgDkAMkA/P94/+T/rwDZAC4Adv+Z/2AA1QBaAI3/X/8PALYAfwCx/zr/uf99AJ4A3/83/23/OACgAA8ASv8r/+v/hwBBAGz/CP+U/1UAZACZ/wL/Qv8aAGgA1/8L/w//zv9nAA0AOf/s/oL/RQA8AHP/6P5B/xcAXAC1//7+Df/e/2UA//8x//D+oP9VAEAAdf/z/mb/OABwAMT/FP87/w4AiAAXAEf/If/W/4cAXgCK/yL/of9xAJcA3/88/3b/UgC6ADsAb/9e/x4AxgCGALX/WP/l/7YAwQADAGz/tf+NAOwAVQCW/5j/XgD7AKkA1P+N/yYA6wDoAB0Ak//t/8YACwFtAK7/wP+NABUBtwDf/6v/UAALAe8AIgCj/xIA4QAZAWcAtv/U/6YAHQGnANj/qf9fAAUB3gADAJX/CwDZAPUAPQCS/8T/lAD4AHMAof+K/z8A5ACeAMv/YP/u/6kAuQDz/1j/lf9tALgALABd/1b/EwClAFEAev8o/73/dwByAKP/Ff9l/zoAdgDe/xX/K//m/3IACAA6//f+n/8=';

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
    if (group.id === 'vertical_jump') {
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
        // Captures add to the in-run Glory score through syncGloryScore().
        // The complete remaining run total is banked once in triggerLose();
        // crediting captures here as well would count those points twice.
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
    // Only the centered card and its two neighbors keep decoded artwork.
    // A 20-card rarity carousel previously decoded every 768x768 illustration
    // at once, even though nearly all of them were offscreen.
    setCarouselCardImageActivity(el, absDelta <= 2.05);
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
  /* 14 */ { text: "Every 2 levels you can open a card pack. Use them to help advance and earn more Glory Points.", showNext: true },
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
  if (mode === 'plus') {
    stats.runsStarted++;
    stats.runsStartedPlus++;
    saveStats();
  } else {
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
  if (!CARTOON_SHOWCASE_BUILD && !hasTutorialBeenSeen() && !loadGame('plus') && !loadGame('normal')) {
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
  if (!getPlayerName()) openFirstRunNameEntryModal();
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