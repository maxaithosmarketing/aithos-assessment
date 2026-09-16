// Minimal SMTP client for Cloudflare Workers (implicit TLS on port 465, AUTH LOGIN).
// Used to send the onboarding email through TransIP, the same mailbox n8n used.
import { connect } from 'cloudflare:sockets';

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(str) {
  const bytes = enc.encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function encodeHeaderText(str) {
  return /^[\x20-\x7e]*$/.test(str) ? str : '=?UTF-8?B?' + b64(str) + '?=';
}

function wrap76(s) {
  return s.replace(/(.{76})/g, '$1\r\n');
}

function addressOnly(a) {
  const m = String(a).match(/<([^>]+)>/);
  return (m ? m[1] : String(a)).trim();
}

export async function sendMail(opts) {
  const host = opts.host;
  const port = opts.port || 465;
  const sock = connect({ hostname: host, port }, { secureTransport: 'on', allowHalfOpen: false });
  const reader = sock.readable.getReader();
  const writer = sock.writable.getWriter();
  let buf = '';

  async function readReply() {
    // A reply is complete once a line starts with "NNN " (space, not dash).
    for (;;) {
      const lines = buf.split('\r\n');
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3} /.test(lines[i])) {
          const reply = lines.slice(0, i + 1).join('\r\n');
          buf = lines.slice(i + 1).join('\r\n');
          return reply;
        }
      }
      const { value, done } = await reader.read();
      if (done) throw new Error('smtp: connection closed');
      buf += dec.decode(value, { stream: true });
    }
  }
  async function cmd(line, okCodes) {
    if (line !== null) await writer.write(enc.encode(line + '\r\n'));
    const reply = await readReply();
    if (!okCodes.includes(reply.slice(0, 3))) throw new Error('smtp ' + reply.slice(0, 200));
    return reply;
  }

  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('smtp: timeout')), opts.timeoutMs || 30000));
  const run = (async () => {
    await cmd(null, ['220']);
    await cmd('EHLO ' + (opts.ehlo || 'aithos-assessment.workers.dev'), ['250']);
    await cmd('AUTH LOGIN', ['334']);
    await cmd(btoa(opts.user), ['334']);
    await cmd(btoa(opts.password), ['235']);
    await cmd('MAIL FROM:<' + addressOnly(opts.from) + '>', ['250']);
    const rcpts = [].concat(opts.to || [], opts.cc || []).map(addressOnly).filter(Boolean);
    for (const r of rcpts) await cmd('RCPT TO:<' + r + '>', ['250', '251']);
    await cmd('DATA', ['354']);
    const headers = [
      'From: ' + opts.from,
      'To: ' + [].concat(opts.to).join(', '),
      opts.cc && opts.cc.length ? 'Cc: ' + [].concat(opts.cc).join(', ') : null,
      'Subject: ' + encodeHeaderText(opts.subject),
      'Date: ' + new Date().toUTCString(),
      'Message-ID: <' + crypto.randomUUID() + '@' + host + '>',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64'
    ].filter(Boolean).join('\r\n');
    const message = headers + '\r\n\r\n' + wrap76(b64(opts.html)) + '\r\n.\r\n';
    await writer.write(enc.encode(message));
    const reply = await readReply();
    if (reply.slice(0, 3) !== '250') throw new Error('smtp data ' + reply.slice(0, 200));
    try { await writer.write(enc.encode('QUIT\r\n')); } catch (e) { /* ignore */ }
    return reply;
  })();

  try {
    return await Promise.race([run, timeout]);
  } finally {
    try { await sock.close(); } catch (e) { /* ignore */ }
  }
}
