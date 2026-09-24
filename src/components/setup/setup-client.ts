import checkSvg from '@/assets/icons/check.svg?raw';
import xSvg from '@/assets/icons/x.svg?raw';
import loaderSvg from '@/assets/icons/loader.svg?raw';

export function initSetupWizard() {
  // ============================================================
  // Setup Wizard — Client-Side State Machine
  // ============================================================

  // --- State ---
  const TOTAL_STEPS = 5;

  // Collected form data
  const data: {
    siteTitle: string;
    authorName: string;
    authorBio: string;
    domain: string;
    email: string;
    password: string;
    avatarUrl: string;
  } = {
    siteTitle: '',
    authorName: '',
    authorBio: '',
    domain: '',
    email: '',
    password: '',
    avatarUrl: '',
  };

  // --- DOM helpers ---
  function $<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }

  // --- Step navigation ---
  function goToStep(n: number) {
    // Hide current
    const currentPanel = document.querySelector('.step-panel--active') as HTMLElement | null;
    if (currentPanel) {
      currentPanel.classList.remove('step-panel--active');
      currentPanel.classList.add('step-panel--exit');
      setTimeout(() => currentPanel.classList.remove('step-panel--exit'), 350);
    }

    // Show new
    const nextPanel = $(`panel-${n}`);
    if (nextPanel) {
      nextPanel.classList.add('step-panel--enter');
      nextPanel.classList.add('step-panel--active');
      setTimeout(() => nextPanel.classList.remove('step-panel--enter'), 350);
    }

    // Update stepper nav
    document.querySelectorAll<HTMLElement>('.stepper__item').forEach((item) => {
      const s = parseInt(item.dataset.step || '0');
      item.classList.toggle('stepper__item--active', s === n);
      item.classList.toggle('stepper__item--done', s < n);
      item.classList.toggle('stepper__item--future', s > n);
    });

    // Update progress fill
    const fill = $('stepper-fill');
    if (fill) {
      fill.style.width = `${((n - 1) / (TOTAL_STEPS - 1)) * 100}%`;
    }

    // Scroll to top of wizard
    document.getElementById('setup-root')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Health check
  // ─────────────────────────────────────────────────────────────
  function setHealthCard(id: 'db' | 'storage', state: 'pending' | 'ok' | 'error', msg: string) {
    const card = $(`health-${id}`);
    const badgeEl = $(`${id}-badge`);
    const statusEl = $(`${id}-status`);
    const iconEl = card?.querySelector('.health-card__icon') as HTMLElement | null;

    if (statusEl) statusEl.textContent = msg;

    ['pending', 'ok', 'error'].forEach((s) => {
      card?.classList.remove(`health-card--${s}`);
      badgeEl?.classList.remove(`health-card__badge--${s}`);
      iconEl?.classList.remove(`health-card__icon--${s}`);
    });

    card?.classList.add(`health-card--${state}`);
    badgeEl?.classList.add(`health-card__badge--${state}`);
    iconEl?.classList.add(`health-card__icon--${state}`);

    if (badgeEl) {
      if (state === 'pending') {
        badgeEl.innerHTML = loaderSvg
          .replace('<svg', '<svg class="spin"')
          .replace(/width="[^"]*"/, 'width="14"')
          .replace(/height="[^"]*"/, 'height="14"')
          .replace(/stroke-width="[^"]*"/, 'stroke-width="2.5"');
      } else if (state === 'ok') {
        badgeEl.innerHTML = checkSvg
          .replace(/width="[^"]*"/, 'width="14"')
          .replace(/height="[^"]*"/, 'height="14"')
          .replace(/stroke-width="[^"]*"/, 'stroke-width="2.5"');
      } else {
        badgeEl.innerHTML = xSvg
          .replace(/width="[^"]*"/, 'width="14"')
          .replace(/height="[^"]*"/, 'height="14"')
          .replace(/stroke-width="[^"]*"/, 'stroke-width="2.5"');
      }
    }
  }

  async function runHealthCheck() {
    const nextBtn = $<HTMLButtonElement>('step1-next');
    const errBox = $('health-error-box');
    const errMsg = $('health-error-msg');
    if (nextBtn) nextBtn.disabled = true;
    if (errBox) errBox.style.display = 'none';

    setHealthCard('db', 'pending', 'Checking…');
    setHealthCard('storage', 'pending', 'Checking…');

    try {
      const res = await fetch('/api/setup/health');
      const json = await res.json();

      setHealthCard(
        'db',
        json.db ? 'ok' : 'error',
        json.db ? 'Connected' : json.errors?.db || 'Connection failed'
      );
      setHealthCard(
        'storage',
        json.storage ? 'ok' : 'error',
        json.storage ? 'Reachable' : json.errors?.storage || 'Unreachable'
      );

      if (json.db && json.storage) {
        if (nextBtn) nextBtn.disabled = false;
      } else {
        if (errBox) errBox.style.display = 'flex';
        if (errMsg) {
          const issues = [];
          if (!json.db) issues.push('database');
          if (!json.storage) issues.push('storage');
          errMsg.textContent = `Could not connect to: ${issues.join(' and ')}. Check your environment variables and ensure services are running.`;
        }
      }
    } catch (e: unknown) {
      setHealthCard('db', 'error', 'Request failed');
      setHealthCard('storage', 'error', 'Request failed');
      if (errBox) errBox.style.display = 'flex';
      if (errMsg) errMsg.textContent = 'Health check request failed. Is the server running?';
    }
  }

  $('retry-health-btn')?.addEventListener('click', runHealthCheck);
  $('step1-next')?.addEventListener('click', () => goToStep(2));

  // Run health check on load
  runHealthCheck();

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Identity
  // ─────────────────────────────────────────────────────────────
  // Bio character counter
  const bioInput = $<HTMLTextAreaElement>('authorBio');
  const bioCounter = $('bio-counter');
  bioInput?.addEventListener('input', () => {
    const len = bioInput.value.length;
    if (bioCounter) {
      bioCounter.textContent = `${len} / 200`;
      bioCounter.style.color = len > 180 ? '#ef4444' : '';
    }
  });

  $('step2-back')?.addEventListener('click', () => goToStep(1));
  $('step2-next')?.addEventListener('click', () => {
    const title = $<HTMLInputElement>('siteTitle')?.value.trim() || '';
    const author = $<HTMLInputElement>('authorName')?.value.trim() || '';
    if (!title) {
      $<HTMLInputElement>('siteTitle')?.focus();
      return;
    }
    if (!author) {
      $<HTMLInputElement>('authorName')?.focus();
      return;
    }
    data.siteTitle = title;
    data.authorName = author;
    data.authorBio = $<HTMLTextAreaElement>('authorBio')?.value.trim() || '';
    data.domain = $<HTMLInputElement>('domain')?.value.trim() || '';
    goToStep(3);
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Account
  // ─────────────────────────────────────────────────────────────
  function scorePassword(pw: string): { score: number; label: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
    return { score, label: labels[Math.min(score, labels.length - 1)] };
  }

  $<HTMLInputElement>('password')?.addEventListener('input', (e) => {
    const pw = (e.target as HTMLInputElement).value;
    const { score, label } = scorePassword(pw);
    const fill = $('pw-fill');
    const lbl = $('pw-label');
    if (fill) {
      fill.style.width = `${(score / 5) * 100}%`;
      fill.dataset.score = String(score);
    }
    if (lbl) lbl.textContent = pw.length === 0 ? 'Enter password' : label;
  });

  // Toggle password visibility
  function setupPasswordToggle(toggleId: string, inputId: string) {
    const toggle = $(toggleId);
    const input = $<HTMLInputElement>(inputId);
    toggle?.addEventListener('click', () => {
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      // Swap eye icons for the pw field
      if (toggleId === 'toggle-pw') {
        const open = $('eye-open');
        const closed = $('eye-closed');
        if (open) open.style.display = isText ? '' : 'none';
        if (closed) closed.style.display = isText ? 'none' : '';
      }
    });
  }
  setupPasswordToggle('toggle-pw', 'password');
  setupPasswordToggle('toggle-cpw', 'confirmPassword');

  $('step3-back')?.addEventListener('click', () => goToStep(2));
  $('step3-next')?.addEventListener('click', () => {
    const email = $<HTMLInputElement>('email')?.value.trim() || '';
    const pw = $<HTMLInputElement>('password')?.value || '';
    const cpw = $<HTMLInputElement>('confirmPassword')?.value || '';
    const matchErr = $('pw-match-error');
    const errBox = $('step3-error');
    const errMsg = $('step3-error-msg');

    if (matchErr) matchErr.style.display = 'none';
    if (errBox) errBox.style.display = 'none';

    if (!email || !email.includes('@')) {
      if (errMsg) errMsg.textContent = 'Please enter a valid email address.';
      if (errBox) errBox.style.display = 'flex';
      return;
    }
    if (pw.length < 8) {
      if (errMsg) errMsg.textContent = 'Password must be at least 8 characters.';
      if (errBox) errBox.style.display = 'flex';
      return;
    }
    if (pw !== cpw) {
      if (matchErr) matchErr.style.display = 'block';
      return;
    }
    data.email = email;
    data.password = pw;
    goToStep(4);
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 4: Branding / Avatar Upload
  // ─────────────────────────────────────────────────────────────
  const avatarFileInput = $<HTMLInputElement>('avatar-file-input');
  avatarFileInput?.addEventListener('change', async () => {
    const file = avatarFileInput.files?.[0];
    if (!file) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    const img = $<HTMLImageElement>('avatar-img');
    const placeholder = $('avatar-placeholder');
    if (img) {
      img.src = localPreview;
      img.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';

    const statusEl = $('avatar-upload-status');
    if (statusEl) statusEl.style.display = 'flex';

    const formData = new FormData();
    formData.append('image', file);
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      let json: { success?: boolean; url?: string; error?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Server returned status ${res.status}`);
      }
      if (res.ok && json?.success && json.url) {
        data.avatarUrl = json.url;
        if (img) img.src = json.url;
      } else {
        alert(json?.error || 'Failed to upload photo. Please verify image size and format.');
      }
    } catch (err: unknown) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Network error occurred.'));
    } finally {
      if (statusEl) statusEl.style.display = 'none';
    }
  });

  $('step4-back')?.addEventListener('click', () => goToStep(3));
  $('step4-skip')?.addEventListener('click', () => {
    data.avatarUrl = '';
    populateSummary();
    goToStep(5);
  });
  $('step4-next')?.addEventListener('click', () => {
    populateSummary();
    goToStep(5);
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 5: Summary & Launch
  // ─────────────────────────────────────────────────────────────
  function populateSummary() {
    const set = (id: string, val: string) => {
      const el = $(id);
      if (el) el.textContent = val || '—';
    };
    set('sum-title', data.siteTitle);
    set('sum-author', data.authorName);
    set('sum-email', data.email);
    set('sum-domain', data.domain || 'Not set (update in Settings)');
    set('sum-avatar', data.avatarUrl ? 'Uploaded ✓' : 'None (skipped)');
  }

  $('step5-back')?.addEventListener('click', () => goToStep(4));

  $('launch-btn')?.addEventListener('click', async () => {
    const btn = $<HTMLButtonElement>('launch-btn');
    const launchText = $('launch-text');
    const launchSpinner = $('launch-spinner');
    const errBox = $('launch-error');
    const errMsg = $('launch-error-msg');

    if (errBox) errBox.style.display = 'none';
    if (btn) btn.disabled = true;
    if (launchText) launchText.style.display = 'none';
    if (launchSpinner) launchSpinner.style.display = 'flex';

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle: data.siteTitle,
          authorName: data.authorName,
          authorBio: data.authorBio,
          domain: data.domain,
          email: data.email,
          password: data.password,
          avatarUrl: data.avatarUrl || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (errMsg) errMsg.textContent = result.error || 'Failed to complete setup.';
        if (errBox) errBox.style.display = 'flex';
        if (btn) btn.disabled = false;
        if (launchText) launchText.style.display = '';
        if (launchSpinner) launchSpinner.style.display = 'none';
        return;
      }

      window.location.href = result.redirect || '/admin';
    } catch (_) {
      if (errMsg) errMsg.textContent = 'A network error occurred. Please try again.';
      if (errBox) errBox.style.display = 'flex';
      if (btn) btn.disabled = false;
      if (launchText) launchText.style.display = '';
      if (launchSpinner) launchSpinner.style.display = 'none';
    }
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSetupWizard);
  } else {
    initSetupWizard();
  }
}
