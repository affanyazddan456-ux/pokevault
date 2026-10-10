// ============================================================
//  PokéVault — Upload / Edit Card Page
// ============================================================

let _editCardId = null;

async function renderUpload() {
  if (!Auth.isLoggedIn()) {
    return `<div class="auth-page"><div class="auth-card">
      <div class="auth-header"><h1>🔒 Login Required</h1></div>
      <a href="/login" class="btn btn-primary btn-full">Log In</a>
    </div></div>`;
  }
  // Check for ?edit=cardId in URL
  const editId = new URLSearchParams(location.search).get('edit');
  _editCardId  = editId || null;
  const isEdit = !!editId;

  return `
    <div class="page-header">
      <div class="container">
        <h1>${isEdit ? '✏️ Edit Card' : '🃏 Upload a Card'}</h1>
        <p>${isEdit ? 'Update your card details' : 'Add a new Pokémon card to your collection'}</p>
      </div>
    </div>
    <div class="section" style="padding-top:2rem">
      <div class="container" style="max-width:720px">
        <div id="uploadError"></div>
        <form id="uploadForm" onsubmit="${isEdit ? 'handleEdit(event)' : 'handleUpload(event)'}">

          <!-- Image Upload (only for new cards) -->
          ${isEdit ? `<div id="editImageNote" class="form-group">
            <label class="form-label">Card Image</label>
            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;display:flex;align-items:center;gap:1rem">
              <img id="existingImg" style="width:60px;height:80px;object-fit:cover;border-radius:6px" onerror="this.src='/img/card-placeholder.svg'"/>
              <div>
                <p style="font-size:.85rem;color:var(--text2)">Current image (upload a new one to replace)</p>
                <input type="file" id="cardImageInput" accept=".jpg,.jpeg,.png,.webp" onchange="previewImage(event)" style="margin-top:.4rem"/>
              </div>
            </div>
          </div>` : `
          <div class="form-group">
            <label class="form-label">Card Photo *</label>
            <div class="img-upload-area" id="uploadArea"
                 onclick="document.getElementById('cardImageInput').click()"
                 ondragover="event.preventDefault();this.classList.add('drag-over')"
                 ondragleave="this.classList.remove('drag-over')"
                 ondrop="handleImageDrop(event)">
              <div class="img-upload-icon">📷</div>
              <p>Click or drag & drop your card image</p>
              <p style="font-size:.78rem;color:var(--text3);margin-top:.3rem">JPG, PNG or WebP · Max 8MB</p>
              <input type="file" id="cardImageInput" accept=".jpg,.jpeg,.png,.webp" onchange="previewImage(event)"/>
              <img id="imgPreview" class="img-preview" alt="Preview"/>
            </div>
          </div>`}

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Card Name *</label>
              <input type="text" name="title" id="f_title" class="form-input" placeholder="e.g. Charizard" required/>
            </div>
            <div class="form-group">
              <label class="form-label">HP</label>
              <input type="number" name="hp" id="f_hp" class="form-input" placeholder="e.g. 120" min="0" max="999"/>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Rarity</label>
              <select name="rarity" id="f_rarity" class="form-select">
                <option value="">Select rarity</option>
                <optgroup label="Common / Uncommon">
                  <option value="Common">Common ●</option>
                  <option value="Uncommon">Uncommon ◆</option>
                </optgroup>
                <optgroup label="Rare">
                  <option value="Rare">Rare ★</option>
                  <option value="Rare Holo">Rare Holo ★</option>
                  <option value="Rare Holo EX">Rare Holo EX</option>
                  <option value="Rare Holo GX">Rare Holo GX</option>
                  <option value="Rare Holo V">Rare Holo V</option>
                  <option value="Rare Holo VMAX">Rare Holo VMAX</option>
                  <option value="Rare Holo VSTAR">Rare Holo VSTAR</option>
                </optgroup>
                <optgroup label="Ultra Rare">
                  <option value="Ultra Rare">Ultra Rare</option>
                  <option value="Amazing Rare">Amazing Rare ★A</option>
                  <option value="Radiant Rare">Radiant Rare ★R</option>
                  <option value="Illustration Rare">Illustration Rare</option>
                </optgroup>
                <optgroup label="Special / Secret">
                  <option value="Special Illustration Rare">Special Illustration Rare</option>
                  <option value="Hyper Rare">Hyper Rare ★★</option>
                  <option value="Secret Rare">Secret Rare ★★</option>
                  <option value="Gold Secret Rare">Gold Secret Rare</option>
                  <option value="Rainbow Rare">Rainbow Rare</option>
                  <option value="Shiny Rare">Shiny Rare</option>
                  <option value="Shiny Ultra Rare">Shiny Ultra Rare</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="ACE SPEC Rare">ACE SPEC Rare</option>
                  <option value="BREAK">BREAK</option>
                  <option value="LEGEND">LEGEND</option>
                  <option value="Prime">Prime</option>
                  <option value="Promo">Promo</option>
                </optgroup>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Card Type / Energy</label>
              <select name="energyType" id="f_energyType" class="form-select">
                <option value="">Select type</option>
                <option value="Fire">🔥 Fire</option>
                <option value="Water">💧 Water</option>
                <option value="Grass">🍃 Grass</option>
                <option value="Lightning">⚡ Lightning</option>
                <option value="Psychic">🔮 Psychic</option>
                <option value="Fighting">🥊 Fighting</option>
                <option value="Darkness">🌑 Darkness</option>
                <option value="Metal">⚙️ Metal</option>
                <option value="Dragon">🐉 Dragon</option>
                <option value="Fairy">🌸 Fairy</option>
                <option value="Colorless">⭐ Colorless</option>
                <option value="Trainer">🎴 Trainer</option>
                <option value="Energy">⚡ Energy Card</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Set / Collection</label>
              <input type="text" name="set" id="f_set" class="form-input" placeholder="e.g. Base Set, Scarlet & Violet..."/>
            </div>
            <div class="form-group">
              <label class="form-label">Card Number</label>
              <input type="text" name="cardNumber" id="f_cardNumber" class="form-input" placeholder="e.g. 4/102"/>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Condition *</label>
              <select name="condition" id="f_condition" class="form-select" required>
                <option value="">Select condition</option>
                <option>Mint</option>
                <option>Near Mint</option>
                <option>Lightly Played</option>
                <option>Moderately Played</option>
                <option>Heavily Played</option>
                <option>Damaged</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date Acquired</label>
              <input type="date" name="dateAcquired" id="f_dateAcquired" class="form-input"/>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea name="description" id="f_description" class="form-textarea" placeholder="Describe this card..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Where Obtained</label>
            <input type="text" name="obtainedFrom" id="f_obtainedFrom" class="form-input" placeholder="Pack pull, traded, purchased..."/>
          </div>

          <!-- Availability -->
          <div class="form-group">
            <label class="form-label">List As</label>
            <div class="form-toggles">
              <label class="toggle-item" id="saleToggle">
                <input type="checkbox" id="f_saleAvailable" name="saleAvailable" value="true" onchange="toggleAvail(this,'saleSection')"/>
                💰 For Sale
              </label>
              <label class="toggle-item" id="tradeToggle">
                <input type="checkbox" id="f_tradeAvailable" name="tradeAvailable" value="true" onchange="toggleAvail(this,'tradeSection')"/>
                🔄 For Trade
              </label>
              <label class="toggle-item" id="auctionToggle">
                <input type="checkbox" id="f_auctionAvailable" name="auctionAvailable" value="true" onchange="toggleAvail(this,'auctionSection')"/>
                🔨 Auction
              </label>
            </div>
          </div>

          <div id="saleSection" class="hidden form-group">
            <label class="form-label">Asking Price (₱)</label>
            <input type="number" name="price" id="f_price" class="form-input" placeholder="0.00" min="0" step="0.01"/>
          </div>
          <div id="auctionSection" class="hidden form-group">
            <label class="form-label">Starting Bid (₱)</label>
            <input type="number" name="startingBid" id="f_startingBid" class="form-input" placeholder="0.00" min="0" step="0.01"/>
          </div>
          <div id="tradeSection" class="hidden form-group">
            <label class="form-label">Trade Preferences</label>
            <input type="text" name="tradePreferences" id="f_tradePreferences" class="form-input" placeholder="What would you like in return?"/>
          </div>

          <div class="form-group">
            <label class="form-label">Additional Notes</label>
            <textarea name="notes" id="f_notes" class="form-textarea" placeholder="Anything else collectors should know..."></textarea>
          </div>

          <div style="display:flex;gap:1rem">
            <button type="submit" class="btn btn-primary btn-full btn-lg" id="uploadBtn">
              ${isEdit ? '✏️ Save Changes' : '🃏 Add to Collection'}
            </button>
            ${isEdit ? `<a href="/card/${editId}" class="btn btn-secondary btn-lg">Cancel</a>` : ''}
          </div>
        </form>
      </div>
    </div>`;
}

