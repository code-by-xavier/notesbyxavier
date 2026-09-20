// File: src/components/settings/settings-client.ts
// ============================================================
// Notesby — Settings Client Interactivity
// Handles asset uploads, live preview, dirty state tracking,
// AJAX saving to PUT /api/settings, and portal toast notifications.
// ============================================================

import checkSvg from '@/assets/icons/check.svg?raw';
import alertSvg from '@/assets/icons/alert.svg?raw';
import helpCircleSvg from '@/assets/icons/help-circle.svg?raw';

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export function showPortalNotification(
  type: 'success' | 'error' | 'info',
  title: string,
  message?: string
) {
  const toast = document.getElementById('portal-toast');
  const iconEl = document.getElementById('portal-toast-icon');
  const titleEl = document.getElementById('portal-toast-title');
  const msgEl = document.getElementById('portal-toast-msg');
  const closeBtn = document.getElementById('portal-toast-close');

  if (!toast || !iconEl || !titleEl || !msgEl) return;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  const formatIcon = (raw: string) =>
    raw
      .replace(/width="[^"]*"/, 'width="18"')
      .replace(/height="[^"]*"/, 'height="18"')
      .replace(/stroke-width="[^"]*"/, 'stroke-width="2.5"');

  const icons = {
    success: formatIcon(checkSvg),
    error: formatIcon(alertSvg),
    info: formatIcon(helpCircleSvg),
  };

  iconEl.innerHTML = icons[type] || icons.info;
  titleEl.textContent = title;
  msgEl.textContent = message || '';
  msgEl.style.display = message ? 'block' : 'none';

  toast.className = `portal-toast portal-toast--${type}`;
  toast.style.display = 'flex';

  const dismiss = () => {
    toast.classList.add('portal-toast--hiding');
    setTimeout(() => {
      toast.style.display = 'none';
      toast.classList.remove('portal-toast--hiding');
    }, 250);
  };

  if (closeBtn) {
    closeBtn.onclick = dismiss;
  }

  toastTimeout = setTimeout(dismiss, 4500);
}

