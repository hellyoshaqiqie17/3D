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

const customLineStyleCode = `function readCustomLineStyle(ar, r) {
  preamble(ar, r);
  const name = r.utf16();
  const pattern = r.utf16();
  const scale = r.f64s(3);
  const id = r.u32();
  if (r.pos < r.data.length && r.data[r.pos] === 0) {
    r.u8();
  }
  let extra = "";
  if (bytesEqual(r.peek(3), STR_MARKER)) {
    extra = r.utf16();
  }
  return { k: "customLineStyle", name, pattern, scale, id, extra };
}
`;

const replacementAnchor = `let [, dn] = ar.readObject(r);
  let defCount = null;
  while (dn !== null && dn !== "CLayer" && dn !== "CComponentDefinition") {
    const tag = r.peekU16();
    if (tag === 65535 && matchesAscii(r.peek(26), 6, "CComponentDefinition")) {
      break;
    }
    const retry = retryCountAfterV20Filler(r, r.pos - 4, 1e6, ar) || retryCountAfterV20Filler(r, r.pos, 1e6, ar);
    if (retry !== null) {
      defCount = retry;
      break;
    }
    if (tag !== 65535 && !(tag & 32768)) {
      break;
    }
    [, dn] = ar.readObject(r);
  }
  if (defCount === null) {
    defCount = r.u32();
    if (defCount > 1e6 || defCount === 0) {
      const retry = retryCountAfterV20Filler(r, r.pos - 4, 1e6, ar) || retryCountAfterV20Filler(r, r.pos, 1e6, ar);
      if (retry !== null) defCount = retry;
    }
  }
  if (defCount > 1e6) {
    throw new LegacyParseError("implausible definition count: " + defCount);
  }
  for (let i = 0; i < defCount; i++) {`;

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-openskp] Target file not found, skipping: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Patch readSkFont and readDimLinear
  if (!content.includes('function readDimConnection')) {
    const regexDim = /function readSkFont\(ar, r\) \{[\s\S]*?function readDimLinear\(ar, r\) \{[\s\S]*?return \{ k: "dimension", db, text[^\}]*\};\s*\}/;
    if (regexDim.test(content)) {
      content = content.replace(regexDim, newDimCode);
      changed = true;
      console.log(`[patch-openskp] Patched dimensions in: ${path.basename(filePath)}`);
    }
  }

  // 2. Patch CCustomLineStyle reader
  if (!content.includes('function readCustomLineStyle')) {
    content = content.replace('var READERS = {', customLineStyleCode + '\nvar READERS = {\n  CCustomLineStyle: readCustomLineStyle,\n  CLineStyle: readCustomLineStyle,');
    changed = true;
    console.log(`[patch-openskp] Added readCustomLineStyle in: ${path.basename(filePath)}`);
  }

  // 3. Patch walkModel definition list anchor
  if (!content.includes('let [, dn] = ar.readObject(r);')) {
    const regexAnchor = /(?:const|let) \[, dn\] = ar\.readObject\(r\);[\s\S]*?for \(let i = 0; i < defCount; i\+\+\) \{/;
    if (regexAnchor.test(content)) {
      content = content.replace(regexAnchor, replacementAnchor);
      changed = true;
      console.log(`[patch-openskp] Patched definition list anchor in: ${path.basename(filePath)}`);
    }
  }

  // 4. Fallback in newObj for any style class
  if (!content.includes('name.includes("LineStyle")')) {
    const oldNewObj = `const reader = this.readers[name];
    if (reader === void 0) {
      throw new LegacyParseError(\`no reader for class \${name} \${r.ctx()}\`);
    }`;
    const newNewObj = `let reader = this.readers[name];
    if (reader === void 0 && (name.includes("LineStyle") || name.includes("Style"))) {
      reader = readCustomLineStyle;
    }
    if (reader === void 0) {
      throw new LegacyParseError(\`no reader for class \${name} \${r.ctx()}\`);
    }`;
    if (content.includes(oldNewObj)) {
      content = content.replace(oldNewObj, newNewObj);
      changed = true;
      console.log(`[patch-openskp] Patched newObj fallback in: ${path.basename(filePath)}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-openskp] Successfully updated: ${path.basename(filePath)}`);
  } else {
    console.log(`[patch-openskp] All patches already applied in: ${path.basename(filePath)}`);
  }
}
