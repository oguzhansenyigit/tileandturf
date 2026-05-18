import axios from 'axios'

/** Axios instance for admin API calls (session cookie). */
const adminHttp = axios.create({
  withCredentials: true,
})

export default adminHttp