export function initSettingsClient() {
  // Expose notification API globally
  if (typeof window !== 'undefined') {
    (window as any).showPortalNotification = showPortalNotification;
  }

  // DOM Elements
  const form = document.getElementById('settings-form') as HTMLFormElement | null;
  const saveBtn = document.getElementById('save-settings-btn') as HTMLButtonElement | null;
  const saveBtnText = saveBtn?.querySelector('.settings-btn-text');
  const saveStatusDot = document.getElementById('save-status-dot');
  const saveStatusText = document.getElementById('save-status-text');

  // Media Inputs & Buttons
  const avatarInput = document.getElementById('authorAvatar') as HTMLInputElement | null;
  const avatarFileInput = document.getElementById('avatar-file-input') as HTMLInputElement | null;
  const avatarPreview = document.getElementById('avatar-preview') as HTMLImageElement | null;
  const avatarLoading = document.getElementById('avatar-loading');
  const uploadAvatarBtn = document.getElementById('upload-avatar-btn');

  const logoInput = document.getElementById('siteLogo') as HTMLInputElement | null;
  const logoFileInput = document.getElementById('logo-file-input') as HTMLInputElement | null;
  const logoPreview = document.getElementById('logo-preview') as HTMLImageElement | null;
  const logoLoading = document.getElementById('logo-loading');
  const uploadLogoBtn = document.getElementById('upload-logo-btn');
  const removeLogoBtn = document.getElementById('remove-logo-btn');

  const faviconInput = document.getElementById('favicon') as HTMLInputElement | null;
  const faviconFileInput = document.getElementById('favicon-file-input') as HTMLInputElement | null;
  const faviconPreview = document.getElementById('favicon-preview') as HTMLImageElement | null;
  const faviconLoading = document.getElementById('favicon-loading');
  const uploadFaviconBtn = document.getElementById('upload-favicon-btn');

  const touchiconInput = document.getElementById('appleTouchIcon') as HTMLInputElement | null;
  const touchiconFileInput = document.getElementById(
    'touchicon-file-input'
  ) as HTMLInputElement | null;
  const touchiconPreview = document.getElementById('touchicon-preview') as HTMLImageElement | null;
  const touchiconLoading = document.getElementById('touchicon-loading');
  const uploadTouchiconBtn = document.getElementById('upload-touchicon-btn');

  // Set form dirty state
  function markDirty() {
    if (saveStatusDot) saveStatusDot.className = 'save-status-dot save-status-dot--dirty';
    if (saveStatusText) saveStatusText.textContent = 'Unsaved changes';
  }

  form?.addEventListener('input', markDirty);
  form?.addEventListener('change', markDirty);

  // Generic upload handler for media assets
  async function handleAssetUpload(
    fileInput: HTMLInputElement,
    previewImg: HTMLImageElement | null,
    hiddenInput: HTMLInputElement | null,
    loadingEl: HTMLElement | null,
    assetLabel: string,
    onSuccess?: (url: string) => void
  ) {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showPortalNotification(
        'error',
        'File Too Large',
        'File size exceeds the 5 MB limit. Please select a smaller file.'
      );
      fileInput.value = '';
      return;
    }

    const localUrl = URL.createObjectURL(file);
    if (previewImg) {
      previewImg.src = localUrl;
      previewImg.style.display = 'block';
    }
    if (loadingEl) loadingEl.style.display = 'flex';

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (hiddenInput) hiddenInput.value = data.url;
        if (previewImg) {
          previewImg.onerror = () => {
            console.warn(
              `[Settings] Image at "${data.url}" failed to load directly; keeping local blob preview.`
            );
            previewImg.src = localUrl;
          };
          previewImg.src = data.url;
        }
        if (onSuccess) onSuccess(data.url);
        markDirty();
        showPortalNotification(
          'success',
          'Asset Uploaded',
          `${assetLabel} uploaded successfully. Remember to click Save Changes to persist.`
        );
      } else {
        showPortalNotification('error', 'Upload Failed', data.error || 'Upload failed.');
        if (previewImg && hiddenInput?.value) {
          previewImg.src = hiddenInput.value;
        }
      }
    } catch {
      showPortalNotification('error', 'Network Error', 'Network error while uploading asset.');
      if (previewImg && hiddenInput?.value) {
        previewImg.src = hiddenInput.value;
      }
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
      fileInput.value = '';
    }
  }

  // Bind Upload Triggers
  uploadAvatarBtn?.addEventListener('click', () => avatarFileInput?.click());
  avatarFileInput?.addEventListener('change', () => {
    if (avatarFileInput) {
      handleAssetUpload(
        avatarFileInput,
        avatarPreview,
        avatarInput,
        avatarLoading,
        'Profile photo'
      );
    }
  });

  const logoStatusLabel = document.getElementById('logo-status-label');
  const uploadLogoBtnText = document.getElementById('upload-logo-btn-text');
  const DEFAULT_LOGO_FALLBACK = '/images/notesby-logo-black.svg';

  uploadLogoBtn?.addEventListener('click', () => logoFileInput?.click());
  logoFileInput?.addEventListener('change', () => {
    if (logoFileInput) {
      handleAssetUpload(
        logoFileInput,
        logoPreview,
        logoInput,
        logoLoading,
        'Custom site logo',
        (url) => {
          if (removeLogoBtn) removeLogoBtn.style.display = 'inline-flex';
          if (logoStatusLabel) logoStatusLabel.textContent = 'Custom Logo Active';
          if (uploadLogoBtnText) uploadLogoBtnText.textContent = 'Change Custom Logo';
        }
      );
    }
  });

  removeLogoBtn?.addEventListener('click', () => {
    if (logoInput) logoInput.value = '';
    if (logoPreview) {
      logoPreview.src = DEFAULT_LOGO_FALLBACK;
      logoPreview.style.display = 'block';
    }
    if (logoStatusLabel) logoStatusLabel.textContent = 'Default Platform Logo';
    if (uploadLogoBtnText) uploadLogoBtnText.textContent = 'Upload Custom Logo';
    if (removeLogoBtn) removeLogoBtn.style.display = 'none';
    markDirty();
    showPortalNotification(
      'info',
      'Logo Reset',
      'Platform default SVG logo restored. Click Save Changes to confirm.'
    );
  });

  uploadFaviconBtn?.addEventListener('click', () => faviconFileInput?.click());
  faviconFileInput?.addEventListener('change', () => {
    if (faviconFileInput) {
      handleAssetUpload(faviconFileInput, faviconPreview, faviconInput, faviconLoading, 'Favicon');
    }
  });

  uploadTouchiconBtn?.addEventListener('click', () => touchiconFileInput?.click());
  touchiconFileInput?.addEventListener('change', () => {
    if (touchiconFileInput) {
      handleAssetUpload(
        touchiconFileInput,
        touchiconPreview,
        touchiconInput,
        touchiconLoading,
        'Apple Touch Icon'
      );
    }
  });

  // Form Submit Handler
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!saveBtn) return;

    saveBtn.disabled = true;
    if (saveBtnText) saveBtnText.textContent = 'Saving...';
    if (saveStatusDot) saveStatusDot.className = 'save-status-dot save-status-dot--saving';
    if (saveStatusText) saveStatusText.textContent = 'Saving to cloud...';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (saveStatusDot) saveStatusDot.className = 'save-status-dot save-status-dot--saved';
        if (saveStatusText) saveStatusText.textContent = 'All changes saved to cloud';
        showPortalNotification(
          'success',
          'Settings Saved',
          'All publication changes have been saved and applied across your site.'
        );
      } else {
        showPortalNotification('error', 'Save Failed', data.error || 'Failed to update settings.');
        if (saveStatusDot) saveStatusDot.className = 'save-status-dot save-status-dot--error';
        if (saveStatusText) saveStatusText.textContent = 'Failed to save';
      }
    } catch {
      showPortalNotification('error', 'Network Error', 'Network error while saving settings.');
      if (saveStatusDot) saveStatusDot.className = 'save-status-dot save-status-dot--error';
      if (saveStatusText) saveStatusText.textContent = 'Failed to save';
    } finally {
      saveBtn.disabled = false;
      if (saveBtnText) saveBtnText.textContent = 'Save Changes';
    }
  });
}
