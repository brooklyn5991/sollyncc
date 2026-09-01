document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.main-header');
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const cartButtons = document.querySelectorAll('.add-to-cart-overlay');
    const cartCountElement = document.querySelector('.cart-count');
    
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
