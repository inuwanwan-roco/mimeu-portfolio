'use strict';

/* ABOUT詳細専用 / 共通モーダル処理へカテゴリ情報を渡す */
document.addEventListener('DOMContentLoaded', () => {
    initContentModal('#likes-dialog', '.p-about-detail__like-trigger', (card) => ({
        title: card.dataset.like.toUpperCase(),
        templateId: `likes-content-${card.dataset.like}`
    }), 'is-likes-modal-open');
});
