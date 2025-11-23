/**
 * Firestore Service
 * Centralized service for all Firestore operations
 * Replaces localStorage with cloud-based storage
 * 
 * Performance Note: This service includes automatic caching via Firestore's
 * built-in offline persistence (see firebase.ts). For frequently accessed data,
 * consider implementing an in-memory cache layer using React Query or similar.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import Logger from '../utils/Logger'

// Types
export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  onboardingCompleted: boolean
  age?: number
  sex?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface MeditationSession {
  id?: string
  userId: string
  duration: number // in minutes
  type: 'guided' | 'timer' | 'breathing' | 'exercise'
  exerciseId?: string
  completedAt: Timestamp
  mood?: string
}

export interface JournalEntry {
  id?: string
  userId: string
  content: string
  mood?: string
  tags?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserStats {
  userId: string
  totalSessions: number
  totalMinutes: number
  currentStreak: number
  longestStreak: number
  lastMeditationDate: string
  meditatedDates: string[]
  shields: number
  level: number
  points: number
  updatedAt: Timestamp
}

// User Profile Operations
export const createUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid)
    await setDoc(userRef, {
      uid,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    Logger.error('Error creating user profile:', error)
    throw error
  }
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile
    }
    return null
  } catch (error) {
    Logger.error('Error getting user profile:', error)
    throw error
  }
}

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// Meditation Session Operations
export const saveMeditationSession = async (
  session: Omit<MeditationSession, 'id'>
): Promise<string> => {
  try {
    const sessionsRef = collection(db, 'meditationSessions')
    const newSessionRef = doc(sessionsRef)

    await setDoc(newSessionRef, {
      ...session,
      completedAt: serverTimestamp()
    })

    // Update user stats
    await updateUserStatsAfterSession(session.userId, session.duration)

    return newSessionRef.id
  } catch (error) {
    Logger.error('Error saving meditation session:', error)
    throw error
  }
}

export const getUserMeditationSessions = async (
  userId: string,
  limitCount: number = 10
): Promise<MeditationSession[]> => {
  try {
    const sessionsRef = collection(db, 'meditationSessions')
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MeditationSession[]
  } catch (error) {
    console.error('Error getting meditation sessions:', error)
    throw error
  }
}

// Journal Operations
export const saveJournalEntry = async (
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const journalRef = collection(db, 'journalEntries')
    const newEntryRef = doc(journalRef)

    await setDoc(newEntryRef, {
      ...entry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return newEntryRef.id
  } catch (error) {
    Logger.error('Error saving journal entry:', error)
    throw error
  }
}

export const getUserJournalEntries = async (
  userId: string,
  limitCount: number = 20
): Promise<JournalEntry[]> => {
  try {
    const journalRef = collection(db, 'journalEntries')
    const q = query(
      journalRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as JournalEntry[]
  } catch (error) {
    console.error('Error getting journal entries:', error)
    throw error
  }
}

export const updateJournalEntry = async (
  entryId: string,
  data: Partial<JournalEntry>
): Promise<void> => {
  try {
    const entryRef = doc(db, 'journalEntries', entryId)
    await updateDoc(entryRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating journal entry:', error)
    throw error
  }
}

export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  try {
    const entryRef = doc(db, 'journalEntries', entryId)
    await deleteDoc(entryRef)
  } catch (error) {
    console.error('Error deleting journal entry:', error)
    throw error
  }
}

// User Stats Operations
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    const statsRef = doc(db, 'userStats', userId)
    const statsSnap = await getDoc(statsRef)

    if (statsSnap.exists()) {
      return statsSnap.data() as UserStats
    }

    // Create initial stats if they don't exist
    const initialStats: UserStats = {
      userId,
      totalSessions: 0,
      totalMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastMeditationDate: '',
      meditatedDates: [],
      shields: 0,
      level: 1,
      points: 0,
      updatedAt: Timestamp.now()
    }

    await setDoc(statsRef, initialStats)
    return initialStats
  } catch (error) {
    console.error('Error getting user stats:', error)
    throw error
  }
}

const updateUserStatsAfterSession = async (
  userId: string,
  duration: number
): Promise<void> => {
  try {
    const stats = await getUserStats(userId)
    if (!stats) return

    const today = new Date().toISOString().split('T')[0]
    const meditatedDates = stats.meditatedDates || []

    // Add today's date if not already present
    if (!meditatedDates.includes(today)) {
      meditatedDates.push(today)
    }

    // Calculate streak
    const sortedDates = meditatedDates.sort()
    let currentStreak = 1

    for (let i = sortedDates.length - 1; i > 0; i--) {
      const current = new Date(sortedDates[i])
      const previous = new Date(sortedDates[i - 1])
      const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentStreak++
      } else {
        break
      }
    }

    const longestStreak = Math.max(stats.longestStreak, currentStreak)
    const totalSessions = stats.totalSessions + 1
    const totalMinutes = stats.totalMinutes + duration
    const points = stats.points + (duration * 10) // 10 points per minute
    const level = Math.floor(points / 1000) + 1 // Level up every 1000 points

    const statsRef = doc(db, 'userStats', userId)
    await updateDoc(statsRef, {
      totalSessions,
      totalMinutes,
      currentStreak,
      longestStreak,
      lastMeditationDate: today,
      meditatedDates,
      points,
      level,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user stats:', error)
    throw error
  }
}

export const addShield = async (userId: string): Promise<void> => {
  try {
    const stats = await getUserStats(userId)
    if (!stats) return

    const statsRef = doc(db, 'userStats', userId)
    await updateDoc(statsRef, {
      shields: stats.shields + 1,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error adding shield:', error)
    throw error
  }
}

export const useShield = async (userId: string): Promise<boolean> => {
  try {
    const stats = await getUserStats(userId)
    if (!stats || stats.shields <= 0) return false

    const statsRef = doc(db, 'userStats', userId)
    await updateDoc(statsRef, {
      shields: stats.shields - 1,
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('Error using shield:', error)
    throw error
  }
}
