import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles.css";

import HomePage from "./pages/HomePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AboutPage from "./pages/AboutPage";
import CoursePage from "./pages/CoursePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CreateCoursePage from "./pages/CreateCoursePage.jsx";
import CreateAccountPage from "./pages/CreateAccountPage.jsx";
import UserPage from './pages/UserPage.jsx'; 

import NavBar from "./components/NavBar.jsx";
import { AuthProvider } from './components/AuthProvider.jsx';
import UpdateCoursePage from "./pages/UpdateCoursePage.jsx";
import Footer from "./components/Footer.jsx";

const router = createBrowserRouter([
  {
      path: "/",
      element: <NavBar />,
      children: [
          { path: "/", element: <LandingPage /> },
          { path: "/circles", element: <HomePage /> },
          { path: "/about", element: <AboutPage /> },
          { path: "/circles/:id", element: <CoursePage /> },
          { path: "/login", element: <LoginPage /> },
          { path: "/circles/update/:id", element: <UpdateCoursePage /> },
          { path: "/start-circle", element: <CreateCoursePage /> },
          { path: "/createaccount", element: <CreateAccountPage /> },
          { path: "/users/:id", element: <UserPage />},
      ],
    },
  ],
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
        <Footer />
      </AuthProvider>
  </React.StrictMode>
);