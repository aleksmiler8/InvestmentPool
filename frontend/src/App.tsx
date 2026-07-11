import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Rules from "./pages/Rules";
import Home from "./Home";
import About from "./pages/About";
import Swap from "./pages/Swap";

function App() {
  const [acceptedRules, setAcceptedRules] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("acceptedRules");

    if (accepted === "true") {
      setAcceptedRules(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Welcome />}
        />

        <Route
          path="/rules"
          element={
            acceptedRules ? (
              <Navigate to="/home" />
            ) : (
              <Rules
                onContinue={() => {
                  localStorage.setItem("acceptedRules", "true");
                  setAcceptedRules(true);
                  window.location.href = "/home";
                }}
              />
            )
          }
        />

        <Route
          path="/home"
          element={<Home />}
        />
        <Route
  path="/swap"
  element={<Swap />}
/>
        <Route
  path="/about"
  element={<About />}
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;