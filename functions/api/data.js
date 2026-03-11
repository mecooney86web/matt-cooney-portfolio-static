const GITHUB_API = 'https://api.github.com';
const DATA_PATH = 'data/videos.json';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

function verifyPassword(request, env) {
  return request.headers.get('X-Admin-Password') === env.ADMIN_PASSWORD;
}

// GET - read portfolio data
export async function onRequestGet(context) {
  const { request, env } = context;
  if (!verifyPassword(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${DATA_PATH}`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
    const file = await res.json();
    const data = JSON.parse(atob(file.content));
    data._sha = file.sha;
    return new Response(JSON.stringify(data), { headers: corsHeaders });
  } catch (e) {
    console.error('GET /api/data error:', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch data', details: e.message }), {
      status: 500, headers: corsHeaders
    });
  }
}

// PUT - save portfolio data
export async function onRequestPut(context) {
  const { request, env } = context;
  if (!verifyPassword(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  try {
    const data = await request.json();
    const sha = data._sha;
    delete data._sha;
    const content = btoa(JSON.stringify(data, null, 2));
    const res = await fetch(
      `${GITHUB_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${DATA_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Update portfolio data from admin panel', content, sha })
      }
    );
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
    const result = await res.json();
    data._sha = result.content.sha;
    return new Response(JSON.stringify({ success: true, sha: result.content.sha }), { headers: corsHeaders });
  } catch (e) {
    console.error('PUT /api/data error:', e);
    return new Response(JSON.stringify({ error: 'Failed to save data', details: e.message }), {
      status: 500, headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password'
    }
  });
}
