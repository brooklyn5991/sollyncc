document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.main-header');
    const cartButtons = document.querySelectorAll('.add-to-cart-overlay');
    const cartCountElement = document.querySelector('.cart-count');
    
    let currentCartCount = 0;

    // 1. Smooth Shrink Header on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '0px';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
        } else {
            header.style.padding = '10px 0';
            header.style.boxShadow = 'none';
        }
    });

    // 2. Mock Add To Cart Functionality
    cartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            currentCartCount++;
            cartCountElement.textContent = currentCartCount;
            
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