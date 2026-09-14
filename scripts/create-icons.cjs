// Rasterize the app's geometric f/star mark with 2x antialiasing. No remote artwork.
const fs = require("node:fs");
const zlib = require("node:zlib");
fs.mkdirSync("assets", { recursive: true });
function crc32(buf) {
  let crc = -1;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type),
    length = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
const line = (x, y, ax, ay, bx, by, r) => {
  const dx = bx - ax,
    dy = by - ay,
    t = Math.max(
      0,
      Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)),
    );
  return Math.hypot(x - ax - t * dx, y - ay - t * dy) < r;
};
function pixel(x, y, transparent) {
  const ink = [17, 17, 17, 255],
    lime = [255, 255, 255, 255],
    paper = [247, 247, 248, 255];
  const ring = Math.hypot(x - 485, y - 375);
  const f =
    (x >= 355 && x <= 440 && y >= 365 && y <= 770) ||
    (y <= 375 && ring >= 45 && ring <= 130) ||
    (x >= 310 && x <= 565 && y >= 445 && y <= 520);
  let star = false;
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    star ||= line(
      x,
      y,
      680 - Math.cos(a) * 64,
      338 - Math.sin(a) * 64,
      680 + Math.cos(a) * 64,
      338 + Math.sin(a) * 64,
      13,
    );
  }
  return star
    ? lime
    : f
      ? transparent
        ? ink
        : paper
      : transparent
        ? [0, 0, 0, 0]
        : ink;
}
function png(size, transparent) {
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const colours = [];
      for (const dy of [0.25, 0.75])
        for (const dx of [0.25, 0.75])
          colours.push(
            pixel(
              ((x + dx) * 1024) / size,
              ((y + dy) * 1024) / size,
              transparent,
            ),
          );
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      for (let c = 0; c < 4; c++)
        rows[offset + c] = Math.round(
          colours.reduce((n, v) => n + v[c], 0) / 4,
        );
    }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size);
  head.writeUInt32BE(size, 4);
  head[8] = 8;
  head[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", head),
    chunk("IDAT", zlib.deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
fs.writeFileSync("assets/icon.png", png(1024, false));
fs.writeFileSync("assets/adaptive-icon.png", png(1024, true));
fs.writeFileSync("assets/splash-icon.png", png(512, true));
console.log("Created local icon, adaptive icon and splash artwork.");
