const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { GITHUB_TOKEN, GITHUB_REPO, ADMIN_PASSWORD_HASH } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPO || !ADMIN_PASSWORD_HASH) {
    res.status(500).json({ error: 'Server misconfigured: missing environment variables' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { password, closed, tests } = body || {};

  if (!password) {
    res.status(401).json({ error: 'Mot de passe manquant' });
    return;
  }
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (hash !== ADMIN_PASSWORD_HASH) {
    res.status(401).json({ error: 'Mot de passe incorrect' });
    return;
  }

  if (typeof closed !== 'boolean' || typeof tests !== 'object' || tests === null) {
    res.status(400).json({ error: 'Payload invalide' });
    return;
  }

  const newConfig = {
    closed,
    updated_at: new Date().toISOString(),
    tests
  };

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/access.json`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'toeic-part5-admin'
  };

  try {
    const getRes = await fetch(apiUrl, { headers });
    if (!getRes.ok) {
      const t = await getRes.text();
      res.status(502).json({ error: 'Impossible de lire access.json sur GitHub: ' + t });
      return;
    }
    const getData = await getRes.json();
    const sha = getData.sha;

    const content = Buffer.from(JSON.stringify(newConfig, null, 2), 'utf-8').toString('base64');

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'admin: update access.json (' + new Date().toISOString() + ')',
        content,
        sha
      })
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      res.status(502).json({ error: 'Échec de la mise à jour GitHub: ' + t });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};
