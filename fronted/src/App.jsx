import { useState } from 'react'
import './App.css'
import Login from './views/Login'

// 1. Definimos la función del componente App
function App() {
  // Aquí puedes declarar estados si los necesitas
  // const [count, setCount] = useState(0)

  return (
    <div className="app-container">
      {/* 2. Renderizamos tu componente de Login */}
      <Login />
    </div>
  )
}

// 3. Exportamos al final
export default App