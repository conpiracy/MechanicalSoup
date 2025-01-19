import axios from 'axios'
import type { Product } from '@/types/product'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const triggerScrape = async (): Promise<boolean> => {
  try {
    const { data } = await axios.post(`${API_URL}/api/scrape`)
    return data.success
  } catch (error) {
    console.error('Failed to trigger scrape:', error.message)
    return false
  }
}

export const getWhopData = async (): Promise<Product[]> => {
  try {
    const { data } = await axios.get(`${API_URL}/api/whop-data`)
    return data?.top_communities || []
  } catch (error) {
    console.error('Failed to fetch Whop data:', error.message)
    return []
  }
}
