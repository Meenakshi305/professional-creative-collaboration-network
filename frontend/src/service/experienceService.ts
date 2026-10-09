import {
  getToken
} from './authService'


const API_BASE_URL =
  'http://localhost:8080/api'


export type Experience = {
  id: number
  userId: number
  jobTitle: string
  organisation: string
  startDate: string
  endDate: string | null
  currentRole: boolean
  description: string | null
}


export type ExperienceRequest = {
  jobTitle: string
  organisation: string
  startDate: string
  endDate: string | null
  currentRole: boolean
  description: string
}


async function readResponse(
  response: Response
): Promise<unknown> {

  const text =
    await response.text()


  if (!text) {
    return null
  }


  try {

    return JSON.parse(
      text
    )

  } catch {

    return text
  }
}


function getErrorMessage(
  data: unknown,
  fallbackMessage: string
) {

  if (
    typeof data === 'object'
    &&
    data !== null
    &&
    'message' in data
  ) {

    const message =
      (data as { message?: unknown })
        .message


    if (
      typeof message === 'string'
      &&
      message.trim()
    ) {

      return message
    }
  }


  if (
    typeof data === 'string'
    &&
    data.trim()
  ) {

    return data
  }


  return fallbackMessage
}


function getHeaders() {

  const token =
    getToken()


  if (!token) {

    throw new Error(
      'No active login session.'
    )
  }


  return {
    'Content-Type':
      'application/json',

    Authorization:
      `Bearer ${token}`
  }
}


// ============================================
// GET EXPERIENCES
// ============================================

export async function getExperiences(
  userId: number
): Promise<Experience[]> {

  const response =
    await fetch(
      `${API_BASE_URL}/users/${userId}/experiences`,
      {
        method: 'GET',

        headers:
          getHeaders()
      }
    )


  const data =
    await readResponse(
      response
    )


  if (!response.ok) {

    throw new Error(
      getErrorMessage(
        data,
        'Unable to load experience.'
      )
    )
  }


  return data as Experience[]
}


// ============================================
// ADD EXPERIENCE
// ============================================

export async function addExperience(
  userId: number,
  request: ExperienceRequest
): Promise<Experience> {

  const response =
    await fetch(
      `${API_BASE_URL}/users/${userId}/experiences`,
      {
        method: 'POST',

        headers:
          getHeaders(),

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
      getErrorMessage(
        data,
        'Unable to add experience.'
      )
    )
  }


  return data as Experience
}


// ============================================
// UPDATE EXPERIENCE
// ============================================

export async function updateExperience(
  userId: number,
  experienceId: number,
  request: ExperienceRequest
): Promise<Experience> {

  const response =
    await fetch(
      `${API_BASE_URL}/users/${userId}/experiences/${experienceId}`,
      {
        method: 'PUT',

        headers:
          getHeaders(),

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
      getErrorMessage(
        data,
        'Unable to update experience.'
      )
    )
  }


  return data as Experience
}


// ============================================
// DELETE EXPERIENCE
// ============================================

export async function deleteExperience(
  userId: number,
  experienceId: number
): Promise<void> {

  const response =
    await fetch(
      `${API_BASE_URL}/users/${userId}/experiences/${experienceId}`,
      {
        method: 'DELETE',

        headers:
          getHeaders()
      }
    )


  if (!response.ok) {

    const data =
      await readResponse(
        response
      )


    throw new Error(
      getErrorMessage(
        data,
        'Unable to delete experience.'
      )
    )
  }
}