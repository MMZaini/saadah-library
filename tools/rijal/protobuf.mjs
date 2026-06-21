const TEXT_DECODER = new TextDecoder()
const TEXT_ENCODER = new TextEncoder()

export const WIRE_VARINT = 0
export const WIRE_FIXED64 = 1
export const WIRE_BYTES = 2
export const WIRE_FIXED32 = 5

export class ProtoWriter {
  constructor() {
    this.parts = []
  }

  uint32(fieldNo, value) {
    if (value == null) return this
    this.tag(fieldNo, WIRE_VARINT)
    this.rawVarint(Number(value))
    return this
  }

  bool(fieldNo, value) {
    if (value == null) return this
    return this.uint32(fieldNo, value ? 1 : 0)
  }

  string(fieldNo, value) {
    if (value == null || value === '') return this
    return this.bytes(fieldNo, TEXT_ENCODER.encode(String(value)))
  }

  bytes(fieldNo, value) {
    if (value == null) return this
    const bytes = value instanceof Uint8Array ? value : Uint8Array.from(value)
    this.tag(fieldNo, WIRE_BYTES)
    this.rawVarint(bytes.length)
    this.parts.push(bytes)
    return this
  }

  message(fieldNo, encode) {
    const value = typeof encode === 'function' ? encode(new ProtoWriter()).finish() : encode
    return this.bytes(fieldNo, value)
  }

  tag(fieldNo, wireType) {
    this.rawVarint((fieldNo << 3) | wireType)
    return this
  }

  rawVarint(value) {
    const bytes = []
    let n = Number(value)
    while (n > 0x7f) {
      bytes.push((n & 0x7f) | 0x80)
      n = Math.floor(n / 128)
    }
    bytes.push(n)
    this.parts.push(Uint8Array.from(bytes))
    return this
  }

  finish() {
    return concatBytes(this.parts)
  }
}

export function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

export function readVarint(bytes, offset = 0) {
  let result = 0
  let shift = 0
  let cursor = offset

  while (cursor < bytes.length) {
    const byte = bytes[cursor++]
    result += (byte & 0x7f) * 2 ** shift
    if ((byte & 0x80) === 0) return { value: result, offset: cursor }
    shift += 7
  }

  throw new Error('Unterminated protobuf varint')
}

export function decodeMessage(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  const fields = []
  let offset = 0

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset)
    offset = tag.offset
    const fieldNo = tag.value >> 3
    const wireType = tag.value & 0x7

    if (wireType === WIRE_VARINT) {
      const value = readVarint(bytes, offset)
      fields.push({ fieldNo, wireType, value: value.value })
      offset = value.offset
      continue
    }

    if (wireType === WIRE_BYTES) {
      const length = readVarint(bytes, offset)
      offset = length.offset
      const end = offset + length.value
      if (end > bytes.length) throw new Error(`Invalid protobuf length for field ${fieldNo}`)
      fields.push({ fieldNo, wireType, value: bytes.slice(offset, end) })
      offset = end
      continue
    }

    if (wireType === WIRE_FIXED32) {
      const end = offset + 4
      if (end > bytes.length) throw new Error(`Invalid fixed32 length for field ${fieldNo}`)
      fields.push({ fieldNo, wireType, value: bytes.slice(offset, end) })
      offset = end
      continue
    }

    if (wireType === WIRE_FIXED64) {
      const end = offset + 8
      if (end > bytes.length) throw new Error(`Invalid fixed64 length for field ${fieldNo}`)
      fields.push({ fieldNo, wireType, value: bytes.slice(offset, end) })
      offset = end
      continue
    }

    throw new Error(`Unsupported protobuf wire type ${wireType}`)
  }

  return fields
}

export function firstString(fields, fieldNo) {
  const field = fields.find((item) => item.fieldNo === fieldNo && item.wireType === WIRE_BYTES)
  return field ? decodeUtf8(field.value) : undefined
}

export function firstNumber(fields, fieldNo) {
  const field = fields.find((item) => item.fieldNo === fieldNo && item.wireType === WIRE_VARINT)
  return field ? Number(field.value) : undefined
}

export function strings(fields, fieldNo) {
  return fields
    .filter((item) => item.fieldNo === fieldNo && item.wireType === WIRE_BYTES)
    .map((item) => decodeUtf8(item.value))
}

export function messages(fields, fieldNo) {
  return fields
    .filter((item) => item.fieldNo === fieldNo && item.wireType === WIRE_BYTES)
    .map((item) => decodeMessage(item.value))
}

export function decodeUtf8(bytes) {
  return TEXT_DECODER.decode(bytes)
}

export function grpcWebFrame(message) {
  const bytes = message instanceof Uint8Array ? message : Uint8Array.from(message)
  const frame = new Uint8Array(bytes.length + 5)
  frame[0] = 0
  new DataView(frame.buffer).setUint32(1, bytes.length, false)
  frame.set(bytes, 5)
  return frame
}

export function decodeGrpcWebFrames(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  const dataFrames = []
  const trailers = []
  let offset = 0

  while (offset + 5 <= bytes.length) {
    const flags = bytes[offset]
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 1, 4).getUint32(0, false)
    offset += 5
    const end = offset + length
    if (end > bytes.length) throw new Error('Invalid gRPC-web frame length')
    const payload = bytes.slice(offset, end)
    offset = end

    if ((flags & 0x80) === 0x80) trailers.push(decodeUtf8(payload))
    else dataFrames.push(payload)
  }

  if (offset !== bytes.length) throw new Error('Unexpected bytes after gRPC-web frames')

  return {
    data: concatBytes(dataFrames),
    trailers,
  }
}

export function toDebugValue(value, depth = 0) {
  if (!(value instanceof Uint8Array)) return value
  if (value.length === 0) return ''

  const text = decodeUtf8(value)
  const printable =
    text &&
    Array.from(text).some((char) => /\p{L}|\p{N}/u.test(char)) &&
    !/[\u0000-\u0008\u000E-\u001F]/.test(text)
  if (printable) return text

  if (depth >= 4) return { bytes: Buffer.from(value).toString('base64') }

  try {
    return decodeMessage(value).map((field) => ({
      fieldNo: field.fieldNo,
      wireType: field.wireType,
      value: toDebugValue(field.value, depth + 1),
    }))
  } catch {
    return { bytes: Buffer.from(value).toString('base64') }
  }
}
