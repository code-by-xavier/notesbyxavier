// File: src/components/editor/editor-client.ts
// ============================================================
// Notesby — Zen Studio Editor Client State Machine
// Handles contenteditable canvas, slash commands, floating toolbar,
// autosave debounce, marked parser, word counts, and drawer management.
// ============================================================

import { marked } from 'marked';

export function initZenEditor() {
  // Configure marked for smooth parsing
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // DOM Elements
  const editorRoot = document.getElementById('zen-editor-root');
  const noteId = editorRoot?.dataset.noteId || '';
  const initialStatus = editorRoot?.dataset.initialStatus || 'draft';
  const initialCoverImage = editorRoot?.dataset.initialCoverImage || '';
  const initialHasUnpublishedChanges = editorRoot?.dataset.hasUnpublishedChanges === 'true';

  const titleInput = document.getElementById('note-title') as HTMLTextAreaElement | null;
  const subtitleInput = document.getElementById('note-subtitle') as HTMLTextAreaElement | null;
  const contentEditable = document.getElementById('note-content') as HTMLDivElement | null;
  const categorySelect = document.getElementById('note-category') as HTMLSelectElement | null;
  const toolbar = document.getElementById('editor-toolbar');

  const publishBtn = document.getElementById('publish-btn') as HTMLButtonElement | null;
  const publishText = publishBtn?.querySelector('.zen-publish-text');
  const saveStatusEl = document.getElementById('save-status');
  const saveTextEl = saveStatusEl?.querySelector('.zen-save-text');
  const statsCounter = document.getElementById('stats-counter');
  const slashMenu = document.getElementById('slash-menu');

  const coverFileInput = document.getElementById('cover-file-input') as HTMLInputElement | null;
  const coverPreviewWrapper = document.getElementById('cover-preview-wrapper');
  const coverPreviewImg = document.getElementById('cover-preview-img') as HTMLImageElement | null;
  const coverActions = coverPreviewWrapper?.querySelector(
    '.zen-cover-actions'
  ) as HTMLElement | null;
  const addCoverBtn = document.getElementById('add-cover-btn');
  const changeCoverBtn = document.getElementById('change-cover-btn');
  const removeCoverBtn = document.getElementById('remove-cover-btn');

  // Cover Loading State Elements
  const coverUploadingCard = document.getElementById('cover-uploading-card');
  const coverLoadingBg = document.getElementById('cover-loading-bg');
  const coverUploadStatus = document.getElementById('cover-upload-status');
  const coverUploadMeta = document.getElementById('cover-upload-meta');
  const coverOverlayLoading = document.getElementById('cover-overlay-loading');
  const coverOverlayStatus = document.getElementById('cover-overlay-status');
  const coverOverlayMeta = document.getElementById('cover-overlay-meta');

  // View Mode Elements
  const modeWriteBtn = document.getElementById('mode-write-btn');
  const modePreviewBtn = document.getElementById('mode-preview-btn');
  const writePane = document.getElementById('write-pane');
  const previewPane = document.getElementById('preview-pane');
  const previewTitle = document.getElementById('preview-title');
  const previewSubtitle = document.getElementById('preview-subtitle');
  const previewReadingTime = document.getElementById('preview-reading-time');
  const previewCoverFigure = document.getElementById('preview-cover-figure');
  const previewCoverImg = document.getElementById('preview-cover-img') as HTMLImageElement | null;
  const previewBody = document.getElementById('preview-body');

  // State Management
  let currentStatus = initialStatus;
  let currentCoverImage: string | null = initialCoverImage || null;
  let hasUnpublishedChanges = initialHasUnpublishedChanges;
  let saveTimeout: any = null;
  let isSaving = false;
  let activeViewMode: 'write' | 'preview' = 'write';

  // Bidirectional HTML to Markdown Serializer
  function htmlToMarkdown(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function nodeToMd(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const children = Array.from(el.childNodes).map(nodeToMd).join('');

      switch (tag) {
        case 'h1':
          return `\n\n# ${children.trim()}\n\n`;
        case 'h2':
          return `\n\n## ${children.trim()}\n\n`;
        case 'h3':
          return `\n\n### ${children.trim()}\n\n`;
        case 'h4':
          return `\n\n#### ${children.trim()}\n\n`;
        case 'p':
          return `\n\n${children.trim()}\n\n`;
        case 'blockquote':
          return `\n\n> ${children.trim().replace(/\n+/g, '\n> ')}\n\n`;
        case 'ul':
          return `\n\n${children.trim()}\n\n`;
        case 'ol':
          return `\n\n${children.trim()}\n\n`;
        case 'li': {
          const isParentOl = el.parentElement?.tagName.toLowerCase() === 'ol';
          if (isParentOl) {
            const index = Array.from(el.parentElement?.children || []).indexOf(el) + 1;
            return `${index}. ${children.trim()}\n`;
          }
          return `- ${children.trim()}\n`;
        }
        case 'strong':
        case 'b':
          return `**${children}**`;
        case 'em':
        case 'i':
          return `*${children}*`;
        case 'code':
          if (el.parentElement?.tagName.toLowerCase() === 'pre') {
            return children;
          }
          return `\`${children}\``;
        case 'pre':
          return `\n\n\`\`\`\n${el.textContent || ''}\n\`\`\`\n\n`;
        case 'hr':
          return '\n\n---\n\n';
        case 'a': {
          const href = el.getAttribute('href') || '#';
          return `[${children}](${href})`;
        }
        case 'br':
          return '\n';
        case 'div':
          return `\n${children}\n`;
        default:
          return children;
      }
    }

    const rawMd = Array.from(doc.body.childNodes).map(nodeToMd).join('');
    return rawMd.replace(/\n{3,}/g, '\n\n').trim();
  }

  // Auto-resize textareas dynamically
  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  [titleInput, subtitleInput].forEach((el) => {
    if (!el) return;
    autoResize(el);
    el.addEventListener('input', () => autoResize(el));
  });

  // Calculate word count & reading time from live contenteditable
  function updateStats() {
    const text = (contentEditable?.innerText || '').trim();
    if (!text) {
      const statsStr = '0 words · 1 min read';
      if (statsCounter) statsCounter.textContent = statsStr;
      if (previewReadingTime) previewReadingTime.textContent = statsStr;
      return;
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    const statsStr = `${words} words · ${minutes} min read`;
    if (statsCounter) statsCounter.textContent = statsStr;
    if (previewReadingTime) previewReadingTime.textContent = statsStr;
  }

  // Update publish button UI with persistent state
  function updatePublishBtnUI() {
    if (!publishBtn || !publishText) return;

    if (currentStatus === 'published') {
      if (hasUnpublishedChanges) {
        publishBtn.className = 'zen-publish-btn zen-publish-btn--unsaved';
        publishText.textContent = 'Publish changes';
      } else {
        publishBtn.className = 'zen-publish-btn zen-publish-btn--published';
        publishText.textContent = 'Published';
      }
    } else {
      publishBtn.className = 'zen-publish-btn';
      publishText.textContent = 'Publish Note';
    }
  }

  // Update save status indicator
  function setSaveStatus(status: 'saving' | 'saved' | 'error' | 'pending') {
    if (!saveStatusEl || !saveTextEl) return;
    saveStatusEl.className = 'zen-save-status';

    if (status === 'saving') {
      saveStatusEl.classList.add('zen-save-status--saving');
      saveTextEl.textContent = 'Saving...';
    } else if (status === 'saved') {
      saveStatusEl.classList.add('zen-save-status--saved');
      saveTextEl.textContent = 'Saved to cloud';
    } else if (status === 'error') {
      saveStatusEl.classList.add('zen-save-status--error');
      saveTextEl.textContent = 'Save failed';
    } else {
      saveTextEl.textContent = 'Unsaved changes';
    }
  }

  // Mark changes dirty (persistent until published)
  function markDirty() {
    if (currentStatus === 'published' && !hasUnpublishedChanges) {
      hasUnpublishedChanges = true;
      editorRoot?.setAttribute('data-has-unpublished-changes', 'true');
      updatePublishBtnUI();
    }
  }

  // Debounced auto-save function (keeps cloud draft saved without reverting publish state)
  async function performSave() {
    if (isSaving) return;
    isSaving = true;
    setSaveStatus('saving');

    const title = titleInput?.value.trim() || 'Untitled Note';
    const subtitle = subtitleInput?.value.trim() || '';
    const content = htmlToMarkdown(contentEditable?.innerHTML || '');
    const category = categorySelect?.value || 'Essays';

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          content,
          category,
          coverImage: currentCoverImage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveStatus('saved');
        if (data.note?.hasUnpublishedChanges) {
          hasUnpublishedChanges = true;
          editorRoot?.setAttribute('data-has-unpublished-changes', 'true');
          updatePublishBtnUI();
        }
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      isSaving = false;
    }
  }

  function queueAutoSave() {
    markDirty();
    setSaveStatus('pending');
    updateStats();
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(performSave, 2200);
  }

  titleInput?.addEventListener('input', queueAutoSave);
  subtitleInput?.addEventListener('input', queueAutoSave);
  categorySelect?.addEventListener('change', queueAutoSave);

  // Content Editable Input Handler
  contentEditable?.addEventListener('input', () => {
    queueAutoSave();
  });

  // Intercept Paste: Convert pasted Markdown to real styled HTML elements & wrap URLs over selected text
  contentEditable?.addEventListener('paste', (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    if (!text) return;

    // 1. If user has text selected and pastes a URL, wrap selected text in link
    const isUrl = /^https?:\/\/[^\s]+$/.test(text.trim());
    const selection = window.getSelection();
    if (isUrl && selection && !selection.isCollapsed && selection.rangeCount > 0) {
      document.execCommand('createLink', false, text.trim());
      contentEditable.querySelectorAll('a').forEach((a) => {
        if (!a.getAttribute('target')) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        }
      });
      queueAutoSave();
      return;
    }

    // 2. Check if pasted text contains Markdown indicators
    const hasMarkdown = /(?:#{1,6}\s+|>\s+|[-*]\s+|\d+\.\s+|```|\*\*|---|\[.+\]\(.+\))/m.test(text);

    if (hasMarkdown) {
      const parsedHtml = marked.parse(text, { async: false }) as string;
      document.execCommand('insertHTML', false, parsedHtml);
    } else {
      const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
      if (paragraphs.length > 1) {
        const html = paragraphs.map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
        document.execCommand('insertHTML', false, html);
      } else {
        document.execCommand('insertText', false, text);
      }
    }
    queueAutoSave();
  });

  // Markdown Auto-Formatting Shortcuts on Typing (e.g. "## " + Space, [link](url))
  contentEditable?.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === ')') {
      const selection = window.getSelection();
      if (!selection || !selection.isCollapsed) return;

      const node = selection.anchorNode;
      if (!node || node.nodeType !== Node.TEXT_NODE) return;

      const text = node.textContent || '';
      const offset = selection.anchorOffset;
      const prefix = text.slice(0, offset);

      // Live Link auto-formatting: [text](url) -> <a href="url">text</a>
      const linkMatch = /(^|\s)\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:)[^\s)]+)\)\s?$/.exec(
        prefix
      );
      if (linkMatch) {
        const leadingSpace = linkMatch[1];
        const linkText = linkMatch[2];
        const linkUrl = linkMatch[3];
        const matchLength = linkMatch[0].length - leadingSpace.length;
        const matchStartIndex = offset - matchLength;

        // Create <a> tag
        const a = document.createElement('a');
        a.href = linkUrl;
        a.textContent = linkText;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        // Split text node
        node.textContent = text.slice(0, matchStartIndex);
        const trailingText = text.slice(offset);
        const trailingNode = document.createTextNode(trailingText || '\u00A0');

        if (node.parentNode) {
          const nextSibling = node.nextSibling;
          node.parentNode.insertBefore(a, nextSibling);
          node.parentNode.insertBefore(trailingNode, a.nextSibling);

          const newRange = document.createRange();
          newRange.setStart(trailingNode, trailingText ? 0 : 1);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }

        queueAutoSave();
        return;
      }

      if (prefix === '## ') {
        node.textContent = text.slice(offset);
        document.execCommand('formatBlock', false, '<h2>');
        queueAutoSave();
      } else if (prefix === '### ') {
        node.textContent = text.slice(offset);
        document.execCommand('formatBlock', false, '<h3>');
        queueAutoSave();
      } else if (prefix === '> ') {
        node.textContent = text.slice(offset);
        document.execCommand('formatBlock', false, '<blockquote>');
        queueAutoSave();
      } else if (prefix === '- ' || prefix === '* ') {
        node.textContent = text.slice(offset);
        document.execCommand('insertUnorderedList', false);
        queueAutoSave();
      } else if (prefix === '1. ') {
        node.textContent = text.slice(offset);
        document.execCommand('insertOrderedList', false);
        queueAutoSave();
      }
    }
  });

  // Formatting Toolbar Buttons (Clicking applies format to current block or selection)
  toolbar?.querySelectorAll('.zen-format-btn').forEach((btn) => {
    if (btn.id === 'link-btn') return; // Link is handled separately
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Preserve canvas focus
      const command = btn.getAttribute('data-command') || '';
      const value = btn.getAttribute('data-value') || '';

      if (command === 'formatBlock') {
        document.execCommand('formatBlock', false, `<${value}>`);
      } else {
        document.execCommand(command, false, value || undefined);
      }
      queueAutoSave();
    });
  });

  // Link Modal State & Actions
  let savedLinkRange: Range | null = null;
  let activeLinkAnchor: HTMLAnchorElement | null = null;

  function handleLinkAction() {
    const selection = window.getSelection();
    if (!selection) return;

    if (selection.rangeCount > 0) {
      savedLinkRange = selection.getRangeAt(0).cloneRange();
    } else {
      savedLinkRange = null;
    }

    // Check if within existing link
    activeLinkAnchor = null;
    let node: Node | null = selection.anchorNode;
    while (node && node !== contentEditable) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName.toLowerCase() === 'a'
      ) {
        activeLinkAnchor = node as HTMLAnchorElement;
        break;
      }
      node = node.parentNode;
    }

    const selectedText = selection.toString();
    const existingDetail = activeLinkAnchor
      ? {
          href: activeLinkAnchor.getAttribute('href') || '',
          text: activeLinkAnchor.textContent || '',
          targetBlank: activeLinkAnchor.getAttribute('target') === '_blank',
        }
      : null;

    window.dispatchEvent(
      new CustomEvent('notesby:open-link-modal', {
        detail: {
          selectedText,
          existingAnchor: existingDetail,
        },
      })
    );
  }

  // Handle link application or removal from LinkModal
  window.addEventListener('notesby:apply-link', (e: any) => {
    const { text, url, targetBlank, remove, isEdit } = e.detail;

    // Restore saved selection
    const selection = window.getSelection();
    if (selection && savedLinkRange) {
      selection.removeAllRanges();
      selection.addRange(savedLinkRange);
    }

    if (remove && activeLinkAnchor) {
      const textNode = document.createTextNode(activeLinkAnchor.textContent || '');
      activeLinkAnchor.parentNode?.replaceChild(textNode, activeLinkAnchor);
      activeLinkAnchor = null;
      savedLinkRange = null;
      queueAutoSave();
      contentEditable?.focus();
      return;
    }

    if (isEdit && activeLinkAnchor) {
      activeLinkAnchor.setAttribute('href', url);
      activeLinkAnchor.textContent = text;
      if (targetBlank) {
        activeLinkAnchor.setAttribute('target', '_blank');
        activeLinkAnchor.setAttribute('rel', 'noopener noreferrer');
      } else {
        activeLinkAnchor.removeAttribute('target');
        activeLinkAnchor.removeAttribute('rel');
      }
      activeLinkAnchor = null;
      savedLinkRange = null;
      queueAutoSave();
      contentEditable?.focus();
      return;
    }

    // Insert new link
    if (savedLinkRange && !savedLinkRange.collapsed) {
      document.execCommand('createLink', false, url);
      contentEditable?.querySelectorAll('a').forEach((a) => {
        if (a.getAttribute('href') === url) {
          if (text) a.textContent = text;
          if (targetBlank) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          } else {
            a.removeAttribute('target');
            a.removeAttribute('rel');
          }
        }
      });
      savedLinkRange = null;
      queueAutoSave();
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = text;
      if (targetBlank) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      if (savedLinkRange) {
        savedLinkRange.insertNode(a);
        const spaceNode = document.createTextNode('\u00A0');
        a.parentNode?.insertBefore(spaceNode, a.nextSibling);

        const newRange = document.createRange();
        newRange.setStart(spaceNode, 1);
        newRange.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(newRange);
      } else {
        contentEditable?.appendChild(a);
      }
      savedLinkRange = null;
      queueAutoSave();
    }

    contentEditable?.focus();
  });

  window.addEventListener('notesby:close-link-modal', () => {
    contentEditable?.focus();
  });

  const linkBtn = document.getElementById('link-btn');
  linkBtn?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleLinkAction();
  });

  // Open links in new tab on Cmd/Ctrl + Click, prevent default navigation in editor
  contentEditable?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      if (e.metaKey || e.ctrlKey) {
        window.open(anchor.href, '_blank', 'noopener,noreferrer');
      } else {
        e.preventDefault();
      }
    }
  });

  // Slash Command Popover Handling
  contentEditable?.addEventListener('keyup', (e) => {
    if (!slashMenu) return;
    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed) {
      slashMenu.style.display = 'none';
      return;
    }

    const text = selection.anchorNode?.textContent || '';
    if (text.trim() === '/') {
      slashMenu.style.display = 'flex';
    } else if (e.key === 'Escape' || !text.includes('/')) {
      slashMenu.style.display = 'none';
    }
  });

  // Slash Menu Selection
  slashMenu?.querySelectorAll('.zen-slash-item').forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      if (!contentEditable) return;

      // Clean up the slash character
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        selection.anchorNode.textContent = (selection.anchorNode.textContent || '').replace(
          '/',
          ''
        );
      }

      if (action === 'h2') {
        document.execCommand('formatBlock', false, '<h2>');
      } else if (action === 'h3') {
        document.execCommand('formatBlock', false, '<h3>');
      } else if (action === 'quote') {
        document.execCommand('formatBlock', false, '<blockquote>');
      } else if (action === 'list') {
        document.execCommand('insertUnorderedList', false);
      } else if (action === 'divider') {
        document.execCommand('insertHorizontalRule', false);
      } else if (action === 'link') {
        slashMenu.style.display = 'none';
        handleLinkAction();
        return;
      }

      slashMenu.style.display = 'none';
      contentEditable.focus();
      queueAutoSave();
    });
  });

  // View Mode Switching (Editor Canvas vs Reader View)
  function renderLivePreview() {
    const rawTitle = titleInput?.value.trim() || 'Untitled Note';
    const rawSubtitle = subtitleInput?.value.trim() || '';

    if (previewTitle) previewTitle.textContent = rawTitle;

    if (previewSubtitle) {
      if (rawSubtitle) {
        previewSubtitle.textContent = rawSubtitle;
        previewSubtitle.style.display = 'block';
      } else {
        previewSubtitle.style.display = 'none';
      }
    }

    if (previewCoverFigure && previewCoverImg) {
      if (currentCoverImage) {
        previewCoverImg.src = currentCoverImage;
        previewCoverFigure.style.display = 'block';
      } else {
        previewCoverFigure.style.display = 'none';
      }
    }

    if (previewBody && contentEditable) {
      previewBody.innerHTML =
        contentEditable.innerHTML ||
        '<p class="zen-preview-empty">Start writing to see preview...</p>';
    }
  }

  function setViewMode(mode: 'write' | 'preview') {
    activeViewMode = mode;

    if (mode === 'preview') {
      renderLivePreview();
      if (writePane) writePane.style.display = 'none';
      if (previewPane) previewPane.style.display = 'block';
      if (slashMenu) slashMenu.style.display = 'none';

      modeWriteBtn?.classList.remove('is-active');
      modeWriteBtn?.setAttribute('aria-selected', 'false');
      modePreviewBtn?.classList.add('is-active');
      modePreviewBtn?.setAttribute('aria-selected', 'true');
    } else {
      if (previewPane) previewPane.style.display = 'none';
      if (writePane) writePane.style.display = 'block';

      modePreviewBtn?.classList.remove('is-active');
      modePreviewBtn?.setAttribute('aria-selected', 'false');
      modeWriteBtn?.classList.add('is-active');
      modeWriteBtn?.setAttribute('aria-selected', 'true');

      contentEditable?.focus();
    }
  }

  modeWriteBtn?.addEventListener('click', () => setViewMode('write'));
  modePreviewBtn?.addEventListener('click', () => setViewMode('preview'));

  // Cover Image Upload Handlers
  addCoverBtn?.addEventListener('click', () => coverFileInput?.click());
  changeCoverBtn?.addEventListener('click', () => coverFileInput?.click());

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  coverFileInput?.addEventListener('change', async () => {
    const file = coverFileInput.files?.[0];
    if (!file) return;

    // Client-side validation: MIME type & size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or GIF image.');
      coverFileInput.value = '';
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      alert('File size exceeds the 5 MB limit. Please choose a smaller image.');
      coverFileInput.value = '';
      return;
    }

    const isReplacement = Boolean(
      currentCoverImage && coverPreviewWrapper && coverPreviewWrapper.style.display !== 'none'
    );

    const localPreviewUrl = URL.createObjectURL(file);
    const fileNameStr = file.name.length > 28 ? `${file.name.slice(0, 25)}...` : file.name;
    const metaStr = `${fileNameStr} · ${formatFileSize(file.size)}`;

    // Set immediate loading state
    setSaveStatus('saving');
    if (isReplacement) {
      if (coverOverlayStatus) coverOverlayStatus.textContent = 'Uploading replacement...';
      if (coverOverlayMeta) coverOverlayMeta.textContent = metaStr;
      if (coverOverlayLoading) coverOverlayLoading.style.display = 'flex';
      if (coverActions) {
        coverActions.style.pointerEvents = 'none';
        coverActions.style.opacity = '0.35';
      }
    } else {
      if (addCoverBtn) addCoverBtn.style.display = 'none';
      if (coverLoadingBg) coverLoadingBg.style.backgroundImage = `url(${localPreviewUrl})`;
      if (coverUploadStatus) coverUploadStatus.textContent = 'Uploading cover image...';
      if (coverUploadMeta) coverUploadMeta.textContent = metaStr;
      if (coverUploadingCard) coverUploadingCard.style.display = 'flex';
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (uploadRes.ok && uploadData.url) {
        if (isReplacement) {
          if (coverOverlayStatus) coverOverlayStatus.textContent = 'Finalizing...';
        } else {
          if (coverUploadStatus) coverUploadStatus.textContent = 'Finalizing...';
        }

        // Graceful pre-decoding offscreen to prevent layout pop or image flash
        const preloader = new Image();
        preloader.src = uploadData.url;
        try {
          await preloader.decode();
        } catch {
          // Fallback if decode is unavailable or image fails offscreen decoding
        }

        currentCoverImage = uploadData.url;
        if (coverPreviewImg) coverPreviewImg.src = currentCoverImage || '';
        if (previewCoverImg) previewCoverImg.src = currentCoverImage || '';
        if (previewCoverFigure) previewCoverFigure.style.display = 'block';

        if (isReplacement) {
          coverOverlayLoading?.classList.add('zen-cover-overlay-loading--fade-out');
          setTimeout(() => {
            if (coverOverlayLoading) {
              coverOverlayLoading.style.display = 'none';
              coverOverlayLoading.classList.remove('zen-cover-overlay-loading--fade-out');
            }
            if (coverActions) {
              coverActions.style.pointerEvents = '';
              coverActions.style.opacity = '';
            }
          }, 240);
        } else {
          if (coverUploadingCard) coverUploadingCard.style.display = 'none';
          if (coverPreviewWrapper) {
            coverPreviewWrapper.style.display = 'block';
            coverPreviewWrapper.classList.add('zen-cover-preview--revealing');
            setTimeout(() => {
              coverPreviewWrapper.classList.remove('zen-cover-preview--revealing');
            }, 350);
          }
        }

        markDirty();
        await performSave();
      } else {
        alert(uploadData.error || 'Failed to upload cover image.');
        setSaveStatus('error');
        // Revert loading states
        if (isReplacement) {
          if (coverOverlayLoading) coverOverlayLoading.style.display = 'none';
          if (coverActions) {
            coverActions.style.pointerEvents = '';
            coverActions.style.opacity = '';
          }
        } else {
          if (coverUploadingCard) coverUploadingCard.style.display = 'none';
          if (addCoverBtn) addCoverBtn.style.display = 'inline-flex';
        }
      }
    } catch {
      alert('Upload failed due to a network error.');
      setSaveStatus('error');
      // Revert loading states
      if (isReplacement) {
        if (coverOverlayLoading) coverOverlayLoading.style.display = 'none';
        if (coverActions) {
          coverActions.style.pointerEvents = '';
          coverActions.style.opacity = '';
        }
      } else {
        if (coverUploadingCard) coverUploadingCard.style.display = 'none';
        if (addCoverBtn) addCoverBtn.style.display = 'inline-flex';
      }
    } finally {
      URL.revokeObjectURL(localPreviewUrl);
      coverFileInput.value = '';
    }
  });

  // Smooth cover removal without screen jump
  removeCoverBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!coverPreviewWrapper) return;

    // Smooth collapsing transition
    coverPreviewWrapper.classList.add('zen-cover-preview--collapsing');

    setTimeout(async () => {
      currentCoverImage = null;
      coverPreviewWrapper.style.display = 'none';
      coverPreviewWrapper.classList.remove('zen-cover-preview--collapsing');
      if (coverPreviewImg) coverPreviewImg.src = '';
      if (previewCoverImg) previewCoverImg.src = '';
      if (previewCoverFigure) previewCoverFigure.style.display = 'none';
      if (addCoverBtn) {
        addCoverBtn.style.display = 'inline-flex';
      }

      markDirty();
      await performSave();
    }, 280);
  });

  // Publish / Update Action
  publishBtn?.addEventListener('click', async () => {
    // 1. If currently published with unpublished changes: publish changes immediately
    if (currentStatus === 'published' && hasUnpublishedChanges) {
      publishBtn.disabled = true;
      if (publishText) publishText.textContent = 'Publishing...';

      if (saveTimeout) clearTimeout(saveTimeout);
      await performSave();

      try {
        const res = await fetch(`/api/notes/${noteId}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'publish' }),
        });
        const data = await res.json();
        if (res.ok) {
          currentStatus = data.status;
          hasUnpublishedChanges = false;
          editorRoot?.setAttribute('data-has-unpublished-changes', 'false');
          setSaveStatus('saved');
          updatePublishBtnUI();
        } else {
          if (publishText) publishText.textContent = 'Error';
        }
      } catch {
        if (publishText) publishText.textContent = 'Error';
      } finally {
        publishBtn.disabled = false;
      }
      return;
    }

    // 2. If currently published and no changes: prompt to unpublish
    if (currentStatus === 'published' && !hasUnpublishedChanges) {
      const confirmUnpublish = confirm(
        'This note is live on your site. Do you want to unpublish it and revert to a draft?'
      );
      if (!confirmUnpublish) return;

      publishBtn.disabled = true;
      if (publishText) publishText.textContent = 'Updating...';

      try {
        const res = await fetch(`/api/notes/${noteId}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unpublish' }),
        });
        const data = await res.json();
        if (res.ok) {
          currentStatus = data.status;
          hasUnpublishedChanges = false;
          editorRoot?.setAttribute('data-has-unpublished-changes', 'false');
          setSaveStatus('saved');
          updatePublishBtnUI();
        } else {
          if (publishText) publishText.textContent = 'Error';
        }
      } catch {
        if (publishText) publishText.textContent = 'Error';
      } finally {
        publishBtn.disabled = false;
      }
      return;
    }

    // 3. If draft: publish note
    if (currentStatus === 'draft') {
      publishBtn.disabled = true;
      if (publishText) publishText.textContent = 'Publishing...';

      if (saveTimeout) clearTimeout(saveTimeout);
      await performSave();

      try {
        const res = await fetch(`/api/notes/${noteId}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'publish' }),
        });
        const data = await res.json();
        if (res.ok) {
          currentStatus = data.status;
          hasUnpublishedChanges = false;
          editorRoot?.setAttribute('data-has-unpublished-changes', 'false');
          setSaveStatus('saved');
          updatePublishBtnUI();
        } else {
          if (publishText) publishText.textContent = 'Error';
        }
      } catch {
        if (publishText) publishText.textContent = 'Error';
      } finally {
        publishBtn.disabled = false;
      }
    }
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + S: Force Save
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (saveTimeout) clearTimeout(saveTimeout);
      performSave();
      return;
    }

    // Cmd/Ctrl + K: Insert / Edit Link
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      handleLinkAction();
      return;
    }

    // Cmd/Ctrl + P: Toggle View Mode (Editor / Reader View)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      setViewMode(activeViewMode === 'write' ? 'preview' : 'write');
      return;
    }

    // Cmd/Ctrl + Z / Shift+Z: Undo / Redo
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        document.execCommand('redo', false);
        queueAutoSave();
        return;
      }
      e.preventDefault();
      document.execCommand('undo', false);
      queueAutoSave();
      return;
    }

    // Cmd/Ctrl + Y: Redo
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      document.execCommand('redo', false);
      queueAutoSave();
      return;
    }
  });

  // Initial Setup
  updateStats();
  updatePublishBtnUI();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZenEditor);
  } else {
    initZenEditor();
  }
}
