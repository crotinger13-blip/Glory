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
      ? buildFloatingCardRulesHTML(centeredGroup.id, baseOnly ? 0 : null, baseOnly, true)
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
  if (activeCollectionScreenMode !== 'normal') return;
  const milestones = PUZZLE_STARTER_DECK_MILESTONES;
  const rarities = PUZZLE_STARTER_DECK_RARITIES;

  if (!col.unlockedCards.includes(cardId)) {
    showGameDialog(`${def.name} is still locked.`, { title: 'CARD LOCKED' });
    return;
  }

  if (col.starterDeckSlots.includes(cardId)) {
    showGameDialog(`${def.name} is already in your Starter Deck — pick a different card, or remove it from its current slot first.`, { title: 'ALREADY EQUIPPED' });
    return;
  }

  const idx = milestones.findIndex((levelReq, i) =>
    col.highestLevelBeaten >= levelReq &&
    !col.starterDeckSlots[i] &&
    rarities[i] === def.rarity
  );
  if (idx === -1) {
    const rarityLabel = getRarityDisplayName(def.rarity);
    const hasAnyRaritySlotAtAll = rarities.includes(def.rarity);
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
  if (activeCollectionScreenMode !== 'normal') return;
  const rarities = PUZZLE_STARTER_DECK_RARITIES;
  const seen = new Set();
  let changed = false;
  col.starterDeckSlots = (col.starterDeckSlots || []).slice(0, rarities.length).map((cardId, idx) => {
    if (!cardId) return cardId;
    const def = CARD_DEFS[cardId];
    if (!def) return cardId; // unrecognized right now — leave it, don't erase real data over a possibly-stale load
    if (def.rarity !== rarities[idx] || seen.has(cardId)) {
      changed = true;
      return null;
    }
    seen.add(cardId);
    return cardId;
  });
  if (changed) saveScreenCollection();
}

