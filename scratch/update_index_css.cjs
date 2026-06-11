const fs = require('fs');
const css = `
/* ==========================================================================
   ⚡ CYBERPUNK THEME (Neon Overdrive)
   ========================================================================== */

.walkman-casing.theme-cyberpunk .walkman-btn {
  background-color: #111; /* Dark buttons */
  box-shadow: 
    inset -4px -4px 0 0 #000,
    inset 4px 4px 0 0 #333,
    0 0 0 3px #000;
}

.walkman-casing.theme-cyberpunk .walkman-btn:hover {
  background-color: #222;
}

.walkman-casing.theme-cyberpunk .walkman-btn.pressed {
  background-color: #050505;
  box-shadow: 
    inset 4px 4px 0 0 #000,
    inset -4px -4px 0 0 #111,
    0 0 0 3px #000;
}

/* Custom Neon Pink style buttons for PLAY and STOP */
.walkman-casing.theme-cyberpunk .btn-play-custom {
  background-color: #ff003c !important; /* Neon Pink */
  box-shadow: 
    inset -4px -4px 0 0 #80001e,
    inset 4px 4px 0 0 #ff6685,
    0 0 0 3px #000 !important;
}

.walkman-casing.theme-cyberpunk .btn-play-custom:hover {
  background-color: #ff3366 !important;
}

.walkman-casing.theme-cyberpunk .btn-play-custom.pressed {
  background-color: #b3002a !important;
  box-shadow: 
    inset 4px 4px 0 0 #4d0012,
    inset -4px -4px 0 0 #ff003c,
    0 0 0 3px #000 !important;
}

.walkman-casing.theme-cyberpunk .btn-stop-custom {
  background-color: #00f3ff !important; /* Neon Cyan */
  box-shadow: 
    inset -4px -4px 0 0 #007980,
    inset 4px 4px 0 0 #66f8ff,
    0 0 0 3px #000 !important;
}

.walkman-casing.theme-cyberpunk .btn-stop-custom:hover {
  background-color: #33f5ff !important;
}

.walkman-casing.theme-cyberpunk .btn-stop-custom.pressed {
  background-color: #00a8b3 !important;
  box-shadow: 
    inset 4px 4px 0 0 #004b50,
    inset -4px -4px 0 0 #00f3ff,
    0 0 0 3px #000 !important;
}
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended to index.css');
