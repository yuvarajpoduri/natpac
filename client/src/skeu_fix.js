const fs = require('fs');
const path = require('path');

const skeuCssPath = path.join(__dirname, 'skeu-utils.css');
if (fs.existsSync(skeuCssPath)) {
    let content = fs.readFileSync(skeuCssPath, 'utf8');

    // Replace gradients with solid vars
    content = content.replace(/background: linear-gradient\(180deg, #818cf8.*?\);/g, 'background: var(--brand);');
    content = content.replace(/background: linear-gradient\(180deg, #34d399.*?\);/g, 'background: var(--success);');
    content = content.replace(/background: linear-gradient\(180deg, #f87171.*?\);/g, 'background: var(--danger);');
    content = content.replace(/background: linear-gradient\(180deg, #fefeff 0%, #ede8f6 100%\);/g, 'background: var(--bg-surface);');
    content = content.replace(/background: linear-gradient\([\s\S]*?\);/g, (match) => {
        if(match.includes('var(--sheen)')) return 'background: none;';
        if(match.includes('255,255,255')) return 'background: none;';
        return match;
    });

    // Remove ::before elements for sheen
    content = content.replace(/\.card-raised::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.btn-skeu-brand::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.btn-skeu-success::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.btn-skeu-danger::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.btn-skeu-secondary::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.has-sheen::before\s*{[\s\S]*?}/g, '');

    // Simplify box shadows
    content = content.replace(/box-shadow:[\s\S]*?;/g, (match) => {
        if (match.includes('var(--shadow')) return match; 
        if (match.includes('inset')) return 'box-shadow: none;';
        return match;
    });

    fs.writeFileSync(skeuCssPath, content);
}

const indexCssPath = path.join(__dirname, 'index.css');
if (fs.existsSync(indexCssPath)) {
    let content = fs.readFileSync(indexCssPath, 'utf8');

    // auth box background
    content = content.replace(/background-image:\s*radial-gradient[\s\S]*?100%\);/g, 'background-image: none;');

    // Auth logo mark & Sidebar logo mark
    content = content.replace(/background: linear-gradient\(145deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%\);/g, 'background: var(--brand);');
    content = content.replace(/background: linear-gradient\(135deg, #818cf8, #6366f1\);/g, 'background: var(--brand);');
    
    // Auth progress
    content = content.replace(/background: linear-gradient\(90deg, #818cf8, #6366f1\);/g, 'background: var(--brand);');

    // Remove remaining ::before elements
    content = content.replace(/\.card::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.auth-box::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.modal-box::before\s*{[\s\S]*?}/g, '');
    content = content.replace(/\.trip-card::before\s*{[\s\S]*?}/g, '');

    fs.writeFileSync(indexCssPath, content);
}
