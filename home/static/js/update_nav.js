// const fs = require('fs');
// const glob = require('glob'); // Note: if glob is not installed, we can just use fs.readdirSync since it's a flat dir.

// const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html') && f !== 'index.html');

// const targetStr = `              <a class="mega-item" href="website.html"><span class="mega-icon">🌐</span> Website Development</a>\r
//             </div>`;
// const targetStr2 = `              <a class="mega-item" href="website.html"><span class="mega-icon">🌐</span> Website Development</a>\n            </div>`;

// const replaceStr = `              <a class="mega-item" href="website.html"><span class="mega-icon">🌐</span> Website Development</a>\n              <a class="mega-item" href="it_Infrastructure.html"><span class="mega-icon">🖥️</span> IT Infrastructure</a>\n            </div>`;

// files.forEach(f => {
//     let content = fs.readFileSync(f, 'utf-8');
//     if (content.includes('website.html') && !content.includes('it_Infrastructure.html')) {
//         let newContent = content.replace(targetStr, replaceStr).replace(targetStr2, replaceStr);
//         fs.writeFileSync(f, newContent, 'utf-8');
//         console.log('Updated ' + f);
//     }
// });
