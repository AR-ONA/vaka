import { useEffect } from 'react'

export const App: React.FC = () => {
  useEffect(() => {
    const load = async (): Promise<void> => {
      const data = await window.api.loadData()
      console.log(data.songs)
    }
    load()
  }, [])

  return <h1>Hello World!</h1>
}
