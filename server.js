const express = require('express');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/policies', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    const policiesDir = path.join(__dirname, 'policies');
    fs.readdir(policiesDir, (err, files) => {
        if (err) {
            if (!fs.existsSync(policiesDir)) {
                fs.mkdirSync(policiesDir);
                return res.json([]);
            }
            return res.status(500).json({ error: 'Error reading policies directory.' });
        }
        const policies = files
            .filter(file => file.endsWith('.md'))
            .map(file => file.replace('.md', ''));
        res.json(policies);
    });
});

app.get('/api/policy/:appName', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    const appName = req.params.appName;

    if (!/^[a-zA-Z0-9_-]+$/.test(appName)) {
        return res.status(400).json({ error: 'Invalid app name format.' });
    }

    const policyPath = path.join(__dirname, 'policies', `${appName}.md`);
    const resolvedPath = path.resolve(policyPath);
    if (!resolvedPath.startsWith(path.resolve(__dirname, 'policies'))) {
        return res.status(403).json({ error: 'Forbidden path.' });
    }

    if (fs.existsSync(policyPath)) {
        const markdownContent = fs.readFileSync(policyPath, 'utf8');
        const htmlContent = marked.parse(markdownContent);
        res.json({ content: htmlContent });
    } else {
        res.status(404).json({ error: 'Policy not found.' });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

app.use((req, res, next) => {
    res.render('index');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

