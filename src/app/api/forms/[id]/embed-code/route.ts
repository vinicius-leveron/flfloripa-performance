import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';
import { headers } from 'next/headers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import('@/lib/prisma');

    const form = await prisma.formTemplate.findUnique({
      where: { id },
      select: { id: true, slug: true, title: true, status: true },
    });

    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    // Obtém o host da requisição
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const embedUrl = `${baseUrl}/embed/${form.slug}`;
    const publicUrl = `${baseUrl}/f/${form.slug}`;

    // Gera código de embed
    const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; max-width: 500px;"
  title="${form.title}"
></iframe>`;

    const scriptCode = `<div id="form-${form.slug}"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${embedUrl}';
    iframe.width = '100%';
    iframe.height = '500';
    iframe.style.border = 'none';
    iframe.style.maxWidth = '500px';
    iframe.title = '${form.title}';
    document.getElementById('form-${form.slug}').appendChild(iframe);

    window.addEventListener('message', function(event) {
      if (event.data.type === 'form-submitted' && event.data.formSlug === '${form.slug}') {
        console.log('Formulário enviado com sucesso!');
        // Adicione seu código de tracking aqui
      }
    });
  })();
</script>`;

    return NextResponse.json({
      data: {
        embedUrl,
        publicUrl,
        iframeCode,
        scriptCode,
        isPublished: form.status === 'PUBLISHED',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
