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

const accordions = document.querySelectorAll(".c-accordion");

accordions.forEach((accordion) => {
    const trigger = accordion.querySelector(".c-accordion__trigger");

    trigger.addEventListener("click", () => {
        const isOpen = accordion.classList.contains("is-open");

        accordion.classList.toggle("is-open");

        trigger.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );
    });
});

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
