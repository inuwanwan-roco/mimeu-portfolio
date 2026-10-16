'use strict';

/* ABOUT詳細専用 / 共通モーダル処理へカテゴリ情報を渡す */
document.addEventListener('DOMContentLoaded', () => {
    initPhilosophyCarousel();
    initContentModal('#likes-dialog', '.p-about-detail__like-trigger', (card) => ({
        title: card.dataset.like.toUpperCase(),
        templateId: `likes-content-${card.dataset.like}`
    }), 'is-likes-modal-open', { closeDuration: 560 });

    // 長い本文でも、開いた直後は上部のイラスト・見出しから表示する。
    const modal = document.querySelector('#likes-dialog');
    document.querySelectorAll('.p-about-detail__like-trigger').forEach((card) => {
        card.addEventListener('click', () => {
            if (modal?.open) modal.scrollTop = 0;
        });
    });
});

/* NEWSと同じ、ネイティブスワイプ＋端の複製スライドによるループ。 */
function initPhilosophyCarousel() {
    const section = document.querySelector('.p-about-detail__philosophy');
    const list = section?.querySelector('.p-about-detail__principles');
    const controls = section?.querySelector('.p-about-detail__carousel-controls');
    if (!list || !controls) return;
    const cards = [...list.children];
    const dots = [...controls.querySelectorAll('.p-about-detail__carousel-dot')];
    const playback = controls.querySelector('.p-about-detail__carousel-playback');
    const mobile = matchMedia('(max-width: 768px)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let slides = cards;
    let current = 0;
    let active = false;
    let visible = false;
    let paused = false;
    let touching = false;
    let drag = null;
    let autoplayTimer = 0;
    let settleTimer = 0;
    let measuredWidth = 0;
    const stop = () => clearTimeout(autoplayTimer);
    const offset = (index) => slides[index].offsetLeft - slides[0].offsetLeft;
    const nearest = () => slides.reduce((best, card, index) =>
        Math.abs(offset(index) - list.scrollLeft) < Math.abs(offset(best) - list.scrollLeft) ? index : best, 0);
    const update = () => {
        dots.forEach((dot, index) => {
            if (index === current) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
        });
        cards.forEach((card, index) => {
            card.setAttribute('aria-hidden', String(index !== current));
        });
        playback.disabled = reducedMotion.matches;
        playback.textContent = reducedMotion.matches ? '自動再生なし' : paused ? '再生' : '一時停止';
        playback.setAttribute('aria-pressed', String(paused));
        playback.setAttribute('aria-label', reducedMotion.matches ? '動きを減らす設定により自動再生は無効です'
            : paused ? '自動再生を再開' : '自動再生を一時停止');
    };
    const schedule = () => {
        stop();
        if (!active || !visible || paused || reducedMotion.matches || document.hidden
            || list.contains(document.activeElement) || dots.includes(document.activeElement)) return;
        autoplayTimer = setTimeout(() => {
            if (touching || drag || document.querySelector('dialog[open]') || document.body.classList.contains('is-menu-open')) {
                schedule();
                return;
            }
            moveTo(current + 2);
        }, 4000);
    };
    const jumpTo = (index) => {
        list.classList.add('is-jumping');
        list.scrollTo({ left: offset(index), behavior: 'instant' });
        // 同じフレームでSnapへ戻しても、端の複製へ再吸着しないよう確定する。
        list.getBoundingClientRect();
        list.classList.remove('is-jumping');
    };
    const finish = () => {
        if (!active || touching || drag) return;
        const index = nearest();
        current = (index - 1 + cards.length) % cards.length;
        if (index === 0 || index === slides.length - 1) jumpTo(current + 1);
        update();
        schedule();
    };
    const settle = () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(finish, 160);
    };
    const moveTo = (index) => {
        if (!active) return;
        stop();
        clearTimeout(settleTimer);
        list.scrollTo({ left: offset(index), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        settle();
    };
    const makeClone = (card) => {
        const clone = card.cloneNode(true);
        clone.dataset.philosophyClone = '';
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
        return clone;
    };
    const configure = () => {
        stop();
        clearTimeout(settleTimer);
        drag = null;
        touching = false;
        list.querySelectorAll('[data-philosophy-clone]').forEach((clone) => clone.remove());
        active = mobile.matches;
        list.classList.toggle('is-carousel', active);
        list.classList.remove('is-dragging', 'is-jumping');
        controls.hidden = !active;
        if (active) {
            list.prepend(makeClone(cards.at(-1)));
            list.append(makeClone(cards[0]));
            slides = [...list.children];
            list.tabIndex = 0;
            list.setAttribute('role', 'region');
            list.setAttribute('aria-roledescription', 'カルーセル');
            list.setAttribute('aria-label', 'Design Philosophy');
            cards.forEach((card, index) => {
                card.setAttribute('role', 'group');
                card.setAttribute('aria-roledescription', 'スライド');
                card.setAttribute('aria-label', `${index + 1} / ${cards.length}`);
            });
            jumpTo(current + 1);
            update();
            schedule();
        } else {
            slides = cards;
            ['tabindex', 'role', 'aria-roledescription', 'aria-label'].forEach((name) => list.removeAttribute(name));
            cards.forEach((card) => ['role', 'aria-roledescription', 'aria-label', 'aria-hidden'].forEach((name) => card.removeAttribute(name)));
            list.scrollLeft = 0;
        }
        measuredWidth = list.clientWidth;
    };
    dots.forEach((dot, index) => dot.addEventListener('click', () => moveTo(index + 1)));
    playback.addEventListener('click', () => {
        paused = !paused;
        update();
        schedule();
    });
    list.addEventListener('scroll', () => {
        if (!active) return;
        stop();
        settle();
    }, { passive: true });
    list.addEventListener('keydown', (event) => {
        if (!active || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        moveTo(event.key === 'Home' ? 1 : event.key === 'End' ? cards.length : current + (event.key === 'ArrowRight' ? 2 : 0));
    });
    list.addEventListener('pointerdown', (event) => {
        if (!active) return;
        stop();
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        drag = { x: event.clientX, scroll: list.scrollLeft };
        list.setPointerCapture(event.pointerId);
        list.classList.add('is-dragging');
    });
    list.addEventListener('pointermove', (event) => {
        if (!drag) return;
        event.preventDefault();
        list.scrollLeft = drag.scroll + drag.x - event.clientX;
    });
    const release = () => {
        if (!drag) return;
        drag = null;
        list.classList.remove('is-dragging');
        if (active) moveTo(nearest());
    };
    list.addEventListener('pointerup', release);
    list.addEventListener('pointercancel', release);
    list.addEventListener('lostpointercapture', release);
    list.addEventListener('touchstart', () => { touching = true; stop(); }, { passive: true });
    const releaseTouch = () => { touching = false; if (active) settle(); };
    list.addEventListener('touchend', releaseTouch, { passive: true });
    list.addEventListener('touchcancel', releaseTouch, { passive: true });
    section.addEventListener('focusin', stop);
    section.addEventListener('focusout', () => queueMicrotask(schedule));
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', schedule);
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        schedule();
    }, { threshold: 0.1 }).observe(list);
    new ResizeObserver(() => {
        if (!active || Math.abs(measuredWidth - list.clientWidth) < 0.5) return;
        measuredWidth = list.clientWidth;
        jumpTo(current + 1);
        schedule();
    }).observe(list);
    mobile.addEventListener('change', configure);
    reducedMotion.addEventListener('change', () => { stop(); if (active) { finish(); update(); } });
    configure();
}
