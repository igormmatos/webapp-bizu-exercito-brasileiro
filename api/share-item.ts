import { createSharePreviewResponse } from '../server/sharePreviewRuntime.js';

export default async function handler(req: any, res: any) {
  const rawItemId = req.query?.itemId;
  const itemId = Array.isArray(rawItemId) ? String(rawItemId[0] || '').trim() : String(rawItemId || '').trim();

  const previewResponse = await createSharePreviewResponse({
    itemId,
    headers: req.headers || {},
  });

  res.statusCode = previewResponse.statusCode;

  Object.entries(previewResponse.headers).forEach(([headerName, headerValue]) => {
    res.setHeader(headerName, headerValue);
  });

  res.end(previewResponse.body);
}
