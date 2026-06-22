import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    const { data: link, error } = await supabase
      .from('download_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !link) {
      return res.status(404).send('Link not found');
    }

    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).send('This download link has expired');
    }

    if (link.downloads_count >= link.max_downloads) {
      return res.status(410).send('Download limit reached');
    }

    await supabase
      .from('download_links')
      .update({
        downloads_count: link.downloads_count + 1,
        downloaded_at: new Date().toISOString(),
      })
      .eq('id', link.id);

    if (link.file_storage_path) {
      const { data: signedUrlData } = await supabase.storage
        .from('product_files')
        .createSignedUrl(link.file_storage_path, 60);

      if (signedUrlData?.signedUrl) {
        return res.redirect(302, signedUrlData.signedUrl);
      }
    }

    return res.status(404).send('File not found');
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
