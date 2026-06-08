export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePresignedUploadUrl } from '@/lib/s3';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { fileName, contentType, fileSize } = body ?? {};

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP, MP4 ou WebM.' }, { status: 400 });
    }

    if (isImage && fileSize > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Imagem deve ter no máximo 10MB.' }, { status: 400 });
    }

    if (isVideo && fileSize > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'Vídeo deve ter no máximo 100MB.' }, { status: 400 });
    }

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      true // exercise media is public
    );

    return NextResponse.json({
      uploadUrl,
      cloud_storage_path,
      mediaType: isImage ? 'image' : 'video',
    });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
