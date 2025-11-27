import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, Timestamp, updateDoc, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import type { Screen } from '../App'
import { IoChevronBack } from 'react-icons/io5'
import { getUserLocation, formatDistance, type UserLocation } from '../utils/geolocation'
import { fetchWellnessEvents, type ScrapedEvent } from '../utils/eventsAPI'
import { fetchYogaCenters, fetchReligiousPlaces, fetchMeditationCenters, type Place } from '../utils/googlePlacesAPI'
import { getLocalitiesForCity } from '../utils/cityLocalities'

interface SharingScreenProps {
  onNavigate: (screen: Screen) => void
}

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: string
  isOwn: boolean
}

interface ChatConversation {
  id: string
  participant: string
  lastMessage: string
  timestamp: string
  unread: number
  messages: ChatMessage[]
}

interface ForumReply {
  id: string
  content: string
  authorId: string
  authorName: string
  timestamp: Timestamp
  likes: number
  likedBy: string[]
}

interface ForumPost {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  timestamp: Timestamp
  tags: string[]
  likes: number
  likedBy: string[]
  replies: ForumReply[]
}

interface Event {
  id: string
  title: string
  address: string
  city: string
  dateTime: Date
  creatorId: string
  creatorName: string
  createdAt: Date
}

// Major cities in India
const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot'
]


// Mock data for chat conversations
const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: '1',
    participant: 'Alex',
    lastMessage: 'Thanks for sharing your experience with meditation...',
    timestamp: '2 min ago',
    unread: 1,
    messages: [
      { id: '1', sender: 'Alex', message: 'Hi! I saw your post about anxiety management. I\'ve been struggling with similar issues.', timestamp: '10:30 AM', isOwn: false },
      { id: '2', sender: 'You', message: 'Hey Alex! I\'m glad you reached out. What techniques have you tried so far?', timestamp: '10:32 AM', isOwn: true },
      { id: '3', sender: 'Alex', message: 'I\'ve tried breathing exercises but find it hard to stay consistent. Any tips?', timestamp: '10:35 AM', isOwn: false },
      { id: '4', sender: 'You', message: 'I found that setting a daily reminder really helped. Start with just 5 minutes.', timestamp: '10:37 AM', isOwn: true },
      { id: '5', sender: 'Alex', message: 'Thanks for sharing your experience with meditation...', timestamp: '10:40 AM', isOwn: false },
    ]
  },
  {
    id: '2',
    participant: 'Jordan',
    lastMessage: 'That\'s a great perspective on self-care',
    timestamp: '1 hour ago',
    unread: 0,
    messages: [
      { id: '1', sender: 'Jordan', message: 'Your journal entry about self-compassion really resonated with me.', timestamp: '9:15 AM', isOwn: false },
      { id: '2', sender: 'You', message: 'Thank you! It took me a while to learn to be kinder to myself.', timestamp: '9:20 AM', isOwn: true },
      { id: '3', sender: 'Jordan', message: 'That\'s a great perspective on self-care', timestamp: '9:25 AM', isOwn: false },
    ]
  },
  {
    id: '3',
    participant: 'Sam',
    lastMessage: 'How do you handle work stress?',
    timestamp: '3 hours ago',
    unread: 2,
    messages: [
      { id: '1', sender: 'Sam', message: 'I noticed you mentioned work-life balance. How do you handle work stress?', timestamp: '7:30 AM', isOwn: false },
    ]
  }
]