function renderStarterDeckSection() {
  const section = document.getElementById('puzzleStarterDeckSection');
  const grid = document.getElementById('starterDeckGrid');
  if (!section || !grid) return;
  const isPuzzle = activeCollectionScreenMode === 'normal';
  section.style.display = isPuzzle ? '' : 'none';
  if (!isPuzzle) { grid.innerHTML = ''; return; }
  sanitizeStarterDeckSlots();
  const col = getScreenCollection();
  grid.innerHTML = '';
  PUZZLE_STARTER_DECK_MILESTONES.forEach((levelReq, idx) => {
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

    const rarityLabel = getRarityDisplayName(PUZZLE_STARTER_DECK_RARITIES[idx]);
    const rarityColor = PUZZLE_STARTER_DECK_RARITIES[idx] === 'rare' ? '#3d6fa8' : PUZZLE_STARTER_DECK_RARITIES[idx] === 'uncommon' ? '#4a8f4a' : '#e8b84b';
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
  renderStarterDeckSection();
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

    if (activeCollectionScreenMode === 'normal' && unlocked && PUZZLE_STARTER_DECK_RARITIES.includes(rarity)) {
      const addBtn = document.createElement('button');
      addBtn.className = 'collection-add-btn';
      const equipped = col.starterDeckSlots.includes(cardId);
      addBtn.textContent = equipped ? 'In Starter Deck' : '+ Add to Starter Deck';
      addBtn.disabled = equipped;
      addBtn.addEventListener('click', event => {
        event.stopPropagation();
        addCardToDeck(cardId);
        renderCollectionScreen();
      });
      wrap.appendChild(addBtn);
    }

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

const PUZZLE_TUTORIAL_STEPS = [
  { text: 'Welcome to Puzzle Mode. Each level is a fixed checkers challenge.', showNext: true },
  { text: 'Capture every enemy piece to solve the level. Enemy pieces never move in Puzzle Mode, so study the board and plan your route.', showNext: true },
  { text: 'Start by moving your piece to the highlighted square.', highlightCells: [{ row: 4, col: 1 }, { row: 3, col: 2 }] },
  { text: 'Notice that the enemy stayed exactly where it was. Puzzle enemies remain stationary while you arrange your captures.', showNext: true },
  { text: 'Now jump the highlighted enemy to capture it.', highlightCells: [{ row: 3, col: 2 }, { row: 1, col: 4 }] },
  { text: 'Good. Clear every remaining enemy to complete a Puzzle level. Cards can help you solve layouts that movement alone cannot.', showNext: true },
  { text: 'Puzzle Mode has its own Card Collection and progression. Let’s look at it now.', showNext: true },
  { text: 'Tap Card Collection.', highlightEl: 'puzzleCollectionBtn' },
  { text: 'Cards you discover in Puzzle Mode appear here. Tap any card to inspect its full ability and permanent upgrade orbs.', showNext: true },
  { text: 'This is your Puzzle Starter Deck. Its three slots unlock at Levels 10, 20, and 30.', highlightEl: 'puzzleStarterDeckSection', showNext: true },
  { text: 'Level 10 unlocks one Common slot, Level 20 unlocks one Uncommon slot, and Level 30 unlocks one Rare slot. Use “Add to Starter Deck” beneath an unlocked card to equip it for every future Puzzle run.', highlightEl: 'starterSlot0', showNext: true },
];

function startTutorial() {
  // Mark the tutorial before entering the live board. enterGame() normally
  // starts gameplay music, and the tutorial uses that same entry path.
  tutorial.active = true;
  tutorial.kind = 'run';
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

function startPuzzleTutorial() {
  // Puzzle tutorial also runs on the real board engine, but tutorials never
  // play either the menu track or the gameplay playlist.
  tutorial.active = true;
  tutorial.kind = 'puzzle';
  enterGame();
  document.body.classList.add('tutorial-mode');
  tutorial.step = 0;
  tutorial.advancing = false;
  tutorial.upgradeCardId = null;
  initState('normal');
  state.level = 1;
  state.boardRows = 6;
  state.boardCols = 6;
  state.specialBoardType = null;
  state.board = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => ({ piece: null })));
  state.board[4][1].piece = { type: 'yours', king: false, id: state.pieceIdCounter++, ability: null, wasKing: false, variant: 0 };
  state.board[2][3].piece = { type: 'enemy', king: false, id: state.pieceIdCounter++, ability: null, variant: 0 };
  state.board[1][2].piece = { type: 'enemy', king: false, id: state.pieceIdCounter++, ability: null, variant: 1 };
  state.cards = [];
  state.selected = null;
  state.validMoves = [];
  state.activeCard = null;
  state.activeCardUid = null;
  state.turnPhase = 'player';
  state.gameOver = false;
  state.openingRewardPending = false;
  state.lastEnemyCount = 2;
  state.lastYoursCount = 1;
  initializeGloryLevel();
  render();
  showTutorialStep(0);
}

function showTutorialStep(step) {
  tutorial.step = step;
  const cfg = tutorial.kind === 'puzzle' ? PUZZLE_TUTORIAL_STEPS[step] : TUTORIAL_STEPS[step];
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
    banner.classList.toggle('tutorial-pass-through', tutorial.kind === 'puzzle' && step === 7);
  }
  applyTutorialElementHighlight(cfg.highlightEl || null);
  if (tutorial.kind === 'puzzle' && (step === 9 || step === 10)) {
    setTimeout(() => document.getElementById(cfg.highlightEl || 'puzzleStarterDeckSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }
  render();

  if (tutorial.kind === 'run' && step === 7) {
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
  if (tutorial.kind === 'puzzle') {
    if (tutorial.step === 2 && state.board[3][2]?.piece?.type === 'yours') {
      tutorial.advancing = true;
      setTimeout(() => { tutorial.advancing = false; advanceTutorial(3); }, 280);
    } else if (tutorial.step === 4 && state.board[1][4]?.piece?.type === 'yours' && !state.board[2][3]?.piece) {
      tutorial.advancing = true;
      setTimeout(() => { tutorial.advancing = false; advanceTutorial(5); }, 280);
    }
    return;
  }
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
  if (tutorial.kind === 'puzzle') {
    if (tutorial.step === 0) advanceTutorial(1);
    else if (tutorial.step === 1) advanceTutorial(2);
    else if (tutorial.step === 3) advanceTutorial(4);
    else if (tutorial.step === 5) advanceTutorial(6);
    else if (tutorial.step === 6) {
      showPuzzleMenu();
      advanceTutorial(7);
    }
    else if (tutorial.step === 8) advanceTutorial(9);
    else if (tutorial.step === 9) advanceTutorial(10);
    else if (tutorial.step === 10) finishTutorial();
    return;
  }
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
  const finishedKind = tutorial.kind;
  tutorial.active = false;
  tutorial.highlightCells = [];
  if (finishedKind === 'puzzle') markPuzzleTutorialSeen();
  else markTutorialSeen();
  const banner = document.getElementById('tutorialBanner');
  if (banner) banner.classList.remove('active', 'tutorial-pass-through');
  applyTutorialElementHighlight(null);
  document.body.classList.remove('tutorial-mode');
  // The last few steps walk through the Collection screen, which is still
  // open at this point — close it before returning to the main menu.
  document.getElementById('collectionScreen').classList.remove('active');
  document.getElementById('cardEnlargeOverlay').classList.remove('active');
  document.getElementById('masteryOrbOverlay').classList.remove('active');
  tutorial.upgradeCardId = null;
  tutorial.kind = 'run';
  if (finishedKind === 'puzzle') showPuzzleMenu();
  else showMainMenu();
}

// Exact whitelist of tappable board squares per step — steps not listed here
// (0, 2, 4, 5, 6, 9) expect ZERO board taps: they're either a pure "Next"
// prompt, or "click End Turn" / "click the card stack", none of which go
// through cellClick at all.
function tutorialAllowsCellClick(row, col) {
  if (tutorial.kind === 'puzzle') {
    if (tutorial.step === 2) return (row === 4 && col === 1) || (row === 3 && col === 2);
    if (tutorial.step === 4) return (row === 3 && col === 2) || (row === 1 && col === 4);
    return false;
  }
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

  if (tutorial.kind === 'puzzle') {
    if ([0, 1, 3, 5, 6, 8, 9, 10].includes(tutorial.step)) return !!target.closest('#tutorialNextBtn');
    if (tutorial.step === 2 || tutorial.step === 4) {
      const cell = target.closest('#board .cell');
      return !!cell && tutorialAllowsCellClick(Number(cell.dataset.row), Number(cell.dataset.col));
    }
    if (tutorial.step === 7) return !!target.closest('#puzzleCollectionBtn');
    return false;
  }

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
  playGameplayMusic();
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

function openLevelSelect(mode) {
  pendingRunMode = mode;
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

function doStartRun(mode, startLevel) {
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
  initState(mode, startLevel || 1, !audioSettings.sfxEnabled);
}

// startRunAtLevel kept as alias for restartLevelFresh and other callers
function startRunAtLevel(mode, startLevel) { doStartRun(mode, startLevel); }

function refreshCheckpointButtons() { /* no-op — level select is a popup now */ }

function initMenuUI() {
  initTutorialInputLock();
  applyAudioSettings(false);
  const developerSkipBtn = document.getElementById('developerSkipBtn');
  if (developerSkipBtn) developerSkipBtn.style.display = CARTOON_SHOWCASE_BUILD ? '' : 'none';
  // New Puzzle is now a fully standalone sub-game reached through its own
  // hub screen (mirroring the main menu), instead of jumping straight to
  // the level-select overlay.
  document.getElementById('menuNewRunBtn').addEventListener('click', () => {
    if (!hasPuzzleTutorialBeenSeen()) startPuzzleTutorial();
    else showPuzzleMenu();
  });
  document.getElementById('menuNewRunPlusBtn').addEventListener('click', () => openLevelSelect('plus'));
  document.getElementById('menuSettingsBtn').addEventListener('click', openSettings);
  document.getElementById('settingsBackBtn').addEventListener('click', closeSettings);
  document.getElementById('settingsMusicToggle').addEventListener('click', () => {
    audioSettings.musicEnabled = !audioSettings.musicEnabled;
    saveAudioSettings();
    applyAudioSettings(true);
  });
  document.getElementById('settingsSfxToggle').addEventListener('click', () => {
    audioSettings.sfxEnabled = !audioSettings.sfxEnabled;
    saveAudioSettings();
    applyAudioSettings(false);
  });
  document.getElementById('musicVolumeSlider').addEventListener('input', event => {
    audioSettings.musicVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
    saveAudioSettings();
    applyAudioSettings(true);
  });

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
    if (tutorial.active && tutorial.kind === 'puzzle' && tutorial.step === 7) advanceTutorial(8);
  });
  document.getElementById('puzzleLeaderboardBtn').addEventListener('click', () => {
    openLeaderboardScreen('normal');
  });
  document.getElementById('puzzleBackBtn').addEventListener('click', () => {
    showMainMenu();
  });

  // Level select overlay buttons wired here — no inline onclick
  document.getElementById('levelSelectL1').addEventListener('click', () => {
    const mode = pendingRunMode; closeLevelSelect(); if (mode) doStartRun(mode, 1);
  });
  document.getElementById('levelSelectL10').addEventListener('click', () => {
    const mode = pendingRunMode; closeLevelSelect(); if (mode) doStartRun(mode, 10);
  });
  document.getElementById('levelSelectL20').addEventListener('click', () => {
    const mode = pendingRunMode; closeLevelSelect(); if (mode) doStartRun(mode, 20);
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
  document.querySelectorAll('.language-choice').forEach(button => {
    button.addEventListener('click', () => chooseInitialLanguage(button.dataset.language));
  });
  document.getElementById('settingsLanguageSelect').addEventListener('change', event => {
    saveLanguage(event.target.value);
    location.reload();
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
  try {
    const savedLanguage = getSavedLanguage();
    // Existing players already passed the original name gate before languages
    // were introduced. Preserve that progress and quietly migrate them to the
    // English default; brand-new players choose a language before entering a name.
    if (!savedLanguage && getPlayerName()) saveLanguage('en');
    applyLocalization(savedLanguage || 'en');
    await prepareInitialMenuVisuals();
    if (!CARTOON_SHOWCASE_BUILD && !savedLanguage && !getPlayerName()) openFirstRunLanguageModal();
    else if (!CARTOON_SHOWCASE_BUILD && !getPlayerName()) openFirstRunNameEntryModal();
    else continueBootAfterNameEntry();
  } catch (err) {
    // A translation, saved-game, font, or image failure must never leave the
    // player trapped behind the loading cover. Fall back to the menu and leave
    // the original error in the console for diagnosis.
    console.error('King Me startup recovered from an error:', err);
    try { showMainMenu(); } catch (menuErr) {
      console.error('King Me fallback menu failed:', menuErr);
    }
  } finally {
    dismissBootSplash();
  }
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

// Last-resort watchdog: even an unexpected error in the synchronous setup
// below cannot leave PREPARING THE BATTLEFIELD covering the game forever.
const bootSplashWatchdog = setTimeout(dismissBootSplash, 8000);
try {
  activityTimer = setInterval(activityTick, ACTIVITY_TICK_MS);
  initBoardClickDelegation();
  initUIClickSound();
  initCarousels();
  initMenuUI();
} catch (err) {
  console.error('King Me interface setup recovered from an error:', err);
  try { showMainMenu(); } catch (menuErr) {
    console.error('King Me fallback menu failed:', menuErr);
  }
}
// Mandatory first-launch gate: no name saved yet means nothing else — not
// the tutorial, not the main menu, nothing — is shown until one is entered.
// There is no cancel/skip control on this overlay.
void startInitialBoot().finally(() => clearTimeout(bootSplashWatchdog));