const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '..', 'node_modules', 'openskp', 'dist', 'index.js'),
  path.join(__dirname, '..', 'node_modules', 'openskp', 'dist', 'index.mjs'),
];

const newDimCode = `function readSkFont(ar, r) {
  ar.readObject(r, "CAttributeContainer");
  const marker = findBytes(r.data, STR_MARKER, r.pos, r.pos + 32);
  if (marker >= 0) {
    r.raw(marker - r.pos);
  } else if (ar.hasPid) {
    r.u8();
  }
  r.utf16();
  r.raw(15);
  return { k: "font" };
}
function readDimConnection(ar, r) {
  const connType = r.u32();
  if (connType === 1) {
    r.u32();
    const pt = r.f64s(3);
    const ref1 = entityRef(ar, r);
    r.raw(10);
    return { connType, pt, ref1 };
  } else if (connType === 2 || connType === 3) {
    const view = new DataView(r.data.buffer, r.data.byteOffset, r.data.byteLength);
    const nextVal = view.getUint32(r.pos, true);
    if (nextVal !== 4) {
      r.u32();
    }
    r.u32();
    const pt = r.f64s(3);
    const ref1 = entityRef(ar, r);
    r.u16();
    r.u32();
    const ref2 = entityRef(ar, r);
    r.u32();
    return { connType, pt, ref1, ref2 };
  } else {
    const view = new DataView(r.data.buffer, r.data.byteOffset, r.data.byteLength);
    const nextVal = view.getUint32(r.pos, true);
    if (nextVal !== 4) r.u32();
    r.u32();
    const pt = r.f64s(3);
    const ref1 = entityRef(ar, r);
    return { connType, pt, ref1 };
  }
}
function readDimLinear(ar, r) {
  preamble(ar, r);
  const db = drawbase(ar, r);
  const text = r.utf16();
  ar.readObject(r, "CSkFont");
  if (r.pos < r.data.length && r.data[r.pos] === 0) {
    r.u8();
  }
  const c1 = readDimConnection(ar, r);
  const c2 = readDimConnection(ar, r);
  r.f64s(6);
  r.u32();
  r.f64();
  r.f64();
  r.u32();
  return { k: "dimension", db, text, connect: [c1, c2] };
}`;

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-openskp] Target file not found, skipping: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('function readDimConnection')) {
    console.log(`[patch-openskp] Already patched: ${path.basename(filePath)}`);
    continue;
  }

  // Replace readSkFont and readDimLinear
  const regex = /function readSkFont\(ar, r\) \{[\s\S]*?function readDimLinear\(ar, r\) \{[\s\S]*?return \{ k: "dimension", db, text[^\}]*\};\s*\}/;
  if (regex.test(content)) {
    content = content.replace(regex, newDimCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-openskp] Successfully patched: ${path.basename(filePath)}`);
  } else {
    console.warn(`[patch-openskp] Could not locate target functions in: ${path.basename(filePath)}`);
  }
}
