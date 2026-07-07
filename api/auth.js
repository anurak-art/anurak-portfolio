const CALLBACK_URL = "https://www.dynasec.pro/api/callback";

module.exports = (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Missing OAUTH_CLIENT_ID environment variable on the server.");
    return;
  }

  const state = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: CALLBACK_URL,
    scope: "repo,user",
    state
  });

  res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params.toString()}` });
  res.end();
};
