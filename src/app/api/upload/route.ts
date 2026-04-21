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

function detectImageMimeFromBytes(bytes: Uint8Array): AllowedMimeType | null {
  if (bytes.length < 12) return null
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }
  // GIF: 47 49 46 38 (37|39) 61  → GIF87a / GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return 'image/gif'
  }
  // WebP: "RIFF" (52 49 46 46) ... "WEBP" (57 45 42 50) at offset 8
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
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

    // Read bytes and verify magic number matches the declared MIME.
    // file.type is client-supplied and spoofable, so we must inspect the
    // actual bytes before trusting the content.
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    const detectedMime = detectImageMimeFromBytes(buffer)
    if (!detectedMime || detectedMime !== file.type) {
      return NextResponse.json(
        {
          error:
            'Le contenu du fichier ne correspond pas au type déclaré. Formats acceptés : JPEG, PNG, WebP, GIF',
        },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = getExtensionFromMime(detectedMime)
    const uniqueId = crypto.randomUUID()
    const filePath = `${user.id}/${uniqueId}.${ext}`

    // Upload to Supabase Storage using admin client (bypasses RLS for storage)
    const adminClient = createAdminClient()

    const { error: uploadError } = await adminClient.storage
      .from('portfolio-images')
      .upload(filePath, buffer, {
        contentType: detectedMime,
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
