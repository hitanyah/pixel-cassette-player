const fs = require('fs');
let code = fs.readFileSync('src/components/Walkman/DisplayScreen.tsx', 'utf8');

code = code.replace(/theme\?: 'classic' \| 'retro-gamer' \| 'gameboy-yellow';/, 
  "theme?: 'classic' | 'retro-gamer' | 'gameboy-yellow' | 'cyberpunk';");

code = code.replace(/ctx\.fillStyle = theme === 'retro-gamer' \? '#071013' : theme === 'gameboy-yellow' \? '#8b956d' : '#030a05';/, 
  "ctx.fillStyle = theme === 'retro-gamer' ? '#071013' : theme === 'gameboy-yellow' ? '#8b956d' : theme === 'cyberpunk' ? '#1a0528' : '#030a05';");

code = code.replace(/let fillStyle = theme === 'retro-gamer' \? '#00f3ff' : theme === 'gameboy-yellow' \? '#0f380f' : '#39ff14';/, 
  "let fillStyle = theme === 'retro-gamer' ? '#00f3ff' : theme === 'gameboy-yellow' ? '#0f380f' : theme === 'cyberpunk' ? '#00f3ff' : '#39ff14';");

code = code.replace(/if \(j > 5\) fillStyle = theme === 'gameboy-yellow' \? '#306230' : '#ffdf00';/, 
  "if (j > 5) fillStyle = theme === 'gameboy-yellow' ? '#306230' : theme === 'cyberpunk' ? '#9d00ff' : '#ffdf00';");

code = code.replace(/if \(j > 8\) fillStyle = theme === 'retro-gamer' \? '#ff5b5b' : theme === 'gameboy-yellow' \? '#8bac0f' : '#ff3b30';/, 
  "if (j > 8) fillStyle = theme === 'retro-gamer' ? '#ff5b5b' : theme === 'gameboy-yellow' ? '#8bac0f' : theme === 'cyberpunk' ? '#ff003c' : '#ff3b30';");

code = code.replace(/backgroundColor: theme === 'retro-gamer' \? '#071013' : theme === 'gameboy-yellow' \? '#8b956d' : '#030a05',/g, 
  "backgroundColor: theme === 'retro-gamer' ? '#071013' : theme === 'gameboy-yellow' ? '#8b956d' : theme === 'cyberpunk' ? '#1a0528' : '#030a05',");

code = code.replace(/color: isSpotifyDisconnected \? '#ff3b30' : theme === 'retro-gamer' \? '#00f3ff' : theme === 'gameboy-yellow' \? '#0f380f' : '#39ff14'/g, 
  "color: isSpotifyDisconnected ? '#ff3b30' : theme === 'retro-gamer' ? '#00f3ff' : theme === 'gameboy-yellow' ? '#0f380f' : theme === 'cyberpunk' ? '#00f3ff' : '#39ff14'");

code = code.replace(/theme === 'retro-gamer' \n                  \? '0 0 6px rgba\(0,243,255,0\.5\)'/g, 
  "theme === 'retro-gamer' || theme === 'cyberpunk' \n                  ? '0 0 6px rgba(0,243,255,0.5)'");

code = code.replace(/theme === 'retro-gamer' \n                  \? 'rgba\(0,243,255,0\.1\)'/g, 
  "theme === 'retro-gamer' || theme === 'cyberpunk' \n                  ? 'rgba(0,243,255,0.1)'");

code = code.replace(/color: hasFinishedSide \? \(theme === 'gameboy-yellow' \? '#306230' : '#ffdf00'\) : theme === 'retro-gamer' \? '#00f3ff' : theme === 'gameboy-yellow' \? '#0f380f' : '#39ff14'/g, 
  "color: hasFinishedSide ? (theme === 'gameboy-yellow' ? '#306230' : '#ffdf00') : theme === 'retro-gamer' ? '#00f3ff' : theme === 'gameboy-yellow' ? '#0f380f' : theme === 'cyberpunk' ? '#00f3ff' : '#39ff14'");

code = code.replace(/border: theme === 'retro-gamer' \? '1px solid rgba\(0,243,255,0\.2\)' : theme === 'gameboy-yellow' \? '1px solid rgba\(15,56,15,0\.25\)' : '1px solid rgba\(57,255,20,0\.2\)'/g, 
  "border: theme === 'retro-gamer' || theme === 'cyberpunk' ? '1px solid rgba(0,243,255,0.2)' : theme === 'gameboy-yellow' ? '1px solid rgba(15,56,15,0.25)' : '1px solid rgba(57,255,20,0.2)'");

fs.writeFileSync('src/components/Walkman/DisplayScreen.tsx', code);
console.log('DisplayScreen.tsx updated');
