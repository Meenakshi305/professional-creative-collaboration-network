import { getToken } from './authService'


const API_BASE_URL =
  'http://localhost:8080/api'


// ============================================
// TYPES
// ============================================

export type ProfileResponse = {

  userId: number

  username: string

  bio: string | null

  skills: string | null

  achievements: string | null

  profileImageUrl: string | null
}


export type UpdateProfileRequest = {

  bio: string

  skills: string

  achievements: string
}


// ============================================
// HELPER
// ============================================

async function readResponse(
  response: Response
) {

  const text =
    await response.text()


  if (!text) {

    return {}
  }


  try {

    return JSON.parse(
      text
    )

  } catch {

    return {

      message:
        text
    }
  }
}


// ============================================
// GET PROFILE
// ============================================

export async function getUserProfile(
  userId: number
): Promise<ProfileResponse> {

  const token =
    getToken()


  if (!token) {

    throw new Error(
      'Authentication token not found.'
    )
  }


  const response =
    await fetch(

      `${API_BASE_URL}/users/${userId}/profile`,

      {

        method: 'GET',

        headers: {

          Authorization:
            `Bearer ${token}`
        }
      }
    )


  const data =
    await readResponse(
      response
    )


  if (!response.ok) {

    throw new Error(

      data.message
      ||
      `Unable to load profile. Status ${response.status}`
    )
  }


  return data as ProfileResponse
}


// ============================================
// UPDATE PROFILE
// ============================================

export async function updateUserProfile(

  userId: number,

  request: UpdateProfileRequest

): Promise<ProfileResponse> {

  const token =
    getToken()


  if (!token) {

    throw new Error(
      'Authentication token not found.'
    )
  }


  const response =
    await fetch(

      `${API_BASE_URL}/users/${userId}/profile`,

      {

        method: 'PUT',

        headers: {

          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`
        },

        body:
          JSON.stringify(
            request
          )
      }
    )


  const data =
    await readResponse(
      response
    )


  if (!response.ok) {

    throw new Error(

      data.message
      ||
      `Unable to save profile. Status ${response.status}`
    )
  }


  return data as ProfileResponse
}


// ============================================
// UPLOAD PROFILE IMAGE TO MEGA
// ============================================

export async function uploadProfileImage(

  userId: number,

  file: File

): Promise<string> {

  const token =
    getToken()


  if (!token) {

    throw new Error(
      'Authentication token not found.'
    )
  }


  const formData =
    new FormData()


  formData.append(
    'file',
    file
  )


  const response =
    await fetch(

      `${API_BASE_URL}/users/${userId}/profile/image`,

      {

        method: 'POST',

        headers: {

          Authorization:
            `Bearer ${token}`
        },

        body:
          formData
      }
    )


  const data =
    await readResponse(
      response
    )


  if (!response.ok) {

    throw new Error(

      data.message
      ||
      `Unable to upload profile image. Status ${response.status}`
    )
  }


  if (!data.profileImageUrl) {

    throw new Error(
      'Backend did not return the profile image URL.'
    )
  }


  /*
   * Timestamp prevents Chrome from
   * showing the previous cached image.
   */

  return `${data.profileImageUrl}?t=${Date.now()}`
}