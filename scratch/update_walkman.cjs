const fs = require('fs');
let code = fs.readFileSync('src/components/Walkman/Walkman.tsx', 'utf8');

code = code.replace(/theme\?: 'classic' \| 'retro-gamer' \| 'gameboy-yellow';/, 
  "theme?: 'classic' | 'retro-gamer' | 'gameboy-yellow' | 'cyberpunk';");

code = code.replace(/theme === 'gameboy-yellow' \? '#f3c23c' : '#383c48'/, 
  "theme === 'gameboy-yellow' ? '#f3c23c' : theme === 'cyberpunk' ? '#10091b' : '#383c48'");

code = code.replace(/0 12px 0 0 rgba\(0,0,0,0.3\)\n        ` : `/, 
  `0 12px 0 0 rgba(0,0,0,0.3)
        \` : theme === 'cyberpunk' ? \`
          inset -4px -4px 0 0 #ff003c,
          inset 4px 4px 0 0 #00f3ff,
          inset -8px -8px 0 0 #80001e,
          inset 8px 8px 0 0 #007980,
          0 12px 0 0 rgba(0,0,0,0.5)
        \` : \``);

code = code.replace(/theme === 'gameboy-yellow' \? '3px solid #b38200' : '3px solid #1e2027'/g, 
  "theme === 'gameboy-yellow' ? '3px solid #b38200' : theme === 'cyberpunk' ? '3px solid #ff003c' : '3px solid #1e2027'");

code = code.replace(/theme === 'gameboy-yellow' \? '#303030' : theme === 'retro-gamer' \? '#ffdf00' : '#dcdde1'/g, 
  "theme === 'gameboy-yellow' ? '#303030' : theme === 'retro-gamer' ? '#ffdf00' : theme === 'cyberpunk' ? '#00f3ff' : '#dcdde1'");

code = code.replace(/theme === 'gameboy-yellow' \? '2px 2px 0 #fce475' : theme === 'retro-gamer' \? '2px 2px 0 #4d1210' : '2px 2px 0 #1e2027'/, 
  "theme === 'gameboy-yellow' ? '2px 2px 0 #fce475' : theme === 'retro-gamer' ? '2px 2px 0 #4d1210' : theme === 'cyberpunk' ? '2px 2px 0 #ff003c' : '2px 2px 0 #1e2027'");

code = code.replace(/theme === 'retro-gamer' \? '★ RETRO-GAME' : theme === 'gameboy-yellow' \? '★ GAME BOY' : 'SOUND-PIXEL'/, 
  "theme === 'retro-gamer' ? '★ RETRO-GAME' : theme === 'gameboy-yellow' ? '★ GAME BOY' : theme === 'cyberpunk' ? '⚡ CYBER PUNK' : 'SOUND-PIXEL'");

code = code.replace(/theme === 'gameboy-yellow' \? '#303030' : theme === 'retro-gamer' \? '#39ff14' : '#00f3ff'/, 
  "theme === 'gameboy-yellow' ? '#303030' : theme === 'retro-gamer' ? '#39ff14' : theme === 'cyberpunk' ? '#ff003c' : '#00f3ff'");

code = code.replace(/theme === 'retro-gamer' \? 'ARCADE STATION' : theme === 'gameboy-yellow' \? '8-BIT CLASSIC' : 'AUTO REVERSE SYSTEM'/, 
  "theme === 'retro-gamer' ? 'ARCADE STATION' : theme === 'gameboy-yellow' ? '8-BIT CLASSIC' : theme === 'cyberpunk' ? 'NEON OVERDRIVE' : 'AUTO REVERSE SYSTEM'");

code = code.replace(/theme === 'gameboy-yellow' \? '#303030' : theme === 'retro-gamer' \? '#fbf2c0' : '#a0a0ab'/g, 
  "theme === 'gameboy-yellow' ? '#303030' : theme === 'retro-gamer' ? '#fbf2c0' : theme === 'cyberpunk' ? '#00f3ff' : '#a0a0ab'");

code = code.replace(/theme === 'gameboy-yellow' \? '#303030' : theme === 'retro-gamer' \? '#8c3531' : '#888'/, 
  "theme === 'gameboy-yellow' ? '#303030' : theme === 'retro-gamer' ? '#8c3531' : theme === 'cyberpunk' ? '#ff003c' : '#888'");

code = code.replace(/theme === 'gameboy-yellow' \? '#151515' : theme === 'retro-gamer' \? '#111318' : '#151619'/, 
  "theme === 'gameboy-yellow' ? '#151515' : theme === 'retro-gamer' ? '#111318' : theme === 'cyberpunk' ? '#09050d' : '#151619'");

code = code.replace(/theme === 'gameboy-yellow' \? '4px solid #b38200' : theme === 'retro-gamer' \? '4px solid #4d1210' : '4px solid #111'/, 
  "theme === 'gameboy-yellow' ? '4px solid #b38200' : theme === 'retro-gamer' ? '4px solid #4d1210' : theme === 'cyberpunk' ? '4px solid #ff003c' : '4px solid #111'");

code = code.replace(/theme === 'gameboy-yellow' \? 'rgba\(179,130,0,0\.15\)' : theme === 'retro-gamer' \? 'rgba\(77,18,16,0\.25\)' : 'rgba\(30,35,45,0\.45\)'/, 
  "theme === 'gameboy-yellow' ? 'rgba(179,130,0,0.15)' : theme === 'retro-gamer' ? 'rgba(77,18,16,0.25)' : theme === 'cyberpunk' ? 'rgba(255,0,60,0.15)' : 'rgba(30,35,45,0.45)'");

code = code.replace(/theme === 'gameboy-yellow' \? '#222222' : theme === 'retro-gamer' \? '#1a1b20' : '#23252d'/, 
  "theme === 'gameboy-yellow' ? '#222222' : theme === 'retro-gamer' ? '#1a1b20' : theme === 'cyberpunk' ? '#1b0f2e' : '#23252d'");

code = code.replace(/theme === 'gameboy-yellow' \? '#fff' : '#000'/g, 
  "theme === 'gameboy-yellow' || theme === 'cyberpunk' ? '#fff' : '#000'");

fs.writeFileSync('src/components/Walkman/Walkman.tsx', code);
console.log('Walkman.tsx updated');
