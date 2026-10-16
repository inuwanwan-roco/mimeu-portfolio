'use strict';

/* ==================================================
Miméu studio MAIN SCRIPT
================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initPageTransitions();
    initLoading();
    initHeader();
    initGlobalMenu();
    initAccordion();
    initContactForm();
    initBackToTopAlignment();
    initGraphicGallery();
});

/* ------------------------------------------
Loading
ページ読み込み・更新のたびに表示
------------------------------------------ */

function initLoading() {
    const loading = document.querySelector('#js-loading');
    if (!loading) return;

    window.addEventListener('load', () => {
        window.setTimeout(() => {
            loading.classList.add('is-hidden');

            loading.addEventListener(
                'transitionend',
                () => {
                    loading.remove();
                    document.dispatchEvent(new Event('mimeu:loading-finished'));
                },
                { once: true }
            );
        }, 1800);
    });
}

/* ------------------------------------------
Header Scroll
------------------------------------------ */

function initHeader() {
    const header = document.querySelector('.l-header');
    if (!header) return;

    const updateHeader = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
}

/* ------------------------------------------
Global Menu
------------------------------------------ */

function initGlobalMenu() {
    const button = document.querySelector('#js-menu-button');
    const menu = document.querySelector('#js-global-menu');
    if (!button || !menu) return;
    const closeButton = menu.querySelector('.c-global-menu__close');
    const background = [document.querySelector('.l-header'), document.querySelector('main'), document.querySelector('.c-page-top'), document.querySelector('.l-footer')].filter(Boolean);
    const mobile = window.matchMedia('(max-width: 768px)');

    const closeMenu = (restoreFocus = true) => {
        if (!menu.classList.contains('is-open')) return;
        menu.classList.remove('is-open');
        menu.inert = true;
        menu.setAttribute('aria-hidden', 'true');
        button.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-menu-open');
        background.forEach((element) => { element.inert = false; });
        if (restoreFocus) button.focus({ preventScroll: true });
    };

    const openMenu = () => {
        if (!mobile.matches) return;
        menu.inert = false;
        menu.removeAttribute('aria-hidden');
        menu.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        document.body.classList.add('is-menu-open');
        background.forEach((element) => { element.inert = true; });
        closeButton.focus({ preventScroll: true });
    };

    button.addEventListener('click', openMenu);
    closeButton.addEventListener('click', () => closeMenu());
    menu.addEventListener('click', (event) => {
        if (event.target === menu || event.target.classList.contains('c-global-menu__top') || event.target === menu.querySelector('.c-global-menu__nav')) closeMenu();
    });
    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            closeMenu(false);
            const target = link.getAttribute('href');
            if (target.startsWith('#')) {
                const section = document.querySelector(target);
                if (section) {
                    section.setAttribute('tabindex', '-1');
                    section.focus({ preventScroll: true });
                }
            }
        });
    });
    menu.querySelectorAll('.c-global-menu__toggle').forEach((toggle) => {
        const panel = document.getElementById(toggle.getAttribute('aria-controls'));
        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') !== 'true';
            toggle.setAttribute('aria-expanded', String(open));
            panel.classList.toggle('is-open', open);
            panel.inert = !open;
        });
    });
    menu.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
        if (event.key !== 'Tab') return;
        const focusable = [...menu.querySelectorAll('a, button')].filter((element) => !element.closest('[inert]'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    mobile.addEventListener('change', () => { if (!mobile.matches) closeMenu(false); });
}

/* ==================================================
Accordion
================================================== */

function initAccordion() {
    document.querySelectorAll('.c-accordion').forEach((accordion) => {
        const trigger = accordion.querySelector('.c-accordion__trigger');
        if (!trigger) return;

        trigger.setAttribute('aria-expanded', String(accordion.classList.contains('is-open')));

        trigger.addEventListener('click', () => {
            const isOpen = accordion.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', String(isOpen));
        });
    });
}

/* ------------------------------------------
Contact Form
Formspreeへページ遷移なしで送信。入力検証・状態通知・二重送信防止。
------------------------------------------ */

function initContactForm() {
    const form = document.querySelector('#js-contact-form');
    if (!form) return;

    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('#contact-status');
    if (!button || !status) return;

    const idleLabel = button.textContent;
    let submitting = false;
    let successTimer = null;
    let fadeTimer = null;
    const showStatus = (message, state) => {
        // 再送信やエラー表示に、前回成功時のタイマーを持ち越さない。
        window.clearTimeout(successTimer);
        window.clearTimeout(fadeTimer);
        status.classList.remove('is-fading');
        status.hidden = false;
        status.textContent = message;
        status.dataset.state = state;
        if (state !== 'success') return;

        successTimer = window.setTimeout(() => {
            if (status.dataset.state !== 'success') return;
            status.classList.add('is-fading');
            const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400;
            fadeTimer = window.setTimeout(() => {
                status.hidden = true;
                status.textContent = '';
                delete status.dataset.state;
                status.classList.remove('is-fading');
            }, duration);
        }, 10000);
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitting || !form.reportValidity()) return;

        // 必須のテキスト項目は、空白だけの入力も送信しない。
        const emptyField = [...form.querySelectorAll('input[required], textarea[required]')]
            .find((field) => !field.value.trim());
        if (emptyField) {
            emptyField.setCustomValidity('入力してください。');
            emptyField.reportValidity();
            emptyField.addEventListener('input', () => emptyField.setCustomValidity(''), { once: true });
            return;
        }

        const data = new FormData(form);
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 30000);
        submitting = true;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = 'Sending...';
        showStatus('送信中です。しばらくお待ちください。', 'sending');

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: data,
                headers: { Accept: 'application/json' },
                signal: controller.signal
            });
            if (!response.ok) {
                showStatus('送信できませんでした。時間をおいてもう一度お試しください。', 'error');
                return;
            }
            form.reset();
            showStatus('Thank you!\nメッセージを送信しました。', 'success');
        } catch {
            // 通信断・タイムアウト時は入力を保持し、自動再送による重複を避ける。
            showStatus('送信結果を確認できませんでした。時間をおいてもう一度お試しください。', 'error');
        } finally {
            window.clearTimeout(timeout);
            submitting = false;
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.textContent = idleLabel;
        }
    });
}

