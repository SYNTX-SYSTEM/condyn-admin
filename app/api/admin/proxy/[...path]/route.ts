import { NextRequest, NextResponse } from 'next/server';

type ProxyRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function handleProxy(req: NextRequest, context: ProxyRouteContext) {
  const API_URL = process.env.CONDYN_API_URL;
  const TOKEN = process.env.BACKEND_TOKEN;

  if (!API_URL || !TOKEN) {
    console.error('Server configuration error: Missing CONDYN_API_URL or BACKEND_TOKEN.');
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const { path } = await context.params;
  const targetPath = (path || []).join('/');
  const searchParams = req.nextUrl.search;
  const targetUrl = `${API_URL}/${targetPath}${searchParams}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // Explicitly strip sensitive/hop-by-hop headers
    if (
      lowerKey !== 'authorization' &&
      lowerKey !== 'cookie' &&
      lowerKey !== 'host' &&
      lowerKey !== 'connection' &&
      lowerKey !== 'content-length' &&
      lowerKey !== 'transfer-encoding'
    ) {
      headers.set(key, value);
    }
  });

  // Inject Backend Bearer token (Next.js server-side only)
  headers.set('Authorization', `Bearer ${TOKEN}`);

  // Forward body as raw stream (req.body is a ReadableStream in NextRequest)
  const body = (req.method !== 'GET' && req.method !== 'HEAD') ? req.body : undefined;

  try {
    // duplex: 'half' required for streaming bodies in Next.js edge/node fetch
    const fetchOptions: RequestInit & { duplex?: 'half' } = {
      method: req.method,
      headers,
      body,
    };
    if (body) {
      fetchOptions.duplex = 'half';
    }

    const response = await fetch(targetUrl, fetchOptions);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Explicitly strip response headers that could cause fetch or streaming issues
      if (
        lowerKey !== 'content-encoding' && 
        lowerKey !== 'transfer-encoding' &&
        lowerKey !== 'content-length' &&
        lowerKey !== 'connection'
      ) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Backend proxy error:', error);
    return NextResponse.json({ detail: 'Backend proxy error' }, { status: 502 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
