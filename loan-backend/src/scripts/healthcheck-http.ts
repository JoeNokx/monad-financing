import http from 'http';
import https from 'https';

function request(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'GET' }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode ?? 0, body });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const baseUrl = process.env.HEALTHCHECK_URL ?? `http://localhost:${process.env.PORT ?? 4000}/api/health`;

  try {
    const res = await request(baseUrl);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      process.stdout.write('ok\n');
      process.exit(0);
    }

    process.stderr.write(`unhealthy (${res.statusCode})\n`);
    process.exit(1);
  } catch {
    process.stderr.write('unreachable\n');
    process.exit(1);
  }
}

void main();