/* ------------------------------------------
共通の戻るボタン：footer区切り線の範囲内でPCナビに合わせる
------------------------------------------ */
function initBackToTopAlignment() {
    const link = document.querySelector('.c-page-top__link');
    const text = document.querySelector('.c-page-top__text');
    const contact = document.querySelector('.l-header__nav-link[href$="#contact"]');
    const divider = document.querySelector('.l-footer > .c-section-divider .c-section-divider__line');
    if (!link || !text || !contact || !divider) return;

    const align = () => {
        link.style.removeProperty('--back-to-top-offset');
        const button = link.getBoundingClientRect();
        const bounds = divider.getBoundingClientRect();
        const textInset = text.getBoundingClientRect().left - button.left;
        const preferredLeft = contact.getClientRects().length
            ? contact.getBoundingClientRect().left - textInset
            : button.left;
        const left = Math.max(bounds.left, Math.min(preferredLeft, bounds.right - button.width));
        link.style.setProperty('--back-to-top-offset', `${button.left - left}px`);
    };

    const observer = new ResizeObserver(align);
    observer.observe(contact);
    observer.observe(divider);
    observer.observe(document.documentElement);
    document.fonts.ready.then(align);
    align();
}

/* 共通dialog / LIKESとGraphic Galleryで再利用 */
function initContentModal(modalSelector, triggerSelector, getContent, scrollClass = 'is-content-modal-open', options = {}) {
    const modal = document.querySelector(modalSelector);
    if (!modal) return;

    const title = modal.querySelector('.p-likes-modal__title, .c-content-modal__title');
    const content = modal.querySelector('.p-likes-modal__content, .c-content-modal__content');
    const closeButton = modal.querySelector('.p-likes-modal__close, .c-content-modal__close');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeCard = null;
    let closing = false;

    const closeModal = () => {
        if (!modal.open || closing) return;
        closing = true;
        modal.classList.remove('is-open');

        let fallback;
        const finish = () => {
            window.clearTimeout(fallback);
            modal.removeEventListener('transitionend', onTransitionEnd);
            modal.close();
        };
        const onTransitionEnd = (event) => {
            if (!options.closeDuration && event.target === modal && event.propertyName === 'opacity') finish();
        };

        if (reducedMotion.matches) {
            finish();
        } else {
            modal.addEventListener('transitionend', onTransitionEnd);
            // 開く途中で閉じた場合など、transitionendが発生しない状況にも対応。
            fallback = window.setTimeout(finish, options.closeDuration ?? 500);
        }
    };

    document.querySelectorAll(triggerSelector).forEach((card) => {
        card.addEventListener('click', () => {
            const details = getContent(card);
            const template = document.getElementById(details.templateId);
            if (!template || modal.open || closing) return;

            activeCard = card;
            title.textContent = details.title;
            content.replaceChildren(template.content.cloneNode(true));
            document.body.classList.add(scrollClass);
            modal.showModal();
            // 初期スタイルを確定してからfade / scaleを開始する。
            modal.getBoundingClientRect();
            modal.classList.add('is-open');
            closeButton.focus({ preventScroll: true });
        });
    });

    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return;
        const focusable = [...modal.querySelectorAll(
            'button, a[href], input, select, textarea, [tabindex]'
        )].filter((element) => !element.disabled && !element.closest('[inert]')
            && element.tabIndex >= 0 && element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if ((event.shiftKey && document.activeElement === first)
            || (!event.shiftKey && document.activeElement === last)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        }
    });
    modal.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeModal();
    });
    modal.addEventListener('click', (event) => {
        if (event.target !== modal) return;
        const bounds = modal.getBoundingClientRect();
        const outside = event.clientX < bounds.left || event.clientX > bounds.right
            || event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (outside) closeModal();
    });
    modal.addEventListener('close', () => {
        document.body.classList.remove(scrollClass);
        modal.classList.remove('is-open');
        closing = false;
        activeCard?.focus({ preventScroll: true });
        activeCard = null;
    });
}

