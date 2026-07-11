import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center font-mono border border-red-500/20 bg-red-950/5 text-red-400 rounded-lg">
          <h4>Произошел сбой при отрисовке компонента.</h4>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
