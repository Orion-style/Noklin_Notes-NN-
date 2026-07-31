import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "30px",
          color: "#ff4444",
          backgroundColor: "#0d0914",
          fontFamily: "monospace",
          minHeight: "100vh",
          boxSizing: "border-box"
        }}>
          <h1 style={{ color: "#ffbb00", fontSize: "20px" }}>CRITICAL FRONTEND ERROR</h1>
          <p style={{ color: "#ffffff" }}>{this.state.error && this.state.error.toString()}</p>
          <pre style={{
            backgroundColor: "#1a1528",
            padding: "15px",
            borderRadius: "8px",
            overflow: "auto",
            fontSize: "12px",
            color: "#aaa"
          }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
