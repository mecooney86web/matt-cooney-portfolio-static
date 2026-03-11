export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  try {
    const body = await context.request.json();
    if (body.password && body.password === context.env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: false, error: 'Invalid password' }), {
      status: 401, headers: corsHeaders
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), {
      status: 400, headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
