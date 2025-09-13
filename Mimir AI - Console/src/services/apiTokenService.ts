import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { getFirebaseFirestore } from '@/config/firebase'
import { tokensApi } from './api'

export interface FirestoreAPIToken {
  created_time: string
  department: string
  expiry_date: string
  last_accessed_time: string
  token: string
  name:string
}

export interface APITokenWithDetails extends FirestoreAPIToken {
  id: string
  name: string
  status: 'active' | 'expired' | 'revoked'
  assignedUser: string
}

class APITokenService {
  private db = getFirebaseFirestore()
  private COLLECTION_NAME = 'User'

  /**
   * Get all API keys for a user from Firestore
   */
  async getUserAPIKeys(userEmail: string): Promise<FirestoreAPIToken[]> {
    try {
      const userDocRef = doc(this.db, this.COLLECTION_NAME, userEmail)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        return userData.api_key || []
      } else {
        console.log('No document found for user:', userEmail)
        return []
      }
    } catch (error) {
      console.error('Error fetching API keys from Firestore:', error)
      throw new Error('Failed to fetch API keys from Firestore')
    }
  }

  /**
   * Create a new API token via API call and optionally store in Firestore
   */
  async createAPIToken(userEmail: string, password: string, department: string, name:string): Promise<{
    token: string
    success: boolean
    message?: string
  }> {
    try {
      // Call the API to create token
      const result = await tokensApi.createApiToken(userEmail, password, {
        name: name,
        department: department
      })
      
      if (result.access_token) {
        // The API should automatically store in Firestore, 
        // but we can also manually ensure it's stored with additional metadata
        const tokenData: FirestoreAPIToken = {
          created_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          department: department,
          expiry_date: "30 days", // Default expiry
          last_accessed_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          token: result.access_token,
          name:name
        }

        // Update user document with new token
        await this.addTokenToUserDocument(userEmail, tokenData)

        return {
          token: result.access_token,
          success: true,
          message: 'Token created successfully'
        }
      } else {
        return {
          token: '',
          success: false,
          message: 'Failed to create token'
        }
      }
    } catch (error) {
      console.error('Error creating API token:', error)
      return {
        token: '',
        success: false,
        message: 'Failed to create token: ' + (error as Error).message
      }
    }
  }

  /**
   * Add a token to user's document in Firestore
   */
  private async addTokenToUserDocument(userEmail: string, tokenData: FirestoreAPIToken): Promise<void> {
    try {
      const userDocRef = doc(this.db, this.COLLECTION_NAME, userEmail)
      
      // Check if document exists
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          api_key: arrayUnion(tokenData)
        })
      } else {
        // Create new document
        await setDoc(userDocRef, {
          api_key: [tokenData]
        })
      }
    } catch (error) {
      console.error('Error adding token to Firestore:', error)
      throw error
    }
  }

  /**
   * Remove a token from user's document in Firestore
   */
  async removeTokenFromUser(userEmail: string, tokenToRemove: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, this.COLLECTION_NAME, userEmail)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        const apiKeys = userData.api_key || []
        
        // Find and remove the token
        const updatedTokens = apiKeys.filter((token: FirestoreAPIToken) => token.token !== tokenToRemove)
        
        await updateDoc(userDocRef, {
          api_key: updatedTokens
        })
      }
    } catch (error) {
      console.error('Error removing token from Firestore:', error)
      throw error
    }
  }

  /**
   * Update last accessed time for a token
   */
  async updateTokenLastAccessed(userEmail: string, tokenValue: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, this.COLLECTION_NAME, userEmail)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        const apiKeys = userData.api_key || []
        
        // Update the specific token's last accessed time
        const updatedTokens = apiKeys.map((token: FirestoreAPIToken) => {
          if (token.token === tokenValue) {
            return {
              ...token,
              last_accessed_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }
          }
          return token
        })
        
        await updateDoc(userDocRef, {
          api_key: updatedTokens
        })
      }
    } catch (error) {
      console.error('Error updating token last accessed time:', error)
      throw error
    }
  }

  /**
   * Convert Firestore token to display format
   */
  convertToDisplayFormat(firestoreTokens: FirestoreAPIToken[], userEmail: string): APITokenWithDetails[] {
    return firestoreTokens.map((token, index) => ({
      ...token,
      id: `${userEmail}_${index}`,
      name: token.name || `API Token ${index + 1}`, // Use the actual token name from Firestore
      status: this.getTokenStatus(token.expiry_date, token.created_time),
      assignedUser: userEmail
    }))
  }

  /**
   * Determine token status based on expiry and creation date
   */
  private getTokenStatus(expiryDate: string, createdTime: string): 'active' | 'expired' | 'revoked' {
    if (expiryDate === "30 days") {
      const createdDate = new Date(createdTime)
      const now = new Date()
      const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays >= 30) {
        return 'expired'
      }
    }
    
    return 'active'
  }

  /**
   * Get formatted date for display
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString.replace(' ', 'T'))
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  /**
   * Get the total count of API keys for a user
   */
  async getUserAPIKeysCount(userEmail: string): Promise<number> {
    try {
      const apiKeys = await this.getUserAPIKeys(userEmail)
      return apiKeys.length
    } catch (error) {
      console.error('Error fetching API keys count:', error)
      return 0
    }
  }
}

export const apiTokenService = new APITokenService()