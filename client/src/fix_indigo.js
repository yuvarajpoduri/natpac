const fs = require('fs');
const path = require('path');

const indexCssPath = path.join(__dirname, 'index.css');
if (fs.existsSync(indexCssPath)) {
    let content = fs.readFileSync(indexCssPath, 'utf8');

    // Replace indigo rgba with teal rgba
    // 99,102,241 is indigo-500. We will replace with 15,118,110 (teal-700) or 13,148,136 (teal-600)
    content = content.replace(/99,102,241/g, '13,148,136');
    
    // 139,92,246 is violet
    content = content.replace(/139,92,246/g, '13,148,136');

    // Remove remaining ::before elements
    content = content.replace(/\.card::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.auth-box::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.modal-box::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.trip-card::before\s*{[\s\S]*?}/g, '');

    // auth box background-image
    content = content.replace(/background-image:\s*radial-gradient[\s\S]*?100%\);/g, 'background-image: none;');

    // Auth logo mark & Sidebar logo mark
    content = content.replace(/background: linear-gradient\(145deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%\);/g, 'background: var(--brand);');
    content = content.replace(/background: linear-gradient\(135deg, #818cf8, #6366f1\);/g, 'background: var(--brand);');
    
    // Auth progress
    content = content.replace(/background: linear-gradient\(90deg, #818cf8, #6366f1\);/g, 'background: var(--brand);');

    fs.writeFileSync(indexCssPath, content);
}

const skeuCssPath = path.join(__dirname, 'skeu-utils.css');
if (fs.existsSync(skeuCssPath)) {
    let content = fs.readFileSync(skeuCssPath, 'utf8');
    content = content.replace(/99,102,241/g, '13,148,136');
    fs.writeFileSync(skeuCssPath, content);
}
