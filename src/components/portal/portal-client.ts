// File: src/components/portal/portal-client.ts
// ============================================================
// Notesby — Admin Portal Client Logic
// Handles toast notifications, inline publish/unpublish toggles,
// and async subscriber list loading on the dashboard.
// Extracted from admin/index.astro for clean separation of concerns.
// ============================================================

// ── Toast Notification ─────────────────────────────────────────────────────

export function showPortalNotification(
  type: 'success' | 'error' | 'info',
  title: string,
  message?: string
) {
  const toast = document.getElementById('portal-toast');
  const titleEl = document.getElementById('portal-toast-title');
  const msgEl = document.getElementById('portal-toast-msg');
  const closeBtn = document.getElementById('portal-toast-close');

  if (!toast || !titleEl) return;

  titleEl.textContent = title;
  if (msgEl) {
    msgEl.textContent = message || '';
    msgEl.style.display = message ? 'block' : 'none';
  }
  toast.className = 'portal-toast portal-toast--' + type;
  toast.style.display = 'flex';

  const dismiss = () => {
    const el = document.getElementById('portal-toast');
    if (!el) return;
    el.classList.add('portal-toast--hiding');
    setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('portal-toast--hiding');
    }, 250);
  };

  if (closeBtn) closeBtn.onclick = dismiss;
  setTimeout(dismiss, 4000);
}

// Expose globally so inline HTML onclick handlers can call it
declare global {
  interface Window {
    showPortalNotification?: (
      type: 'success' | 'error' | 'info',
      title: string,
      message: string
    ) => void;
  }
}
window.showPortalNotification = showPortalNotification;

// ── Publish / Unpublish Toggles ────────────────────────────────────────────

export function initPublishToggles() {
  document.querySelectorAll<HTMLButtonElement>('.portal-table__action-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const button = e.currentTarget as HTMLButtonElement;
      const noteId = button.getAttribute('data-note-id');
      const currentStatus = button.getAttribute('data-status');
      const noteTitle = button.getAttribute('data-note-title') || 'Note';
      const targetAction = currentStatus === 'published' ? 'unpublish' : 'publish';

      button.disabled = true;
      const origText = button.textContent;
      button.textContent = targetAction === 'unpublish' ? 'Unpublishing...' : 'Publishing...';

      try {
        const res = await fetch('/api/notes/' + noteId + '/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: targetAction }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const newStatus = data.status;
          button.setAttribute('data-status', newStatus);
          button.className =
            'portal-table__action-btn portal-table__action-btn--' +
            (newStatus === 'published' ? 'unpublish' : 'publish');
          button.textContent = newStatus === 'published' ? 'Unpublish' : 'Publish';
          button.title =
            newStatus === 'published'
              ? 'Unpublish note and revert to draft'
              : 'Publish note to live site';

          // Update row status pill
          const row = button.closest('tr');
          const statusCell = row ? row.querySelector('.portal-status-pill') : null;
          if (statusCell) {
            statusCell.className = 'portal-status-pill portal-status-pill--' + newStatus;
            statusCell.textContent = newStatus;
          }
          const modifiedPill = row ? row.querySelector('.portal-status-pill--modified') : null;
          if (modifiedPill) modifiedPill.remove();

          showPortalNotification(
            'success',
            newStatus === 'published' ? 'Note Published' : 'Note Unpublished',
            newStatus === 'published'
              ? '"' + noteTitle + '" is now live on your site.'
              : '"' + noteTitle + '" has been reverted to draft.'
          );
        } else {
          alert(data.error || 'Failed to update note status');
          button.textContent = origText;
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Network error');
        button.textContent = origText;
      } finally {
        button.disabled = false;
      }
    });
  });
}

// ── Subscribers Section ────────────────────────────────────────────────────

export async function initSubscribersList() {
  const loadingEl = document.getElementById('subscribers-loading');
  const emptyEl = document.getElementById('subscribers-empty');
  const tableWrapper = document.getElementById('subscribers-table-wrapper');
  const tbody = document.getElementById('subscribers-tbody');
  const countBadge = document.getElementById('subscribers-count');
  const exportBtn = document.getElementById('subscribers-export-btn') as HTMLAnchorElement | null;

  try {
    const res = await fetch('/api/subscribers');
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    const list: { email: string; source: string; createdAt: string }[] = data.subscribers || [];

    if (loadingEl) loadingEl.style.display = 'none';

    if (list.length === 0) {
      if (emptyEl) emptyEl.style.display = '';
    } else {
      if (countBadge) countBadge.textContent = String(list.length);
      if (exportBtn) exportBtn.style.display = '';
      if (tableWrapper) tableWrapper.style.display = '';
      if (tbody) {
        tbody.innerHTML = list
          .map((s) => {
            const date = new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(s.createdAt));
            const sourceLabel = s.source === 'popup' ? 'Popup Modal' : 'Inline Section';
            return `<tr>
              <td class="portal-table__title-cell">
                <span class="portal-subscriber-email">${s.email}</span>
              </td>
              <td>
                <span class="portal-source-pill portal-source-pill--${s.source}">${sourceLabel}</span>
              </td>
              <td class="portal-table__date">${date}</td>
              <td class="text-right portal-table__actions">
                <button
                  type="button"
                  class="portal-table__edit-btn portal-copy-email-btn"
                  data-email="${s.email}"
                  title="Copy email to clipboard"
                >
                  Copy
                </button>
              </td>
            </tr>`;
          })
          .join('');

        tbody.querySelectorAll<HTMLButtonElement>('.portal-copy-email-btn').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = btn.getAttribute('data-email') || '';
            if (!email) return;
            try {
              await navigator.clipboard.writeText(email);
              const origText = btn.textContent;
              btn.textContent = 'Copied!';
              btn.style.borderColor = 'var(--accent-color)';
              btn.style.color = 'var(--accent-color)';
              setTimeout(() => {
                btn.textContent = origText;
                btn.style.borderColor = '';
                btn.style.color = '';
              }, 1600);
            } catch {
              // Clipboard fallback — silent
            }
          });
        });
      }
    }
  } catch {
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) {
      emptyEl.style.display = '';
      const title = emptyEl.querySelector('.portal-empty-state__title');
      if (title) title.textContent = 'Could not load subscribers';
    }
  }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

initPublishToggles();
initSubscribersList();
