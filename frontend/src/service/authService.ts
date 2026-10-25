const API_BASE_URL =
  'http://localhost:8080/api/auth'


// ============================================
// TYPES
// ============================================

export type SignupRequest = {
  fullName: string
  username: string
  email: string
  password: string
  dateOfBirth: string
}


export type SigninRequest = {
  email: string
  password: string
}


export type AuthResponse = {
  userId: number
  fullName: string
  username: string
  email: string
  role: string
  token: string | null
  message: string
}


export type CurrentUserResponse = {
  userId: number
  fullName: string
  username: string
  email: string
  dateOfBirth: string | null
  role: string
  active: boolean
}


type ErrorResponse = {
  message?: string
}


// ============================================
// TOKEN
// ============================================

const TOKEN_KEY =
  'creativeCollabToken'


// ============================================
// READ RESPONSE
// ============================================

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


// ============================================
// GET ERROR MESSAGE
// ============================================

function getErrorMessage(
  data: unknown,
  fallbackMessage: string
): string {

  if (
    typeof data === 'object'
    &&
    data !== null
    &&
    'message' in data
  ) {

    const errorData =
      data as ErrorResponse


    if (
      typeof errorData.message === 'string'
      &&
      errorData.message.trim() !== ''
    ) {

      return errorData.message
    }
  }


  if (
    typeof data === 'string'
    &&
    data.trim() !== ''
  ) {

    return data
  }


  return fallbackMessage
}


// ============================================
// SIGNUP
// ============================================

export async function signupUser(
  request: SignupRequest
): Promise<AuthResponse> {

  const response =
    await fetch(
      `${API_BASE_URL}/signup`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
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
      getErrorMessage(
        data,
        'Unable to create account.'
      )
    )
  }


  return data as AuthResponse
}


// ============================================
// LOGIN
// ============================================

export async function loginUser(
  request: SigninRequest
): Promise<AuthResponse> {

  const response =
    await fetch(
      `${API_BASE_URL}/login`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
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
      getErrorMessage(
        data,
        'Unable to login.'
      )
    )
  }


  return data as AuthResponse
}


// ============================================
// SAVE LOGIN SESSION
// ============================================

export function saveLoginSession(
  response: AuthResponse
) {

  if (!response.token) {

    throw new Error(
      'No authentication token was returned.'
    )
  }


  sessionStorage.setItem(
    TOKEN_KEY,
    response.token
  )
}


// ============================================
// GET TOKEN
// ============================================

export function getToken():
  string | null {

  return sessionStorage.getItem(
    TOKEN_KEY
  )
}


// ============================================
// CHECK LOGIN SESSION
// ============================================

export function hasLoginSession():
  boolean {

  return Boolean(
    getToken()
  )
}


// ============================================
// CLEAR LOGIN SESSION
// ============================================

export function clearLoginSession() {

  sessionStorage.removeItem(
    TOKEN_KEY
  )
}


// ============================================
// CURRENT USER
// ============================================

export async function getCurrentUser():
  Promise<CurrentUserResponse> {

  const token =
    getToken()


  if (!token) {

    throw new Error(
      'No active login session.'
    )
  }


  const response =
    await fetch(
      `${API_BASE_URL}/me`,
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
      getErrorMessage(
        data,
        'Unable to load current user.'
      )
    )
  }


  if (
    typeof data !== 'object'
    ||
    data === null
  ) {

    throw new Error(
      'Invalid current user response from server.'
    )
  }


  return data as CurrentUserResponse
}


// ============================================
// LOGOUT
// ============================================

export async function logoutUser():
  Promise<void> {

  const token =
    getToken()


  try {

    if (token) {

      await fetch(
        `${API_BASE_URL}/signout`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      )
    }

  } finally {

    clearLoginSession()
  }
}