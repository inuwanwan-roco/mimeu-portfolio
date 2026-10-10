'use strict';

/* ABOUT詳細専用 / LIKES modal */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('#likes-dialog');
    if (!modal) return;

    const title = modal.querySelector('.p-likes-modal__title');
    const content = modal.querySelector('.p-likes-modal__content');
    const closeButton = modal.querySelector('.p-likes-modal__close');
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
            if (event.target === modal && event.propertyName === 'opacity') finish();
        };

        if (reducedMotion.matches) {
            finish();
        } else {
            modal.addEventListener('transitionend', onTransitionEnd);
            // 開く途中で閉じた場合など、transitionendが発生しない状況にも対応。
            fallback = window.setTimeout(finish, 500);
        }
    };

    document.querySelectorAll('.p-about-detail__like-trigger').forEach((card) => {
        card.addEventListener('click', () => {
            const template = document.querySelector(`#likes-content-${card.dataset.like}`);
            if (!template || modal.open || closing) return;

            activeCard = card;
            title.textContent = card.dataset.like.toUpperCase();
            content.replaceChildren(template.content.cloneNode(true));
            document.body.classList.add('is-likes-modal-open');
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
        document.body.classList.remove('is-likes-modal-open');
        modal.classList.remove('is-open');
        closing = false;
        activeCard?.focus({ preventScroll: true });
        activeCard = null;
    });
});