async function initUpload() {
  if (!_editCardId) return;
  // Load existing card data to pre-fill form
  try {
    const data = await API.cards.get(_editCardId);
    const c    = data.card;

    // Verify ownership
    if (c.ownerId !== Auth.user?._id) {
      showToast('You do not own this card', 'error');
      Router.go('/collection');
      return;
    }

    // Pre-fill all fields
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('f_title',       c.title);
    set('f_hp',          c.hp || '');
    set('f_rarity',      c.rarity || '');
    set('f_energyType',  c.energyType || '');
    set('f_set',         c.set || '');
    set('f_cardNumber',  c.cardNumber || '');
    set('f_condition',   c.condition || '');
    set('f_dateAcquired',c.dateAcquired || '');
    set('f_description', c.description || '');
    set('f_obtainedFrom',c.obtainedFrom || '');
    set('f_price',       c.price || '');
    set('f_startingBid', c.startingBid || '');
    set('f_tradePreferences', c.tradePreferences || '');
    set('f_notes',       c.notes || '');

    // Set existing image preview
    const img = document.getElementById('existingImg');
    if (img) img.src = c.imageUrl;

    // Set checkboxes
    const setCheck = (id, val) => {
      const el = document.getElementById(id);
      if (el) { el.checked = !!val; el.closest('.toggle-item').classList.toggle('checked', !!val); }
    };
    setCheck('f_saleAvailable',    c.saleAvailable);
    setCheck('f_tradeAvailable',   c.tradeAvailable);
    setCheck('f_auctionAvailable', c.auctionAvailable);

    if (c.saleAvailable)    document.getElementById('saleSection')?.classList.remove('hidden');
    if (c.tradeAvailable)   document.getElementById('tradeSection')?.classList.remove('hidden');
    if (c.auctionAvailable) document.getElementById('auctionSection')?.classList.remove('hidden');

  } catch (err) {
    showToast(err.message, 'error');
    Router.go('/collection');
  }
}

