const fs = require('fs');
const path = require('path');
const dir = 'd:/ect_loki/ECT_CLIENT/testing/ECT_10days/ECT_10days/ECT_MAIN';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');
files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    if (!content.includes('js/base.js')) {
        // Replace the last </body> with the script included
        const lastBodyIndex = content.lastIndexOf('</body>');
        if (lastBodyIndex !== -1) {
            content = content.substring(0, lastBodyIndex) + '  <script src="js/base.js"></script>\n' + content.substring(lastBodyIndex);
            fs.writeFileSync(path.join(dir, file), content, 'utf8');
            console.log('Added base.js to ' + file);
        }
    }
});
