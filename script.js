import { supabase } from "./js/supabase.js";

const REVIEW_STORAGE_KEY = 'solcyn_customer_reviews';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getStoredReviews() {
    try {
        return JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

function saveStoredReviews(reviews) {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
}

function formatReviewDate(dateValue) {
    if (!dateValue) return 'Recently';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Recently';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function renderReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;

    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '<div class="review-empty">Be the first to share your experience with us.</div>';
        return;
    }

    const reviewLimit = Number(reviewsList.dataset.reviewLimit);
    const visibleReviews = reviewLimit > 0 ? reviews.slice(0, reviewLimit) : reviews;

    reviewsList.innerHTML = visibleReviews.map((review) => {
        const name = review.name ? escapeHtml(review.name) : 'Anonymous Customer';
        const phone = review.phone ? escapeHtml(review.phone) : 'Customer';
        const message = escapeHtml(review.review || '');
        const createdAt = formatReviewDate(review.created_at || new Date().toISOString());
        const initial = name.charAt(0).toUpperCase();

        return `
            <article class="review-card">
                <div class="review-card-top">
                    <div class="review-avatar">${initial}</div>
                    <div>
                        <h3>${name}</h3>
                        <p>${phone}</p>
                    </div>
                    <span class="review-date">${createdAt}</span>
                </div>
                <p class="review-message">“${message}”</p>
            </article>
        `;
    }).join('');
}

async function loadReviews() {
    const stored = getStoredReviews();
    if (stored.length) renderReviews(stored);

    try {
        const { data, error } = await supabase
            .from('customer_reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (Array.isArray(data) && data.length > 0) {
            saveStoredReviews(data);
            renderReviews(data);
            return;
        }

        if (!stored.length) renderReviews([]);
    } catch (error) {
        console.warn('Using local review storage because Supabase is unavailable:', error);
        renderReviews(stored);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const header = document.querySelector('.main-header');
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const cartButtons = document.querySelectorAll('.add-to-cart-overlay');
    const cartCountElement = document.querySelector('.cart-count');

    await loadReviews();

    const reviewForm = document.getElementById('reviewForm');
    const reviewStatus = document.getElementById('reviewStatus');

    if (reviewForm && reviewStatus) {
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(reviewForm);
            const name = (formData.get('name') || '').toString().trim();
            const phone = (formData.get('phone') || '').toString().trim();
            const review = (formData.get('review') || '').toString().trim();

            if (!name || !phone || !review) {
                reviewStatus.textContent = 'Please fill in your name, phone number, and review.';
                return;
            }

            const payload = {
                name,
                phone,
                review,
                created_at: new Date().toISOString()
            };

            reviewStatus.textContent = 'Submitting your review...';

            try {
                const { error } = await supabase.from('customer_reviews').insert(payload);

                if (error) throw error;

                reviewStatus.textContent = 'Thank you! Your review has been submitted.';
                reviewForm.reset();
                await loadReviews();
            } catch (error) {
                const storedReviews = getStoredReviews();
                const updatedReviews = [payload, ...storedReviews].slice(0, 20);
                saveStoredReviews(updatedReviews);
                renderReviews(updatedReviews);
                reviewStatus.textContent = 'Saved locally because the database is temporarily unavailable.';
                reviewForm.reset();
                console.warn('Could not save review to Supabase:', error);
            }
        });
    }

    if (!document.querySelector('.whatsapp-float')) {
        const whatsappLink = document.createElement('a');
        whatsappLink.href = 'https://wa.me/2349032107622?text=' + encodeURIComponent('Hello! I have a question.');
        whatsappLink.className = 'whatsapp-float';
        whatsappLink.target = '_blank';
        whatsappLink.rel = 'noopener noreferrer';
        whatsappLink.setAttribute('aria-label', 'Chat on WhatsApp');
        whatsappLink.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.48 0 .14 5.34.13 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.36-1.67a11.9 11.9 0 0 0 5.7 1.73h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.2-1.24-6.2-3.47-8.66ZM12.06 21.8h-.01a9.92 9.92 0 0 1-5.05-1.38l-.36-.21-3.77.99 1.01-3.67-.23-.38A9.85 9.85 0 0 1 2.2 11.92a9.86 9.86 0 1 1 17.23 6.99A9.89 9.89 0 0 1 12.06 21.8Zm5.41-7.42c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.51-1.78-1.69-2.08-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.08-.79.38-.27.3-1.04 1.02-1.04 2.5s1.06 2.9 1.21 3.09c.15.2 2.08 3.17 5.04 4.45.7.3 1.25.48 1.68.62.71.22 1.35.19 1.86.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.28-.2-.58-.35Z"></path>
            </svg>
        `;
        document.body.appendChild(whatsappLink);
    }
    
    let currentCartCount = 0;

    // 1. Mobile navigation
    if (navLinks && mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('is-open');
            mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
            mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('is-open');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.setAttribute('aria-label', 'Open menu');
            });
        });
    }

    // 2. Smooth Shrink Header on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '0px';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
        } else {
            header.style.padding = '10px 0';
            header.style.boxShadow = 'none';
        }
    });

    // 3. Mock Add To Cart Functionality
    cartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            currentCartCount++;
            if (cartCountElement) cartCountElement.textContent = currentCartCount;
            
            // Brief click indicator feedback
            const originalText = button.textContent;
            button.textContent = 'Added ✔';
            button.style.backgroundColor = '#2e7d32';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 1200);
        });
    });
});