// Handle EDIT (PUT existing card)
async function handleEdit(e) {
  e.preventDefault();
  const form  = e.target;
  const btn   = document.getElementById('uploadBtn');
  const errEl = document.getElementById('uploadError');
  if (errEl) errEl.innerHTML = '';

  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  // Check if a new image was selected
  const file = document.getElementById('cardImageInput')?.files[0];

  try {
    if (file) {
      // Upload with new image via FormData
      const fd = new FormData(form);
      fd.set('saleAvailable',    form.saleAvailable.checked    ? 'true' : 'false');
      fd.set('tradeAvailable',   form.tradeAvailable.checked   ? 'true' : 'false');
      fd.set('auctionAvailable', form.auctionAvailable.checked ? 'true' : 'false');
      fd.append('image', file);
      // Use PUT with FormData — backend handles updating
      await API.cards.update(_editCardId, {
        title:           form.title.value.trim(),
        description:     form.description?.value?.trim() || '',
        set:             form.set?.value?.trim() || '',
        cardNumber:      form.cardNumber?.value?.trim() || '',
        condition:       form.condition.value,
        hp:              form.hp?.value || null,
        rarity:          form.rarity?.value || '',
        energyType:      form.energyType?.value || '',
        obtainedFrom:    form.obtainedFrom?.value?.trim() || '',
        tradeAvailable:  form.tradeAvailable.checked,
        saleAvailable:   form.saleAvailable.checked,
        auctionAvailable: form.auctionAvailable.checked,
        price:           form.price?.value || null,
        startingBid:     form.startingBid?.value || null,
        tradePreferences: form.tradePreferences?.value?.trim() || '',
        notes:           form.notes?.value?.trim() || '',
        dateAcquired:    form.dateAcquired?.value || null,
      });
    } else {
      // No new image — just update fields via JSON
      await API.cards.update(_editCardId, {
        title:           form.title.value.trim(),
        description:     form.description?.value?.trim() || '',
        set:             form.set?.value?.trim() || '',
        cardNumber:      form.cardNumber?.value?.trim() || '',
        condition:       form.condition.value,
        hp:              form.hp?.value ? parseInt(form.hp.value) : null,
        rarity:          form.rarity?.value || '',
        energyType:      form.energyType?.value || '',
        obtainedFrom:    form.obtainedFrom?.value?.trim() || '',
        tradeAvailable:  form.tradeAvailable.checked,
        saleAvailable:   form.saleAvailable.checked,
        auctionAvailable: form.auctionAvailable.checked,
        price:           form.price?.value ? parseFloat(form.price.value) : null,
        startingBid:     form.startingBid?.value ? parseFloat(form.startingBid.value) : null,
        tradePreferences: form.tradePreferences?.value?.trim() || '',
        notes:           form.notes?.value?.trim() || '',
        dateAcquired:    form.dateAcquired?.value || null,
      });
    }
    showToast('Card updated!', 'success');
    Router.go(`/card/${_editCardId}`);
  } catch (err) {
    if (errEl) errEl.innerHTML = `<div class="error-banner">${err.message}</div>`;
    btn.disabled  = false;
    btn.innerHTML = '✏️ Save Changes';
  }
}

