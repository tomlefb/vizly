import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MAX_IMAGE_SIZE } from '@/lib/constants'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

function isAllowedMimeType(type: string): type is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type)
}

function getExtensionFromMime(mime: AllowedMimeType): string {
  const map: Record<AllowedMimeType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[mime]
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        {
          error:
            'Type de fichier non supporté. Formats acceptés : JPEG, PNG, WebP, GIF',
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 5 Mo' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = getExtensionFromMime(file.type)
    const uniqueId = crypto.randomUUID()
    const filePath = `${user.id}/${uniqueId}.${ext}`

    // Upload to Supabase Storage using admin client (bypasses RLS for storage)
    const adminClient = createAdminClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
      .from('portfolio-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload : ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = adminClient.storage
      .from('portfolio-images')
      .getPublicUrl(filePath)

    return NextResponse.json(
      { url: publicUrlData.publicUrl },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
