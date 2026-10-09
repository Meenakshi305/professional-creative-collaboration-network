import {
  useEffect,
  useState
} from 'react'

import {
  searchUsers,
  type SearchUser
} from '../../service/userService'


type UserSearchProps = {

  currentUserId?: number

  onUserClick: (
    userId: number
  ) => void
}


function UserSearch({

  currentUserId,

  onUserClick

}: UserSearchProps) {


  const [
    searchText,
    setSearchText
  ] = useState('')


  const [
    searchResults,
    setSearchResults
  ] = useState<SearchUser[]>([])


  const [
    isSearching,
    setIsSearching
  ] = useState(false)


  const [
    searchError,
    setSearchError
  ] = useState('')


  // ============================================
  // SEARCH WITH SMALL DELAY
  // ============================================

  useEffect(() => {

    const query =
      searchText.trim()


    if (!query) {

      setSearchResults(
        []
      )

      setSearchError(
        ''
      )

      setIsSearching(
        false
      )

      return
    }


    const timeout =
      window.setTimeout(

        async () => {

          try {

            setIsSearching(
              true
            )


            setSearchError(
              ''
            )


            const results =
              await searchUsers(
                query
              )


            // Optional:
            // hide yourself from search results

            const filteredResults =
              currentUserId
                ? results.filter(
                    user =>
                      user.userId
                      !==
                      currentUserId
                  )
                : results


            setSearchResults(
              filteredResults
            )


          } catch (error) {

            console.error(
              'Search error:',
              error
            )


            setSearchResults(
              []
            )


            setSearchError(
              error instanceof Error
                ? error.message
                : 'Unable to search users.'
            )


          } finally {

            setIsSearching(
              false
            )
          }
        },

        350
      )


    return () => {

      window.clearTimeout(
        timeout
      )
    }

  }, [
    searchText,
    currentUserId
  ])


  const openUser = (
    userId: number
  ) => {

    setSearchText(
      ''
    )


    setSearchResults(
      []
    )


    setSearchError(
      ''
    )


    onUserClick(
      userId
    )
  }


  return (

    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '480px'
      }}
    >


      <input
        type="search"
        value={
          searchText
        }
        placeholder="Search creative people..."
        onChange={
          event =>
            setSearchText(
              event.target.value
            )
        }
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border:
            '1px solid #dedbea',
          borderRadius:
            '12px',
          padding:
            '12px 15px',
          fontSize:
            '0.95rem',
          outline:
            'none'
        }}
      />


      {
        searchText.trim()
        &&
        (

          <div
            style={{
              position:
                'absolute',
              top:
                'calc(100% + 8px)',
              left: 0,
              right: 0,
              zIndex: 2000,
              background:
                '#ffffff',
              border:
                '1px solid #eceaf5',
              borderRadius:
                '14px',
              boxShadow:
                '0 14px 35px rgba(32, 28, 72, 0.15)',
              maxHeight:
                '380px',
              overflowY:
                'auto'
            }}
          >


            {
              isSearching
              &&
              (

                <div
                  style={{
                    padding:
                      '16px'
                  }}
                >

                  Searching...

                </div>

              )
            }


            {
              !isSearching
              &&
              searchError
              &&
              (

                <div
                  style={{
                    padding:
                      '16px'
                  }}
                >

                  {searchError}

                </div>

              )
            }


            {
              !isSearching
              &&
              !searchError
              &&
              searchResults.length === 0
              &&
              (

                <div
                  style={{
                    padding:
                      '16px'
                  }}
                >

                  No users found.

                </div>

              )
            }


            {
              !isSearching
              &&
              !searchError
              &&
              searchResults.map(
                user => (

                  <button
                    key={
                      user.userId
                    }
                    type="button"
                    onClick={
                      () =>
                        openUser(
                          user.userId
                        )
                    }
                    style={{
                      width:
                        '100%',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap:
                        '12px',
                      border:
                        'none',
                      borderBottom:
                        '1px solid #efedf7',
                      background:
                        '#ffffff',
                      padding:
                        '12px 15px',
                      cursor:
                        'pointer',
                      textAlign:
                        'left'
                    }}
                  >


                    {
                      user.profileImageUrl
                        ? (

                            <img
                              src={
                                user.profileImageUrl
                              }
                              alt={
                                user.username
                              }
                              style={{
                                width:
                                  '46px',
                                height:
                                  '46px',
                                borderRadius:
                                  '50%',
                                objectFit:
                                  'cover',
                                flexShrink:
                                  0
                              }}
                            />

                          )
                        : (

                            <div
                              style={{
                                width:
                                  '46px',
                                height:
                                  '46px',
                                borderRadius:
                                  '50%',
                                background:
                                  '#7567df',
                                color:
                                  'white',
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                justifyContent:
                                  'center',
                                fontWeight:
                                  700,
                                flexShrink:
                                  0
                              }}
                            >

                              {
                                user.username
                                  .charAt(0)
                                  .toUpperCase()
                              }

                            </div>

                          )
                    }


                    <div
                      style={{
                        minWidth: 0
                      }}
                    >


                      <strong>

                        {
                          user.fullName
                          ||
                          user.username
                        }

                      </strong>


                      <div
                        style={{
                          opacity:
                            0.7,
                          fontSize:
                            '0.88rem',
                          marginTop:
                            '2px'
                        }}
                      >

                        @{user.username}

                      </div>


                      {
                        user.bio
                        &&
                        (

                          <div
                            style={{
                              opacity:
                                0.65,
                              fontSize:
                                '0.8rem',
                              marginTop:
                                '3px',
                              whiteSpace:
                                'nowrap',
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              maxWidth:
                                '330px'
                            }}
                          >

                            {user.bio}

                          </div>

                        )
                      }


                    </div>


                  </button>

                )
              )
            }


          </div>

        )
      }


    </div>
  )
}


export default UserSearch