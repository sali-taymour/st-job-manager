import { useState, useEffect } from "react";
import "./App.scss";
import axios from "axios";
import { PageWelcome } from "./pages/PageWelcome";
import { PageJobSources } from "./pages/PageJobSources";
import { PageJobApplications } from "./pages/PageJobApplications";
import { PageCv } from "./pages/PageCv";
import { PageLogin } from "./pages/PageLogin";
import { PageRegister } from "./pages/PageRegister";
import { NavLink, Route, Routes } from "react-router-dom";

const backend_base_url = "http://localhost:3045";

function App() {
    const [jobSources, setJobSources] = useState([]);
    const [currentUser, setCurrentUser] = useState({
        username: "anonymousUser",
        accessGroups: ["loggedOutUsers"],
    });
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const userIsLoggedIn = () => {
        return currentUser.username !== "anonymousUser";
    };

    const currentUserIsInAccessGroups = (accessGroups) => {
        let rb = false;
        accessGroups.forEach((accessGroup) => {
            if (currentUser.accessGroups.includes(accessGroup)) {
                rb = true;
            }
        });
        return rb;
    };

    const getJobSources = () => {
        (async () => {
            setJobSources(
                (await axios.get(backend_base_url + "/job-sources")).data
            );
        })();
    };

    useEffect(() => {
        (async () => {
            console.log("111");
            const response = await fetch(backend_base_url + "/maintain-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: "Bearer " + localStorage.getItem("token"),
                },
            });
            console.log(response);
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.user);
                getJobSources();
            } else {
                const response = await fetch(backend_base_url + "/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "anonymousUser",
                        password: "anonymous123",
                    }),
                });
                console.log(response);
                if (response.ok) {
                    const data = await response.json();
                    getJobSources();
                    setCurrentUser(data.user);
                    localStorage.setItem("token", data.token);
                } else {
                    setMessage("bad login");
                }
            }
        })();
    }, []);

    const handleLoginButton = async (e) => {
        e.preventDefault();
        const response = await fetch(backend_base_url + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        setUsername("");
        setPassword("");
        if (response.ok) {
            const data = await response.json();
            getJobSources();
            setCurrentUser(data.user);
            localStorage.setItem("token", data.token);
        } else {
            setMessage("bad login");
            setTimeout(() => {
                setMessage("");
            }, 3000);
        }
    };

    const handleLogoutButton = () => {
        localStorage.removeItem("token");
        setCurrentUser({
            username: "anonymousUser",
            accessGroups: ["loggedOutUsers"],
        });
    };

    return (
        <div className="App">
            <>
                <h1>ST Job Manager</h1>
                {userIsLoggedIn() && (
                    <div className="loggedInInfo">
                        {currentUser.firstName} {currentUser.lastName}{" "}
                        <button className="logout" onClick={handleLogoutButton}>
                            Logout
                        </button>
                    </div>
                )}
                {message !== "" && <div className="siteMessage">{message}</div>}
                <nav>
                    <NavLink to="/welcome">Welcome</NavLink>

                    {currentUserIsInAccessGroups([
                        "jobSeekers",
                        "administrators",
                    ]) && <NavLink to="/job-sources">Job Sources</NavLink>}

                    {currentUserIsInAccessGroups(["administrators"]) && (
                        <NavLink to="/job-applications">
                            Job Applications
                        </NavLink>
                    )}

                    {currentUserIsInAccessGroups([
                        "companies",
                        "administrators",
                    ]) && <NavLink to="/cv">CV</NavLink>}

                    {currentUserIsInAccessGroups(["loggedOutUsers"]) && (
                        <>
                            <NavLink to="/login">Login</NavLink>
                            <NavLink to="/register">Register</NavLink>
                        </>
                    )}
                </nav>
                <Routes>
                    <Route path="/welcome" element={<PageWelcome />} />
                    {currentUserIsInAccessGroups([
                        "jobSeekers",
                        "administrators",
                    ]) && (
                        <Route
                            path="/job-sources"
                            element={
                                <PageJobSources
                                    jobSources={jobSources}
                                    handleLogoutButton={handleLogoutButton}
                                />
                            }
                        />
                    )}
                    k
                    {currentUserIsInAccessGroups(["administrators"]) && (
                        <Route
                            path="/job-applications"
                            element={<PageJobApplications />}
                        />
                    )}
                    {currentUserIsInAccessGroups([
                        "companies",
                        "administrators",
                    ]) && <Route path="/cv" element={<PageCv />} />}
                    <Route
                        path="/login"
                        element={
                            <PageLogin
                                message={message}
                                jobSources={jobSources}
                                userIsLoggedIn={userIsLoggedIn}
                                currentUser={currentUser}
                                currentUserIsInAccessGroups={
                                    currentUserIsInAccessGroups
                                }
                                handleLogoutButton={handleLogoutButton}
                                handleLoginButton={handleLoginButton}
                                username={username}
                                password={password}
                                setUsername={setUsername}
                                setPassword={setPassword}
                            />
                        }
                    />
                    <Route path="/register" element={<PageRegister />} />
                </Routes>
            </>
        </div>
    );
}

export default App;
