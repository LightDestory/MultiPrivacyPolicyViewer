document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = themeToggle.querySelector('.theme-label');
    const appContent = document.getElementById('app-content');
    const goUpButton = document.getElementById('go-up');

    const policyIcon = '<i class="fa-solid fa-file-shield" aria-hidden="true"></i>';

    const setTheme = (theme) => {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark-mode', isDark);
        themeLabel.textContent = isDark ? 'Light' : 'Dark';
        themeToggle.setAttribute(
            'aria-label',
            isDark ? 'Switch to light mode' : 'Switch to dark mode'
        );
        localStorage.setItem('theme', theme);
    };

    setTheme(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');

    themeToggle.addEventListener('click', () => {
        setTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark');
    });

    const updateGoUpVisibility = () => {
        goUpButton.classList.toggle('is-visible', window.scrollY > 320);
    };

    goUpButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', updateGoUpVisibility, { passive: true });
    updateGoUpVisibility();

    const escapeHtml = (value) => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const formatPolicyName = (value) => escapeHtml(value.replace(/[-_]+/g, ' '));

    const loadingState = (message) => `
        <div class="state-panel" role="status">
            <span class="spinner" aria-hidden="true"></span>
            <span>${message}</span>
        </div>
    `;

    const navigateTo = async (url) => {
        window.history.pushState({}, '', url);
        await renderRoute(window.location.pathname);
    };

    window.addEventListener('popstate', () => {
        renderRoute(window.location.pathname);
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (!link) return;

        const url = link.getAttribute('href');
        if (!url || url.startsWith('http')) return;

        e.preventDefault();
        navigateTo(url);
    });

    const renderRoute = async (url) => {
        if (url === '/' || url === '') {
            await renderHome();
        } else if (url.startsWith('/policy/')) {
            let appName = '';
            try {
                appName = decodeURIComponent(url.split('/policy/')[1] || '');
            } catch (e) {
                return render404();
            }
            await renderPolicy(appName);
        } else {
            render404();
        }
    };

    const renderHome = async () => {
        appContent.innerHTML = loadingState('Loading policies');

        try {
            const res = await fetch('/api/policies', { cache: 'no-store' });
            if (!res.ok) throw new Error('Network error');
            const policies = await res.json();
            const policyCount = policies.length;

            const policyList = policyCount === 0
                ? '<p class="empty-state">No privacy policies are available yet.</p>'
                : `
                    <ul class="policy-grid">
                        ${policies.map(policy => `
                            <li class="policy-card">
                                <a href="/policy/${encodeURIComponent(policy)}" class="nav-link">
                                    <span class="card-top">
                                        <span class="app-icon">${policyIcon}</span>
                                        <span class="card-arrow" aria-hidden="true">
                                            <i class="fa-solid fa-arrow-right"></i>
                                        </span>
                                    </span>
                                    <span class="policy-name">${formatPolicyName(policy)}</span>
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                `;

            appContent.innerHTML = `
                <div class="hero">
                    <span class="eyebrow">Privacy Center</span>
                    <h1>Privacy policies for LightDestory apps.</h1>
                    <p>Choose an app to review what data is collected, how it is handled, and which choices are available to you.</p>
                </div>
                <main>
                    <div class="toolbar">
                        <h2 class="section-title">Available policies</h2>
                        <span class="count-pill">${policyCount} ${policyCount === 1 ? 'policy' : 'policies'}</span>
                    </div>
                    ${policyList}
                </main>
            `;
            document.title = 'LightDestory Apps - Privacy Policies';
        } catch (e) {
            appContent.innerHTML = `
                <div class="error-container">
                    <h1 class="error-title">Error</h1>
                    <h2>Policies could not be loaded</h2>
                    <p>Please refresh the page or try again later.</p>
                </div>
            `;
        }
    };

    const renderPolicy = async (appName) => {
        appContent.innerHTML = loadingState('Loading policy');

        try {
            const res = await fetch('/api/policy/' + encodeURIComponent(appName), { cache: 'no-store' });
            if (res.status === 404) {
                return render404(appName);
            }
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            const displayName = formatPolicyName(appName);

            appContent.innerHTML = `
                <nav class="back-nav">
                    <a href="/" class="nav-link" aria-label="Back to policies list">&larr; Back to policies</a>
                </nav>
                <main class="policy-reader">
                    <div class="policy-heading">
                        <h1>${displayName}</h1>
                        <p>Review the privacy details for this application.</p>
                    </div>
                    <article class="markdown-body">
                        ${data.content}
                    </article>
                </main>
            `;
            document.title = 'Privacy Policy - ' + displayName + ' | LightDestory';
        } catch (e) {
            renderInvalidRequest();
        }
    };

    const renderInvalidRequest = () => {
        appContent.innerHTML = `
            <div class="error-container">
                <h1 class="error-title">403</h1>
                <h2>Invalid request</h2>
                <p>The requested resource is not accessible.</p>
                <a href="/" class="btn nav-link">Back to policies</a>
            </div>
        `;
        document.title = 'Invalid Request | LightDestory';
    };

    const render404 = (appName = 'Unknown') => {
        appContent.innerHTML = `
            <div class="error-container">
                <h1 class="error-title">404</h1>
                <h2>Policy not found</h2>
                <p>The privacy policy for <strong>${escapeHtml(appName)}</strong> does not exist or has been removed.</p>
                <a href="/" class="btn nav-link">Back to policies</a>
            </div>
        `;
        document.title = 'Page Not Found | LightDestory';
    };

    renderRoute(window.location.pathname);
});
