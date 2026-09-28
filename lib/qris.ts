interface Tlv {
  id: string;
  value: string;
}

function normalizePayload(value: string): string {
  return value.trim().replace(/[\r\n\t]+/g, '');
}

function parseRootTlv(payload: string): Tlv[] | null {
  const clean = normalizePayload(payload);
  const tags: Tlv[] = [];
  let index = 0;
  while (index < clean.length) {
    const id = clean.slice(index, index + 2);
    const rawLength = clean.slice(index + 2, index + 4);
    const length = Number(rawLength);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(rawLength) || !Number.isSafeInteger(length)) return null;
    const valueStart = index + 4;
    const valueEnd = valueStart + length;
    if (valueEnd > clean.length) return null;
    tags.push({ id, value: clean.slice(valueStart, valueEnd) });
    index = valueEnd;
  }
  return index === clean.length ? tags : null;
}

function buildTlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

function crc16CcittFalse(value: string): string {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index++) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function validateQrisPayload(value: string): string | null {
  if (!value.trim()) return null;
  const tags = parseRootTlv(value);
  if (!tags || tags.length < 4 || tags[0]?.id !== '00' || tags[0]?.value !== '01') return 'Payload QRIS tidak valid. Tempel teks QRIS statis hasil scan, bukan gambar.';
  if (!tags.some(tag => tag.id === '26' || tag.id === '51')) return 'Payload QRIS tidak memuat data merchant QRIS.';
  if (!tags.some(tag => tag.id === '58' && tag.value === 'ID')) return 'Payload QRIS harus berasal dari merchant Indonesia.';
  if (!tags.some(tag => tag.id === '63' && tag.value.length === 4)) return 'Payload QRIS harus memuat CRC.';
  return null;
}

export function createDynamicQrisPayload(basePayload: string, amount: number): string {
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('Nominal QRIS tidak valid.');
  const tags = parseRootTlv(basePayload);
  if (!tags || validateQrisPayload(basePayload)) throw new Error('Payload QRIS tidak valid.');
  const amountValue = String(amount);
  const bodyTags = tags.filter(tag => tag.id !== '54' && tag.id !== '63').map(tag => tag.id === '01' ? { ...tag, value: '12' } : tag);
  const countryIndex = bodyTags.findIndex(tag => tag.id === '58');
  const amountTag = { id: '54', value: amountValue };
  const withAmount = countryIndex >= 0 ? [...bodyTags.slice(0, countryIndex), amountTag, ...bodyTags.slice(countryIndex)] : [...bodyTags, amountTag];
  const withoutCrc = `${withAmount.map(tag => buildTlv(tag.id, tag.value)).join('')}6304`;
  return `${withoutCrc}${crc16CcittFalse(withoutCrc)}`;
}
