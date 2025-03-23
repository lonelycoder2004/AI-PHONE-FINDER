import React, { useState, useEffect, useRef } from "react";
import "./SecondPage.css";
import { FaPaperPlane, FaSpinner } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const SecondPage = () => {
  const location = useLocation();
  const [chatHistory, setChatHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFetchingText, setShowFetchingText] = useState(false);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);
  const hasFetchedInitialQuery = useRef(false);

  const cleanResponse = (text) => {
    // Remove IDs
    let cleanedText = text.replace(/\(ID: \w+\)/g, "");

    // Format bold text
    cleanedText = cleanedText.replace(/(\*\*|\*)(.*?)\1/g, "<strong>$2</strong>");

    // Replace newline characters with <br /> tags
    cleanedText = cleanedText.replace(/\n/g, "<br />");

    return cleanedText;
  };

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("visited");
    if (hasVisited || hasFetchedInitialQuery.current) return;

    hasFetchedInitialQuery.current = true;
    sessionStorage.setItem("visited", "true");

    const fetchInitialResponse = async () => {
      const initialQuery = location.state?.initialQuery;
      if (initialQuery) {
        setIsLoading(true);
        try {
          const res = await fetch("http://192.168.1.8:4000/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: initialQuery }),
          });
          const data = await res.json();

          // Clean the response
          const cleanedResponse = cleanResponse(data.response);

          setChatHistory([
            { type: "user", content: initialQuery },
            { type: "bot", content: cleanedResponse, phones: data.phones || [] },
          ]);
        } catch (error) {
          console.error("Error:", error);
          setChatHistory([
            { type: "user", content: initialQuery },
            { type: "bot", content: "Sorry, I had trouble connecting to the server. Please try again." },
          ]);
        }
        setIsLoading(false);
      }
    };

    fetchInitialResponse();
  }, [location.state]);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowFetchingText(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowFetchingText(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { type: "user", content: inputValue };
    setChatHistory((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    setChatHistory((prev) => [...prev, { type: "typing" }]);

    try {
      const res = await fetch("http://192.168.1.8:4000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: inputValue }),
      });
      const data = await res.json();

      // Clean the response
      const cleanedResponse = cleanResponse(data.response);

      setChatHistory((prev) => {
        const newHistory = prev.filter((msg) => msg.type !== "typing");
        return [
          ...newHistory,
          { type: "bot", content: cleanedResponse, phones: data.phones || [] },
        ];
      });
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) => {
        const newHistory = prev.filter((msg) => msg.type !== "typing");
        return [
          ...newHistory,
          { type: "bot", content: "Sorry, I had trouble connecting to the server. Please try again." },
        ];
      });
    }
    setIsLoading(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default behavior (e.g., new line)
      handleSubmit(e); // Submit the form
    }
    // Allow Shift + Enter for new line
  };

  const getYouTubeVideoId = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  return (
    <div className="chat-container" role="main">
      <header className="chat-header">
        <div className="header-content">
          <div className="app-brand">
          
            <h1>PhoneAdvisor AI</h1>
          </div>
          <div className="user-status">
            <div className="status-indicator online"></div>
            <span>Online</span>
          </div>
        </div>
      </header>

      <div
        className="chat-messages-container"
        ref={chatMessagesRef}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {chatHistory.length === 0 && (
          <div className="welcome-container">
            <div className="welcome-animation">
              <div className="pulse-ring"></div>
              <div className="welcome-icon">AI</div>
            </div>
            <h2>Hello, I'm your PhoneAdvisor</h2>
            <p>I can help you find the perfect smartphone based on your needs and budget.</p>
            <div className="sample-queries">
              <p>Try asking me:</p>
              <div className="query-pills">
                <button className="query-pill" onClick={() => setInputValue("Best camera phone under 20K")}>
                  Best camera phone under 20K
                </button>
                <button className="query-pill" onClick={() => setInputValue("Best gaming phone above 40K")}>
                  Best gaming phone above 40K
                </button>
                <button className="query-pill" onClick={() => setInputValue("Suggest me a allrounder phone between 20K and 30K")}>
                  Suggest me a allrounder phone between 20K and 30K
                </button>
              </div>
            </div>
          </div>
        )}

        {chatHistory.map((message, index) => {
          if (message.type === "typing") {
            return (
              <div key={`typing-${index}`} className="message-wrapper bot-message">
                <div className="message-avatar bot-avatar" aria-hidden="true">
                  AI
                </div>
                <div className="message-bubble typing-bubble">
                  <div className="typing-indicator" aria-label="AI is typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className={`message-wrapper ${message.type === "user" ? "user-message" : "bot-message"}`}>
              <div className="message-avatar" aria-hidden="true">
                {message.type === "user" ? "You" : "AI"}
              </div>
              <div className="message-bubble">
                {/* Render cleaned response as HTML */}
                <div dangerouslySetInnerHTML={{ __html: message.content }} />
                {message.phones && message.phones.length > 0 && (
                  <div className="phone-grid">
                    {message.phones.map((phone, idx) => (
                      <div key={idx} className="phone-card">
                        <div className="phone-left">
                          <h4 className="phone-name">{phone.name}</h4>
                          <div className="phone-price">₹{phone.price.toLocaleString()}</div>
                          <div className="phone-image">
                            <img
                              src={phone.image}
                              alt={`${phone.name} device`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/default-phone.png";
                              }}
                            />
                          </div>
                          <a
                            href={phone.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="buy-button"
                          >
                            Buy Now
                          </a>
                        </div>
                        <div className="phone-right">
                          <div className="specs-container">
                            
                            <div className="specs-grid">
                              {Object.entries(phone.specifications || {}).map(([key, value], index) => (
                                <div key={`${key}-${index}`} className="spec-item">
                                  <div className="spec-label">{key}</div>
                                  <div className="spec-value">{value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {phone.youtube_link && getYouTubeVideoId(phone.youtube_link) && (
                            <div className="video-preview">
                              <iframe
                                width="100%"
                                height="200"
                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(phone.youtube_link)}?rel=0`}
                                title={`${phone.name} Review`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="message-time">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
      </div>

      <form className="chat-input-container" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            className="chat-input"
            type="text"
            placeholder="Ask me about phones..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            ref={inputRef}
            aria-label="Message input"
          />
        </div>

        <button
          type="submit"
          className="send-button"
          disabled={isLoading || !inputValue.trim()}
          aria-label="Send message"
        >
          {isLoading ? <FaSpinner className="spin-icon" /> : <FaPaperPlane />}
        </button>
      </form>

      {isLoading && (
        <div className="loading-overlay" aria-live="polite">
          <div className="loading-container">
            <div className="loading-animation">
              <div className="loading-circle"></div>
              <div className="loading-progress"></div>
            </div>
            <p className="loading-text">Finding the perfect phone for you</p>
            {showFetchingText && <p className="secondary-text">Analyzing specifications and needs...</p>}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default SecondPage;