public struct DebugHelper {
    public var defaultColorCode = "\u{001B}[0m"

    /// Helper function to map your DebugType to an ANSI color code
    /// Defaults to default terminal text color "\u{001B}[0m" if provided optional argument is `nil`
    public func colorCode(_ type: DebugType?) -> String {
        switch type {
        case .error: return "\u{001B}[31m"  // Red
        case .warning: return "\u{001B}[33m"  // Yellow
        case .log: return "\u{001B}[36m"  // Cyan
        // case .success: return "\u{001B}[32m"  // Green
        default: return self.defaultColorCode  // Default/Reset
        }
    }

}
