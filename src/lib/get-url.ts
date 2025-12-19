export const getURL = () => {
    let url =
        process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
        'http://localhost:3000/';

    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;

    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;

    // Make sure to exclude a trailing `/` (per user request: "常に / なし（またはあり）に統一すること" -> let's standardize on NO trailing slash for base, but user said "path" usually starts with /.
    // Actually, usually redirect URLs are constructed as `base + path`.
    // Let's standardise to NO trailing slash to match typical Next.js conventions, allowing easy concatenation.
    // Wait, the code above adds a trailing slash.
    // User instruction: "末尾の / の有無を正規化し、常に / なし（またはあり）に統一すること" -> It says "Standardize to NO / (or WITH /)".
    // I will standardise to **NO TRAILING SLASH**.

    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    return url;
};
