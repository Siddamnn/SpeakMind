import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, Timestamp, updateDoc, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import type { Screen } from '../App'
import { IoChevronBack } from 'react-icons/io5'
import { getUserLocation, formatDistance, type UserLocation } from '../utils/geolocation'
import { fetchWellnessEvents, type ScrapedEvent } from '../utils/eventsAPI'

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
  imageUrl?: string // Instagram-style post image
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
const formatTimeAgo = (timestamp: Timestamp | { seconds: number; nanoseconds: number } | undefined) => {
  if (!timestamp) return ''
  
  // Handle both Firestore Timestamp and plain object with seconds
  let date: Date
  if ('toDate' in timestamp && typeof (timestamp as any).toDate === 'function') {
    date = (timestamp as Timestamp).toDate()
  } else if ('seconds' in timestamp) {
    date = new Date(timestamp.seconds * 1000)
  } else {
    return ''
  }
  
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export default function SharingScreen({ onNavigate }: SharingScreenProps) {
  const { currentUser } = useAuth()
  const { colors, isDark, colorTheme } = useTheme()
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
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventAddress, setNewEventAddress] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventTime, setNewEventTime] = useState('')

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

        // Add showcase posts with images (Instagram-style)
        const showcasePosts: ForumPost[] = [
          {
            id: 'showcase-1',
            title: 'Morning Meditation Routine',
            content: 'Starting my day with 10 minutes of mindfulness meditation has completely transformed my mental clarity. The peace I feel is indescribable. 🌅✨ #meditation #mindfulness #wellness',
            authorId: 'showcase-user-1',
            authorName: 'Sarah Wellness',
            timestamp: { seconds: Math.floor(Date.now() / 1000) - 3600, nanoseconds: 0 } as Timestamp,
            tags: ['meditation', 'mindfulness', 'wellness'],
            likes: 124,
            likedBy: [],
            replies: [
              {
                id: 'reply-1',
                content: 'This is so inspiring! I\'ve been trying to build a morning routine too.',
                authorId: 'user-2',
                authorName: 'Mike',
                timestamp: { seconds: Math.floor(Date.now() / 1000) - 1800, nanoseconds: 0 } as Timestamp,
                likes: 8,
                likedBy: []
              }
            ],
            imageUrl: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=2'
          },
          {
            id: 'showcase-2',
            title: 'Yoga Session in Nature',
            content: 'Nothing beats practicing yoga surrounded by nature. The fresh air, the sounds of birds, and the feeling of being grounded. This is what self-care looks like. 🧘‍♀️🌿 #yoga #nature #selfcare',
            authorId: 'showcase-user-2',
            authorName: 'Emma Yoga',
            timestamp: { seconds: Math.floor(Date.now() / 1000) - 7200, nanoseconds: 0 } as Timestamp,
            tags: ['yoga', 'nature', 'selfcare'],
            likes: 89,
            likedBy: [],
            replies: [],
            imageUrl: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=2'
          },
          {
            id: 'showcase-3',
            title: 'Gratitude Journal Entry',
            content: 'Today I\'m grateful for the small moments of peace I found throughout my busy day. Taking time to pause and breathe has made all the difference. What are you grateful for today? 🙏💙 #gratitude #journaling #mentalhealth',
            authorId: 'showcase-user-3',
            authorName: 'Alex Mindful',
            timestamp: { seconds: Math.floor(Date.now() / 1000) - 10800, nanoseconds: 0 } as Timestamp,
            tags: ['gratitude', 'journaling', 'mentalhealth'],
            likes: 156,
            likedBy: [],
            replies: [
              {
                id: 'reply-2',
                content: 'I\'m grateful for this community and all the support!',
                authorId: 'user-3',
                authorName: 'Jordan',
                timestamp: { seconds: Math.floor(Date.now() / 1000) - 9000, nanoseconds: 0 } as Timestamp,
                likes: 12,
                likedBy: []
              },
              {
                id: 'reply-3',
                content: 'Beautiful reminder to appreciate the little things.',
                authorId: 'user-4',
                authorName: 'Sam',
                timestamp: { seconds: Math.floor(Date.now() / 1000) - 8000, nanoseconds: 0 } as Timestamp,
                likes: 5,
                likedBy: []
              }
            ],
            imageUrl: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=2'
          }
        ]

        // Combine showcase posts with fetched posts
        setForumPosts([...showcasePosts, ...posts])
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

  // Theme-aware background gradients
  const getBackgroundGradient = () => {
    if (isDark) {
      const gradients: Record<string, string> = {
        purple: 'from-purple-900/30 via-indigo-900/20 to-slate-900/40',
        blue: 'from-blue-900/30 via-cyan-900/20 to-slate-900/40',
        green: 'from-emerald-900/30 via-teal-900/20 to-slate-900/40',
        orange: 'from-orange-900/30 via-amber-900/20 to-slate-900/40',
        pink: 'from-pink-900/30 via-rose-900/20 to-slate-900/40',
        indigo: 'from-indigo-900/30 via-purple-900/20 to-slate-900/40'
      }
      return gradients[colorTheme] || gradients.purple
    } else {
      const gradients: Record<string, string> = {
        purple: 'from-purple-100/80 via-pink-100/60 to-blue-100/80',
        blue: 'from-blue-100/80 via-cyan-100/60 to-sky-100/80',
        green: 'from-emerald-100/80 via-teal-100/60 to-green-100/80',
        orange: 'from-orange-100/80 via-amber-100/60 to-yellow-100/80',
        pink: 'from-pink-100/80 via-rose-100/60 to-fuchsia-100/80',
        indigo: 'from-indigo-100/80 via-purple-100/60 to-violet-100/80'
      }
      return gradients[colorTheme] || gradients.purple
    }
  }

  // Glassmorphism base styles - Enhanced borders for light theme
  const glassBase = isDark
    ? 'bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10'
    : 'bg-white/60 dark:bg-white/60 backdrop-blur-xl border-2 border-gray-200/80 dark:border-gray-200/80 shadow-sm'

  // Chat interface - Discord Style
  if (selectedChat) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} relative pb-20 flex flex-col transition-all duration-300`}>
        {/* Chat Header - Discord Style */}
        <div className={`px-4 pt-12 pb-3 ${glassBase} border-b ${isDark ? 'border-white/10' : 'border-gray-300/60'} ${isDark ? 'shadow-md' : 'shadow-lg'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedChat(null)}
              className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className={`w-10 h-10 rounded-full ${glassBase} flex items-center justify-center text-sm font-semibold shadow-sm`} style={{
              background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
              color: 'white'
            }}>
              {selectedChat.participant.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChat.participant}</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages - Discord Style */}
        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-1">
            {selectedChat.messages.map((message, index) => {
              const showAvatar = !message.isOwn && (index === 0 || selectedChat.messages[index - 1].isOwn || selectedChat.messages[index - 1].sender !== message.sender)
              const showTimestamp = index === 0 || selectedChat.messages[index - 1].timestamp !== message.timestamp
              
              return (
                <div key={message.id} className={`group flex gap-3 px-2 py-1 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100/40'} transition-colors ${message.isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar - Only show for first message or when sender changes */}
                  {!message.isOwn && (
                    <div className={`flex-shrink-0 ${showAvatar ? 'w-10' : 'w-10 invisible'}`}>
                      {showAvatar && (
                        <div className={`w-10 h-10 rounded-full ${glassBase} flex items-center justify-center text-xs font-semibold shadow-sm`} style={{
                          background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
                          color: 'white'
                        }}>
                          {message.sender.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`flex-1 min-w-0 ${message.isOwn ? 'flex flex-col items-end' : ''}`}>
                    {!message.isOwn && showAvatar && (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{message.sender}</span>
                        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{message.timestamp}</span>
                      </div>
                    )}
                    {message.isOwn && (
                      <span className={`text-[10px] mb-0.5 block ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{message.timestamp}</span>
                    )}
                    <div
                      className={`inline-block max-w-[75%] px-3 py-2 rounded-lg ${message.isOwn ? 'shadow-md' : isDark ? 'shadow-sm' : 'shadow-md'} ${message.isOwn
                        ? `text-white` 
                        : `${isDark ? glassBase : 'bg-white/70 border border-gray-200/80'} ${isDark ? 'text-gray-100' : 'text-gray-800'}`
                        }`}
                      style={message.isOwn ? {
                        background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`
                      } : {}}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.message}</p>
                    </div>
                  </div>

                  {/* Own message avatar */}
                  {message.isOwn && (
                    <div className="flex-shrink-0 w-10">
                      <div className={`w-10 h-10 rounded-full ${glassBase} flex items-center justify-center text-xs font-semibold shadow-sm`} style={{
                        background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
                        color: 'white'
                      }}>
                        {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Message Input - Discord Style */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-white/10' : 'border-gray-300/60'} ${glassBase} ${isDark ? 'shadow-lg' : 'shadow-xl'}`}>
          <div className="flex items-center gap-2">
            <div className={`flex-1 ${glassBase} rounded-lg px-4 py-2.5 shadow-sm`}>
              <input
                type="text"
                placeholder={`Message ${selectedChat.participant}...`}
                className={`w-full bg-transparent ${isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'} focus:outline-none text-sm`}
              />
            </div>
            <button className={`w-10 h-10 ${colors.gradient} text-white rounded-lg flex items-center justify-center hover:opacity-90 transition-all shadow-md flex-shrink-0`} style={{ background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)` }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} relative transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${glassBase} border-b ${isDark ? 'border-white/10' : 'border-white/20'} shadow-lg`}>
        <button
          onClick={() => onNavigate('home')}
          className={`p-2 ${glassBase} rounded-full transition-all hover:scale-110 shadow-md`}
        >
          <IoChevronBack className={`w-6 h-6 ${isDark ? 'text-gray-200' : 'text-gray-700'}`} />
        </button>
        <div className="text-center">
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sharing</h1>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Connect with the community</p>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          className={`p-2 rounded-full ${glassBase} hover:scale-110 transition-all shadow-md`}
        >
          <svg className={`w-6 h-6 ${isDark ? 'text-gray-200' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="px-4 pb-32 overflow-y-auto" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Tab Navigation */}
        <div className="mb-6 mt-4">
          <div className={`flex ${glassBase} rounded-2xl p-1.5 ${isDark ? 'shadow-lg' : 'shadow-xl'}`}>
            <button
              onClick={() => setActiveTab('forum')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'forum'
                ? `${glassBase} ${isDark ? 'text-white shadow-lg' : 'text-gray-900 shadow-md'}`
                : `${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              style={activeTab === 'forum' ? {
                background: isDark 
                  ? `linear-gradient(135deg, rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.2) 0%, rgba(${colors.gradientTo.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 184, 196'}, 0.15) 100%)`
                  : `linear-gradient(135deg, rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3) 0%, rgba(${colors.gradientTo.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 184, 196'}, 0.25) 100%)`
              } : {}}
            >
              Forum
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'chat'
                ? `${glassBase} ${isDark ? 'text-white shadow-lg' : 'text-gray-900 shadow-md'}`
                : `${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              style={activeTab === 'chat' ? {
                background: isDark 
                  ? `linear-gradient(135deg, rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.2) 0%, rgba(${colors.gradientTo.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 184, 196'}, 0.15) 100%)`
                  : `linear-gradient(135deg, rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3) 0%, rgba(${colors.gradientTo.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 184, 196'}, 0.25) 100%)`
              } : {}}
            >
              Support Chat
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'events'
                ? `${glassBase} ${isDark ? 'text-white shadow-lg' : 'text-gray-900 shadow-md'}`
                : `${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              style={activeTab === 'events' ? {
                background: isDark 
                  ? `linear-gradient(135deg, rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.2) 0%, rgba(${colors.gradientTo.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 184, 196'}, 0.15) 100%)`
                  : `linear-gradient(135deg, rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3) 0%, rgba(${colors.gradientTo.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 184, 196'}, 0.25) 100%)`
              } : {}}
            >
              Events
            </button>
          </div>
        </div>

        {/* Forum Tab - Instagram Style */}
        {activeTab === 'forum' && (
          <div>
            {/* Forum Posts */}
            <div className="space-y-6 pb-4">
              {forumPosts.map((post) => {
                const isLiked = currentUser ? post.likedBy.includes(currentUser.uid) : false
                return (
                  <div key={post.id} className={`${glassBase} rounded-2xl overflow-hidden ${isDark ? 'shadow-lg hover:shadow-xl' : 'shadow-xl hover:shadow-2xl'} transition-all duration-200`}>
                    {/* Instagram-style Post Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${glassBase} flex items-center justify-center text-sm font-semibold flex-shrink-0`} style={{
                          background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
                          color: 'white'
                        }}>
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.authorName}</span>
                          <span className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatTimeAgo(post.timestamp)}</span>
                        </div>
                      </div>
                      <button className={`p-1.5 rounded-full transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>

                    {/* Post Image */}
                    {post.imageUrl && (
                      <div className="relative w-full aspect-square bg-gray-900">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Action Buttons (Like, Comment, Share, Save) */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLikePost(post)}
                          className={`transition-all ${isLiked ? 'text-rose-500 scale-110' : isDark ? 'text-gray-300 hover:text-rose-400' : 'text-gray-600 hover:text-rose-500'}`}
                        >
                          <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                          className={`transition-all ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                        <button className={`transition-all ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </div>
                      <button className={`transition-all ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>

                    {/* Likes Count */}
                    <div className="px-4 pb-2">
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                      </span>
                    </div>

                    {/* Caption */}
                    <div className="px-4 pb-2">
                      <div className="flex items-start gap-2">
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.authorName}</span>
                        <p className={`text-sm flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          {post.content}
                        </p>
                      </div>
                    </div>

                    {/* View Comments */}
                    {post.replies.length > 0 && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                        className={`px-4 pb-2 text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                      >
                        View all {post.replies.length} {post.replies.length === 1 ? 'comment' : 'comments'}
                      </button>
                    )}

                    {/* Comments Section */}
                    {post.replies.length > 0 && (
                      <div className={`px-4 pb-3 space-y-2 border-t ${isDark ? 'border-white/10' : 'border-gray-300/60'} pt-3`}>
                        {post.replies.slice(0, 2).map((reply) => (
                          <div key={reply.id} className="flex items-start gap-2">
                            <div className={`w-7 h-7 rounded-full ${glassBase} flex items-center justify-center text-xs flex-shrink-0`} style={{
                              background: `linear-gradient(135deg, ${colors.gradientFrom}40 0%, ${colors.gradientTo}40 100%)`
                            }}>
                              {reply.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{reply.authorName}</span>
                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatTimeAgo(reply.timestamp)}</span>
                              </div>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{reply.content}</p>
                            </div>
                            <button
                              onClick={() => handleLikeReply(post, reply)}
                              className={`p-1 transition-all ${currentUser && reply.likedBy.includes(currentUser.uid) ? 'text-rose-500' : isDark ? 'text-gray-400 hover:text-rose-400' : 'text-gray-400 hover:text-rose-500'}`}
                            >
                              <svg className={`w-4 h-4 ${currentUser && reply.likedBy.includes(currentUser.uid) ? 'fill-current' : ''}`} fill={currentUser && reply.likedBy.includes(currentUser.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    {replyingTo === post.id && (
                      <div className={`px-4 py-3 border-t ${isDark ? 'border-white/10' : 'border-gray-300/60'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${glassBase} flex items-center justify-center text-xs flex-shrink-0`} style={{
                            background: `linear-gradient(135deg, ${colors.gradientFrom}40 0%, ${colors.gradientTo}40 100%)`
                          }}>
                            {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Add a comment..."
                            className={`flex-1 px-3 py-2 ${glassBase} rounded-full text-sm focus:outline-none transition-all ${isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                            style={{
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.2)`
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleReplyPost(post.id)}
                            disabled={!replyContent.trim()}
                            className={`px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all rounded-full`}
                            style={{ 
                              color: replyContent.trim() ? colors.primary : (isDark ? '#9ca3af' : '#6b7280'),
                              background: replyContent.trim() ? `linear-gradient(135deg, ${colors.gradientFrom}20 0%, ${colors.gradientTo}20 100%)` : 'transparent'
                            }}
                          >
                            Post
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent('')
                            }}
                            className={`p-1.5 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Support Chat Tab - Discord Style */}
        {activeTab === 'chat' && (
          <div className="pb-6">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedChat(conversation)}
                  className={`${glassBase} rounded-lg p-3 cursor-pointer ${isDark ? 'hover:shadow-lg' : 'hover:shadow-xl'} transition-all duration-200 group`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full ${glassBase} flex items-center justify-center text-sm font-semibold shadow-sm`} style={{
                        background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
                        color: 'white'
                      }}>
                        {conversation.participant.charAt(0).toUpperCase()}
                      </div>
                      {conversation.unread > 0 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">{conversation.unread}</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{conversation.participant}</h4>
                        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'} font-medium`}>{conversation.timestamp}</span>
                      </div>
                      <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{conversation.lastMessage}</p>
                      {conversation.unread > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                          <span className={`text-[10px] font-medium`} style={{ color: colors.primary }}>{conversation.unread} new</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${glassBase} rounded-2xl w-full max-w-md p-6 shadow-2xl`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Post</h3>

              <input
                type="text"
                placeholder="Post title..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className={`w-full p-3 ${glassBase} rounded-lg mb-3 focus:outline-none transition-all ${isDark ? 'text-gray-100 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                style={{
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3)`
                }}
              />

              <textarea
                placeholder="Share your thoughts, experiences, or questions..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
                className={`w-full p-3 ${glassBase} rounded-lg mb-3 focus:outline-none transition-all resize-none ${isDark ? 'text-gray-100 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                style={{
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3)`
                }}
              />

              <input
                type="text"
                placeholder="Tags (separate with commas)"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                className={`w-full p-3 ${glassBase} rounded-lg mb-4 focus:outline-none transition-all ${isDark ? 'text-gray-100 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                style={{
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3)`
                }}
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewPost(false)}
                  className={`flex-1 py-2 px-4 ${glassBase} ${isDark ? 'text-gray-200 hover:bg-white/10' : 'text-gray-600 hover:bg-white/50'} rounded-lg transition-all shadow-md`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className={`flex-1 py-2 px-4 ${colors.gradient} text-white rounded-lg hover:opacity-90 transition-all shadow-lg`}
                  style={{ background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)` }}
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
            <div className={`mb-4 ${glassBase} rounded-2xl p-4 shadow-lg`}>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                📍 Choose Your City
              </label>
              <p className={`text-xs mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Select your city to see local wellness events and connect with nearby community members
              </p>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className={`w-full px-4 py-2 ${glassBase} rounded-lg focus:outline-none transition-all shadow-md ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
                style={{
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3)`,
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

            {/* Development Mode Notice */}
            {import.meta.env.DEV && !isLoadingEvents && scrapedEvents.length === 0 && (
              <div className={`mb-4 ${glassBase} rounded-2xl p-4 shadow-lg`}>
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                  ℹ️ Development Mode
                </p>
                <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
                  Real event scraping works only in production. Deploy to Vercel to see wellness events from BookMyShow & District.in.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoadingEvents && (
              <div className={`${glassBase} rounded-2xl p-8 text-center shadow-lg`}>
                <div className={`animate-spin w-8 h-8 border-4 rounded-full mx-auto mb-3`} style={{ borderColor: `${colors.primary}40`, borderTopColor: colors.primary }}></div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Finding wellness events in {selectedCity}...</p>
              </div>
            )}

            {/* Scraped Events Section */}
            {!isLoadingEvents && scrapedEvents.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 px-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🌟 Wellness Events Nearby
                </h3>
                <div className="space-y-3">
                  {scrapedEvents.map((event, index) => (
                    <a
                      key={`scraped-${index}`}
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block ${glassBase} rounded-2xl p-4 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}
                      style={{
                        background: isDark
                          ? `linear-gradient(135deg, rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.15) 0%, rgba(${colors.gradientTo.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 184, 196'}, 0.1) 100%)`
                          : `linear-gradient(135deg, rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.2) 0%, rgba(${colors.gradientTo.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 184, 196'}, 0.15) 100%)`
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-semibold flex-1 pr-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{event.title}</h4>
                        <span className={`px-2 py-0.5 ${glassBase} text-xs rounded-full whitespace-nowrap shadow-sm`} style={{ color: colors.primary }}>
                          {event.source}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className="mr-2">📍</span>
                          <span className="flex-1">{event.venue}</span>
                        </div>

                        {event.distance && (
                          <div className="flex items-center font-medium" style={{ color: colors.primary }}>
                            <span className="mr-2">🚶</span>
                            <span>{formatDistance(event.distance)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{event.date}</span>
                          <span className="text-xs font-medium" style={{ color: colors.primary }}>View Details →</span>
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
                <div className={`${glassBase} rounded-2xl p-8 text-center shadow-lg`}>
                  <div className="text-5xl mb-3">📅</div>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Events Yet</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Be the first to create an event in {selectedCity}!</p>
                </div>
              )}

              {events.length > 0 && events
                .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
                .map((event) => (
                  <div key={event.id} className={`${glassBase} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{event.title}</h3>
                          <span className={`px-2 py-0.5 ${glassBase} text-xs rounded-full shadow-sm`} style={{ color: colors.primary }}>
                            {event.city}
                          </span>
                        </div>
                        <div className={`flex items-center text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="mr-2">👤</span>
                          <span>Organized by {event.creatorName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className={`flex items-start text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="mr-2">📍</span>
                        <span>{event.address}</span>
                      </div>
                      <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="mr-2">📅</span>
                        <span>{event.dateTime.toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="mr-2">🕐</span>
                        <span>{event.dateTime.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200/50'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Posted {event.createdAt.toLocaleDateString()}
                      </span>
                      {currentUser && event.creatorId === currentUser.uid && (
                        <span className={`px-2 py-1 ${glassBase} text-xs rounded-full shadow-sm`} style={{ color: colors.primary }}>
                          Your Event
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Info Box */}
            <div className={`mt-6 ${glassBase} rounded-2xl p-4 shadow-lg`}>
              <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>💡 About Events</h3>
              <div className={`space-y-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>• Connect with others in your city for real-life meetups</p>
                <p>• Share mental wellness activities and group sessions</p>
                <p>• Events automatically expire after the scheduled time</p>
              </div>
            </div>

            {/* Floating Add Button */}
            <button
              onClick={() => setShowNewEvent(true)}
              className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 ${colors.gradient} text-white rounded-full shadow-2xl hover:opacity-90 transition-all hover:scale-110 flex items-center justify-center text-3xl font-light z-40 leading-none backdrop-blur-sm border border-white/20`}
              style={{ 
                background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
                boxShadow: `0 4px 20px rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.4)`
              }}
            >
              <span className="block leading-none">+</span>
            </button>

            {/* New Event Modal */}
            {showNewEvent && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`${glassBase} rounded-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto shadow-2xl`}>
                  <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Event</h3>

                  <div className="space-y-2.5">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Event Title</label>
                      <input
                        type="text"
                        placeholder="E.g., Meditation Group Session"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className={`w-full p-2.5 text-sm ${glassBase} rounded-lg focus:outline-none transition-all ${isDark ? 'text-gray-100 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                        style={{
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3)`
                        }}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Address</label>
                      <textarea
                        placeholder="Full address with landmarks"
                        value={newEventAddress}
                        onChange={(e) => setNewEventAddress(e.target.value)}
                        rows={2}
                        className={`w-full p-2.5 text-sm ${glassBase} rounded-lg focus:outline-none transition-all resize-none ${isDark ? 'text-gray-100 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                        style={{
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3)`
                        }}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>City</label>
                      <div className={`px-2.5 py-2 text-sm ${glassBase} rounded-lg ${isDark ? 'text-gray-200' : 'text-gray-700'} shadow-sm`}>
                        {selectedCity}
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Date</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full p-2.5 text-sm ${glassBase} rounded-lg focus:outline-none transition-all ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
                        style={{
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3)`
                        }}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Time</label>
                      <input
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className={`w-full p-2.5 text-sm ${glassBase} rounded-lg focus:outline-none transition-all ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
                        style={{
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `rgba(${colors.gradientFrom.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '157, 124, 243'}, 0.3)`
                        }}
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
                      className={`flex-1 py-2 px-4 ${glassBase} ${isDark ? 'text-gray-200 hover:bg-white/10' : 'text-gray-600 hover:bg-white/50'} rounded-lg transition-all shadow-md`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateEvent}
                      className={`flex-1 py-2 px-4 ${colors.gradient} text-white rounded-lg hover:opacity-90 transition-all shadow-lg`}
                      style={{ background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)` }}
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
            className={`w-full py-3 px-6 ${colors.gradient} text-white rounded-2xl font-medium shadow-xl hover:opacity-90 transition-all text-sm backdrop-blur-sm border border-white/20`}
            style={{ background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)` }}
          >
            Share your Experience
          </button>
        </div>
      )}
    </div>
  )
}