// Mock data for forum posts
// Helper to format timestamp
const formatTimeAgo = (timestamp: Timestamp | undefined) => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export default function SharingScreen({ onNavigate }: SharingScreenProps) {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'chat' | 'forum' | 'events'>('forum')
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostTags, setNewPostTags] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // Events state
  const [selectedCity, setSelectedCity] = useState<string>('Mumbai')
  const [selectedLocality, setSelectedLocality] = useState<string>('')
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventAddress, setNewEventAddress] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventTime, setNewEventTime] = useState('')

  // Places state
  const [yogaCenters, setYogaCenters] = useState<Place[]>([])
  const [religiousPlaces, setReligiousPlaces] = useState<Place[]>([])
  const [meditationCenters, setMeditationCenters] = useState<Place[]>([])
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'yoga' | 'religious' | 'meditation' | null>(null)
  const [placesError, setPlacesError] = useState<string | null>(null)

  // Real events from scraping
  const [scrapedEvents, setScrapedEvents] = useState<ScrapedEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [conversations] = useState<ChatConversation[]>(MOCK_CONVERSATIONS)
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])

  // Fetch forum posts
  useEffect(() => {
    // Removing orderBy temporarily to avoid index creation issues during development
    // and sorting client-side instead
    const q = query(collection(db, 'forum_posts'))

    console.log("Setting up Firestore listener for forum_posts...")

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Snapshot received!", {
        size: snapshot.size,
        empty: snapshot.empty,
        metadata: {
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites
        }
      })

      try {
        const posts: ForumPost[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          posts.push({
            id: doc.id,
            ...data,
            // Ensure arrays exist to prevent crashes
            likedBy: data.likedBy || [],
            replies: data.replies || [],
            tags: data.tags || []
          } as ForumPost)
        })

        console.log("Parsed posts:", posts.length)

        // Sort client-side by timestamp desc
        posts.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0
          const timeB = b.timestamp?.seconds || 0
          return timeB - timeA
        })

        setForumPosts(posts)
      } catch (error) {
        console.error("Error processing forum posts:", error)
      }
    }, (error) => {
      console.error("Error fetching forum posts:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
    })

    return () => {
      console.log("Unsubscribing from forum_posts")
      unsubscribe()
    }
  }, [])

  // Fetch events for selected city
  useEffect(() => {
    console.log('Fetching events for city:', selectedCity)

    // Clear events first to ensure fresh data
    setEvents([])

    const eventsRef = collection(db, 'events')
    const q = query(eventsRef, where('city', '==', selectedCity))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: Event[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Event data:', data.title, 'City:', data.city)
        fetchedEvents.push({
          id: doc.id,
          title: data.title,
          address: data.address,
          city: data.city,
          dateTime: data.dateTime.toDate(),
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          createdAt: data.createdAt.toDate()
        })
      })
      console.log('Total events fetched:', fetchedEvents.length)
      setEvents(fetchedEvents)
    }, (error) => {
      console.error('Error fetching events:', error)
    })

    return () => {
      console.log('Cleaning up listener for city:', selectedCity)
      unsubscribe()
    }
  }, [selectedCity])

  // Auto-delete expired events
  useEffect(() => {
    const checkAndDeleteExpiredEvents = async () => {
      const now = new Date()
      events.forEach(async (event) => {
        if (event.dateTime < now) {
          try {
            await deleteDoc(doc(db, 'events', event.id))
          } catch (error) {
            console.error('Error deleting expired event:', error)
          }
        }
      })
    }

    const interval = setInterval(checkAndDeleteExpiredEvents, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [events])

  // Get user location when Events tab is opened
  useEffect(() => {
    // Disabled auto-detection - users should manually select their city
    // This improves privacy and gives users control over location data
    if (activeTab === 'events') {
      console.log('Events tab opened. User should select city manually.')
    }
  }, [activeTab])

  // Fetch scraped events when city changes or Events tab is opened
  useEffect(() => {
    if (activeTab === 'events') {
      console.log('Fetching wellness events for:', selectedCity)
      setIsLoadingEvents(true)

      fetchWellnessEvents(
        selectedCity,
        userLocation?.latitude,
        userLocation?.longitude
      )
        .then((response) => {
          console.log('Fetched events:', response.count)
          if (response.success) {
            setScrapedEvents(response.events)
          } else {
            console.error('Failed to fetch events:', response.error)
            setScrapedEvents([])
          }
        })
        .catch((error) => {
          console.error('Error fetching events:', error)
          setScrapedEvents([])
        })
        .finally(() => {
          setIsLoadingEvents(false)
        })
    }
  }, [activeTab, selectedCity, userLocation])

  // Fetch places when locality or category changes
  useEffect(() => {
    if (!selectedLocality || !activeCategory) {
      return
    }

    const fetchPlaces = async () => {
      setIsLoadingPlaces(true)
      setPlacesError(null)
      try {
        if (activeCategory === 'yoga') {
          const response = await fetchYogaCenters(selectedCity, selectedLocality)
          if (response.success) {
            setYogaCenters(response.places)
            setPlacesError(null)
          } else {
            setYogaCenters([])
            setPlacesError(response.error || 'Failed to load yoga centers')
          }
        } else if (activeCategory === 'religious') {
          const response = await fetchReligiousPlaces(selectedCity, selectedLocality)
          if (response.success) {
            setReligiousPlaces(response.places)
            setPlacesError(null)
          } else {
            setReligiousPlaces([])
            setPlacesError(response.error || 'Failed to load religious places')
          }
        } else if (activeCategory === 'meditation') {
          const response = await fetchMeditationCenters(selectedCity)
          if (response.success) {
            setMeditationCenters(response.places)
            setPlacesError(null)
          } else {
            setMeditationCenters([])
            setPlacesError(response.error || 'Failed to load meditation centers')
          }
        }
      } catch (error) {
        console.error('Error fetching places:', error)
        setPlacesError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setIsLoadingPlaces(false)
      }
    }

    fetchPlaces()
  }, [selectedLocality, activeCategory, selectedCity])

  // Reset locality when city changes
  useEffect(() => {
    setSelectedLocality('')
    setActiveCategory(null)
    setYogaCenters([])
    setReligiousPlaces([])
    setMeditationCenters([])
    setPlacesError(null)
  }, [selectedCity])

  const handleCreateEvent = async () => {
    if (!currentUser) {
      alert('Please log in to create events')
      return
    }

    if (!newEventTitle.trim() || !newEventAddress.trim() || !newEventDate || !newEventTime) {
      alert('Please fill in all fields')
      return
    }

    try {
      const dateTimeString = `${newEventDate}T${newEventTime}`
      const eventDateTime = new Date(dateTimeString)

      if (eventDateTime <= new Date()) {
        alert('Event date and time must be in the future')
        return
      }

      await addDoc(collection(db, 'events'), {
        title: newEventTitle.trim(),
        address: newEventAddress.trim(),
        city: selectedCity,
        dateTime: Timestamp.fromDate(eventDateTime),
        creatorId: currentUser.uid,
        creatorName: currentUser.displayName || currentUser.email || 'Anonymous',
        createdAt: Timestamp.now()
      })

      // Clear form and close modal
      setNewEventTitle('')
      setNewEventAddress('')
      setNewEventDate('')
      setNewEventTime('')
      setShowNewEvent(false)

    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    }
  }

  const handleLikePost = async (post: ForumPost) => {
    if (!currentUser) {
      alert('Please log in to like posts')
      return
    }
    const postRef = doc(db, 'forum_posts', post.id)
    const isLiked = post.likedBy.includes(currentUser.uid)

    try {
      await updateDoc(postRef, {
        likes: isLiked ? post.likes - 1 : post.likes + 1,
        likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
      })
    } catch (error) {
      console.error('Error updating like:', error)
    }
  }

  const handleLikeReply = async (post: ForumPost, reply: ForumReply) => {
    if (!currentUser) {
      alert('Please log in to like replies')
      return
    }
    const postRef = doc(db, 'forum_posts', post.id)
    const isLiked = reply.likedBy.includes(currentUser.uid)

    const updatedReplies = post.replies.map(r => {
      if (r.id === reply.id) {
        return {
          ...r,
          likes: isLiked ? r.likes - 1 : r.likes + 1,
          likedBy: isLiked ? r.likedBy.filter(id => id !== currentUser.uid) : [...r.likedBy, currentUser.uid]
        }
      }
      return r
    })

    try {
      await updateDoc(postRef, { replies: updatedReplies })
    } catch (error) {
      console.error('Error updating reply like:', error)
    }
  }

  const handleCreatePost = async () => {
    console.log('handleCreatePost called')
    console.log('Current user:', currentUser)

    if (!currentUser) {
      alert('Please log in to create a post')
      return
    }

    console.log('Post data:', {
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      tags: newPostTags
    })

    if (newPostTitle.trim() && newPostContent.trim()) {
      try {
        console.log('Attempting to create post in Firestore...')
        const docRef = await addDoc(collection(db, 'forum_posts'), {
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          authorId: currentUser.uid,
          authorName: currentUser.displayName || 'Anonymous',
          timestamp: Timestamp.now(),
          tags: newPostTags.split(',').map(tag => tag.trim()).filter(tag => tag),
          likes: 0,
          likedBy: [],
          replies: []
        })
        console.log('✅ Post created successfully! Doc ID:', docRef.id)

        setNewPostTitle('')
        setNewPostContent('')
        setNewPostTags('')
        setShowNewPost(false)
      } catch (error) {
        console.error('❌ Error creating post:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        alert('Failed to create post: ' + error.message)
      }
    } else {
      console.warn('Title or content is empty')
      alert('Please fill in both title and content')
    }
  }

  const handleReplyPost = async (postId: string) => {
    if (!currentUser) {
      alert('Please log in to reply')
      return
    }
    if (!replyContent.trim()) return

    const postRef = doc(db, 'forum_posts', postId)
    const newReply: ForumReply = {
      id: Date.now().toString(),
      content: replyContent.trim(),
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonymous',
      timestamp: Timestamp.now(),
      likes: 0,
      likedBy: []
    }

    try {
      await updateDoc(postRef, {
        replies: arrayUnion(newReply)
      })
      setReplyContent('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error replying:', error)
      alert('Failed to reply')
    }
  }

  // Chat interface
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 relative pb-20 flex flex-col">
        {/* Chat Header */}
        <div className="px-4 pt-12 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ←
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                👤
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedChat.participant}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Available for support</span>
                  <button className="text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-4">
            {selectedChat.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm mr-3 mt-1 flex-shrink-0">
                    👤
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${message.isOwn
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${message.isOwn ? 'text-white/80' : 'text-gray-500'}`}>
                    {message.timestamp}
                  </p>
                </div>
                {message.isOwn && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm ml-3 mt-1 flex-shrink-0">
                    👤
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-full flex items-center px-4 py-3">
            <input
              type="text"
              placeholder="Ask anything"
              className="flex-1 px-2 py-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-sm"
            />
            <button className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors ml-2 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => onNavigate('home')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <IoChevronBack className="w-6 h-6 text-gray-700" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Sharing</h1>
          <p className="text-sm text-gray-500">Connect with the community</p>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="px-4 pb-32 overflow-y-auto" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('forum')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'forum'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Forum
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'chat'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Support Chat
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Events
            </button>
          </div>
        </div>

        {/* Forum Tab */}
        {activeTab === 'forum' && (
          <div>
            {/* Forum Posts */}
            <div className="space-y-4">
              {forumPosts.map((post) => {
                const isLiked = currentUser ? post.likedBy.includes(currentUser.uid) : false
                return (
                  <div key={post.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{post.authorName}</span>
                            <span className="text-gray-500 text-sm ml-2">{formatTimeAgo(post.timestamp)}</span>
                          </div>
                          <button
                            onClick={() => handleLikePost(post)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                              }`}
                          >
                            <span>{isLiked ? '❤️' : '🤍'}</span>
                            <span>{post.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="ml-13">
                      <h3 className="font-medium text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{post.content}</p>
                    </div>

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 ml-13">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Replies */}
                    {post.replies.length > 0 && (
                      <div className="border-t border-gray-100 mt-4 pt-4 space-y-3">
                        {post.replies.map((reply) => {
                          const isReplyLiked = currentUser ? reply.likedBy.includes(currentUser.uid) : false
                          return (
                            <div key={reply.id} className="bg-white border border-gray-100 p-3 rounded-xl ml-13 shadow-sm">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                    👤
                                  </div>
                                  <span className="font-medium text-gray-900 text-sm">{reply.authorName}</span>
                                  <span className="text-gray-500 text-xs">{formatTimeAgo(reply.timestamp)}</span>
                                </div>
                                <button
                                  onClick={() => handleLikeReply(post, reply)}
                                  className={`flex items-center space-x-1 text-xs ${isReplyLiked ? 'text-rose-400' : 'text-gray-400 hover:text-rose-400'
                                    }`}
                                >
                                  <span>{isReplyLiked ? '❤️' : '🤍'}</span>
                                  <span>{reply.likes}</span>
                                </button>
                              </div>
                              <p className="text-gray-600 text-sm">{reply.content}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Reply Button & Input */}
                    <div className="mt-3 ml-13">
                      {replyingTo === post.id ? (
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-purple-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleReplyPost(post.id)}
                            disabled={!replyContent.trim()}
                            className="p-2 bg-purple-500 text-white rounded-full disabled:opacity-50 hover:bg-purple-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent('')
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(post.id)}
                          className="text-sm text-gray-500 hover:text-purple-600 font-medium flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span>Reply</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="pb-6">
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedChat(conversation)}
                  className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                        👤
                      </div>
                      {conversation.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conversation.unread}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{conversation.participant}</h4>
                        <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Post</h3>

              <input
                type="text"
                placeholder="Post title..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:border-purple-500"
              />

              <textarea
                placeholder="Share your thoughts, experiences, or questions..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:border-purple-500 resize-none"
              />

              <input
                type="text"
                placeholder="Tags (separate with commas)"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-purple-500"
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewPost(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {/* City Selector */}
            <div className="mb-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-4">
              <label className="block text-gray-900 text-sm font-semibold mb-2">
                📍 Choose Your City
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Select your city to see local wellness events and connect with nearby community members
              </p>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23374151\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                  appearance: 'none'
                }}
              >
                {INDIAN_CITIES.map((city) => (
                  <option key={city} value={city} className="bg-white text-gray-900">
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Locality Selector */}
            <div className="mb-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-4">
              <label className="block text-gray-900 text-sm font-semibold mb-2">
                🏘️ Choose Your Locality
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Select your area to discover nearby yoga centers, temples, and meditation organizations
              </p>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23374151\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                  appearance: 'none'
                }}
              >
                <option value="">Select a locality</option>
                {getLocalitiesForCity(selectedCity).map((locality) => (
                  <option key={locality} value={locality} className="bg-white text-gray-900">
                    {locality}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            {selectedLocality && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-3 px-1">
                  🔍 Explore Nearby Places
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveCategory(activeCategory === 'yoga' ? null : 'yoga')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === 'yoga'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    🧘 Yoga & Meditation Centers
                  </button>
                  <button
                    onClick={() => setActiveCategory(activeCategory === 'religious' ? null : 'religious')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === 'religious'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    🕉️ Religious Places
                  </button>
                  <button
                    onClick={() => setActiveCategory(activeCategory === 'meditation' ? null : 'meditation')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === 'meditation'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    🙏 Major Meditation Organizations
                  </button>
                </div>
              </div>
            )}

            {/* Places Display */}
            {selectedLocality && activeCategory && (
              <div className="mb-6">
                {placesError && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⚠️</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 mb-1">Error Loading Places</h4>
                        <p className="text-sm text-red-700">{placesError}</p>
                        <button
                          onClick={() => {
                            setPlacesError(null)
                            setActiveCategory(null)
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {isLoadingPlaces ? (
                  <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Finding places in {selectedLocality}...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeCategory === 'yoga' && yogaCenters.length > 0 && (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">
                          🧘 Yoga & Meditation Centers
                        </h3>
                        {yogaCenters.map((place, index) => (
                          <div
                            key={`yoga-${index}`}
                            className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl p-4 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 flex-1 pr-2">{place.name}</h4>
                              {place.rating && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">
                                  ⭐ {place.rating}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-start text-gray-700">
                                <span className="mr-2">📍</span>
                                <span className="flex-1">{place.address}</span>
                              </div>
                              {place.distance && (
                                <div className="flex items-center text-green-600 font-medium">
                                  <span className="mr-2">🚶</span>
                                  <span>{formatDistance(place.distance)}</span>
                                </div>
                              )}
                              {place.phone && (
                                <div className="flex items-center text-gray-700">
                                  <span className="mr-2">📞</span>
                                  <a href={`tel:${place.phone}`} className="text-purple-600 hover:underline">
                                    {place.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {activeCategory === 'religious' && religiousPlaces.length > 0 && (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">
                          🕉️ Religious Places
                        </h3>
                        {religiousPlaces.map((place, index) => (
                          <div
                            key={`religious-${index}`}
                            className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 flex-1 pr-2">{place.name}</h4>
                              {place.rating && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full whitespace-nowrap">
                                  ⭐ {place.rating}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-start text-gray-700">
                                <span className="mr-2">📍</span>
                                <span className="flex-1">{place.address}</span>
                              </div>
                              {place.distance && (
                                <div className="flex items-center text-orange-600 font-medium">
                                  <span className="mr-2">🚶</span>
                                  <span>{formatDistance(place.distance)}</span>
                                </div>
                              )}
                              <div className="flex items-center text-gray-700">
                                <span className="mr-2">🏛️</span>
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                  {place.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {activeCategory === 'meditation' && meditationCenters.length > 0 && (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">
                          🙏 Major Meditation Organizations
                        </h3>
                        {meditationCenters.map((place, index) => (
                          <div
                            key={`meditation-${index}`}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 flex-1 pr-2">{place.name}</h4>
                              {place.rating && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full whitespace-nowrap">
                                  ⭐ {place.rating}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-start text-gray-700">
                                <span className="mr-2">📍</span>
                                <span className="flex-1">{place.address}</span>
                              </div>
                              {place.distance && (
                                <div className="flex items-center text-purple-600 font-medium">
                                  <span className="mr-2">🚶</span>
                                  <span>{formatDistance(place.distance)}</span>
                                </div>
                              )}
                              {place.website && (
                                <div className="flex items-center text-gray-700">
                                  <span className="mr-2">🌐</span>
                                  <a 
                                    href={place.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:underline text-xs"
                                  >
                                    Visit Website
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Empty State */}
                    {((activeCategory === 'yoga' && yogaCenters.length === 0) ||
                      (activeCategory === 'religious' && religiousPlaces.length === 0) ||
                      (activeCategory === 'meditation' && meditationCenters.length === 0)) && (
                      <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 text-center text-gray-900">
                        <div className="text-5xl mb-3">🔍</div>
                        <h3 className="font-semibold mb-2">No Places Found</h3>
                        <p className="text-gray-600 text-sm">
                          We couldn't find any {activeCategory === 'yoga' ? 'yoga centers' : activeCategory === 'religious' ? 'religious places' : 'meditation centers'} in {selectedLocality}.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Development Mode Notice */}
            {import.meta.env.DEV && !isLoadingEvents && scrapedEvents.length === 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  ℹ️ Development Mode
                </p>
                <p className="text-xs text-blue-600">
                  Real event scraping works only in production. Deploy to Vercel to see wellness events from BookMyShow & District.in.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoadingEvents && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Finding wellness events in {selectedCity}...</p>
              </div>
            )}

            {/* Scraped Events Section */}
            {!isLoadingEvents && scrapedEvents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">
                  🌟 Wellness Events Nearby
                </h3>
                <div className="space-y-3">
                  {scrapedEvents.map((event, index) => (
                    <a
                      key={`scraped-${index}`}
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex-1 pr-2">{event.title}</h4>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full whitespace-nowrap">
                          {event.source}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-start text-gray-700">
                          <span className="mr-2">📍</span>
                          <span className="flex-1">{event.venue}</span>
                        </div>

                        {event.distance && (
                          <div className="flex items-center text-purple-600 font-medium">
                            <span className="mr-2">🚶</span>
                            <span>{formatDistance(event.distance)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-gray-500">{event.date}</span>
                          <span className="text-xs text-purple-600 font-medium">View Details →</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* User-Created Events Section */}
            <div className="space-y-4 pb-20">
              {events.length > 0 && (
                <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">
                  👥 Community Events
                </h3>
              )}

              {events.length === 0 && scrapedEvents.length === 0 && !isLoadingEvents && (
                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 text-center text-gray-900">
                  <div className="text-5xl mb-3">📅</div>
                  <h3 className="font-semibold mb-2">No Events Yet</h3>
                  <p className="text-gray-600 text-sm">Be the first to create an event in {selectedCity}!</p>
                </div>
              )}

              {events.length > 0 && events
                .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
                .map((event) => (
                  <div key={event.id} className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-5 text-gray-900">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {event.city}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <span className="mr-2">👤</span>
                          <span>Organized by {event.creatorName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start text-gray-700 text-sm">
                        <span className="mr-2">📍</span>
                        <span>{event.address}</span>
                      </div>
                      <div className="flex items-center text-gray-700 text-sm">
                        <span className="mr-2">📅</span>
                        <span>{event.dateTime.toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center text-gray-700 text-sm">
                        <span className="mr-2">🕐</span>
                        <span>{event.dateTime.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Posted {event.createdAt.toLocaleDateString()}
                      </span>
                      {currentUser && event.creatorId === currentUser.uid && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Your Event
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 text-gray-900">
              <h3 className="text-sm font-semibold mb-2">💡 About Events</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <p>• Connect with others in your city for real-life meetups</p>
                <p>• Share mental wellness activities and group sessions</p>
                <p>• Events automatically expire after the scheduled time</p>
              </div>
            </div>

            {/* Floating Add Button */}
            <button
              onClick={() => setShowNewEvent(true)}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 bg-primary-purple text-white rounded-full shadow-lg hover:bg-primary-purple/90 transition-all hover:scale-110 flex items-center justify-center text-3xl font-light z-40 leading-none"
              style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)' }}
            >
              <span className="block leading-none">+</span>
            </button>

            {/* New Event Modal */}
            {showNewEvent && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white/95 rounded-2xl w-full max-w-sm p-5 backdrop-blur-md max-h-[90vh] overflow-y-auto">
                  <h3 className="text-base font-semibold mb-3">Create New Event</h3>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Event Title</label>
                      <input
                        type="text"
                        placeholder="E.g., Meditation Group Session"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-purple"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        placeholder="Full address with landmarks"
                        value={newEventAddress}
                        onChange={(e) => setNewEventAddress(e.target.value)}
                        rows={2}
                        className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-purple resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                      <div className="px-2.5 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                        {selectedCity}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-purple"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-purple"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => {
                        setShowNewEvent(false)
                        setNewEventTitle('')
                        setNewEventAddress('')
                        setNewEventDate('')
                        setNewEventTime('')
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateEvent}
                      className="flex-1 py-2 px-4 bg-primary-purple text-white rounded-lg hover:bg-primary-purple/90 transition-colors"
                    >
                      Create Event
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Share Experience Button above navbar */}
      {activeTab === 'forum' && (
        <div className="fixed left-6 right-6 bottom-24 z-50 max-w-sm mx-auto">
          <button
            onClick={() => setShowNewPost(true)}
            className="w-full py-3 px-6 bg-purple-500 text-white rounded-2xl font-medium shadow-lg hover:bg-purple-600 transition-colors text-sm"
          >
            Share your Experience
          </button>
        </div>
      )}
    </div>
  )
}
