const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\Gunalan\\.gemini\\antigravity\\brain\\500627f1-ed24-47eb-88b8-a942e42f2df0\\media__1774704202857.jpg";
const dest = "c:\\CSA\\Website\\Location\\investigative_banner.jpg";

try {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
} catch (err) {
    console.error(`Error copying file: ${err}`);
    process.exit(1);
}
