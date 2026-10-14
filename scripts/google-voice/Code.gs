/** SEP incoming-only text relay. No outgoing email/SMS methods. */
function sepConfig() {
  const p = PropertiesService.getScriptProperties().getProperties();
  if (!/^https:\/\/[^/?#]+\/api\/sms\/ingest$/.test(p.SEP_ENDPOINT || '') || !p.SEP_RELAY_SECRET || p.SEP_RELAY_SECRET.length < 32 || !/^\d{4}\/\d{2}\/\d{2}$/.test(p.SEP_START_DATE || '')) {
    throw new Error('Set SEP_ENDPOINT, SEP_RELAY_SECRET and SEP_START_DATE in Script Properties.');
  }
  return p;
}
function sepLabel(name) {
  const found = (Gmail.Users.Labels.list('me').labels || []).find(l => l.name === name);
  return found ? found.id : Gmail.Users.Labels.create({ name: name, labelListVisibility: 'labelShow', messageListVisibility: 'show' }, 'me').id;
}
function pollSepTexts() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1)) return;
  try {
    const config = sepConfig();
    const mailbox = Gmail.Users.getProfile('me').emailAddress;
    const imported = sepLabel('sep-sms-imported'), attention = sepLabel('sep-sms-attention');
    const messages = Gmail.Users.Messages.list('me', {
      q: 'from:(@txt.voice.google.com) after:' + config.SEP_START_DATE + ' -label:sep-sms-imported -label:sep-sms-attention',
      maxResults: 10,
    }).messages || [];
    const deadline = Date.now() + 240000;
    for (const entry of messages) {
      if (Date.now() > deadline) break;
      const mail = Gmail.Users.Messages.get('me', entry.id, { format: 'raw' });
      if (!mail.raw || mail.raw.length > 350000) {
        Gmail.Users.Messages.modify({ addLabelIds: [attention] }, 'me', entry.id);
        console.warn('An oversized message needs manual review in sep-sms-attention.');
        continue;
      }
      const payload = JSON.stringify({ mailbox: mailbox, raw: mail.raw, receivedAt: new Date(Number(mail.internalDate)).toISOString() });
      const timestamp = String(Date.now());
      const signature = Utilities.computeHmacSha256Signature(timestamp + '.' + payload, config.SEP_RELAY_SECRET, Utilities.Charset.UTF_8).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
      const response = UrlFetchApp.fetch(config.SEP_ENDPOINT, {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true, followRedirects: false,
        payload: JSON.stringify({ payload: payload, timestamp: timestamp, signature: signature }),
      });
      const code = response.getResponseCode();
      if (code === 200) {
        const result = JSON.parse(response.getContentText());
        if (result.ok && !result.retry) Gmail.Users.Messages.modify({ addLabelIds: [imported] }, 'me', entry.id);
      } else if ([400, 413, 422].includes(code)) {
        Gmail.Users.Messages.modify({ addLabelIds: [attention] }, 'me', entry.id);
        console.warn('A message needs manual review in sep-sms-attention. HTTP ' + code);
      } else {
        // Authentication/configuration/outage: preserve all remaining messages for retry.
        throw new Error('SEP relay unavailable (HTTP ' + code + '). Messages remain queued.');
      }
    }
    PropertiesService.getScriptProperties().setProperty('SEP_LAST_SUCCESS', new Date().toISOString());
  } finally { lock.releaseLock(); }
}
/** Run manually only after account authorization, configuration and a successful test. */
function installSepTextJob() {
  sepConfig();
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'pollSepTexts')) {
    ScriptApp.newTrigger('pollSepTexts').timeBased().everyMinutes(5).create();
  }
}
function stopSepTextJob() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'pollSepTexts').forEach(t => ScriptApp.deleteTrigger(t));
}
