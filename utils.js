// =================== SEOTIZE SHARED UTILITIES ===================

// Theme Management
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        this.bindEvents();
    },

    setTheme(theme) {
        document.body.dataset.theme = theme;
        document.body.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    },

    toggle() {
        const currentTheme = document.body.dataset.theme || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.theme-toggle')) {
                e.preventDefault();
                this.toggle();
            }
        });
    }
};

// Mobile Menu Management
const MobileMenu = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.mobile-menu-toggle')) {
                e.preventDefault();
                this.toggle();
            }
            if (e.target.matches('.mobile-menu-close') || e.target.matches('.mobile-overlay')) {
                e.preventDefault();
                this.close();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    },

    toggle() {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('mobileOverlay');
        if (menu && overlay) {
            menu.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    },

    close() {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('mobileOverlay');
        if (menu && overlay) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
        }
    }
};

// Toast Notifications
const Toast = {
    show(message, type = 'success', duration = 3000) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        toast.textContent = message;
        toast.style.cssText = `
            position:fixed;top:80px;right:1rem;padding:.8rem 1.2rem;
            border-radius:8px;color:white;font-weight:500;
            transform:translateX(100%);transition:transform .3s ease;
            z-index:1000;font-size:.9rem;
            background:${type === 'error' ? '#dc2626' : type === 'warning' ? '#f59e0b' : '#059669'};
        `;

        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.style.transform = 'translateX(0)', 10);
        
        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Performance optimized scroll handler
const ScrollHandler = {
    init() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    },

    handleScroll() {
        const nav = document.querySelector('nav');
        if (nav) {
            const scrolled = window.pageYOffset;
            const opacity = Math.min(scrolled / 100, 1);
            const isDark = document.body.classList.contains('dark');
            nav.style.backgroundColor = `rgba(${isDark ? '15, 23, 42' : '255, 255, 255'}, ${0.95 * opacity})`;
        }
    }
};

// Lazy Loading for Images
const LazyLoader = {
    init() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
};

// Form Utilities
const FormUtils = {
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        let errorEl = field.parentNode.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            errorEl.style.cssText = 'color:#dc2626;font-size:.875rem;margin-top:.5rem;';
            field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = message;
    },

    showFieldSuccess(field) {
        field.classList.add('success');
        field.classList.remove('error');
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    },

    clearFieldState(field) {
        field.classList.remove('error', 'success');
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    }
};

// Copy to Clipboard
const ClipboardUtils = {
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            Toast.show('Copied to clipboard', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Toast.show('Copied to clipboard', 'success');
        }
    }
};

// Initialize all utilities when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MobileMenu.init();
    ScrollHandler.init();
    LazyLoader.init();
});

// Export for use in other scripts
window.SeotizeUtils = {
    ThemeManager,
    MobileMenu,
    Toast,
    ScrollHandler,
    LazyLoader,
    FormUtils,
    ClipboardUtils
};