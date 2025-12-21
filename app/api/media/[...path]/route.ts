import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const pathSegments = pathname.split('/').filter(Boolean).slice(2);
  const externalUrl = `https://files.latific.click/file/${pathSegments.join("/")}`; // My weak ass file server
  /*
    PLEASE READ ME
    Please for the love of GOD do not directly interact with this, yes it's behind cloudflare proxying
    That does not mean it has fast internet for some reason. Just use this:
    https://www.latific.click/api/media/file.ext
    Thank you!
  */
  
  console.log("Fetching from:", externalUrl);
  
  try {
    const upstreamResponse = await fetch(externalUrl);
  
    if (!upstreamResponse.ok) {
      return new NextResponse("Error fetching file", { status: upstreamResponse.status });
    }
  
    const headers = new Headers(upstreamResponse.headers);
  
    headers.set(
      "Cache-Control", 
      "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400"
    );
  
    headers.delete("content-encoding");
    
    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: headers,
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}