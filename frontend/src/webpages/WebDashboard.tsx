import {
    useEffect,
    useRef,
    useState
} from 'react'

import './WebDashboard.css'

import NavigationBar
    from '../shared/NavigationBar/NavigationBar'
import {
    searchUsers,
    getSuggestedUsers,
    type SearchUser,
    type SuggestedUser
} from '../service/userService'


type UserPost = {
    id: number
    caption: string
    image: string
}


type DashboardProps = {

    onHomeClick: () => void

    onProfileClick: () => void

    onEventsClick: () => void

    onUserClick: (
        userId: number
    ) => void
}


function Dashboard({

    onHomeClick,

    onProfileClick,

    onEventsClick,

    onUserClick

}: DashboardProps) {


    // ============================================
    // SEARCH
    // ============================================

    const [
        searchText,
        setSearchText
    ] = useState('')


    const [
        searchedCreatives,
        setSearchedCreatives
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
    // POST
    // ============================================

    const [
        postCaption,
        setPostCaption
    ] = useState('')


    const [
        selectedImage,
        setSelectedImage
    ] = useState<string | null>(
        null
    )


    const [
        userPosts,
        setUserPosts
    ] = useState<UserPost[]>([])

    const [
        suggestedUsers,
        setSuggestedUsers
    ] = useState<SuggestedUser[]>([])


    const [
        suggestionsLoading,
        setSuggestionsLoading
    ] = useState(true)

    const imageInputRef =
        useRef<HTMLInputElement>(
            null
        )


    // ============================================
    // LIKE / COMMENT
    // ============================================

    const [
        likedPosts,
        setLikedPosts
    ] = useState<
        (number | string)[]
    >([])


    const [
        openCommentPost,
        setOpenCommentPost
    ] = useState<
        number |
        string |
        null
    >(null)


    const [
        commentText,
        setCommentText
    ] = useState('')


    const [
        postComments,
        setPostComments
    ] = useState<
        Record<string, string[]>
    >({})


    // ============================================
    // SAMPLE COLLABORATIONS
    // ============================================

    const collaborations = [

        {
            id: 1,

            title:
                'Music Video Production',

            description:
                'Looking for a creative video editor.'
        },

        {
            id: 2,

            title:
                'Brand Campaign Design',

            description:
                'Graphic designer required for a new campaign.'
        }

    ]


    // ============================================
    // SAMPLE EVENTS
    // ============================================

    const events = [

        {
            id: 1,

            title:
                'Creative Networking Meetup',

            details:
                '24 Sep • Adelaide • In-person'
        },

        {
            id: 2,

            title:
                'Digital Art Workshop',

            details:
                '10 Oct • Online'
        }

    ]


    // ============================================
    // NORMALISED SEARCH
    // ============================================

    const normalizedSearch =
        searchText
            .trim()
            .toLowerCase()


    // ============================================
    // FILTER COLLABORATIONS
    // ============================================

    const filteredCollaborations =
        collaborations.filter(
            collaboration =>

                collaboration.title
                    .toLowerCase()
                    .includes(
                        normalizedSearch
                    )

                ||

                collaboration.description
                    .toLowerCase()
                    .includes(
                        normalizedSearch
                    )
        )


    // ============================================
    // FILTER EVENTS
    // ============================================

    const filteredEvents =
        events.filter(
            event =>

                event.title
                    .toLowerCase()
                    .includes(
                        normalizedSearch
                    )

                ||

                event.details
                    .toLowerCase()
                    .includes(
                        normalizedSearch
                    )
        )


    // ============================================
    // REAL USER SEARCH
    // ============================================

    useEffect(() => {

        const query =
            searchText.trim()


        if (!query) {

            setSearchedCreatives(
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


                        const users =
                            await searchUsers(
                                query
                            )


                        setSearchedCreatives(
                            users
                        )


                    } catch (error) {

                        console.error(
                            'Search users error:',
                            error
                        )


                        setSearchedCreatives(
                            []
                        )


                        setSearchError(

                            error instanceof Error

                                ? error.message

                                : 'Unable to search creatives.'

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

    }, [searchText])


    // ============================================
    // OPEN USER PROFILE
    // ============================================
    // ============================================
    // LOAD SUGGESTED CREATIVES
    // ============================================

    useEffect(() => {

        let cancelled =
            false


        const loadSuggestions =
            async () => {

                try {

                    setSuggestionsLoading(
                        true
                    )


                    const users =
                        await getSuggestedUsers()


                    if (!cancelled) {

                        setSuggestedUsers(
                            users
                        )
                    }


                } catch (error) {

                    console.error(
                        'Suggested creatives error:',
                        error
                    )


                    if (!cancelled) {

                        setSuggestedUsers(
                            []
                        )
                    }


                } finally {

                    if (!cancelled) {

                        setSuggestionsLoading(
                            false
                        )
                    }
                }
            }


        loadSuggestions()


        return () => {

            cancelled =
                true
        }

    }, [])

    const handleCreativeClick = (
        userId: number
    ) => {

        setSearchText(
            ''
        )


        setSearchedCreatives(
            []
        )


        setSearchError(
            ''
        )


        onUserClick(
            userId
        )
    }


    // ============================================
    // IMAGE SELECT
    // ============================================

    const handleImageSelect = (
        event:
            React.ChangeEvent<HTMLInputElement>
    ) => {

        const file =
            event.target.files?.[0]


        if (file) {

            const imageUrl =
                URL.createObjectURL(
                    file
                )


            setSelectedImage(
                imageUrl
            )
        }
    }


    // ============================================
    // PUBLISH POST
    // ============================================

    const handlePublishPost = () => {

        if (!selectedImage) {

            return
        }


        const newPost:
            UserPost = {

            id:
                Date.now(),

            caption:
                postCaption.trim(),

            image:
                selectedImage

        }


        setUserPosts(
            previousPosts => [

                newPost,

                ...previousPosts

            ]
        )


        setPostCaption(
            ''
        )


        setSelectedImage(
            null
        )


        if (
            imageInputRef.current
        ) {

            imageInputRef
                .current
                .value = ''
        }
    }


    // ============================================
    // LIKE
    // ============================================

    const handleLike = (
        postId:
            number |
            string
    ) => {

        setLikedPosts(
            previousLikedPosts => {

                if (
                    previousLikedPosts
                        .includes(
                            postId
                        )
                ) {

                    return previousLikedPosts
                        .filter(
                            id =>
                                id !== postId
                        )
                }


                return [

                    ...previousLikedPosts,

                    postId

                ]
            }
        )
    }


    // ============================================
    // COMMENT
    // ============================================

    const handleAddComment = (
        postId:
            number |
            string
    ) => {

        const newComment =
            commentText.trim()


        if (!newComment) {

            return
        }


        setPostComments(
            previousComments => ({

                ...previousComments,

                [String(postId)]: [

                    ...(
                        previousComments[
                        String(postId)
                        ]
                        ||
                        []
                    ),

                    newComment

                ]

            })
        )


        setCommentText(
            ''
        )
    }


    // ============================================
    // USER INITIALS
    // ============================================

    const getUserInitials = (
        user: SearchUser
    ) => {

        const name =
            user.fullName
            ||
            user.username


        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word.charAt(0)
            )
            .join('')
            .toUpperCase()
    }


    return (

        <main className="dashboard-page">


            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <NavigationBar

                activePage="home"

                onHomeClick={
                    onHomeClick
                }

                onProfileClick={
                    onProfileClick
                }

                onEventsClick={
                    onEventsClick
                }

                searchArea={

                    <div className="search-wrapper">


                        <div className="dashboard-search">


                            <span>

                                ⌕

                            </span>


                            <input

                                type="text"

                                placeholder="Search creatives, collaborations and events"

                                value={
                                    searchText
                                }

                                onChange={
                                    event =>
                                        setSearchText(
                                            event.target.value
                                        )
                                }

                            />


                            {
                                searchText
                                &&
                                (

                                    <button

                                        type="button"

                                        className="clear-search"

                                        onClick={() => {

                                            setSearchText(
                                                ''
                                            )

                                            setSearchedCreatives(
                                                []
                                            )

                                            setSearchError(
                                                ''
                                            )
                                        }}

                                    >

                                        ✕

                                    </button>

                                )
                            }


                        </div>


                        {
                            searchText
                            &&
                            (

                                <div className="search-results">


                                    {/* ========================= */}
                                    {/* REAL CREATIVES */}
                                    {/* ========================= */}

                                    {
                                        isSearching
                                        &&
                                        (

                                            <div className="search-result-section">


                                                <h4>

                                                    Creatives

                                                </h4>


                                                <div className="no-search-results">

                                                    Searching...

                                                </div>


                                            </div>

                                        )
                                    }


                                    {
                                        !isSearching
                                        &&
                                        searchError
                                        &&
                                        (

                                            <div className="search-result-section">


                                                <h4>

                                                    Creatives

                                                </h4>


                                                <div className="no-search-results">

                                                    {searchError}

                                                </div>


                                            </div>

                                        )
                                    }


                                    {
                                        !isSearching
                                        &&
                                        !searchError
                                        &&
                                        searchedCreatives.length > 0
                                        &&
                                        (

                                            <div className="search-result-section">


                                                <h4>

                                                    Creatives

                                                </h4>


                                                {
                                                    searchedCreatives
                                                        .map(
                                                            creative => (

                                                                <button

                                                                    type="button"

                                                                    className="search-result-item"

                                                                    key={
                                                                        creative.userId
                                                                    }

                                                                    onClick={
                                                                        () =>
                                                                            handleCreativeClick(
                                                                                creative.userId
                                                                            )
                                                                    }

                                                                >


                                                                    {
                                                                        creative.profileImageUrl
                                                                            ? (

                                                                                <img

                                                                                    src={
                                                                                        creative.profileImageUrl
                                                                                    }

                                                                                    alt={
                                                                                        creative.username
                                                                                    }

                                                                                    className="search-result-avatar"

                                                                                    style={{
                                                                                        objectFit:
                                                                                            'cover'
                                                                                    }}

                                                                                />

                                                                            )
                                                                            : (

                                                                                <div className="search-result-avatar">

                                                                                    {
                                                                                        getUserInitials(
                                                                                            creative
                                                                                        )
                                                                                    }

                                                                                </div>

                                                                            )
                                                                    }


                                                                    <div className="search-result-info">


                                                                        <strong>

                                                                            {
                                                                                creative.fullName
                                                                                ||
                                                                                creative.username
                                                                            }

                                                                        </strong>


                                                                        <span>

                                                                            @{creative.username}

                                                                        </span>


                                                                        {
                                                                            creative.bio
                                                                            &&
                                                                            (

                                                                                <span>

                                                                                    {
                                                                                        creative.bio.length > 70
                                                                                            ? `${creative.bio.substring(0, 70)}...`
                                                                                            : creative.bio
                                                                                    }

                                                                                </span>

                                                                            )
                                                                        }


                                                                    </div>


                                                                    <span className="search-result-arrow">

                                                                        ›

                                                                    </span>


                                                                </button>

                                                            )
                                                        )
                                                }


                                            </div>

                                        )
                                    }


                                    {/* ========================= */}
                                    {/* COLLABORATIONS */}
                                    {/* ========================= */}

                                    {
                                        filteredCollaborations
                                            .length > 0
                                        &&
                                        (

                                            <div className="search-result-section">


                                                <h4>

                                                    Collaborations

                                                </h4>


                                                {
                                                    filteredCollaborations
                                                        .map(
                                                            collaboration => (

                                                                <button

                                                                    type="button"

                                                                    className="search-result-item"

                                                                    key={
                                                                        collaboration.id
                                                                    }

                                                                >


                                                                    <div className="search-result-icon">

                                                                        🤝

                                                                    </div>


                                                                    <div className="search-result-info">


                                                                        <strong>

                                                                            {
                                                                                collaboration.title
                                                                            }

                                                                        </strong>


                                                                        <span>

                                                                            {
                                                                                collaboration.description
                                                                            }

                                                                        </span>


                                                                    </div>


                                                                    <span className="search-result-arrow">

                                                                        ›

                                                                    </span>


                                                                </button>

                                                            )
                                                        )
                                                }


                                            </div>

                                        )
                                    }


                                    {/* ========================= */}
                                    {/* EVENTS */}
                                    {/* ========================= */}

                                    {
                                        filteredEvents.length > 0
                                        &&
                                        (

                                            <div className="search-result-section">


                                                <h4>

                                                    Events

                                                </h4>


                                                {
                                                    filteredEvents.map(
                                                        event => (

                                                            <button

                                                                type="button"

                                                                className="search-result-item"

                                                                key={
                                                                    event.id
                                                                }

                                                            >


                                                                <div className="search-result-icon">

                                                                    📅

                                                                </div>


                                                                <div className="search-result-info">


                                                                    <strong>

                                                                        {event.title}

                                                                    </strong>


                                                                    <span>

                                                                        {event.details}

                                                                    </span>


                                                                </div>


                                                                <span className="search-result-arrow">

                                                                    ›

                                                                </span>


                                                            </button>

                                                        )
                                                    )
                                                }


                                            </div>

                                        )
                                    }


                                    {/* ========================= */}
                                    {/* NOTHING FOUND */}
                                    {/* ========================= */}

                                    {
                                        !isSearching
                                        &&
                                        !searchError
                                        &&
                                        searchedCreatives.length === 0
                                        &&
                                        filteredCollaborations.length === 0
                                        &&
                                        filteredEvents.length === 0
                                        &&
                                        (

                                            <div className="no-search-results">


                                                <span>

                                                    ⌕

                                                </span>


                                                <strong>

                                                    No results found

                                                </strong>


                                                <p>

                                                    No creatives,
                                                    collaborations or events
                                                    match "{searchText}".

                                                </p>


                                            </div>

                                        )
                                    }


                                </div>

                            )
                        }


                    </div>

                }

            />


            {/* ================================= */}
            {/* DASHBOARD BODY */}
            {/* ================================= */}

            <section className="dashboard-container">


                {/* ================================= */}
                {/* LEFT PROFILE */}
                {/* ================================= */}

                <aside className="dashboard-left">


                    <section className="profile-card">


                        <div className="profile-cover" />


                        <div className="profile-details">


                            <div className="profile-avatar">

                                <span>

                                    PG

                                </span>

                            </div>


                            <h2>

                                Pratik Gaikwad

                            </h2>


                            <p className="profile-role">

                                Creative Professional

                            </p>


                            <p className="profile-location">

                                Adelaide,
                                South Australia

                            </p>


                        </div>


                        <div className="profile-stats">


                            <div>

                                <span>

                                    Profile Views

                                </span>

                                <strong>

                                    24

                                </strong>

                            </div>


                            <div>

                                <span>

                                    Connections

                                </span>

                                <strong>

                                    18

                                </strong>

                            </div>


                            <div>

                                <span>

                                    Posts

                                </span>

                                <strong>

                                    6

                                </strong>

                            </div>


                        </div>


                        <div className="profile-links">


                            <button
                                type="button"
                                onClick={
                                    onProfileClick
                                }
                            >

                                👤 View My Profile

                            </button>


                            <button
                                type="button"
                            >

                                🎨 My Portfolio

                            </button>


                            <button
                                type="button"
                                onClick={
                                    onEventsClick
                                }
                            >

                                📅 My Events

                            </button>


                            <button
                                type="button"
                            >

                                🔖 Saved Items

                            </button>


                        </div>


                    </section>


                </aside>


                {/* ================================= */}
                {/* CENTRE FEED */}
                {/* ================================= */}

                <section className="dashboard-feed">


                    {/* POST COMPOSER */}

                    <section className="create-post-card">


                        <div className="create-post-top">


                            <div className="small-avatar">

                                <span>

                                    PG

                                </span>

                            </div>


                            <input

                                type="text"

                                className="start-post-button"

                                placeholder="Share your creative work or update..."

                                value={
                                    postCaption
                                }

                                onChange={
                                    event =>
                                        setPostCaption(
                                            event.target.value
                                        )
                                }

                            />


                        </div>


                        <input

                            ref={
                                imageInputRef
                            }

                            type="file"

                            accept="image/*"

                            style={{
                                display:
                                    'none'
                            }}

                            onChange={
                                handleImageSelect
                            }

                        />


                        {
                            selectedImage
                            &&
                            (

                                <div className="selected-image-preview">


                                    <img

                                        src={
                                            selectedImage
                                        }

                                        alt="Selected post preview"

                                    />


                                    <button

                                        type="button"

                                        className="remove-selected-image"

                                        onClick={
                                            () =>
                                                setSelectedImage(
                                                    null
                                                )
                                        }

                                        aria-label="Remove selected image"

                                    >

                                        ✕

                                    </button>


                                </div>

                            )
                        }


                        <div className="create-post-action">


                            {
                                !selectedImage
                                    ? (

                                        <button

                                            type="button"

                                            className="add-post-button"

                                            onClick={
                                                () =>
                                                    imageInputRef
                                                        .current
                                                        ?.click()
                                            }

                                        >


                                            <span className="add-post-icon">

                                                +

                                            </span>


                                            <span className="add-post-text">


                                                <strong>

                                                    Create Post

                                                </strong>


                                                <small>

                                                    Share an update or image

                                                </small>


                                            </span>


                                        </button>

                                    )
                                    : (

                                        <div className="post-ready-actions">


                                            <button

                                                type="button"

                                                className="change-image-button"

                                                onClick={
                                                    () =>
                                                        imageInputRef
                                                            .current
                                                            ?.click()
                                                }

                                            >

                                                Change Image

                                            </button>


                                            <button

                                                type="button"

                                                className="publish-ready-button"

                                                onClick={
                                                    handlePublishPost
                                                }

                                            >

                                                Publish Post

                                            </button>


                                        </div>

                                    )
                            }


                        </div>


                    </section>


                    {/* ================================= */}
                    {/* USER CREATED POSTS */}
                    {/* ================================= */}

                    {
                        userPosts.map(
                            post => (

                                <article

                                    className="feed-post"

                                    key={
                                        post.id
                                    }

                                >


                                    <div className="post-header">


                                        <div className="post-avatar">

                                            <span>

                                                PG

                                            </span>

                                        </div>


                                        <div className="post-author">


                                            <strong>

                                                Pratik Gaikwad

                                            </strong>


                                            <span>

                                                Creative Professional
                                                {' • '}
                                                Adelaide

                                            </span>


                                            <small>

                                                Just now

                                            </small>


                                        </div>


                                        <button

                                            type="button"

                                            className="post-more"

                                        >

                                            •••

                                        </button>


                                    </div>


                                    <div className="post-content">


                                        {
                                            post.caption
                                            &&
                                            (

                                                <p>

                                                    {post.caption}

                                                </p>

                                            )
                                        }


                                        <img

                                            src={
                                                post.image
                                            }

                                            alt="Creative post"

                                            className="published-post-image"

                                        />


                                    </div>


                                    <div className="post-actions post-actions-two">


                                        <button

                                            type="button"

                                            className={
                                                likedPosts
                                                    .includes(
                                                        post.id
                                                    )
                                                    ? 'liked'
                                                    : ''
                                            }

                                            onClick={
                                                () =>
                                                    handleLike(
                                                        post.id
                                                    )
                                            }

                                        >

                                            {
                                                likedPosts
                                                    .includes(
                                                        post.id
                                                    )
                                                    ? '♥ Liked'
                                                    : '♡ Like'
                                            }

                                        </button>


                                        <button

                                            type="button"

                                            onClick={
                                                () =>
                                                    setOpenCommentPost(

                                                        openCommentPost
                                                            ===
                                                            post.id

                                                            ? null

                                                            : post.id

                                                    )
                                            }

                                        >

                                            💬 Comment

                                            {
                                                postComments[
                                                    String(
                                                        post.id
                                                    )
                                                ]?.length

                                                    ? ` (${postComments[String(post.id)].length})`

                                                    : ''
                                            }

                                        </button>


                                    </div>


                                    {
                                        openCommentPost
                                        ===
                                        post.id
                                        &&
                                        (

                                            <div className="comment-section">


                                                {
                                                    postComments[
                                                        String(
                                                            post.id
                                                        )
                                                    ]?.map(
                                                        (
                                                            comment,
                                                            index
                                                        ) => (

                                                            <div

                                                                className="comment-item"

                                                                key={
                                                                    index
                                                                }

                                                            >


                                                                <div className="comment-avatar">

                                                                    PG

                                                                </div>


                                                                <div className="comment-content">


                                                                    <strong>

                                                                        Pratik Gaikwad

                                                                    </strong>


                                                                    <p>

                                                                        {comment}

                                                                    </p>


                                                                </div>


                                                            </div>

                                                        )
                                                    )
                                                }


                                                <div className="comment-input-row">


                                                    <div className="comment-avatar">

                                                        PG

                                                    </div>


                                                    <input

                                                        type="text"

                                                        placeholder="Write a comment..."

                                                        value={
                                                            commentText
                                                        }

                                                        onChange={
                                                            event =>
                                                                setCommentText(
                                                                    event.target.value
                                                                )
                                                        }

                                                        onKeyDown={
                                                            event => {

                                                                if (
                                                                    event.key
                                                                    ===
                                                                    'Enter'
                                                                ) {

                                                                    handleAddComment(
                                                                        post.id
                                                                    )
                                                                }
                                                            }
                                                        }

                                                    />


                                                    <button

                                                        type="button"

                                                        onClick={
                                                            () =>
                                                                handleAddComment(
                                                                    post.id
                                                                )
                                                        }

                                                    >

                                                        Post

                                                    </button>


                                                </div>


                                            </div>

                                        )
                                    }


                                </article>

                            )
                        )
                    }


                    {/* ================================= */}
                    {/* EXAMPLE FEED POST */}
                    {/* ================================= */}

                    <article className="feed-post">


                        <div className="post-header">


                            <div className="post-avatar">

                                <span>

                                    OM

                                </span>

                            </div>


                            <div className="post-author">


                                <strong>

                                    Oliver Miller

                                </strong>


                                <span>

                                    Photographer
                                    {' • '}
                                    Adelaide

                                </span>


                                <small>

                                    2 hours ago

                                </small>


                            </div>


                            <button
                                type="button"
                                className="post-more"
                            >

                                •••

                            </button>


                        </div>


                        <div className="post-content">


                            <p>

                                Exploring Adelaide through
                                my lens. Every street,
                                colour and creative space
                                has its own story to tell.

                            </p>


                            <div className="post-media-placeholder">


                                <div className="portfolio-preview-content">


                                    <span className="portfolio-preview-icon">

                                        📷

                                    </span>


                                    <strong>

                                        Creative Portfolio

                                    </strong>


                                    <span>

                                        Photography
                                        {' • '}
                                        Adelaide

                                    </span>


                                </div>


                            </div>


                        </div>


                        <div className="post-actions post-actions-two">


                            <button

                                type="button"

                                className={
                                    likedPosts.includes(
                                        'oliver-post'
                                    )
                                        ? 'liked'
                                        : ''
                                }

                                onClick={
                                    () =>
                                        handleLike(
                                            'oliver-post'
                                        )
                                }

                            >

                                {
                                    likedPosts.includes(
                                        'oliver-post'
                                    )
                                        ? '♥ Liked'
                                        : '♡ Like'
                                }

                            </button>


                            <button

                                type="button"

                                onClick={
                                    () =>
                                        setOpenCommentPost(

                                            openCommentPost
                                                ===
                                                'oliver-post'

                                                ? null

                                                : 'oliver-post'

                                        )
                                }

                            >

                                💬 Comment

                                {
                                    postComments[
                                        'oliver-post'
                                    ]?.length

                                        ? ` (${postComments['oliver-post'].length})`

                                        : ''
                                }

                            </button>


                        </div>


                        {
                            openCommentPost
                            ===
                            'oliver-post'
                            &&
                            (

                                <div className="comment-section">


                                    {
                                        postComments[
                                            'oliver-post'
                                        ]?.map(
                                            (
                                                comment,
                                                index
                                            ) => (

                                                <div

                                                    className="comment-item"

                                                    key={
                                                        index
                                                    }

                                                >


                                                    <div className="comment-avatar">

                                                        PG

                                                    </div>


                                                    <div className="comment-content">


                                                        <strong>

                                                            Pratik Gaikwad

                                                        </strong>


                                                        <p>

                                                            {comment}

                                                        </p>


                                                    </div>


                                                </div>

                                            )
                                        )
                                    }


                                    <div className="comment-input-row">


                                        <div className="comment-avatar">

                                            PG

                                        </div>


                                        <input

                                            type="text"

                                            placeholder="Write a comment..."

                                            value={
                                                commentText
                                            }

                                            onChange={
                                                event =>
                                                    setCommentText(
                                                        event.target.value
                                                    )
                                            }

                                            onKeyDown={
                                                event => {

                                                    if (
                                                        event.key
                                                        ===
                                                        'Enter'
                                                    ) {

                                                        handleAddComment(
                                                            'oliver-post'
                                                        )
                                                    }
                                                }
                                            }

                                        />


                                        <button

                                            type="button"

                                            onClick={
                                                () =>
                                                    handleAddComment(
                                                        'oliver-post'
                                                    )
                                            }

                                        >

                                            Post

                                        </button>


                                    </div>


                                </div>

                            )
                        }


                    </article>


                </section>


                {/* ================================= */}
                {/* RIGHT DISCOVERY */}
                {/* ================================= */}

                <aside className="dashboard-right">





                    {/* ================================= */}
                    {/* SUGGESTED CREATIVES */}
                    {/* ================================= */}

                    <section className="discovery-card">


                        <div className="card-heading">


                            <h3>

                                Suggested Creatives

                            </h3>


                            <button
                                type="button"
                            >

                            </button>


                        </div>


                        {/* ================================= */}
                        {/* LOADING */}
                        {/* ================================= */}

                        {
                            suggestionsLoading
                            &&
                            (

                                <p>

                                    Loading creatives...

                                </p>

                            )
                        }


                        {/* ================================= */}
                        {/* NO USERS */}
                        {/* ================================= */}

                        {
                            !suggestionsLoading
                            &&
                            suggestedUsers.length === 0
                            &&
                            (

                                <p>

                                    No suggested creatives available.

                                </p>

                            )
                        }


                        {/* ================================= */}
                        {/* REAL USERS */}
                        {/* ================================= */}

                        {
                            !suggestionsLoading
                            &&
                            suggestedUsers.map(
                                user => (

                                    <div

                                        className="creative-person"

                                        key={
                                            user.userId
                                        }

                                    >


                                        {/* ============================= */}
                                        {/* PROFILE IMAGE */}
                                        {/* ============================= */}

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

                                                        className="small-avatar"

                                                        style={{
                                                            objectFit:
                                                                'cover'
                                                        }}

                                                    />

                                                )
                                                : (

                                                    <div className="small-avatar">


                                                        <span>

                                                            {
                                                                getUserInitials(
                                                                    user
                                                                )
                                                            }

                                                        </span>


                                                    </div>

                                                )
                                        }


                                        {/* ============================= */}
                                        {/* USER DETAILS */}
                                        {/* ============================= */}

                                        <div>


                                            <strong>

                                                {
                                                    user.fullName
                                                    ||
                                                    user.username
                                                }

                                            </strong>


                                            <span>

                                                @{user.username}

                                            </span>


                                            {/* ========================= */}
                                            {/* USER SKILLS */}
                                            {/* ========================= */}

                                            {
                                                user.skills
                                                &&
                                                (

                                                    <small
                                                        style={{
                                                            display:
                                                                'block'
                                                        }}
                                                    >

                                                        {
                                                            user.skills.length > 35
                                                                ? `${user.skills.substring(0, 35)}...`
                                                                : user.skills
                                                        }

                                                    </small>

                                                )
                                            }


                                            {/* ========================= */}
                                            {/* MATCHED SKILLS */}
                                            {/* ========================= */}

                                            {
                                                user.matchedSkills
                                                &&
                                                user.matchedSkills.length > 0
                                                &&
                                                (

                                                    <small
                                                        style={{
                                                            display:
                                                                'block',

                                                            marginTop:
                                                                '4px',

                                                            fontWeight:
                                                                600
                                                        }}
                                                    >

                                                        Matched: {
                                                            user.matchedSkills
                                                                .join(', ')
                                                        }

                                                    </small>

                                                )
                                            }


                                        </div>


                                        {/* ============================= */}
                                        {/* OPEN PUBLIC PROFILE */}
                                        {/* ============================= */}

                                        <button

                                            type="button"

                                            className="follow-button"

                                            onClick={
                                                () =>
                                                    onUserClick(
                                                        user.userId
                                                    )
                                            }

                                        >

                                            View

                                        </button>


                                    </div>

                                )
                            )
                        }


                    </section>


                    {/* COLLABORATIONS */}

                    <section className="discovery-card">


                        <div className="card-heading">


                            <h3>

                                Collaboration Opportunities

                            </h3>


                            <button
                                type="button"
                            >

                                View All

                            </button>


                        </div>


                        <div className="discovery-item">


                            <span>

                                📷

                            </span>


                            <div>

                                <strong>

                                    Music Video Production

                                </strong>

                                <p>

                                    Looking for a creative
                                    video editor.

                                </p>

                            </div>


                        </div>


                        <div className="discovery-item">


                            <span>

                                🎨

                            </span>


                            <div>

                                <strong>

                                    Brand Campaign Design

                                </strong>

                                <p>

                                    Graphic designer required
                                    for a new campaign.

                                </p>

                            </div>


                        </div>


                    </section>


                    {/* EVENTS */}

                    <section className="discovery-card">


                        <div className="card-heading">


                            <h3>

                                Upcoming Events

                            </h3>


                            <button
                                type="button"
                                onClick={
                                    onEventsClick
                                }
                            >

                                View All

                            </button>


                        </div>


                        <div className="discovery-item">


                            <span>

                                📅

                            </span>


                            <div>

                                <strong>

                                    Creative Networking Meetup

                                </strong>

                                <p>

                                    24 Sep
                                    {' • '}
                                    Adelaide
                                    {' • '}
                                    In-person

                                </p>

                            </div>


                        </div>


                        <div className="discovery-item">


                            <span>

                                💻

                            </span>


                            <div>

                                <strong>

                                    Digital Art Workshop

                                </strong>

                                <p>

                                    10 Oct
                                    {' • '}
                                    Online

                                </p>

                            </div>


                        </div>


                    </section>


                </aside>


            </section>


            {/* ================================= */}
            {/* FOOTER */}
            {/* ================================= */}

            <footer className="dashboard-footer">


                <div className="footer-links">


                    <button type="button">
                        About
                    </button>


                    <button type="button">
                        Privacy
                    </button>


                    <button type="button">
                        Safety
                    </button>


                    <button type="button">
                        Terms
                    </button>


                    <button type="button">
                        Help
                    </button>


                </div>


                <p>

                    © 2026 Professional Creative
                    Collaboration Network

                </p>


            </footer>


        </main>
    )
}


export default Dashboard