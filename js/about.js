'use strict';

/* ABOUT詳細専用 / 共通モーダル処理へカテゴリ情報を渡す */
document.addEventListener('DOMContentLoaded', () => {
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
