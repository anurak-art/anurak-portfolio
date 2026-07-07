module.exports = async (req, res) => {
  const { code, error, error_description } = req.query || {};

  if (error) {
    res.status(400).send(`GitHub OAuth error: ${error_description || error}`);
    return;
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send("Missing OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET environment variables on the server.");
    return;
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || "GitHub did not return an access token.");
    }

    const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(`<!DOCTYPE html><html><body>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:github:success:${payload}',
        e.origin
      );
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body></html>`);
  } catch (err) {
    res.status(500).send("Authentication error: " + err.message);
  }
};