// Handle UPLOAD (POST new card)
async function handleUpload(e) {
  e.preventDefault();
  const form  = e.target;
  const btn   = document.getElementById('uploadBtn');
  const errEl = document.getElementById('uploadError');
  const file  = document.getElementById('cardImageInput').files[0];

  if (errEl) errEl.innerHTML = '';
  if (!file) {
    if (errEl) errEl.innerHTML = '<div class="error-banner">Please select a card image.</div>';
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Uploading...';

  const fd = new FormData(form);
  fd.set('saleAvailable',    form.saleAvailable.checked    ? 'true' : 'false');
  fd.set('tradeAvailable',   form.tradeAvailable.checked   ? 'true' : 'false');
  fd.set('auctionAvailable', form.auctionAvailable.checked ? 'true' : 'false');
  fd.append('image', file);

  try {
    const data = await API.cards.upload(fd);
    showToast('Card uploaded!', 'success');
    Router.go(`/card/${data.card._id}`);
  } catch (err) {
    if (errEl) errEl.innerHTML = `<div class="error-banner">${err.message}</div>`;
    btn.disabled  = false;
    btn.innerHTML = '🃏 Add to Collection';
  }
}

function previewImage(e) {
  const file    = e.target.files[0];
  const preview = document.getElementById('imgPreview') || document.getElementById('existingImg');
  if (!file || !preview) return;
  if (file.size > 8 * 1024 * 1024) { showToast('Image must be under 8MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.style.display = 'block';
    const icon = document.querySelector('.img-upload-icon');
    if (icon) icon.style.display = 'none';
    document.querySelectorAll('.img-upload-area p').forEach(p => p.style.display = 'none');
  };
  reader.readAsDataURL(file);
}

function handleImageDrop(e) {
  e.preventDefault();
  document.getElementById('uploadArea')?.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const input = document.getElementById('cardImageInput');
  const dt    = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  previewImage({ target: { files: [file] } });
}

function toggleAvail(cb, sectionId) {
  const section = document.getElementById(sectionId);
  if (section) section.classList.toggle('hidden', !cb.checked);
  cb.closest('.toggle-item').classList.toggle('checked', cb.checked);
}

window.previewImage    = previewImage;
window.handleImageDrop = handleImageDrop;
window.toggleAvail     = toggleAvail;
window.handleUpload    = handleUpload;
window.handleEdit      = handleEdit;
