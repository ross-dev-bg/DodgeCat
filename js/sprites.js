/* ---------------- PIXEL SPRITE ---------------- */
const spriteData = `
xxxxxxxxxx..............xxxxxxxxxxxxxx......xxxxxxxxxx................xxxxxxxxxx........xxxxxxxxxxxxxxxxxx....xxxxxxxxxxxxxxxxxx....xxxxxxxxxxxxxxxxxx....xxxxxxxxxxxxxxxxxx
xxxxxxxxxxxx............xxxxxxxxxxxxxx......xxxxxxxxxxxx............xxxxxxxxxxxxxx......xxxxxxxxxxxxxxxxxx....xxxxxxxxxxxxxxxxxx....xxxxxxxxxxxxxxxxxx....xxxxxxxxxxxxxxxxxx
xx........xxxx........xxxx..........xxxx....xx........xxxx........xxxx..........xxxx....xx....................xx..............xx....xx..............xx............xx........
xx..........xxxx......xx..............xx....xx..........xxxx......xx..............xx....xx....................xx..............xx....xx..............xx............xx........
xx............xxxx....xx..............xx....xx............xxxx....xx..............xx....xx....................xx..............xx....xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx..............xx....xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx....................xxxxxxxxxxxxxxxxxx....xx....................xxxxxxxxxxxxxxxxxx............xx........
xx..............xx....xx..............xx....xx..............xx....xx....................xxxxxxxxxxxxxxxxxx....xx....................xxxxxxxxxxxxxxxxxx............xx........
xx..............xx....xx..............xx....xx..............xx....xx........xxxxxxxx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx........xxxxxxxx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx....................xx..............xx............xx........
xx..............xx....xx..............xx....xx..............xx....xx..............xx....xx....................xx..............xx....xx..............xx............xx........
xx............xxxx....xx..............xx....xx............xxxx....xx..............xx....xx....................xx..............xx....xx..............xx............xx........
xx..........xxxx......xx..............xx....xx..........xxxx......xx..............xx....xx....................xx..............xx....xx..............xx............xx........
xx........xxxx........xxxx..........xxxx....xx........xxxx........xxxx..........xxxx....xx....................xx..............xx....xx..............xx............xx........
xxxxxxxxxxxx............xxxxxxxxxxxxxx......xxxxxxxxxxxx............xxxxxxxxxxxxxx......xxxxxxxxxxxxxxxxxx....xxxxxxxxxxxxxxxxxx....xx..............xx............xx........
xxxxxxxxxx..............xxxxxxxxxxxxxx......xxxxxxxxxx................xxxxxxxxxx........xxxxxxxxxxxxxxxxxx....xxxxxxxxxxxxxxxxxx....xx..............xx............xx........
`;

const idleDesign = [
"xx....xxx.....","x.x..x..x.....","x..xx...x.....","x.......x.....","x.......x.....",
"x.x.x...x.....","x.x.x...x...xx","x..x....x..x.x","x.......xx.x.x",".x.....x..x..x",
"..x........xx.","..x........x..","..x.x.x..x.x..","..x.x.xxxx.x..","..xxxxx.xxxx.."
];

const movingLeftDesign = [
".x...x.....x..",".xx.xx....x...",".x.x.x.....x..","x.x.x.x.....x.","x.x.x.x....x..",
"x.....x....x..",".xxxxx.....x..","...x..xxxxx...","...x......x...",
"..x.......xx..",".xxxxxxxxxxxx.",".x..x....x..x.","x...x....x..x.",
"x..x....x....x","x..x....x....x"
];

const movingRightDesign = [
"..x.....x...x.","...x....xx.xx.","..x.....x.x.x.",".x.....x.x.x.x","..x....x.x.x.x",
"..x....x.....x","..xxxxx.....x.","...xxxxx..x...","...x......x...",
"..xx.......x..",".xxxxxxxxxxxx.",".x..x....x..x.","x..x....x...x.",
"x....x....x..x","x....x....x..x"
];

const shieldSprite = [
  "....x.....",
  ".....x....",
  "....x.xx..",
  "x..x....x.",
  ".xx......x",
  ".xx......x",
  "x..x....x.",
  "....x.xx..",
  ".....x....",
  "....x....."
];

const orbSprite = [
  ".x..xx.x..",
  "x..x..x.x.",
  "x..x..x.x.",
  "x..x.x.x.x",
  "x..xx....x",
  "xxx.....x.",
  "x.......x.",
  ".x....xx..",
  "..x.xx..x.",
  "...x..xx.."
];

const heartSprite = [
  "..x....x..",
  ".xxx..xxx.",
  "xxxxx.xxxxx",
  "xxxxxxxxxxx",
  ".xxxxxxxxx.",
  "..xxxxxxx..",
  "...xxxxx...",
  "....xxx....",
  ".....x....."
];

const spriteRows = spriteData.split("\n");
const spriteCols = Math.max(...spriteRows.map(row => row.length));
const pixelSize = 2;
const spriteWidth = spriteCols * pixelSize;
const spriteHeight = spriteRows.length * pixelSize;

const spriteCanvas = document.getElementById("spriteCanvas");
spriteCanvas.width = spriteWidth;
spriteCanvas.height = spriteHeight;
const spriteCtx = spriteCanvas.getContext("2d");

spriteRows.forEach((row, y) => {
  for (let x = 0; x < row.length; x++) {
    if (row[x] === "x") {
      spriteCtx.fillStyle = "white";
      spriteCtx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
});