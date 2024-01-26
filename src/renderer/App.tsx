import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function Page() {
  const { arch, chromeVersion, nodeVersion, electronVersion } = window.appInfo;

  const handleCrash = () => {
    window.electron.crash();
  };

  return (
    <div>
      <div>Electron App with React</div>
      <div>arch: {arch}</div>
      <div>chromeVersion: {chromeVersion}</div>
      <div>nodeVersion: {nodeVersion}</div>
      <div>electronVersion: {electronVersion}</div>
      <button onClick={handleCrash}>click to mock crash</button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Page />} />
      </Routes>
    </Router>
  );
}
