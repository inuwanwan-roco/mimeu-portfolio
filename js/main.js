'use strict';

/* ==================================================
Miméu studio MAIN SCRIPT
================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initLoading();
    initHeader();
    initGlobalMenu();
    initAccordion();
    initContactForm();
    initBackToTopAlignment();
});

/* ------------------------------------------
Loading
初回アクセス時のみ表示（同一タブのセッション内）
------------------------------------------ */

function initLoading() {
    const loading = document.querySelector('#js-loading');
    if (!loading) return;

    const storageKey = 'mimeu-loading-viewed';
    const hasViewed = sessionStorage.getItem(storageKey) === 'true';

    if (hasViewed) {
        loading.remove();
        return;
    }

    window.addEventListener('load', () => {
        window.setTimeout(() => {
            loading.classList.add('is-hidden');
            sessionStorage.setItem(storageKey, 'true');

            loading.addEventListener(
                'transitionend',
                () => loading.remove(),
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

    const closeMenu = () => {
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'メニューを開く');
        menu.hidden = true;
        document.body.classList.remove('is-menu-open');
    };

    const openMenu = () => {
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', 'メニューを閉じる');
        menu.hidden = false;
        document.body.classList.add('is-menu-open');
    };

    button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        isOpen ? closeMenu() : openMenu();
    });

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });
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
現在はデザイン確認用。実送信機能は未接続。
------------------------------------------ */

function initContactForm() {
    const form = document.querySelector('#js-contact-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
    });
}

/* ------------------------------------------
TOPの戻るボタン：PCナビCONTACTの文字開始位置に合わせる
------------------------------------------ */
function initBackToTopAlignment() {
    const link = document.querySelector('.p-home-back-to-top__link');
    const text = document.querySelector('.p-home-back-to-top__text');
    const contact = document.querySelector('.l-header__nav-link[href="#contact"]');
    if (!link || !text || !contact) return;

    const align = () => {
        link.style.removeProperty('--back-to-top-offset');
        if (!contact.getClientRects().length) return;
        const offset = text.getBoundingClientRect().left - contact.getBoundingClientRect().left;
        link.style.setProperty('--back-to-top-offset', `${offset}px`);
    };

    const observer = new ResizeObserver(align);
    observer.observe(contact);
    observer.observe(document.documentElement);
    document.fonts.ready.then(align);
    align();
}