/* Graphic Gallery / カテゴリ未設定の作品はALLに表示 */
function initGraphicGallery() {
    const gallery = document.querySelector('.p-gallery');
    if (!gallery) return;
    initContentModal('#gallery-dialog', '.p-gallery__trigger', (card) => ({
        title: document.getElementById(card.getAttribute('aria-labelledby')).textContent,
        templateId: `gallery-content-${card.dataset.artwork}`
    }));
    const filters = [...gallery.querySelectorAll('[data-gallery-filter]')];
    const items = [...gallery.querySelectorAll('.p-gallery__item')];
    const empty = gallery.querySelector('.p-gallery__empty');
    const applyFilter = (category) => {
        filters.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.galleryFilter === category)));
        items.forEach((item) => { item.hidden = category !== 'all' && item.dataset.category !== category; });
        empty.hidden = items.some((item) => !item.hidden);
    };
    filters.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.galleryFilter)));
    const revealAnchor = () => {
        const item = items.find((item) => `#${item.id}` === location.hash);
        if (!item) return;
        applyFilter('all');
        item.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    window.addEventListener('hashchange', revealAnchor);
    window.addEventListener('load', revealAnchor, { once: true });
}

/* 全ページ共通 / 内部HTMLへの遷移だけを柔らかく切り替える */
function initPageTransitions() {
    const page = document.createElement('div');
    page.className = 'l-page-transition is-waiting';
    page.inert = true;
    const contents = [...document.body.children].filter((element) =>
        element.matches('.l-header, main, .c-page-top, .l-footer')
    );
    document.body.insertBefore(page, contents[0] ?? null);
    contents.forEach((element) => page.append(element));
    document.documentElement.classList.remove('is-page-preparing');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let navigationTimer = null;
    let leaving = false;
    const reveal = () => {
        page.inert = false;
        page.classList.remove('is-waiting', 'is-leaving', 'is-entering');
        if (!reducedMotion.matches) {
            // 戻る・進むで復元したページでも新しくフェードを開始する。
            page.getBoundingClientRect();
            page.classList.add('is-entering');
        }
    };
    page.addEventListener('animationend', (event) => {
        if (event.target === page && event.animationName === 'page-enter-opacity') {
            page.classList.remove('is-entering');
        }
    });
    document.addEventListener('mimeu:loading-finished', reveal, { once: true });
    if (!document.querySelector('#js-loading')) reveal();

    const normalizePath = (path) => path.endsWith('/') ? `${path}index.html` : path;
    document.addEventListener('click', (event) => {
        const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
        if (!link || event.defaultPrevented || event.button !== 0
            || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
            || link.hasAttribute('download')
            || (link.target && link.target !== '_self')) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        const destination = new URL(link.href, location.href);
        if (destination.origin !== location.origin || !/\.html$/i.test(destination.pathname)) return;
        if (destination.hash && normalizePath(destination.pathname) === normalizePath(location.pathname)
            && destination.search === location.search) return;
        if (reducedMotion.matches) return;
        event.preventDefault();
        if (leaving) return;
        leaving = true;
        page.classList.remove('is-entering', 'is-waiting');
        page.classList.add('is-leaving');
        page.inert = true;
        navigationTimer = window.setTimeout(() => location.assign(destination.href), 370);
    });

    // BFCacheに透明な状態を保存せず、復元時も確実に表示する。
    window.addEventListener('pagehide', () => {
        window.clearTimeout(navigationTimer);
        leaving = false;
        page.inert = false;
        page.classList.remove('is-entering', 'is-leaving', 'is-waiting');
    });
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        window.clearTimeout(navigationTimer);
        leaving = false;
        reveal();
    });
    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) page.classList.remove('is-entering');
    });
}
