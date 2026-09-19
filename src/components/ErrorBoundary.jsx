import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <div className="bg-white rounded-2xl shadow-md p-6 max-w-sm w-full text-center space-y-3">
            <p className="text-red-500 font-semibold text-lg">エラーが発生しました</p>
            <p className="text-gray-500 text-sm break-words">
              {this.state.error?.message || "予期しないエラーが発生しました。"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-xl text-sm"
            >
              再読み込み
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
