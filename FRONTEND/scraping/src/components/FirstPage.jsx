import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import "./FirstPage.css";

function FirstPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    navigate("/second", { state: { initialQuery: query } });
    setIsLoading(false);
  };

  

  return (
    <div className="modern-container">
     
      <div className="content-area">
        <div className="left-column">
          <h1>AI Phone Advisor</h1>
          <p className="tagline">Find your perfect smartphone match in seconds</p>

          <form onSubmit={handleSubmit} className="search-form">
            <div className="search-wrapper">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What features do you need?"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="search-btn"
              >
                {isLoading ? (
                  <div className="loader"></div>
                ) : (
                  <FontAwesomeIcon icon={faSearch} />
                )}
              </button>
            </div>
          </form>

          <div className="suggestion-chips">
            <div className="chip" onClick={() => setQuery("Best camera phone under 20K")}>Best camera phone under 20K</div>
            <div className="chip" onClick={() => setQuery("Best phones from samsung")}>Best phones from samsung</div>
            <div className="chip" onClick={() => setQuery("Best allrounder phone above 50K")}>Best allrounder phone above 50K</div>
          </div>
        </div>

        <div className="right-column">
          <div className="blob-bg"></div>
          <div className="phone-display">
            <div className="inner-display">
              <div className="ai-message">Best allrounder phone above 50K</div>
              <div className="user-message">Based on that, here are my top 3 recommendations...</div>
              <div className="ai-message">Suggest me some allrounder phones from samsung</div>
            </div>
          </div>
        </div>
      </div>

      <div className="trust-indicators">
        <div className="trust-item">
          <div className="trust-number">50+</div>
          <div className="trust-label">Recommendations</div>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <div className="trust-number">90%</div>
          <div className="trust-label">Accuracy</div>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <div className="trust-number">50+</div>
          <div className="trust-label">Phones</div>
        </div>
      </div>
    </div>
  );
}

export default FirstPage;
